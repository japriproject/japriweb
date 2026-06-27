import { createHash, createHmac, timingSafeEqual } from 'crypto'

const DIGIFLAZZ_URL = 'https://api.digiflazz.com/v1/transaction'
const DIGIFLAZZ_PRICE_LIST_URL = 'https://api.digiflazz.com/v1/price-list'
const DIGIFLAZZ_HOTEL_URL = process.env.DIGIFLAZZ_HOTEL_URL ?? 'https://api.digiflazz.com/v1/hotel'

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

export type DigiflazzPostpaidProduct = {
  buyer_sku_code: string
  product_name: string
  category: string
  brand: string
  admin: number
  commission?: number
  buyer_product_status?: boolean
  seller_product_status?: boolean
  desc?: unknown
}

type DigiflazzRequest = {
  buyerSkuCode: string
  customerNo: string
  refId: string
  command?: 'inq-pasca' | 'pay-pasca'
  maxPrice?: number
}

export type DigiflazzHotelEndpoint =
  | 'country'
  | 'city'
  | 'search-destination'
  | 'initiation'
  | 'filter'
  | 'property-detail'
  | 'recheck'
  | 'booking'
  | 'booking-detail'

type DigiflazzHotelRequest = {
  endpoint: DigiflazzHotelEndpoint
  additional?: string
  payload?: Record<string, unknown>
}

export class DigiflazzHotelError extends Error {
  status: number
  rc?: string

  constructor(message: string, status: number, rc?: string) {
    super(message)
    this.name = 'DigiflazzHotelError'
    this.status = status
    this.rc = rc
  }
}

const HOTEL_RESPONSE_CODES: Record<string, { status: number; message: string }> = {
  '11': { status: 401, message: 'Sesi Anda telah kedaluwarsa. Silakan lakukan pencarian hotel kembali.' },
  '12': { status: 422, message: 'Kamar tidak tersedia saat ini.' },
  '13': { status: 409, message: 'Kamar sudah terbooking.' },
  '14': { status: 422, message: 'Harga kamar telah berubah. Silakan validasi harga kembali.' },
  '15': { status: 422, message: 'Booking tidak dapat dilakukan sebelum melakukan recheck.' },
  '40': { status: 400, message: 'Data yang dikirim ke Digiflazz tidak valid.' },
  '41': { status: 403, message: 'Signature Digiflazz tidak valid.' },
  '42': { status: 403, message: 'Akses endpoint Hotel Digiflazz ditolak. Periksa izin API Buyer dan mode koneksi.' },
  '43': { status: 404, message: 'SKU hotel tidak ditemukan atau tidak aktif.' },
  '44': { status: 422, message: 'Saldo Digiflazz tidak cukup.' },
  '45': { status: 403, message: 'IP server belum dikenali oleh Digiflazz.' },
  '49': { status: 409, message: 'Ref ID booking sudah digunakan.' },
  '50': { status: 404, message: 'Transaksi hotel tidak ditemukan.' },
  '51': { status: 500, message: 'Seller belum memilih tipe koneksi.' },
  '53': { status: 404, message: 'SKU Seller tidak ditemukan atau tidak aktif.' },
  '54': { status: 404, message: 'Kamar tidak ditemukan di Seller.' },
  '55': { status: 422, message: 'Produk hotel sedang mengalami gangguan.' },
  '62': { status: 422, message: 'Seller sedang mengalami gangguan.' },
  '67': { status: 422, message: 'Seller belum terverifikasi.' },
  '80': { status: 403, message: 'Akun Anda telah diblokir oleh Seller.' },
  '81': { status: 422, message: 'Seller ini telah diblokir oleh Anda.' },
  '82': { status: 422, message: 'Akun Anda belum terverifikasi.' },
  '88': { status: 403, message: 'Akun Anda tidak dapat melakukan aksi ini.' },
  '90': { status: 404, message: 'Test case hotel tidak ditemukan.' },
  '94': { status: 429, message: 'Tidak dapat terhubung ke Seller. Silakan coba lagi.' },
  '95': { status: 429, message: 'Terlalu banyak permintaan. Mohon coba beberapa saat lagi.' },
  '951': { status: 429, message: 'Terlalu banyak transaksi. Mohon coba beberapa saat lagi.' },
  '99': { status: 500, message: 'Terjadi kesalahan pada layanan Digiflazz.' },
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

export async function fetchDigiflazzPostpaidPriceList(): Promise<DigiflazzPostpaidProduct[]> {
  const config = getConfig()
  const commands = ['pasca', 'postpaid', 'pascabayar'] as const
  let lastError: string | null = null

  for (const cmd of commands) {
    const payload: Record<string, unknown> = {
      cmd,
      username: config.username,
      sign: md5(config.username + config.apiKey + 'pricelist'),
    }

    if (config.testing) payload.testing = true

    try {
      const response = await fetch(DIGIFLAZZ_PRICE_LIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()
      let body: { data?: DigiflazzPostpaidProduct[]; message?: string } | null = null

      if (responseText) {
        try {
          body = JSON.parse(responseText) as { data?: DigiflazzPostpaidProduct[]; message?: string }
        } catch {
          body = null
        }
      }

      if (response.ok && Array.isArray(body?.data) && body.data.length > 0) {
        return body.data
      }

      lastError = body?.message || responseText || `Digiflazz ${response.status}: invalid postpaid price list response`
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request daftar harga pascabayar Digiflazz gagal'
    }
  }

  throw new Error(lastError || 'Request daftar harga pascabayar Digiflazz gagal')
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

function getHotelCode() {
  return process.env.DIGIFLAZZ_HOTEL_CODE ?? 'skuhotel'
}

function getHotelConfig() {
  const config = getConfig()
  const testing = process.env.DIGIFLAZZ_HOTEL_TESTING === 'true' || config.testing
  const developmentApiKey =
    process.env.DIGIFLAZZ_HOTEL_DEVELOPMENT_API_KEY ??
    process.env.DIGIFLAZZ_DEVELOPMENT_API_KEY ??
    process.env.DIGIFLAZZ_API_KEY_DEVELOPMENT
  const productionApiKey =
    process.env.DIGIFLAZZ_HOTEL_PRODUCTION_API_KEY ??
    process.env.DIGIFLAZZ_PRODUCTION_API_KEY ??
    process.env.DIGIFLAZZ_API_KEY_PRODUCTION ??
    config.apiKey

  if (testing && !developmentApiKey) {
    throw new Error('DIGIFLAZZ_HOTEL_TESTING=true membutuhkan API key development. Isi DIGIFLAZZ_HOTEL_DEVELOPMENT_API_KEY atau matikan mode testing.')
  }

  return {
    username: config.username,
    apiKey: testing ? developmentApiKey! : productionApiKey,
    testing,
  }
}

function getHotelPath(endpoint: DigiflazzHotelEndpoint, payload: Record<string, unknown>) {
  if (endpoint === 'booking-detail') {
    const refId = String(payload.ref_id ?? '').trim()
    if (!refId) throw new Error('ref_id wajib diisi untuk detail booking hotel')
    return `booking/${encodeURIComponent(refId)}`
  }

  const paths: Record<DigiflazzHotelEndpoint, string> = {
    country: 'content/country',
    city: 'content/city',
    'search-destination': 'content/search',
    initiation: 'search',
    filter: 'filter',
    'property-detail': 'content/property',
    recheck: 'recheck',
    booking: 'booking',
    'booking-detail': 'booking',
  }
  return paths[endpoint]
}

function getHotelAdditional(endpoint: DigiflazzHotelEndpoint, payload: Record<string, unknown>) {
  if (endpoint === 'country' || endpoint === 'city' || endpoint === 'search-destination' || endpoint === 'property-detail') {
    return 'hotel.content'
  }
  if (endpoint === 'initiation' || endpoint === 'filter') return 'hotel.search'
  if (endpoint === 'recheck') return 'hotel.recheck'
  if (endpoint === 'booking') return `hotel.booking${String(payload.ref_id ?? '')}`
  if (endpoint === 'booking-detail') return `hotel.booking${String(payload.ref_id ?? '')}`
  return endpoint
}

export async function sendDigiflazzHotelRequest<T = unknown>({
  endpoint,
  additional,
  payload = {},
}: DigiflazzHotelRequest): Promise<T> {
  const config = getHotelConfig()
  const endpointAdditional = additional ?? getHotelAdditional(endpoint, payload)
  const body: Record<string, unknown> = {
    username: config.username,
    sign: md5(config.username + config.apiKey + endpointAdditional),
    code: getHotelCode(),
    ...payload,
  }

  if (config.testing) {
    body.is_testing = true
  }

  const response = await fetch(`${DIGIFLAZZ_HOTEL_URL}/${getHotelPath(endpoint, payload)}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  let parsed: unknown = null

  if (responseText) {
    try {
      parsed = JSON.parse(responseText)
    } catch {
      parsed = null
    }
  }

  const providerMessage =
    typeof parsed === 'object' && parsed && 'message' in parsed
      ? String((parsed as { message?: unknown }).message)
      : responseText || 'Request hotel Digiflazz gagal'
  const rc =
    typeof parsed === 'object' && parsed && 'rc' in parsed
      ? String((parsed as { rc?: unknown }).rc)
      : undefined

  if (!response.ok || (rc && rc !== '00')) {
    const mapped = rc ? HOTEL_RESPONSE_CODES[rc] : undefined
    throw new DigiflazzHotelError(
      mapped?.message ?? providerMessage,
      mapped?.status ?? response.status,
      rc,
    )
  }

  return (parsed ?? {}) as T
}
