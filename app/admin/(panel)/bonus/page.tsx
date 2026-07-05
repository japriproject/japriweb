import { Gift, Search } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { formatRupiah } from '@/lib/utils'
import DataTablePagination from '../DataTablePagination'

export const dynamic = 'force-dynamic'

type BonusRow = { id: number; invoice: string; members: string; product: string; sale: number; status: number; desc: string | null; created_at: Date }

export default async function BonusHistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; perPage?: string }> }) {
  await requireAdmin()
  const { q = '', page: rawPage = '1', perPage: rawSize = '25' } = await searchParams
  const search = q.trim().slice(0, 100)
  const pageSize = [25, 50, 100].includes(Number(rawSize)) ? Number(rawSize) : 25
  const where = Prisma.sql`WHERE type = 7 AND product LIKE 'BONUS_%' ${search ? Prisma.sql`AND (invoice LIKE ${`%${search}%`} OR members LIKE ${`%${search}%`} OR product LIKE ${`%${search}%`})` : Prisma.empty}`
  const count = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT COUNT(*) total FROM transaksi ${where}`)
  const totalRows = Number(count[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const page = Math.min(Math.max(1, Number.parseInt(rawPage, 10) || 1), totalPages)
  const rows = await prisma.$queryRaw<BonusRow[]>(Prisma.sql`SELECT id, invoice, members, product, sale, status, ${Prisma.raw('`desc`')}, created_at FROM transaksi ${where} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`)

  return <div className="mx-auto max-w-7xl p-8"><header className="mb-6"><p className="text-sm font-medium text-violet-400">Laporan</p><h1 className="mt-1 flex items-center gap-3 text-2xl font-bold"><Gift className="text-amber-400" /> History bonus</h1><p className="mt-2 text-sm text-slate-400">Seluruh bonus referral Digiflazz dan top up.</p></header><form className="mb-5 flex h-12 max-w-md items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4"><Search size={17} className="text-slate-500" /><input name="q" defaultValue={search} placeholder="Cari invoice, member, atau jenis bonus" className="w-full bg-transparent text-sm outline-none" /></form><div className="overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-white/[0.03] text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Penerima</th><th className="px-5 py-3">Jenis</th><th className="px-5 py-3">Nominal</th><th className="px-5 py-3">Keterangan</th><th className="px-5 py-3">Waktu</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4 font-mono text-xs">{row.invoice}</td><td className="px-5 py-4">{row.members}</td><td className="px-5 py-4">{row.product}</td><td className="px-5 py-4 font-semibold text-amber-300">+{formatRupiah(row.sale)}</td><td className="max-w-[280px] truncate px-5 py-4 text-slate-400">{row.desc || '-'}</td><td className="px-5 py-4 text-xs text-slate-500">{formatDate(row.created_at)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">History bonus tidak ditemukan.</td></tr>}</tbody></table></div></div><div className="-mt-px overflow-hidden rounded-b-2xl border border-white/10 bg-slate-900"><DataTablePagination page={page} pageSize={pageSize} totalRows={totalRows} path="/admin/bonus" query={search} /></div></div>
}

function formatDate(date: Date) { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
