import { createHash, randomInt } from 'crypto'

const OTP_TTL_MS = 5 * 60 * 1000
const OTP_LENGTH = 6

type OtpEntry = {
  hash: string
  expiresAt: number
  attempts: number
}

const store = new Map<string, OtpEntry>()

function hashOtp(identity: string, otp: string) {
  const secret = process.env.JWT_SECRET || 'dev-otp-secret'
  return createHash('sha256').update(`${identity}:${otp}:${secret}`).digest('hex')
}

function otpIdentity(phone: string, email?: string) {
  return email ? `${normalizePhone(phone)}:${email.trim().toLowerCase()}` : normalizePhone(phone)
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('62')) return `0${digits.slice(2)}`
  return digits
}

export function createOtp(phone: string, email?: string) {
  const identity = otpIdentity(phone, email)
  const otp = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0')

  store.set(identity, {
    hash: hashOtp(identity, otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  })

  return { otp, expiresInSeconds: OTP_TTL_MS / 1000 }
}

export function verifyOtp(phone: string, otp: string, email?: string) {
  const identity = otpIdentity(phone, email)
  const entry = store.get(identity)
  if (!entry) return false

  if (Date.now() > entry.expiresAt) {
    store.delete(identity)
    return false
  }

  if (entry.attempts >= 5) {
    store.delete(identity)
    return false
  }

  entry.attempts += 1
  const valid = entry.hash === hashOtp(identity, otp)
  if (valid) store.delete(identity)
  return valid
}

export async function sendOtp(phone: string, otp: string) {
  const apiUrl = process.env.WHATSAPP_API_URL
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const message = `Kode OTP pendaftaran mitra Anda: ${otp}. Berlaku 5 menit. Jangan bagikan kode ini.`

  if (!apiUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WHATSAPP_API_URL belum dikonfigurasi')
    }
    return { sent: false, reason: 'WHATSAPP_API_URL belum dikonfigurasi' }
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    body: JSON.stringify({
      to: normalizePhone(phone),
      phone: normalizePhone(phone),
      message,
    }),
  })

  if (!res.ok) {
    throw new Error('Gagal mengirim OTP WhatsApp')
  }

  return { sent: true }
}
