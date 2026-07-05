import Link from 'next/link'
import { ArrowRight, ReceiptText, Users, WalletCards, Zap } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { formatRupiah } from '@/lib/utils'
import { fetchDigiflazzBalance } from '@/lib/digiflazz'

export const dynamic = 'force-dynamic'

type Summary = { totalMembers: bigint; totalTransactions: bigint; pendingTopups: bigint }
type PendingTopup = { id: number; invoice: string; members: string; product: string; sale: number; price: number; created_at: Date }
type TodayTopup = { qrisDynamicCount: bigint; qrisDynamicAmount: bigint; mandiriCount: bigint; mandiriAmount: bigint; qrisStaticCount: bigint; qrisStaticAmount: bigint }

export default async function AdminPage() {
  await requireAdmin()
  const [summaryRows, pending, todayRows, balanceResult] = await Promise.all([
    prisma.$queryRaw<Summary[]>`
      SELECT
        (SELECT COUNT(*) FROM members WHERE type <> 1) AS totalMembers,
        (SELECT COUNT(*) FROM transaksi WHERE type <> 7) AS totalTransactions,
        (SELECT COUNT(*) FROM transaksi WHERE type = 7 AND status = 0 AND product NOT LIKE 'BONUS_%') AS pendingTopups
    `,
    prisma.$queryRaw<PendingTopup[]>`
      SELECT id, invoice, members, product, sale, price, created_at
      FROM transaksi WHERE type = 7 AND status = 0 AND product NOT LIKE 'BONUS_%' ORDER BY created_at DESC LIMIT 8
    `,
    prisma.$queryRaw<TodayTopup[]>`
      SELECT
        SUM(product = 'DUITKU_QRIS') AS qrisDynamicCount,
        COALESCE(SUM(CASE WHEN product = 'DUITKU_QRIS' THEN sale ELSE 0 END), 0) AS qrisDynamicAmount,
        SUM(product LIKE 'BANK_MANDIRI%') AS mandiriCount,
        COALESCE(SUM(CASE WHEN product LIKE 'BANK_MANDIRI%' THEN sale ELSE 0 END), 0) AS mandiriAmount,
        SUM(product IN ('BANK_QRIS', 'QRIS_STATIC', 'QRIS_STATIS')) AS qrisStaticCount,
        COALESCE(SUM(CASE WHEN product IN ('BANK_QRIS', 'QRIS_STATIC', 'QRIS_STATIS') THEN sale ELSE 0 END), 0) AS qrisStaticAmount
      FROM transaksi
      WHERE type = 7 AND status = 1 AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY
    `,
    fetchDigiflazzBalance().then((balance) => ({ balance, error: false })).catch(() => ({ balance: 0, error: true })),
  ])
  const summary = summaryRows[0]
  const today = todayRows[0]
  const cards = [
    { label: 'Total member', value: Number(summary.totalMembers).toLocaleString('id-ID'), note: 'Semua akun member', icon: Users, color: 'text-sky-400' },
    { label: 'Total transaksi', value: Number(summary.totalTransactions).toLocaleString('id-ID'), note: 'Di luar top up saldo', icon: ReceiptText, color: 'text-violet-400' },
    { label: 'Balance Digiflazz', value: balanceResult.error ? 'Tidak tersedia' : formatRupiah(balanceResult.balance), note: balanceResult.error ? 'Gagal terhubung ke Digiflazz' : 'Saldo deposit saat ini', icon: Zap, color: 'text-emerald-400' },
    { label: 'Top up pending', value: Number(summary.pendingTopups).toLocaleString('id-ID'), note: 'Menunggu pembayaran/proses', icon: WalletCards, color: 'text-amber-400' },
  ]

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header className="mb-8"><p className="text-sm font-medium text-violet-400">Admin Console</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan bisnis</h1><p className="mt-2 text-sm text-slate-400">Data operasional Japri Pay saat ini.</p></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, color }) => <article key={label} className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl shadow-black/10"><div className="flex items-start justify-between"><p className="text-sm text-slate-400">{label}</p><Icon size={20} className={color} /></div><p className="mt-5 truncate text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>)}
      </section>
      <section className="mt-7"><div className="mb-3"><h2 className="font-semibold">Top up sukses hari ini</h2><p className="mt-1 text-xs text-slate-500">Jumlah transaksi dan total nominal berdasarkan metode.</p></div><div className="grid grid-cols-3 gap-4"><TodayCard label="QRIS Dinamis" count={Number(today?.qrisDynamicCount ?? 0)} amount={Number(today?.qrisDynamicAmount ?? 0)} /><TodayCard label="Mandiri" count={Number(today?.mandiriCount ?? 0)} amount={Number(today?.mandiriAmount ?? 0)} /><TodayCard label="QRIS Statis" count={Number(today?.qrisStaticCount ?? 0)} amount={Number(today?.qrisStaticAmount ?? 0)} /></div></section>
      <section className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="flex items-center justify-between border-b border-white/10 p-5"><div><h2 className="font-semibold">Top up pending</h2><p className="mt-1 text-xs text-slate-500">8 pengajuan terbaru yang belum selesai</p></div><Link href="/admin/topup" className="flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300">Lihat semua <ArrowRight size={15} /></Link></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3">Nominal</th><th className="px-5 py-3">Total bayar</th><th className="px-5 py-3">Waktu</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{pending.map((item) => <tr key={item.id} className="hover:bg-white/[0.03]"><td className="px-5 py-4 font-mono text-xs">{item.invoice}</td><td className="px-5 py-4">{item.members}</td><td className="px-5 py-4">{item.product}</td><td className="px-5 py-4">{formatRupiah(item.sale)}</td><td className="px-5 py-4 font-medium">{formatRupiah(item.price)}</td><td className="px-5 py-4 text-xs text-slate-500">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(item.created_at)}</td></tr>)}{pending.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Tidak ada top up pending.</td></tr>}</tbody></table></div>
      </section>
    </div>
  )
}

function TodayCard({ label, count, amount }: { label: string; count: number; amount: number }) {
  return <article className="rounded-2xl border border-white/10 bg-slate-900 p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{label}</p><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">{count.toLocaleString('id-ID')} transaksi</span></div><p className="mt-4 text-xl font-bold">{formatRupiah(amount)}</p></article>
}
