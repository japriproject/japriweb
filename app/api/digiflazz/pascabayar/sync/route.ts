import { NextRequest, NextResponse } from 'next/server'
import { syncPostpaidProducts } from '@/lib/admin-products'

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

async function runSync() {
  try {
    const result = await syncPostpaidProducts()

    return NextResponse.json({
      success: true,
      ...result,
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
