import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'
import { syncPostpaidProducts, syncPrepaidProducts } from '@/lib/admin-products'

export async function POST(_req: NextRequest, context: RouteContext<'/api/admin/products/[type]/sync'>) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { type } = await context.params
  if (type !== 'prabayar' && type !== 'pascabayar') {
    return NextResponse.json({ error: 'Tipe produk tidak valid' }, { status: 400 })
  }

  try {
    const result = type === 'pascabayar' ? await syncPostpaidProducts() : await syncPrepaidProducts()
    return NextResponse.json({ success: true, type, ...result })
  } catch (error) {
    console.error('Admin product sync error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Sinkronisasi produk gagal',
    }, { status: 500 })
  }
}
