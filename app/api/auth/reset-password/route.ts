import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { sendPasswordChangedEmail } from '@/lib/email'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  token: z.string().length(64),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`reset-password:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi 1 menit.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Data tidak valid' }, { status: 400 })

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
  const resetTokens = await prisma.$queryRaw<Array<{
    id: number
    member_id: number
    expires_at: Date
    used_at: Date | null
  }>>`
    SELECT id, member_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `
  const resetToken = resetTokens[0] ?? null

  if (!resetToken || resetToken.used_at || resetToken.expires_at <= new Date()) {
    return NextResponse.json({ error: 'Tautan reset password tidak valid atau sudah kedaluwarsa' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const passwordUpdated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.$executeRaw`
      UPDATE password_reset_tokens
      SET used_at = UTC_TIMESTAMP()
      WHERE id = ${resetToken.id} AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
    `
    if (Number(claimed) !== 1) return false

    const memberUpdated = await tx.$executeRaw`
      UPDATE members
      SET password = ${passwordHash}, login_status = 0
      WHERE id = ${resetToken.member_id}
    `
    if (Number(memberUpdated) !== 1) {
      throw new Error('Akun untuk reset password tidak ditemukan')
    }

    return true
  })

  if (!passwordUpdated) {
    return NextResponse.json(
      { error: 'Tautan reset password tidak valid, sudah digunakan, atau sudah kedaluwarsa.' },
      { status: 409 },
    )
  }

  const member = await prisma.members.findUnique({
    where: { id: resetToken.member_id },
    select: { email: true, name: true },
  })

  if (member?.email) {
    const ipAddress = (req.headers.get('x-forwarded-for') || 'Tidak diketahui').split(',')[0].trim()
    const userAgent = req.headers.get('user-agent') || 'Tidak diketahui'

    try {
      await sendPasswordChangedEmail({
        email: member.email,
        name: member.name,
        changedAt: new Date(),
        ipAddress,
        userAgent,
        resetTokenId: resetToken.id,
      })
    } catch (error) {
      console.error('Failed to send password changed email', error)
    }
  }

  return NextResponse.json({ message: 'Password berhasil diperbarui. Silakan masuk kembali.' })
}
