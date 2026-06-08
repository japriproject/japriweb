import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { formatRupiah, formatDate } from '@/lib/utils'
import { CopyButton } from '@/components/CopyButton'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { PendingStatusRefresher } from './PendingStatusRefresher'

const statusConfig: Record<number, { label: string; icon: React.ComponentType<any>; bg: string; text: string; border: string }> = {
  1: { label: 'Sukses', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  0: { label: 'Pending', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  2: { label: 'Gagal', icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

const typeLabel: Record<number, string> = {
  1: 'Prabayar',
  2: 'Pascabayar',
  7: 'Top Up Saldo',
  6: 'Bonus',
}

export default async function TransaksiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const memberRows = await prisma.$queryRaw<Array<{ phone: string }>>`
    SELECT phone FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = memberRows[0]
  if (!member) redirect('/login')

  const trxId = parseInt(id, 10)
  if (isNaN(trxId)) notFound()

  const trx = await prisma.transaksi.findUnique({
    where: { id: trxId },
  })

  if (!trx || trx.members !== member.phone) notFound()

  const status = statusConfig[trx.status] ?? statusConfig[0]
  const Icon = status.icon
  const tipeLabel = typeLabel[trx.type] ?? 'Transaksi'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`px-5 pt-12 pb-6 text-white relative overflow-hidden ${trx.status === 1 ? 'gradient-primary' : trx.status === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-red-500 to-rose-500'}`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <Link href="/riwayat" className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1 className="text-xl font-bold">Detail Transaksi</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">{tipeLabel}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-6">
        <PendingStatusRefresher enabled={trx.status === 0} />

        {/* Status Card */}
        <div className={`rounded-2xl p-6 text-center ${status.bg} border ${status.border}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${status.bg}`}>
            <Icon size={32} className={status.text} />
          </div>
          <p className={`text-lg font-bold ${status.text}`}>{status.label}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(trx.created_at)}</p>
        </div>

        {/* Info Transaksi */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100/80 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informasi Transaksi</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Invoice', value: trx.invoice, copy: true },
              { label: 'Produk', value: trx.desc || trx.product },
              { label: 'Tujuan', value: trx.customers },
              { label: 'Tipe', value: tipeLabel },
            ].map(({ label, value, copy }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                  {copy && <CopyButton text={value} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rincian Biaya */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100/80 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rincian Biaya</p>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-gray-500">Harga</span>
              <span className="text-sm font-semibold text-gray-800">{formatRupiah(trx.price)}</span>
            </div>
            {trx.admin > 0 && (
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500">Biaya Admin</span>
                <span className="text-sm font-semibold text-gray-800">{formatRupiah(trx.admin)}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50">
              <span className="text-sm font-bold text-gray-900">Total Bayar</span>
              <span className="text-base font-bold text-violet-600">{formatRupiah(trx.sale)}</span>
            </div>
          </div>
        </div>

        {/* Serial Number (jika ada) */}
        {trx.sn && (
          <div className="bg-violet-50 border border-violet-200/60 rounded-2xl p-4">
            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2">Serial Number</p>
            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-violet-200">
              <code className="text-sm font-mono text-gray-800">{trx.sn}</code>
              <CopyButton text={trx.sn} />
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl card-shadow border border-gray-100/80 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Timeline</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Transaksi Dibuat</p>
                <p className="text-xs text-gray-400">{formatDate(trx.created_at)}</p>
              </div>
            </div>
            {trx.updated_at && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${status.bg}`}>
                  <Icon size={16} className={status.text} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Status: {status.label}</p>
                  <p className="text-xs text-gray-400">{formatDate(trx.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Link href="/riwayat" className="block w-full py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl text-center btn-press">
          Kembali ke Riwayat
        </Link>
      </div>
    </div>
  )
}
