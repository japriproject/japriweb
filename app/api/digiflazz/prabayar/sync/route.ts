import { NextRequest, NextResponse } from 'next/server'
import { fetchDigiflazzPrepaidPriceList, type DigiflazzPrepaidProduct } from '@/lib/digiflazz'
import { prisma } from '@/lib/prisma'

type ExistingPulsaRow = {
  id: number
  code: string
  members: number
}

function toPulsaStatus(product: DigiflazzPrepaidProduct) {
  return product.buyer_product_status !== false && product.seller_product_status !== false ? '1' : '0'
}

function toPulsaStats(product: DigiflazzPrepaidProduct) {
  return toPulsaStatus(product) === '1' ? 1 : 0
}

function toPulsaDesc(product: DigiflazzPrepaidProduct) {
  if (typeof product.desc === 'string' && product.desc.trim()) return product.desc

  const payload = {
    seller_name: product.seller_name ?? null,
    unlimited_stock: product.unlimited_stock ?? null,
    stock: product.stock ?? null,
    multi: product.multi ?? null,
    start_cut_off: product.start_cut_off ?? null,
    end_cut_off: product.end_cut_off ?? null,
    desc: product.desc ?? null,
  }

  return JSON.stringify(payload)
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

async function runSync() {
  try {
    const products = await fetchDigiflazzPrepaidPriceList()
    const existingRows = await prisma.$queryRaw<ExistingPulsaRow[]>`
      SELECT id, code, members
      FROM pulsa
    `

    const existingByCode = new Map(existingRows.map((row) => [row.code, row]))

    let created = 0
    let updated = 0

    for (const product of products) {
      const existing = existingByCode.get(product.buyer_sku_code)
      const data = {
        code: product.buyer_sku_code,
        name: product.product_name,
        kategori: product.category,
        jenis: product.type || '',
        stats: toPulsaStats(product),
        brand: product.brand,
        price: Number(product.price || 0),
        sale: Number(product.price || 0),
        members: existing?.members ?? 0,
        status: toPulsaStatus(product),
        desc: toPulsaDesc(product),
      }

      if (existing) {
        await prisma.pulsa.update({
          where: { id: existing.id },
          data,
        })
        updated += 1
      } else {
        await prisma.pulsa.create({ data })
        created += 1
      }
    }

    return NextResponse.json({
      success: true,
      totalFetched: products.length,
      created,
      updated,
    })
  } catch (error) {
    console.error('Digiflazz prepaid sync error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Sinkronisasi produk Digiflazz gagal',
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const syncKey = process.env.DIGIFLAZZ_SYNC_KEY
  const requestKey = new URL(req.url).searchParams.get('key')

  if (syncKey && requestKey !== syncKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runSync()
}
