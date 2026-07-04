import 'server-only'

import { prisma } from '@/lib/prisma'
import {
  fetchDigiflazzPostpaidPriceList,
  fetchDigiflazzPrepaidPriceList,
  type DigiflazzPostpaidProduct,
  type DigiflazzPrepaidProduct,
} from '@/lib/digiflazz'

type ExistingPulsaRow = {
  id: number
  code: string
  members: number
  margin: number
}

function toPulsaStatus(product: DigiflazzPrepaidProduct) {
  return product.buyer_product_status !== false && product.seller_product_status !== false ? '1' : '0'
}

function toPulsaStats(product: DigiflazzPrepaidProduct) {
  return toPulsaStatus(product) === '1' ? 1 : 0
}

function toPulsaDesc(product: DigiflazzPrepaidProduct) {
  if (typeof product.desc === 'string' && product.desc.trim()) return product.desc

  return JSON.stringify({
    seller_name: product.seller_name ?? null,
    unlimited_stock: product.unlimited_stock ?? null,
    stock: product.stock ?? null,
    multi: product.multi ?? null,
    start_cut_off: product.start_cut_off ?? null,
    end_cut_off: product.end_cut_off ?? null,
    desc: product.desc ?? null,
  })
}

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

export async function syncPrepaidProducts() {
  const products = await fetchDigiflazzPrepaidPriceList()
  const existingRows = await prisma.$queryRaw<ExistingPulsaRow[]>`
    SELECT id, code, members, GREATEST(sale - price, 0) AS margin
    FROM pulsa
  `
  const existingByCode = new Map(existingRows.map((row) => [row.code, row]))

  let created = 0
  let updated = 0

  for (const product of products) {
    const existing = existingByCode.get(product.buyer_sku_code)
    const price = Number(product.price || 0)
    const margin = Number(existing?.margin || 0)
    const data = {
      code: product.buyer_sku_code,
      name: product.product_name,
      kategori: product.category,
      jenis: product.type || '',
      stats: toPulsaStats(product),
      brand: product.brand,
      price,
      sale: price + margin,
      members: existing?.members ?? 0,
      status: toPulsaStatus(product),
      desc: toPulsaDesc(product),
    }

    if (existing) {
      await prisma.pulsa.update({ where: { id: existing.id }, data })
      updated += 1
    } else {
      await prisma.pulsa.create({ data })
      created += 1
    }
  }

  return { totalFetched: products.length, created, updated }
}

export async function syncPostpaidProducts() {
  const products = await fetchDigiflazzPostpaidPriceList()
  const marginRows = await prisma.$queryRaw<Array<{ margin: number }>>`
    SELECT COALESCE(MAX(GREATEST(sale - price, 0)), 0) AS margin
    FROM pasca
  `
  const margin = Number(marginRows[0]?.margin || 0)
  const rows = products.map((product) => {
    const admin = Number(product.admin || 0)
    return {
      code: product.buyer_sku_code,
      name: product.product_name,
      kategori: product.category,
      brand: product.brand,
      admin,
      price: admin,
      sale: admin + margin,
      members: 0,
      status: toPascaStatus(product),
      desc: toPascaDesc(product),
    }
  })

  await prisma.$transaction(async (tx) => {
    await tx.pasca.deleteMany({})
    if (rows.length > 0) await tx.pasca.createMany({ data: rows })
  })

  return { totalFetched: products.length, inserted: rows.length }
}

export async function applyProductMargin(type: 'prabayar' | 'pascabayar', margin: number) {
  const safeMargin = Math.max(0, Math.floor(margin))

  if (type === 'pascabayar') {
    const updated = await prisma.$executeRaw`
      UPDATE pasca
      SET sale = price + ${safeMargin}
    `
    return { updated: Number(updated), margin: safeMargin }
  }

  const updated = await prisma.$executeRaw`
    UPDATE pulsa
    SET sale = price + ${safeMargin}
  `
  return { updated: Number(updated), margin: safeMargin }
}
