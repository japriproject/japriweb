import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { sendEmailVerificationEmail } from '@/lib/email'

const schema = z.object({ email: z.string().trim().toLowerCase().email('Format email tidak valid').max(100) })

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`email-verification:${session.userId}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi beberapa menit.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Email tidak valid' }, { status: 400 })

  const memberId = Number(session.userId)
  const email = parsed.data.email
  const member = await prisma.members.findUnique({ where: { id: memberId }, select: { name: true, email: true, email_verified_at: true } })
  if (!member) return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })
  if (member.email.toLowerCase() === email && member.email_verified_at) {
    return NextResponse.json({ error: 'Email tersebut sudah aktif pada akun Anda' }, { status: 409 })
  }

  const owner = await prisma.members.findFirst({ where: { email, NOT: { id: memberId } }, select: { id: true } })
  if (owner) return NextResponse.json({ error: 'Email sudah digunakan akun lain' }, { status: 409 })

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    await tx.email_verification_tokens.deleteMany({ where: { member_id: memberId, used_at: null } })
    await tx.email_verification_tokens.create({ data: { member_id: memberId, pending_email: email, token_hash: tokenHash, expires_at: expiresAt } })
    await tx.members.update({
      where: { id: memberId },
      data: { email, email_verified_at: null },
    })
  })

  const created = await prisma.email_verification_tokens.findUnique({ where: { token_hash: tokenHash }, select: { id: true } })
  if (!created) return NextResponse.json({ error: 'Gagal membuat verifikasi email' }, { status: 500 })

  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://web.japrime.id'
    : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin).replace(/\/$/, '')
  try {
    await sendEmailVerificationEmail({
      email,
      name: member.name,
      verificationUrl: `${baseUrl}/verify-email?token=${token}`,
      tokenId: created.id,
    })
  } catch (error) {
    await prisma.$transaction(async (tx) => {
      await tx.email_verification_tokens.deleteMany({ where: { id: created.id, used_at: null } })
      await tx.members.update({
        where: { id: memberId },
        data: { email: member.email, email_verified_at: member.email_verified_at },
      })
    })
    console.error('Failed to send email verification', error)
    return NextResponse.json({ error: 'Email verifikasi gagal dikirim. Silakan coba kembali.' }, { status: 502 })
  }

  return NextResponse.json({ message: `Tautan verifikasi telah dikirim ke ${email}` })
}
