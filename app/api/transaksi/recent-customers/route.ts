import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.members.findUnique({
    where: { id: Number(session.userId) },
    select: { phone: true },
  })
  if (!member) return NextResponse.json({ data: [] })

  const transactions = await prisma.transaksi.findMany({
    where: {
      members: member.phone,
      customers: { not: '' },
      type: { in: [1, 2] },
    },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: 5,
    select: { id: true, customers: true, desc: true, product: true, created_at: true },
  })

  return NextResponse.json({
    data: transactions.map(transaction => ({
      id: transaction.id,
      nomorTujuan: transaction.customers,
      produk: transaction.desc || transaction.product,
      createdAt: transaction.created_at,
    })),
  })
}
