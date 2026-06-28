import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({ token: z.string().length(64) })

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Tautan verifikasi tidak valid' }, { status: 400 })

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
  const token = await prisma.email_verification_tokens.findUnique({ where: { token_hash: tokenHash } })
  if (!token || token.used_at || token.expires_at <= new Date()) {
    return NextResponse.json({ error: 'Tautan verifikasi tidak valid atau sudah kedaluwarsa' }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const duplicate = await tx.members.findFirst({
      where: { email: token.pending_email, NOT: { id: token.member_id } },
      select: { id: true },
    })
    if (duplicate) return 'duplicate' as const

    const claimed = await tx.email_verification_tokens.updateMany({
      where: { id: token.id, used_at: null, expires_at: { gt: new Date() } },
      data: { used_at: new Date() },
    })
    if (claimed.count !== 1) return 'invalid' as const

    await tx.members.update({
      where: { id: token.member_id },
      data: { email: token.pending_email, email_verified_at: new Date() },
    })
    return 'success' as const
  })

  if (result === 'duplicate') return NextResponse.json({ error: 'Email sudah digunakan akun lain' }, { status: 409 })
  if (result === 'invalid') return NextResponse.json({ error: 'Tautan verifikasi sudah digunakan atau kedaluwarsa' }, { status: 409 })
  return NextResponse.json({ message: 'Email berhasil diverifikasi dan sekarang sudah aktif.' })
}
