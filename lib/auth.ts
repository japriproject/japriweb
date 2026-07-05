import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret')
const COOKIE_NAME = 'pulsa_token'

export type JWTPayload = {
  userId: number
  phone: string
  role: string // 'admin' | 'member'
  mfa?: boolean
}

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function signAdminOtpChallenge(userId: number, setup: boolean) {
  return new SignJWT({ userId, setup, purpose: 'admin-otp' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(SECRET)
}

export async function verifyAdminOtpChallenge(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.purpose !== 'admin-otp') return null
    return { userId: Number(payload.userId), setup: Boolean(payload.setup) }
  } catch {
    return null
  }
}

export type PascaInquiryPayload = {
  userId: number
  productId: number
  customerNo: string
  refId: string
  providerAmount: number
  totalAmount: number
}

export async function signPascaInquiry(payload: PascaInquiryPayload) {
  return new SignJWT({ ...payload, purpose: 'pasca-inquiry' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(SECRET)
}

export async function verifyPascaInquiry(token: string): Promise<PascaInquiryPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.purpose !== 'pasca-inquiry') return null
    return {
      userId: Number(payload.userId),
      productId: Number(payload.productId),
      customerNo: String(payload.customerNo),
      refId: String(payload.refId),
      providerAmount: Number(payload.providerAmount),
      totalAmount: Number(payload.totalAmount),
    }
  } catch {
    return null
  }
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const raw = payload as unknown as Record<string, unknown>
    return {
      userId: Number(raw.userId),
      phone: String(raw.phone ?? ''),
      role: String(raw.role ?? ''),
      mfa: raw.mfa === true,
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function setTokenCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}
