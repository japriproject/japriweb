import { Search, Users } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import MembersTable, { type MemberRow } from './MembersTable'
import DataTablePagination from '../DataTablePagination'

export const dynamic = 'force-dynamic'

type MemberRecord = {
  id: number
  name: string
  phone: string
  email: string
  sososo: number
  login_status: number
  date_login: Date | null
  created_at: Date
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; perPage?: string }> }) {
  await requireAdmin()
  const { q = '', page: rawPage = '1', perPage: rawPageSize = '25' } = await searchParams
  const search = q.trim().slice(0, 80)
  const pageSize = [25, 50, 100].includes(Number(rawPageSize)) ? Number(rawPageSize) : 25
  const requestedPage = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const countRows = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
    SELECT COUNT(*) AS total FROM members
    WHERE type <> 1 ${search ? Prisma.sql`AND (name LIKE ${`%${search}%`} OR phone LIKE ${`%${search}%`} OR email LIKE ${`%${search}%`})` : Prisma.empty}
  `)
  const totalRows = Number(countRows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize
  const records = await prisma.$queryRaw<MemberRecord[]>(Prisma.sql`
    SELECT id, name, phone, email, sososo, login_status, date_login, created_at
    FROM members
    WHERE type <> 1 ${search ? Prisma.sql`AND (name LIKE ${`%${search}%`} OR phone LIKE ${`%${search}%`} OR email LIKE ${`%${search}%`})` : Prisma.empty}
    ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
  `)
  const members: MemberRow[] = records.map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone,
    email: member.email,
    saldo: member.sososo || 0,
    loginStatus: member.login_status === 1 ? 1 : 0,
    lastLogin: member.date_login?.toISOString() ?? null,
    createdAt: member.created_at.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-violet-400">Pengguna</p>
        <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold"><Users className="text-slate-500" /> Daftar member</h1>
        <p className="mt-2 text-sm text-slate-400">Data member dengan pagination server-side.</p>
      </header>
      <form className="mb-5 flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-violet-500">
        <Search size={17} className="text-slate-500" />
        <input name="q" defaultValue={search} placeholder="Cari nama, HP, atau email" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
      </form>
      <MembersTable initialMembers={members} />
      <div className="-mt-px overflow-hidden rounded-b-2xl border border-white/10 bg-slate-900"><DataTablePagination page={page} pageSize={pageSize} totalRows={totalRows} path="/admin/members" query={search} /></div>
    </div>
  )
}
