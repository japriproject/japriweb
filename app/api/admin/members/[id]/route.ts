import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  password: z.string().min(6).max(72).optional(),
  saldo: z.number().int().min(0).max(2_147_483_647).optional(),
  loginStatus: z.union([z.literal(0), z.literal(1)]).optional(),
}).refine((data) => Object.keys(data).length === 1, { message: 'Kirim tepat satu perubahan' })

async function authorizeAdmin() {
  const session = await getSession()
  if (!session) return null
  const rows = await prisma.$queryRaw<Array<{ type: number }>>`
    SELECT type FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  return rows[0]?.type === 1 ? session : null
}

function parseMemberId(value: string) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!await authorizeAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = parseMemberId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID member tidak valid' }, { status: 400 })

  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; phone: string; email: string; sososo: number; login_status: number
    date_login: Date | null; date_logout: Date | null; created_at: Date; address: string
    provinsi: string; kabupaten: string; kecamatan: string; kelurahan: string; perusahaan: string
  }>>`
    SELECT id, name, phone, email, sososo, login_status, date_login, date_logout, created_at,
      address, provinsi, kabupaten, kecamatan, kelurahan, perusahaan
    FROM members WHERE id = ${id} AND type <> 1 LIMIT 1
  `
  const member = rows[0]
  if (!member) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })

  return NextResponse.json({ member: {
    id: member.id, name: member.name, phone: member.phone, email: member.email,
    saldo: member.sososo || 0, loginStatus: member.login_status === 1 ? 1 : 0,
    lastLogin: member.date_login?.toISOString() ?? null,
    dateLogout: member.date_logout?.toISOString() ?? null,
    createdAt: member.created_at.toISOString(), address: member.address, provinsi: member.provinsi,
    kabupaten: member.kabupaten, kecamatan: member.kecamatan, kelurahan: member.kelurahan,
    perusahaan: member.perusahaan,
  } })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!await authorizeAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = parseMemberId((await params).id)
  if (!id) return NextResponse.json({ error: 'ID member tidak valid' }, { status: 400 })
  const parsed = updateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }, { status: 400 })

  const exists = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM members WHERE id = ${id} AND type <> 1 LIMIT 1
  `
  if (!exists[0]) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })

  if (parsed.data.password !== undefined) {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    await prisma.$executeRaw`UPDATE members SET password = ${passwordHash}, login_status = 0, date_logout = NOW() WHERE id = ${id} AND type <> 1`
    return NextResponse.json({ message: 'Password berhasil diperbarui. Sesi member dikeluarkan.', member: { loginStatus: 0 } })
  }
  if (parsed.data.saldo !== undefined) {
    await prisma.$executeRaw`UPDATE members SET sososo = ${parsed.data.saldo} WHERE id = ${id} AND type <> 1`
    return NextResponse.json({ message: 'Saldo berhasil diperbarui.', member: { saldo: parsed.data.saldo } })
  }

  const loginStatus = parsed.data.loginStatus ?? 0
  if (loginStatus === 1) {
    await prisma.$executeRaw`UPDATE members SET login_status = 1, date_login = NOW() WHERE id = ${id} AND type <> 1`
  } else {
    await prisma.$executeRaw`UPDATE members SET login_status = 0, date_logout = NOW() WHERE id = ${id} AND type <> 1`
  }
  return NextResponse.json({ message: 'Status login berhasil diperbarui.', member: { loginStatus } })
}
