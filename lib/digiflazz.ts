import { createHash, createHmac, timingSafeEqual } from 'crypto'

const DIGIFLAZZ_URL = 'https://api.digiflazz.com/v1/transaction'
const DIGIFLAZZ_PRICE_LIST_URL = 'https://api.digiflazz.com/v1/price-list'

export type DigiflazzStatus = 'Sukses' | 'Pending' | 'Gagal'

export type DigiflazzData = {
  ref_id: string
  customer_no: string
  buyer_sku_code: string
  message: string
  status: DigiflazzStatus | string
  rc: string
  sn?: string
  buyer_last_saldo?: number
  price?: number
  selling_price?: number
  admin?: number
  customer_name?: string
  bill_count?: number
  desc?: unknown
}

export type DigiflazzPrepaidProduct = {
  buyer_sku_code: string
  product_name: string
  category: string
  brand: string
  type: string
  seller_name?: string
  price: number
  buyer_product_status?: boolean
  seller_product_status?: boolean
  unlimited_stock?: boolean
  stock?: number
  multi?: boolean
  start_cut_off?: string
  end_cut_off?: string
  desc?: unknown
}

type DigiflazzRequest = {
  buyerSkuCode: string
  customerNo: string
  refId: string
  command?: 'inq-pasca' | 'pay-pasca'
  maxPrice?: number
}

function md5(value: string) {
  return createHash('md5').update(value).digest('hex')
}

function getConfig() {
  const username = process.env.DIGIFLAZZ_USERNAME
  const apiKey = process.env.DIGIFLAZZ_API_KEY
  if (!username || !apiKey) {
    throw new Error('DIGIFLAZZ_USERNAME dan DIGIFLAZZ_API_KEY wajib diisi')
  }
  return {
    username,
    apiKey,
    testing: process.env.DIGIFLAZZ_TESTING === 'true',
    callbackUrl: process.env.DIGIFLAZZ_CALLBACK_URL,
    webhookSecret: process.env.DIGIFLAZZ_WEBHOOK_SECRET,
  }
}

export function digiflazzStatusToCode(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'sukses') return 1
  if (normalized === 'gagal') return 2
  return 0
}

export async function fetchDigiflazzPrepaidPriceList(): Promise<DigiflazzPrepaidProduct[]> {
  const config = getConfig()
  const payload: Record<string, unknown> = {
    cmd: 'prepaid',
    username: config.username,
    sign: md5(config.username + config.apiKey + 'pricelist'),
  }

  if (config.testing) payload.testing = true

  const response = await fetch(DIGIFLAZZ_PRICE_LIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let body: { data?: DigiflazzPrepaidProduct[]; message?: string } | null = null

  if (responseText) {
    try {
      body = JSON.parse(responseText) as { data?: DigiflazzPrepaidProduct[]; message?: string }
    } catch {
      body = null
    }
  }

  if (!response.ok || !Array.isArray(body?.data)) {
    const message = body?.message || responseText || 'Request daftar harga Digiflazz gagal'
    throw new Error(`Digiflazz ${response.status}: ${message}`)
  }

  return body.data
}

export async function sendDigiflazzTransaction({
  buyerSkuCode,
  customerNo,
  refId,
  command,
  maxPrice,
}: DigiflazzRequest): Promise<DigiflazzData> {
  const config = getConfig()
  const payload: Record<string, unknown> = {
    username: config.username,
    buyer_sku_code: buyerSkuCode,
    customer_no: customerNo,
    ref_id: refId,
    sign: md5(config.username + config.apiKey + refId),
  }

  if (config.testing) payload.testing = true
  if (config.callbackUrl) payload.cb_url = config.callbackUrl
  if (command) payload.commands = command
  if (maxPrice) payload.max_price = maxPrice

  const response = await fetch(DIGIFLAZZ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let body: { data?: DigiflazzData; message?: string } | null = null

  if (responseText) {
    try {
      body = JSON.parse(responseText) as { data?: DigiflazzData; message?: string }
    } catch {
      body = null
    }
  }
  if (!response.ok || !body?.data) {
    const message =
      body?.data?.message ||
      body?.message ||
      responseText ||
      'Request Digiflazz gagal'

    throw new Error(`Digiflazz ${response.status}: ${message}`)
  }

  return body.data as DigiflazzData
}

export function getDigiflazzPascaAmount(data: DigiflazzData) {
  if (typeof data.selling_price === 'number' && data.selling_price > 0) return data.selling_price
  if (typeof data.price === 'number' && data.price > 0) {
    return data.price + (typeof data.admin === 'number' ? data.admin : 0)
  }
  if (typeof data.admin === 'number' && data.admin > 0) return data.admin
  return 0
}

export function verifyDigiflazzWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET
  if (!secret) return true
  if (!signature?.startsWith('sha1=')) return false

  const expected = 'sha1=' + createHmac('sha1', secret).update(rawBody).digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
