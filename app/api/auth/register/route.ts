import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { isValidIndonesianPhone, normalizeIndonesianPhone } from '@/lib/phone'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  nama: z.string().min(2).max(50),
  noHp: z.string().refine(isValidIndonesianPhone, 'Format nomor HP tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  email: z.string().email('Format email tidak valid'),
  refCode: z.string().regex(/^[0-9]+$/, 'Kode referral tidak valid').optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`register:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { nama, password, refCode } = parsed.data
  const noHp = normalizeIndonesianPhone(parsed.data.noHp)
  const email = parsed.data.email.trim().toLowerCase()

  const exists = await prisma.members.findUnique({ where: { phone: noHp } })
  if (exists) return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 409 })

  const emailExists = await prisma.members.findFirst({ where: { email } })
  if (emailExists) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })

  let upline = 0
  if (refCode) {
    const refNumber = Number(refCode)
    const uplineMember = await prisma.members.findUnique({ where: { reff: refNumber } })
    if (!uplineMember) return NextResponse.json({ error: 'Kode referral tidak ditemukan' }, { status: 400 })
    upline = refNumber
  }

  // Generate reff unik
  const lastMember = await prisma.members.findFirst({ orderBy: { reff: 'desc' } })
  const reff = (lastMember?.reff ?? 10000) + 1

  const hash = await bcrypt.hash(password, 12)

  const member = await prisma.members.create({
    data: {
      name: nama,
      phone: noHp,
      email,
      password: hash,
      sososo: 0,
      reff,
      upline,
      sender: '',
      status: 1,
      type: 0,
      tanggal_daftar: new Date(),
    },
  })

  const token = await signToken({ userId: member.id, phone: member.phone, role: 'member' })
  const res = NextResponse.json({ message: 'Registrasi berhasil' }, { status: 201 })
  res.cookies.set(setTokenCookie(token))
  return res
}
