import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { digiflazzStatusToCode, getDigiflazzPascaAmount, sendDigiflazzTransaction } from '@/lib/digiflazz'
import { normalizePhone, toInt } from '@/lib/money'
import { z } from 'zod'

const schema = z.object({
  produkId: z.string().min(1),
  nomorTujuan: z.string().min(5).max(35),
  productType: z.enum(['prabayar', 'pasca']).default('prabayar'),
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

  const { produkId, nomorTujuan, productType } = parsed.data
  const productId = Number(produkId)
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
  }

  let produkNama = ''
  let hargaJual = 0
  let kodeProduk = ''

  if (productType === 'pasca') {
    const pascaItem = await prisma.pasca.findUnique({ where: { id: productId } })
    if (!pascaItem) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    produkNama = pascaItem.name
    kodeProduk = pascaItem.code

    const inquiry = await sendDigiflazzTransaction({
      buyerSkuCode: kodeProduk,
      customerNo: normalizePhone(nomorTujuan) || nomorTujuan,
      refId: `INQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
      command: 'inq-pasca',
    })

    hargaJual = toInt(getDigiflazzPascaAmount(inquiry))
    if (hargaJual <= 0) {
      return NextResponse.json({ error: inquiry.message || 'Tagihan tidak valid' }, { status: 400 })
    }
  } else {
    const pulsaItem = await prisma.pulsa.findUnique({ where: { id: productId } })
    if (!pulsaItem) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    produkNama = pulsaItem.name
    hargaJual = toInt(pulsaItem.sale)
    kodeProduk = pulsaItem.code
  }

  const memberRows = await prisma.$queryRaw<Array<{ phone: string; sososo: number }>>`
    SELECT phone, sososo FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = memberRows[0] ?? null
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const saldoNow = toInt(member.sososo)
  if (saldoNow < hargaJual) return NextResponse.json({ error: 'Saldo tidak cukup' }, { status: 400 })

  const invoice = generateInvoice()

  const trx = await prisma.$transaction(async (tx) => {
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
        price: hargaJual,
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
    if (error instanceof Error && error.message === 'Saldo tidak cukup') return null
    throw error
  })

  if (!trx) return NextResponse.json({ error: 'Saldo tidak cukup' }, { status: 400 })

  try {
    const result = await sendDigiflazzTransaction({
      buyerSkuCode: kodeProduk,
      customerNo: normalizePhone(nomorTujuan) || nomorTujuan,
      refId: invoice,
      command: productType === 'pasca' ? 'pay-pasca' : undefined,
      maxPrice: hargaJual,
    })

    const providerStatus = digiflazzStatusToCode(result.status)
    const status = providerStatus === 2 ? 2 : 0
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
      status: status === 2 ? 'Gagal' : 'Pending',
      message: status === 2 ? (result.message || 'Transaksi gagal diproses') : 'Transaksi sedang diproses',
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

  const [data, total] = await prisma.$transaction([
    prisma.transaksi.findMany({
      where: { members: memberGet.phone },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaksi.count({ where: { members: memberGet.phone } }),
  ])

  const mapped = data.map(t => ({
    id: t.id,
    nomorTujuan: t.customers,
    harga: t.sale,
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
