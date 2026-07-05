import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { signAdminOtpChallenge, signToken, setTokenCookie } from '@/lib/auth'
import { createTotpSetup, getOrCreateAdminTotp } from '@/lib/admin-totp'
import { rateLimit } from '@/lib/rateLimit'
import { normalizeIndonesianPhone } from '@/lib/phone'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  identifier: z.string().min(3).max(100).optional(),
  noHp: z.string().min(3).max(100).optional(),
  password: z.string().min(1),
  portal: z.enum(['member', 'admin']).default('member'),
}).refine((data) => data.identifier || data.noHp, { message: 'Username, email, atau nomor HP wajib diisi' })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi 1 menit.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const { password } = parsed.data
  const rawIdentifier = (parsed.data.identifier || parsed.data.noHp || '').trim()
  const isEmail = rawIdentifier.includes('@')
  const isAdminPortal = parsed.data.portal === 'admin'
  const identifier = isAdminPortal ? rawIdentifier.toLowerCase() : (isEmail ? rawIdentifier.toLowerCase() : normalizeIndonesianPhone(rawIdentifier))
  const configuredAdminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
  const matchesConfiguredAdmin = isAdminPortal && identifier === configuredAdminUsername

  // Raw query untuk hindari kolom tanggal_daftar = 0000-00-00 yang invalid
  const rows = await prisma.$queryRaw<Array<{
    id: number; phone: string; password: string; status: number; type: number; name: string; login_status: number; email_verified_at: Date | null
  }>>`
    SELECT id, phone, password, status, type, name, login_status, email_verified_at
    FROM members
    WHERE ${isAdminPortal
      ? matchesConfiguredAdmin
        ? Prisma.sql`type = 1`
        : Prisma.sql`type = 1 AND (
            LOWER(name) = ${identifier}
            OR LOWER(email) = ${identifier}
            OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = ${identifier}
          )`
      : isEmail
        ? Prisma.sql`LOWER(email) = ${identifier}`
        : Prisma.sql`phone = ${identifier}`}
    LIMIT 1
  `

  const member = rows[0] ?? null
  if (!member) {
    return NextResponse.json({ error: isAdminPortal ? 'Username atau password salah' : 'Email/nomor HP atau password salah' }, { status: 401 })
  }

  if (!isAdminPortal && isEmail && !member.email_verified_at) {
    return NextResponse.json({ error: 'Email belum diverifikasi. Masuk dengan nomor HP lalu verifikasi email di halaman profil.' }, { status: 403 })
  }

  if (!isAdminPortal && member.login_status === 1) {
    return NextResponse.json({ error: 'Akun sedang login di perangkat lain' }, { status: 403 })
  }

  const usesBcrypt = member.password.startsWith('$2')
  const passwordMatches = usesBcrypt
    ? await bcrypt.compare(password, member.password)
    : createHash('md5').update(password).digest('hex') === member.password
  if (!passwordMatches) return NextResponse.json({ error: isAdminPortal ? 'Username atau password salah' : 'Email/nomor HP atau password salah' }, { status: 401 })

  const isAdmin = member.type === 1
  if (isAdminPortal && !isAdmin) {
    return NextResponse.json({ error: 'Akun tidak memiliki akses admin' }, { status: 403 })
  }
  if (parsed.data.portal === 'member' && isAdmin) {
    return NextResponse.json({ error: 'Gunakan halaman login admin' }, { status: 403 })
  }

  if (!usesBcrypt) {
    const upgradedHash = await bcrypt.hash(password, 12)
    await prisma.$executeRaw`UPDATE members SET password = ${upgradedHash} WHERE id = ${member.id}`
  }

  if (isAdminPortal) {
    const totp = await getOrCreateAdminTotp(member.id)
    const setup = totp.enabled !== 1
    const challengeToken = await signAdminOtpChallenge(member.id, setup)
    const enrollment = setup ? await createTotpSetup(totp.secret, configuredAdminUsername) : null
    return NextResponse.json({
      requiresOtp: true,
      setup,
      challengeToken,
      qrCode: enrollment?.qrCode,
      manualKey: setup ? totp.secret : undefined,
    }, { status: 202 })
  }

  // type 1 = admin, 0 = member
  const role = isAdmin ? 'admin' : 'member'
  const token = await signToken({ userId: member.id, phone: member.phone, role })

  // Update login_status = 1 dan date_login
  await prisma.$executeRaw`UPDATE members SET login_status = 1, date_login = NOW() WHERE id = ${member.id}`

  const res = NextResponse.json({ message: 'Login berhasil', role })
  res.cookies.set(setTokenCookie(token))
  return res
}
