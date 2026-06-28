import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { sendPasswordResetEmail } from '@/lib/email'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })
const genericMessage = 'Jika email terdaftar, tautan reset password akan segera dikirim.'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`forgot-password:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi 1 menit.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })

  const email = parsed.data.email.trim().toLowerCase()
  const member = await prisma.members.findFirst({
    where: { email, email_verified_at: { not: null } },
    select: { id: true, name: true, email: true },
  })

  if (!member) return NextResponse.json({ message: genericMessage })

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM password_reset_tokens WHERE member_id = ${member.id} AND used_at IS NULL`
    await tx.$executeRaw`
      INSERT INTO password_reset_tokens (member_id, token_hash, expires_at)
      VALUES (${member.id}, ${tokenHash}, ${expiresAt})
    `
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin).replace(/\/$/, '')

  try {
    await sendPasswordResetEmail({
      email: member.email,
      name: member.name,
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
    })
  } catch (error) {
    console.error('Failed to send password reset email', error)
  }

  return NextResponse.json({ message: genericMessage })
}
