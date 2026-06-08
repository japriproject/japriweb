import { NextRequest, NextResponse } from 'next/server'
import { applyDuitkuTopupBonus } from '@/lib/bonus'
import { verifyDuitkuCallback } from '@/lib/duitku'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const merchantCode = String(form.get('merchantCode') ?? '')
  const amount = String(form.get('amount') ?? '')
  const merchantOrderId = String(form.get('merchantOrderId') ?? '')
  const resultCode = String(form.get('resultCode') ?? '')
  const reference = String(form.get('reference') ?? '')
  const signature = String(form.get('signature') ?? '')

  if (!merchantCode || !amount || !merchantOrderId || !signature) {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }

  if (!verifyDuitkuCallback(merchantCode, amount, merchantOrderId, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{
      id: number
      members: string
      sale: number
      price: number
      status: number
    }>>`
      SELECT id, members, sale, price, status
      FROM transaksi
      WHERE invoice = ${merchantOrderId} AND type = 7
      LIMIT 1
    `

    const trx = rows[0]
    if (!trx) return

    const nextStatus = resultCode === '00' ? 1 : 2
    await tx.transaksi.update({
      where: { id: trx.id },
      data: {
        status: nextStatus,
        status_update: 1,
        sn: reference || null,
        desc: resultCode === '00' ? 'Top up berhasil dibayar via Duitku' : 'Top up gagal via Duitku',
        updated_at: new Date(),
      },
    })

    if (resultCode === '00' && trx.status !== 1) {
      await tx.$executeRaw`
        UPDATE members
        SET sososo = sososo + ${trx.sale}
        WHERE phone = ${trx.members}
      `

      await applyDuitkuTopupBonus(tx, {
        sourceInvoice: merchantOrderId,
        memberPhone: trx.members,
      })
    }
  })

  return new NextResponse('SUCCESS', { status: 200 })
}
