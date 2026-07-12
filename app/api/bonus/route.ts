import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.$queryRaw<Array<{ phone: string; bobobo: number }>>`
    SELECT phone, bobobo FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = rows[0]
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const pending = await prisma.transaksi.aggregate({
    where: { members: member.phone, type: 7, claim: 0 },
    _sum: { sale: true },
    _count: true,
  })

  return NextResponse.json({
    pending: pending._sum.sale || 0,
    pendingCount: pending._count,
    terkumpul: member.bobobo || 0,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.$queryRaw<Array<{ phone: string }>>`
    SELECT phone FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = rows[0]
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const pending = await prisma.transaksi.findMany({
    where: { members: member.phone, type: 7, claim: 0 },
    select: { id: true, sale: true },
  })

  if (pending.length === 0) return NextResponse.json({ error: 'Tidak ada bonus yang bisa diklaim' }, { status: 400 })

  const total = pending.reduce((s, t) => s + t.sale, 0)
  const ids = pending.map(t => t.id)

  await prisma.$transaction(async (tx) => {
    await tx.transaksi.updateMany({ where: { id: { in: ids } }, data: { claim: 1, status: 1, status_update: 1 } })
    await tx.$executeRaw`
      UPDATE members SET bobobo = bobobo + ${total}, sososo = sososo + ${total}
      WHERE id = ${Number(session.userId)}
    `
  })

  return NextResponse.json({ success: true, total })
}
