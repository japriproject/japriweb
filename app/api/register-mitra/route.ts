import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { normalizePhone, verifyOtp } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pulsa_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const uplineData = await prisma.$queryRaw<Array<{ reff: number }>>`
      SELECT reff FROM members WHERE phone = ${decoded.phone}
    `

    if (!uplineData || uplineData.length === 0) {
      return NextResponse.json({ error: 'Upline not found' }, { status: 404 })
    }

    const uplineReff = uplineData[0].reff

    const { name, phone, email, password, otp } = await req.json()
    const normalizedPhone = normalizePhone(String(phone || ''))

    if (!name || !normalizedPhone || !email || !password || !otp) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    if (!verifyOtp(normalizedPhone, String(otp))) {
      return NextResponse.json({ error: 'OTP tidak valid atau sudah kadaluarsa' }, { status: 400 })
    }

    const existingUser = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM members WHERE phone = ${normalizedPhone} LIMIT 1
    `

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 400 })
    }

    const maxReffData = await prisma.$queryRaw<Array<{ maxReff: number }>>`
      SELECT COALESCE(MAX(reff), 1000) as maxReff FROM members
    `
    const newReff = maxReffData[0].maxReff + 1

    const hashedPassword = createHash('md5').update(password).digest('hex')

    await prisma.$executeRaw`
      INSERT INTO members (name, phone, email, password, upline, reff, sender, status, created_at, tanggal_daftar)
      VALUES (${name}, ${normalizedPhone}, ${email}, ${hashedPassword}, ${uplineReff}, ${newReff}, '', 1, NOW(), CURDATE())
    `

    return NextResponse.json({ success: true, message: 'Mitra berhasil didaftarkan' })
  } catch (error) {
    console.error('Register mitra error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
