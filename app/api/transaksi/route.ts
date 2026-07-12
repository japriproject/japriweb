import { NextRequest, NextResponse } from 'next/server'
import { getSession, verifyPascaInquiry } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { digiflazzStatusToCode, sendDigiflazzTransaction } from '@/lib/digiflazz'
import { normalizePhone, toInt } from '@/lib/money'
import { z } from 'zod'

const schema = z.object({
  produkId: z.string().min(1),
  nomorTujuan: z.string().min(5).max(35),
  productType: z.enum(['prabayar', 'pasca']).default('prabayar'),
  inquiryToken: z.string().min(20).optional(),
})

function generateInvoice() {
  return 'INV' + Date.now() + Math.floor(Math.random() * 1000)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`trx:${session.userId}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak transaksi.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const { produkId, nomorTujuan, productType, inquiryToken } = parsed.data
  const productId = Number(produkId)
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
  }

  let produkNama = ''
  let hargaJual = 0
  let hargaProvider = 0
  let kodeProduk = ''
  let invoice = generateInvoice()

  if (productType === 'pasca') {
    const pascaItem = await prisma.pasca.findUnique({ where: { id: productId } })
    if (!pascaItem) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    produkNama = pascaItem.name
    kodeProduk = pascaItem.code

    if (!inquiryToken) return NextResponse.json({ error: 'Cek tagihan terlebih dahulu' }, { status: 400 })
    const inquiry = await verifyPascaInquiry(inquiryToken)
    const normalizedCustomer = normalizePhone(nomorTujuan) || nomorTujuan
    if (!inquiry || inquiry.userId !== Number(session.userId) || inquiry.productId !== productId || inquiry.customerNo !== normalizedCustomer) {
      return NextResponse.json({ error: 'Data tagihan tidak valid atau sudah kedaluwarsa. Silakan cek ulang.' }, { status: 400 })
    }
    hargaProvider = toInt(inquiry.providerAmount)
    hargaJual = toInt(inquiry.totalAmount)
    invoice = inquiry.refId
    if (hargaJual <= 0 || hargaProvider <= 0) return NextResponse.json({ error: 'Nominal tagihan tidak valid' }, { status: 400 })
  } else {
    const pulsaItem = await prisma.pulsa.findUnique({ where: { id: productId } })
    if (!pulsaItem) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    produkNama = pulsaItem.name
    hargaJual = toInt(pulsaItem.sale)
    hargaProvider = toInt(pulsaItem.price)
    kodeProduk = pulsaItem.code
  }

  const memberRows = await prisma.$queryRaw<Array<{ phone: string; sososo: number }>>`
    SELECT phone, sososo FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = memberRows[0] ?? null
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const saldoNow = toInt(member.sososo)
  if (saldoNow < hargaJual) return NextResponse.json({ error: 'Saldo tidak cukup' }, { status: 400 })

  const trx = await prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM transaksi WHERE members = ${member.phone} AND invoice = ${invoice} LIMIT 1 FOR UPDATE
    `
    if (existing[0]) throw new Error('Tagihan sudah pernah diproses')
    const updated = await tx.$executeRaw`
      UPDATE members
      SET sososo = sososo - ${hargaJual}
      WHERE id = ${Number(session.userId)} AND sososo >= ${hargaJual}
    `

    if (updated !== 1) {
      throw new Error('Saldo tidak cukup')
    }

    return tx.transaksi.create({
      data: {
        invoice,
        members: member.phone,
        product: kodeProduk,
        customers: normalizePhone(nomorTujuan) || nomorTujuan,
        sale: hargaJual,
        price: hargaProvider,
        admin: 0,
        status: 0,
        type: productType === 'pasca' ? 2 : 1,
        claim: 0,
        status_update: 0,
        migrasi: 0,
        desc: produkNama,
        date: new Date(),
      },
    })
  }).catch((error) => {
    if (error instanceof Error && (error.message === 'Saldo tidak cukup' || error.message === 'Tagihan sudah pernah diproses')) return error.message
    throw error
  })

  if (typeof trx === 'string') return NextResponse.json({ error: trx }, { status: trx === 'Tagihan sudah pernah diproses' ? 409 : 400 })

  try {
    const result = await sendDigiflazzTransaction({
      buyerSkuCode: kodeProduk,
      customerNo: normalizePhone(nomorTujuan) || nomorTujuan,
      refId: invoice,
      command: productType === 'pasca' ? 'pay-pasca' : undefined,
      maxPrice: productType === 'pasca' ? hargaProvider : hargaJual,
    })

    const providerStatus = digiflazzStatusToCode(result.status)
    const status = providerStatus
    await prisma.$transaction(async (tx) => {
      await tx.transaksi.update({
        where: { id: trx.id },
        data: {
          status,
          status_update: status === 0 ? 0 : 1,
          sn: providerStatus === 1 ? result.sn || null : null,
          desc: produkNama,
          updated_at: new Date(),
        },
      })

      if (status === 2) {
        await tx.$executeRaw`
          UPDATE members
          SET sososo = sososo + ${hargaJual}
          WHERE phone = ${member.phone}
        `
      }
    })

    return NextResponse.json({
      id: trx.id,
      invoice: trx.invoice,
      produk: produkNama,
      harga: hargaJual,
      status: status === 2 ? 'Gagal' : status === 1 ? 'Sukses' : 'Pending',
      message: result.message || (status === 1 ? 'Pembayaran berhasil' : status === 2 ? 'Transaksi gagal diproses' : 'Transaksi sedang diproses'),
      sn: status === 2 ? null : result.sn,
    }, { status: 201 })
  } catch (error) {
    console.error('Digiflazz transaction error:', error)
    const providerMessage = error instanceof Error ? error.message : 'Transaksi gagal diproses provider'
    await prisma.$transaction(async (tx) => {
      await tx.transaksi.update({
        where: { id: trx.id },
        data: {
          status: 2,
          status_update: 1,
          desc: 'Transaksi gagal dikirim ke Digiflazz',
          updated_at: new Date(),
        },
      })
      await tx.$executeRaw`
        UPDATE members
        SET sososo = sososo + ${hargaJual}
        WHERE phone = ${member.phone}
      `
    })

    return NextResponse.json({ error: providerMessage }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberGetRows = await prisma.$queryRaw<Array<{ phone: string }>>`
    SELECT phone FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const memberGet = memberGetRows[0]
  if (!memberGet) return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 1 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 10
  const skip = (page - 1) * limit
  const typeParam = searchParams.get('type')
  const excludeTypeParam = searchParams.get('exclude_type')
  const where = {
    members: memberGet.phone,
    ...(typeParam !== null ? { type: parseInt(typeParam) } : {}),
    ...(excludeTypeParam !== null ? { NOT: { type: parseInt(excludeTypeParam) } } : {}),
  }

  const [data, total] = await prisma.$transaction([
    prisma.transaksi.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaksi.count({ where }),
  ])

  const mapped = data.map(t => ({
    id: t.id,
    nomorTujuan: t.customers,
    harga: t.sale,
    claim: t.claim,
    status: t.status === 1 ? 'SUKSES' : t.status === 0 ? 'PENDING' : 'GAGAL',
    createdAt: t.created_at,
    produk: {
      nama: t.desc ?? t.product,
      kategori: 'PULSA',
      operator: '',
    },
  }))

  return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
}
