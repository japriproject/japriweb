import { NextRequest, NextResponse } from 'next/server'
import { fetchDigiflazzPostpaidPriceList, type DigiflazzPostpaidProduct } from '@/lib/digiflazz'
import { prisma } from '@/lib/prisma'

function toPascaStatus(product: DigiflazzPostpaidProduct) {
  return product.buyer_product_status !== false && product.seller_product_status !== false ? '1' : '0'
}

function toPascaDesc(product: DigiflazzPostpaidProduct) {
  if (typeof product.desc === 'string' && product.desc.trim()) return product.desc

  return JSON.stringify({
    desc: product.desc ?? null,
    buyer_product_status: product.buyer_product_status ?? null,
    seller_product_status: product.seller_product_status ?? null,
    commission: product.commission ?? null,
  })
}

function toPascaRow(product: DigiflazzPostpaidProduct) {
  const admin = Number(product.admin || 0)
  return {
    code: product.buyer_sku_code,
    name: product.product_name,
    kategori: product.category,
    brand: product.brand,
    admin,
    price: admin,
    sale: admin,
    members: 0,
    status: toPascaStatus(product),
    desc: toPascaDesc(product),
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

async function runSync() {
  try {
    const products = await fetchDigiflazzPostpaidPriceList()
    const rows = products.map(toPascaRow)

    await prisma.$transaction(async (tx) => {
      await tx.pasca.deleteMany({})
      if (rows.length > 0) {
        await tx.pasca.createMany({ data: rows })
      }
    })

    return NextResponse.json({
      success: true,
      totalFetched: products.length,
      inserted: rows.length,
    })
  } catch (error) {
    console.error('Digiflazz postpaid sync error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Sinkronisasi produk pascabayar Digiflazz gagal',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const syncKey = process.env.DIGIFLAZZ_SYNC_KEY
  const url = new URL(req.url)
  const requestKey = url.searchParams.get('key')
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'

  if (syncKey && !isLocalhost && requestKey !== syncKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runSync()
}
