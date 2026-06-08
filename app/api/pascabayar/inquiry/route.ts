import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendDigiflazzTransaction, getDigiflazzPascaAmount } from '@/lib/digiflazz'
import { z } from 'zod'

const schema = z.object({
  produkId: z.string().min(1),
  nomorPelanggan: z.string().min(5).max(35),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const produkId = Number(parsed.data.produkId)
  if (!Number.isInteger(produkId)) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
  }

  const pascaItem = await prisma.pasca.findUnique({ where: { id: produkId } })
  if (!pascaItem) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })

  try {
    const refId = `INQ${Date.now()}${Math.floor(Math.random() * 1000)}`
    const result = await sendDigiflazzTransaction({
      buyerSkuCode: pascaItem.code,
      customerNo: parsed.data.nomorPelanggan,
      refId,
      command: 'inq-pasca',
    })

    return NextResponse.json({
      refId,
      productCode: pascaItem.code,
      productName: pascaItem.name,
      brand: pascaItem.brand,
      customerNo: parsed.data.nomorPelanggan,
      customerName: result.customer_name || null,
      message: result.message,
      status: result.status,
      rc: result.rc,
      billCount: result.bill_count ?? null,
      admin: result.admin ?? 0,
      price: result.price ?? 0,
      sellingPrice: result.selling_price ?? 0,
      totalAmount: getDigiflazzPascaAmount(result),
      desc: result.desc ?? null,
      raw: result,
    })
  } catch (error) {
    console.error('Digiflazz inquiry error:', error)
    return NextResponse.json({ error: 'Gagal cek tagihan ke provider' }, { status: 502 })
  }
}
