import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { createHash } from 'crypto'
import { z } from 'zod'

const schema = z.object({
  noHp: z.string().min(8).max(20),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi 1 menit.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const { noHp, password } = parsed.data

  // Raw query untuk hindari kolom tanggal_daftar = 0000-00-00 yang invalid
  const rows = await prisma.$queryRaw<Array<{
    id: number; phone: string; password: string; status: number; type: number; name: string; login_status: number
  }>>`SELECT id, phone, password, status, type, name, login_status FROM members WHERE phone = ${noHp} LIMIT 1`

  const member = rows[0] ?? null
  if (!member) {
    return NextResponse.json({ error: 'No HP atau password salah' }, { status: 401 })
  }

  if (member.login_status === 1) {
    return NextResponse.json({ error: 'Akun sedang login di perangkat lain' }, { status: 403 })
  }

  const md5 = createHash('md5').update(password).digest('hex')
  if (md5 !== member.password) return NextResponse.json({ error: 'No HP atau password salah' }, { status: 401 })

  // type 1 = admin, 0 = member
  const role = member.type === 1 ? 'admin' : 'member'
  const token = await signToken({ userId: member.id, phone: member.phone, role })

  // Update login_status = 1 dan date_login
  await prisma.$executeRaw`UPDATE members SET login_status = 1, date_login = NOW() WHERE id = ${member.id}`

  const res = NextResponse.json({ message: 'Login berhasil', role })
  res.cookies.set(setTokenCookie(token))
  return res
}
