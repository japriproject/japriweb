import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { createOtp, normalizePhone } from '@/lib/otp'
import { sendMitraRegistrationOtpEmail } from '@/lib/email'
import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().email().max(100)

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pulsa_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { name, phone, email, password } = await req.json()
    const normalizedPhone = normalizePhone(String(phone || ''))
    const parsedEmail = emailSchema.safeParse(email)

    if (!name || !normalizedPhone || !email || !password) {
      return NextResponse.json({ error: 'Isi data mitra dulu sebelum meminta OTP' }, { status: 400 })
    }

    if (!/^08[0-9]{8,11}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: 'Format nomor HP tidak valid' }, { status: 400 })
    }

    if (!parsedEmail.success) return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    const normalizedEmail = parsedEmail.data

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    if (!rateLimit(`mitra-otp:${decoded.userId}:${normalizedPhone}:${normalizedEmail}`, 3, 10 * 60_000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan OTP. Coba lagi nanti.' }, { status: 429 })
    }

    const existingUser = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM members WHERE phone = ${normalizedPhone} LIMIT 1
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 400 })
    }


    const existingEmail = await prisma.members.findFirst({ where: { email: normalizedEmail }, select: { id: true } })
    if (existingEmail) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })

    const { otp, expiresInSeconds } = createOtp(normalizedPhone, normalizedEmail)
    await sendMitraRegistrationOtpEmail({ email: normalizedEmail, name: String(name), otp })

    return NextResponse.json({
      success: true,
      message: `OTP telah dikirim ke ${normalizedEmail}`,
      expiresInSeconds,
    })
  } catch (error) {
    console.error('Register mitra OTP error:', error)
    return NextResponse.json({ error: 'Gagal mengirim OTP ke email' }, { status: 502 })
  }
}
