import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { createHash } from 'crypto'
import { z } from 'zod'

const schema = z.object({
  nama: z.string().min(2).max(50),
  noHp: z.string().regex(/^08[0-9]{8,11}$/, 'Format nomor HP tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  email: z.string().email().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`register:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { nama, noHp, password, email } = parsed.data

  const exists = await prisma.members.findUnique({ where: { phone: noHp } })
  if (exists) return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 409 })

  // Generate reff unik
  const lastMember = await prisma.members.findFirst({ orderBy: { reff: 'desc' } })
  const reff = (lastMember?.reff ?? 10000) + 1

  const hash = createHash('md5').update(password).digest('hex')

  const member = await prisma.members.create({
    data: {
      name: nama,
      phone: noHp,
      email: email || '',
      password: hash,
      sososo: 0,
      reff,
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
