import Link from 'next/link'
import { CheckCircle2, Clock3, Search, WalletCards } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import type { TransactionRow } from '../transaksi/TransactionsTable'
import DataTablePagination from '../DataTablePagination'
import TopupTable from './TopupTable'

export const dynamic = 'force-dynamic'

type TransactionRecord = {
  id: number
  invoice: string
  members: string
  product: string
  customers: string
  sale: number
  price: number
  admin: number
  status: number
  desc: string | null
  sn: string | null
  created_at: Date
  date: Date | null
  updated_at: Date | null
  type: number
  claim: number
  status_update: number
  migrasi: number
}

export default async function TopupPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; perPage?: string }> }) {
  await requireAdmin()
  const { q = '', status: rawStatus = 'pending', page: rawPage = '1', perPage: rawPageSize = '25' } = await searchParams
  const status = rawStatus === 'success' ? 'success' : 'pending'
  const statusValue = status === 'success' ? 1 : 0
  const search = q.trim().slice(0, 100)
  const pageSize = [25, 50, 100].includes(Number(rawPageSize)) ? Number(rawPageSize) : 25
  const requestedPage = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const countRows = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
    SELECT COUNT(*) AS total FROM transaksi
    WHERE type = 7 AND status = ${statusValue} AND product NOT LIKE 'BONUS_%' ${search ? Prisma.sql`AND (invoice LIKE ${`%${search}%`} OR members LIKE ${`%${search}%`} OR customers LIKE ${`%${search}%`} OR product LIKE ${`%${search}%`})` : Prisma.empty}
  `)
  const totalRows = Number(countRows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize
  const records = await prisma.$queryRaw<TransactionRecord[]>(Prisma.sql`
    SELECT id, invoice, members, product, customers, sale, price, admin, status, ${Prisma.raw('`desc`')}, sn,
      created_at, date, updated_at, type, claim, status_update, migrasi
    FROM transaksi
    WHERE type = 7 AND status = ${statusValue} AND product NOT LIKE 'BONUS_%' ${search ? Prisma.sql`AND (invoice LIKE ${`%${search}%`} OR members LIKE ${`%${search}%`} OR customers LIKE ${`%${search}%`} OR product LIKE ${`%${search}%`})` : Prisma.empty}
    ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
  `)
  const transactions: TransactionRow[] = records.map((item) => ({
    id: item.id,
    invoice: item.invoice,
    member: item.members,
    product: item.product,
    customer: item.customers,
    sale: item.sale,
    price: item.price,
    admin: item.admin,
    status: item.status,
    description: item.desc,
    serialNumber: item.sn,
    createdAt: item.created_at.toISOString(),
    transactionDate: item.date?.toISOString() ?? null,
    updatedAt: item.updated_at?.toISOString() ?? null,
    type: item.type,
    claim: item.claim,
    statusUpdate: item.status_update,
    migration: item.migrasi,
  }))

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-violet-400">Saldo member</p>
        <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold"><WalletCards className="text-slate-500" /> Top up saldo</h1>
        <p className="mt-2 text-sm text-slate-400">Review top up pending dan riwayat top up yang sudah berhasil.</p>
      </header>

      <div className="mb-5 flex gap-2 border-b border-white/10">
        <StatusTab href="/admin/topup?status=pending" active={status === 'pending'} icon={<Clock3 size={16} />} label="Pending" />
        <StatusTab href="/admin/topup?status=success" active={status === 'success'} icon={<CheckCircle2 size={16} />} label="Sukses" />
      </div>

      <form className="mb-5 flex h-12 max-w-md items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 focus-within:border-violet-500">
        <input type="hidden" name="status" value={status} />
        <Search size={17} className="text-slate-500" />
        <input name="q" defaultValue={search} placeholder="Cari invoice, member, atau metode" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
      </form>
      <TopupTable transactions={transactions} pending={status === 'pending'} />
      <div className="-mt-px overflow-hidden rounded-b-2xl border border-white/10 bg-slate-900"><DataTablePagination page={page} pageSize={pageSize} totalRows={totalRows} path="/admin/topup" query={search} params={{ status }} /></div>
    </div>
  )
}

function StatusTab({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return <Link href={href} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? 'border-violet-500 text-violet-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{icon}{label}</Link>
}
