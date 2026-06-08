import { createHash, createHmac, timingSafeEqual } from 'crypto'

const DEFAULT_DUITKU_APP_URL = 'https://host.duniakreasi.biz.id'

type CreateDuitkuInvoiceInput = {
  amount: number
  orderId: string
  productDetails: string
  customerName: string
  email: string
  phoneNumber: string
  paymentMethod?: string
}

export type DuitkuInvoice = {
  merchantCode: string
  reference: string
  paymentUrl: string
  qrString?: string
  qrUrl?: string
  statusCode: string
  statusMessage: string
}

function getConfig() {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE
  const apiKey = process.env.DUITKU_API_KEY || process.env.DUITKU_MERCHANT_KEY
  const callbackBaseOrUrl =
    process.env.DUITKU_CALLBACK_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    DEFAULT_DUITKU_APP_URL
  const appUrl = callbackBaseOrUrl.replace(/\/api\/topup\/callback\/duitku\/?$/i, '').replace(/\/$/, '')
  const callbackUrl = process.env.DUITKU_CALLBACK_URL || `${appUrl}/api/topup/callback/duitku`
  const returnUrl = process.env.DUITKU_RETURN_URL || `${appUrl}/topup`
  if (!merchantCode || !apiKey) {
    throw new Error('DUITKU_MERCHANT_CODE dan DUITKU_API_KEY wajib diisi')
  }
  return {
    merchantCode,
    apiKey,
    appUrl,
    callbackUrl,
    returnUrl,
    sandbox: process.env.DUITKU_SANDBOX !== 'false',
  }
}

function md5(value: string) {
  return createHash('md5').update(value).digest('hex')
}

function hmacSha256(value: string, key: string) {
  return createHmac('sha256', key).update(value).digest('hex')
}

export async function createDuitkuInvoice(input: CreateDuitkuInvoiceInput): Promise<DuitkuInvoice> {
  const config = getConfig()
  const signature = md5(`${config.merchantCode}${input.orderId}${input.amount}${config.apiKey}`)
  const baseUrl = config.sandbox ? 'https://sandbox.duitku.com' : 'https://passport.duitku.com'

  const payload = {
    merchantCode: config.merchantCode,
    paymentAmount: input.amount,
    paymentMethod: input.paymentMethod || '',
    merchantOrderId: input.orderId,
    productDetails: input.productDetails,
    additionalParam: '',
    merchantUserInfo: input.phoneNumber,
    customerVaName: input.customerName.slice(0, 20),
    email: input.email || `${input.phoneNumber}@pulsa.local`,
    phoneNumber: input.phoneNumber,
    itemDetails: [
      {
        name: input.productDetails.slice(0, 50),
        price: input.amount,
        quantity: 1,
      },
    ],
    customerDetail: {
      firstName: input.customerName || input.phoneNumber,
      email: input.email || `${input.phoneNumber}@pulsa.local`,
      phoneNumber: input.phoneNumber,
      merchantCustomerId: input.phoneNumber,
    },
    callbackUrl: config.callbackUrl,
    returnUrl: config.returnUrl,
    signature,
    expiryPeriod: Number(process.env.DUITKU_EXPIRY_MINUTES || 15),
  }

  const response = await fetch(`${baseUrl}/webapi/api/merchant/v2/inquiry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let body: Record<string, unknown> | null = null

  if (responseText) {
    try {
      body = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      body = null
    }
  }

  if (!response.ok || !body?.reference) {
    throw new Error(
      String(
        body?.Message ||
        body?.message ||
        body?.statusMessage ||
        responseText ||
        `Create invoice Duitku gagal (${response.status})`
      )
    )
  }

  const invoice = body as DuitkuInvoice & {
    qrString?: string
    qr_string?: string
    qrUrl?: string
    qr_url?: string
    qrImage?: string
    qr_image?: string
  }

  return {
    ...invoice,
    qrString: invoice.qrString || invoice.qr_string,
    qrUrl: invoice.qrUrl || invoice.qr_url || invoice.qrImage || invoice.qr_image,
  }
}

export function verifyDuitkuCallback(merchantCode: string, amount: string, orderId: string, signature: string) {
  const merchantKey = process.env.DUITKU_MERCHANT_KEY
  if (!merchantKey) return false

  const expected = hmacSha256(merchantCode + amount + orderId, merchantKey)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
