import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDuitkuInvoice } from '@/lib/duitku'
import { z } from 'zod'

const schema = z.object({
  jumlah: z.number().min(10000).max(10000000),
  metode: z.string().min(1),
  kodeUnik: z.number().int().min(300).max(499),
})

const ADMIN_FEE = 3500
type BankRow = {
  id: number
  bank_id: string
  bank_code: string
  bank_name: string
  otomatis: number
  icon: string
  number: string
  status: number
}

export async function GET() {
  const methods = await prisma.$queryRaw<BankRow[]>`
    SELECT id, bank_id, bank_code, bank_name, otomatis, icon, number, status
    FROM bank
    WHERE status = 1
    ORDER BY otomatis DESC, id ASC
  `

  return NextResponse.json({
    methods: methods.map((row) => ({
      value: row.bank_id,
      code: row.bank_code,
      label: row.otomatis === 1 ? row.bank_code : `${row.bank_code} Transfer`,
      description: row.otomatis === 1 ? 'Otomatis • Scan & bayar' : 'Transfer manual • Ke rekening bank',
      icon: row.icon,
      automatic: row.otomatis === 1,
      bankName: row.bank_name,
      accountNumber: row.number,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const { jumlah, metode, kodeUnik } = parsed.data
  const bankRows = await prisma.$queryRaw<BankRow[]>`
    SELECT id, bank_id, bank_code, bank_name, otomatis, icon, number, status
    FROM bank
    WHERE bank_id = ${metode} AND status = 1
    LIMIT 1
  `
  const bank = bankRows[0]
  if (!bank) return NextResponse.json({ error: 'Metode pembayaran tidak ditemukan' }, { status: 404 })

  const memberRows = await prisma.$queryRaw<Array<{ phone: string; name: string; email: string }>>`
    SELECT phone, name, email FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = memberRows[0]
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const biayaLayanan = ADMIN_FEE
  const totalBiaya = biayaLayanan + kodeUnik
  const totalTransfer = jumlah + totalBiaya

  const invoice = 'DEP' + Date.now() + Math.floor(Math.random() * 1000)
  const product = bank.otomatis === 1 ? 'DUITKU_QRIS' : `BANK_${bank.bank_code}`

  const trx = await prisma.transaksi.create({
    data: {
      invoice,
      members: member.phone,
      product,
      customers: member.phone,
      sale: jumlah,
      price: totalTransfer,
      admin: totalBiaya,
      status: 0,
      type: 7,
      claim: 0,
      status_update: 0,
      migrasi: 0,
      desc: `Top Up Saldo Japripay ${invoice}`,
      date: new Date(),
    },
  })

  if (bank.otomatis !== 1) {
    return NextResponse.json({
      id: trx.id,
      invoice: trx.invoice,
      nominal: jumlah,
      biayaLayanan,
      kodeUnik,
      totalTransfer,
      metode: bank.bank_code,
      bankName: bank.bank_code,
      accountNumber: bank.number,
      accountName: bank.bank_name,
      status: 'PENDING',
    }, { status: 201 })
  }

  try {
    const duitku = await createDuitkuInvoice({
      amount: totalTransfer,
      orderId: invoice,
      productDetails: `Top Up Saldo ${invoice}`,
      customerName: member.name || member.phone,
      email: member.email || `${member.phone}@pulsa.local`,
      phoneNumber: member.phone,
      paymentMethod: process.env.DUITKU_QRIS_METHOD || 'SP',
    })

    console.log('Duitku invoice response:', {
      invoice,
      reference: duitku.reference,
      paymentUrl: duitku.paymentUrl,
      hasQrString: Boolean(duitku.qrString),
      qrUrl: duitku.qrUrl || null,
    })

    await prisma.transaksi.update({
      where: { id: trx.id },
      data: {
        sn: duitku.reference,
        desc: `Top Up Saldo Japripay ${invoice}`,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      id: trx.id,
      invoice: trx.invoice,
      reference: duitku.reference,
      paymentUrl: duitku.paymentUrl,
      qrCode: duitku.qrString,
      qrUrl: duitku.qrUrl,
      nominal: jumlah,
      biayaLayanan,
      kodeUnik,
      totalTransfer,
      metode: bank.bank_code,
      status: 'PENDING',
    }, { status: 201 })
  } catch (error) {
    console.error('Duitku create invoice error:', error)
    await prisma.transaksi.update({
      where: { id: trx.id },
      data: {
        status: 2,
        status_update: 1,
        desc: 'Top up gagal dibuat di Duitku',
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ error: 'Top up gagal dibuat' }, { status: 502 })
  }
}
