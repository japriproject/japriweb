import { Network, Search } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { formatRupiah } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type UserRow = { id: number; name: string; phone: string; email: string; reff: number; upline: number; sososo: number; bobobo: number; saham: number; jumlah_topup: number; jumlah_transaksi: number; created_at: Date }
type HistoryRow = { id: number; invoice: string; product: string; sale: number; status: number; created_at: Date }

export default async function UserHistoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin()
  const { q = '' } = await searchParams
  const search = q.trim().slice(0, 100)
  const numeric = /^\d+$/.test(search) ? Number(search) : -1
  const rows = search ? await prisma.$queryRaw<UserRow[]>`
    SELECT id, name, phone, email, reff, upline, sososo, bobobo, saham, jumlah_topup, jumlah_transaksi, created_at
    FROM members WHERE type <> 1 AND (reff = ${numeric} OR phone = ${search} OR LOWER(email) = ${search.toLowerCase()}) LIMIT 1
  ` : []
  const user = rows[0] ?? null
  const uplines: UserRow[] = []
  let nextReference = user?.upline ?? 0
  for (let level = 1; level <= 15 && nextReference; level += 1) {
    const parent = (await prisma.$queryRaw<UserRow[]>`SELECT id, name, phone, email, reff, upline, sososo, bobobo, saham, jumlah_topup, jumlah_transaksi, created_at FROM members WHERE reff = ${nextReference} LIMIT 1`)[0]
    if (!parent) break
    uplines.push(parent)
    nextReference = parent.upline
  }
  const history = user ? await prisma.$queryRaw<HistoryRow[]>`SELECT id, invoice, product, sale, status, created_at FROM transaksi WHERE members = ${user.phone} ORDER BY created_at DESC LIMIT 50` : []

  return <div className="mx-auto max-w-7xl p-8"><header className="mb-6"><p className="text-sm font-medium text-violet-400">Laporan User</p><h1 className="mt-1 flex items-center gap-3 text-2xl font-bold"><Network className="text-sky-400" /> History lengkap user</h1><p className="mt-2 text-sm text-slate-400">Cari tepat berdasarkan kode referral, nomor HP, atau email.</p></header><form className="mb-6 flex h-12 max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4"><Search size={17} className="text-slate-500" /><input name="q" defaultValue={search} placeholder="Masukkan reff, nomor HP, atau email" className="w-full bg-transparent text-sm outline-none" /><button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold">Cari</button></form>{!search && <Empty text="Masukkan data user untuk melihat seluruh riwayat dan jaringan upline." />}{search && !user && <Empty text="User tidak ditemukan." />}{user && <><section className="grid grid-cols-4 gap-4"><Card label="Saldo" value={formatRupiah(user.sososo)} /><Card label="Bonus" value={formatRupiah(user.bobobo)} /><Card label="Jumlah saham" value={user.saham.toLocaleString('id-ID')} /><Card label="Jumlah topup" value={user.jumlah_topup.toLocaleString('id-ID')} /><Card label="Jumlah transaksi" value={user.jumlah_transaksi.toLocaleString('id-ID')} /><Card label="Kode referral" value={String(user.reff)} /><Card label="Nomor HP" value={user.phone} /><Card label="Email" value={user.email || '-'} /></section><section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="font-semibold">Jaringan upline · hingga level 15</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-3">Level</th><th>Nama</th><th>Reff</th><th>Phone</th><th>Email</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{uplines.map((item, index) => <tr key={item.id}><td className="py-3 text-violet-300">Level {index + 1}</td><td>{item.name}</td><td>{item.reff}</td><td>{item.phone}</td><td>{item.email || '-'}</td></tr>)}{uplines.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak memiliki upline.</td></tr>}</tbody></table></div></section><section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">50 history terbaru</h2></div><table className="w-full text-left text-sm"><thead className="bg-white/[0.03] text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Invoice</th><th>Produk</th><th>Nominal</th><th>Status</th><th>Waktu</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{history.map(item => <tr key={item.id}><td className="px-5 py-3 font-mono text-xs">{item.invoice}</td><td>{item.product}</td><td>{formatRupiah(item.sale)}</td><td>{statusLabel(item.status)}</td><td className="text-xs text-slate-500">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(item.created_at)}</td></tr>)}</tbody></table></section></>}</div>
}

function Card({ label, value }: { label: string; value: string }) { return <article className="rounded-2xl border border-white/10 bg-slate-900 p-5"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-3 truncate font-semibold">{value}</p></article> }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-slate-500">{text}</div> }
function statusLabel(status: number) { return ({ 0: 'Pending', 1: 'Sukses', 2: 'Gagal', 3: 'Refund' } as Record<number, string>)[status] || String(status) }
