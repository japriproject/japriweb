'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export type TransactionRow = {
  id: number
  invoice: string
  member: string
  product: string
  customer: string
  sale: number
  price: number
  admin: number
  status: number
  description: string | null
  serialNumber: string | null
  createdAt: string
  transactionDate: string | null
  updatedAt: string | null
  type: number
  claim: number
  statusUpdate: number
  migration: number
}

const labels: Record<number, string> = { 0: 'Pending', 1: 'Sukses', 2: 'Gagal', 3: 'Refund' }
const colors: Record<number, string> = { 0: 'bg-amber-500/10 text-amber-400', 1: 'bg-emerald-500/10 text-emerald-400', 2: 'bg-rose-500/10 text-rose-400', 3: 'bg-sky-500/10 text-sky-400' }

export default function TransactionsTable({ transactions }: { transactions: TransactionRow[] }) {
  const [selected, setSelected] = useState<TransactionRow | null>(null)

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Member / tujuan</th><th className="px-5 py-3">Produk</th><th className="px-5 py-3">Nilai</th><th className="px-5 py-3">Profit</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Waktu</th><th className="px-5 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {transactions.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-mono text-xs">{item.invoice}</td>
                  <td className="px-5 py-4"><p>{item.member}</p><p className="text-xs text-slate-500">{item.customer}</p></td>
                  <td className="max-w-[220px] truncate px-5 py-4">{item.product}</td>
                  <td className="px-5 py-4 font-medium">{formatRupiah(item.sale)}</td>
                  <td className="px-5 py-4 text-slate-400">{formatRupiah(item.sale - item.price)}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20"><Eye size={15} /> Detail</button></td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">Transaksi tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-5 py-4">
              <div><h2 id="transaction-detail-title" className="font-bold">Detail transaksi</h2><p className="mt-1 font-mono text-xs text-slate-500">{selected.invoice}</p></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={19} /></button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <div><p className="text-xs uppercase tracking-wide text-slate-600">Status transaksi</p><div className="mt-2"><StatusBadge status={selected.status} /></div></div>
                <div className="text-right"><p className="text-xs uppercase tracking-wide text-slate-600">Nilai transaksi</p><p className="mt-1 text-xl font-bold">{formatRupiah(selected.sale)}</p></div>
              </div>

              <dl className="grid gap-4 rounded-xl bg-slate-950/60 p-4 sm:grid-cols-2">
                <Detail label="Member" value={selected.member} />
                <Detail label="Tujuan" value={selected.customer} />
                <Detail label="Produk" value={selected.product || '-'} wide />
                <Detail label="Harga beli" value={formatRupiah(selected.price)} />
                <Detail label="Harga jual" value={formatRupiah(selected.sale)} />
                <Detail label="Biaya admin" value={formatRupiah(selected.admin)} />
                <Detail label="Profit" value={formatRupiah(selected.sale - selected.price)} />
                <Detail label="Tipe transaksi" value={String(selected.type)} />
                <Detail label="Tanggal transaksi" value={formatDate(selected.transactionDate)} />
                <Detail label="Dibuat" value={formatDate(selected.createdAt)} />
                <Detail label="Terakhir diperbarui" value={formatDate(selected.updatedAt)} />
                <Detail label="Status update" value={String(selected.statusUpdate)} />
                <Detail label="Claim" value={selected.claim === 1 ? 'Ya' : 'Tidak'} />
                <Detail label="Migrasi" value={selected.migration === 1 ? 'Ya' : 'Tidak'} />
                <Detail label="Serial number / token" value={selected.serialNumber || '-'} wide mono />
                <Detail label="Keterangan" value={selected.description || '-'} wide />
              </dl>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: number }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs ${colors[status] ?? 'bg-white/10 text-slate-300'}`}>{labels[status] ?? `Status ${status}`}</span>
}

function Detail({ label, value, wide = false, mono = false }: { label: string; value: string; wide?: boolean; mono?: boolean }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><dt className="text-xs uppercase tracking-wide text-slate-600">{label}</dt><dd className={`mt-1 break-words text-sm text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd></div>
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'
}
