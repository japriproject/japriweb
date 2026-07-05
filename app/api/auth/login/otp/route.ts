import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { enableAdminTotp, ensureAdminTotpTable, verifyAdminTotp } from '@/lib/admin-totp'
import { rateLimit } from '@/lib/rateLimit'
import { setTokenCookie, signToken, verifyAdminOtpChallenge } from '@/lib/auth'

const schema = z.object({
  challengeToken: z.string().min(20),
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`admin-otp:${ip}`, 8, 60_000)) return NextResponse.json({ error: 'Terlalu banyak percobaan OTP' }, { status: 429 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Kode OTP harus 6 digit' }, { status: 400 })
  const challenge = await verifyAdminOtpChallenge(parsed.data.challengeToken)
  if (!challenge) return NextResponse.json({ error: 'Sesi verifikasi kedaluwarsa. Login ulang.' }, { status: 401 })

  await ensureAdminTotpTable()
  const admins = await prisma.$queryRaw<Array<{ id: number; phone: string; name: string; type: number; secret: string; enabled: number }>>`
    SELECT m.id, m.phone, m.name, m.type, t.secret, t.enabled
    FROM members m JOIN admin_totp t ON t.member_id = m.id
    WHERE m.id = ${challenge.userId} AND m.type = 1 LIMIT 1
  `
  const admin = admins[0]
  if (!admin || !await verifyAdminTotp(parsed.data.code, admin.secret)) return NextResponse.json({ error: 'Kode Google Authenticator salah' }, { status: 401 })
  if (challenge.setup && admin.enabled !== 1) await enableAdminTotp(admin.id)

  const token = await signToken({ userId: admin.id, phone: admin.phone, role: 'admin' })
  await prisma.$executeRaw`UPDATE members SET login_status = 1, date_login = NOW() WHERE id = ${admin.id}`
  const response = NextResponse.json({ message: 'Login admin berhasil', role: 'admin' })
  response.cookies.set(setTokenCookie(token))
  return response
}
