import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function mapStatus(status: number) {
  if (status === 1) return 'SUKSES'
  if (status === 2) return 'GAGAL'
  return 'PENDING'
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = req.nextUrl.searchParams.get('invoice')?.trim()
  if (!invoice) return NextResponse.json({ error: 'Invoice wajib diisi' }, { status: 400 })

  const memberRows = await prisma.$queryRaw<Array<{ phone: string }>>`
    SELECT phone FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = memberRows[0]
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const rows = await prisma.$queryRaw<Array<{
    id: number
    invoice: string
    status: number
    sn: string | null
    updated_at: Date | null
  }>>`
    SELECT id, invoice, status, sn, updated_at
    FROM transaksi
    WHERE invoice = ${invoice} AND members = ${member.phone} AND type = 7
    LIMIT 1
  `

  const trx = rows[0]
  if (!trx) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })

  return NextResponse.json({
    id: trx.id,
    invoice: trx.invoice,
    status: mapStatus(trx.status),
    reference: trx.sn,
    updatedAt: trx.updated_at,
  })
}
