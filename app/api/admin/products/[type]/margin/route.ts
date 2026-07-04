import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminSession } from '@/lib/admin'
import { applyProductMargin } from '@/lib/admin-products'

const schema = z.object({
  margin: z.coerce.number().int().min(0).max(10_000_000),
})

export async function PATCH(req: NextRequest, context: RouteContext<'/api/admin/products/[type]/margin'>) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { type } = await context.params
  if (type !== 'prabayar' && type !== 'pascabayar') {
    return NextResponse.json({ error: 'Tipe produk tidak valid' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Margin tidak valid' }, { status: 400 })

  const result = await applyProductMargin(type, parsed.data.margin)
  return NextResponse.json({ success: true, type, ...result })
}
