import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; phone: string; email: string; sososo: number; type: number; created_at: Date
  }>>`SELECT id, name, phone, email, sososo, type, created_at FROM members WHERE id = ${Number(session.userId)} LIMIT 1`

  const member = rows[0]
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  return NextResponse.json({
    id: member.id,
    nama: member.name,
    noHp: member.phone,
    email: member.email,
    saldo: member.sososo || 0,
    role: member.type === 1 ? 'ADMIN' : 'USER',
    createdAt: member.created_at,
  })
}
