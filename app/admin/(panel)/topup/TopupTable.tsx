'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { CheckCircle2, Eye, Loader2, WalletCards, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'
import type { TransactionRow } from '../transaksi/TransactionsTable'

export default function TopupTable({ transactions, pending }: { transactions: TransactionRow[]; pending: boolean }) {
  const router = useRouter()
  const [selected, setSelected] = useState<TransactionRow | null>(null)
  const [approving, setApproving] = useState<TransactionRow | null>(null)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, startTransition] = useTransition()

  useEffect(() => {
    if (!message && !error) return
    const timer = window.setTimeout(() => {
      setMessage('')
      setError('')
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [message, error])

  function openApproval(item: TransactionRow) {
    setApproving(item)
    setAmount(String(item.sale || ''))
    setError('')
  }

  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/topups/${approving.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? 'Top up gagal disetujui')
      setApproving(null)
      setMessage(data.message ?? 'Top up berhasil disetujui')
      startTransition(() => router.refresh())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Top up gagal disetujui')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {(message || error) && (
        <p role="status" className={`fixed right-5 top-5 z-[90] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${error ? 'border-rose-500/20 bg-rose-950/90 text-rose-200' : 'border-emerald-500/20 bg-emerald-950/90 text-emerald-200'}`}>
          {error || message}
        </p>
      )}

      <div className="overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3">Nominal</th><th className="px-5 py-3">Total bayar</th><th className="px-5 py-3">Waktu</th><th className="px-5 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {transactions.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-mono text-xs">{item.invoice}</td>
                  <td className="px-5 py-4">{item.member}</td>
                  <td className="px-5 py-4">{item.product}</td>
                  <td className="px-5 py-4 font-semibold">{formatRupiah(item.sale)}</td>
                  <td className="px-5 py-4 text-slate-400">{formatRupiah(item.price)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"><Eye size={15} /> Detail</button>
                    {pending && <button type="button" onClick={() => openApproval(item)} disabled={submitting || refreshing} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"><CheckCircle2 size={15} /> Approve</button>}
                  </div></td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Tidak ada top up {pending ? 'pending' : 'sukses'}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {approving && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="approve-title">
          <form onSubmit={approve} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 id="approve-title" className="font-bold">Approve top up</h2><p className="mt-1 font-mono text-xs text-slate-500">{approving.invoice}</p></div><button type="button" onClick={() => setApproving(null)} disabled={submitting} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-white/10"><X size={18} /></button></div>
            <div className="mt-5 rounded-xl bg-slate-950/60 p-4 text-sm"><p className="text-slate-500">Saldo akan ditambahkan ke</p><p className="mt-1 font-semibold">{approving.member}</p></div>
            <label className="mt-5 block"><span className="mb-2 block text-sm font-medium">Nominal saldo</span><div className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 focus-within:border-emerald-500"><WalletCards size={17} className="text-slate-500" /><input type="number" min="1" max="2000000000" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full bg-transparent text-sm outline-none" /></div></label>
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={submitting || refreshing} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold hover:bg-emerald-500 disabled:opacity-50">{submitting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} Approve & tambah saldo</button>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="topup-detail-title">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h2 id="topup-detail-title" className="font-bold">Detail top up</h2><p className="mt-1 font-mono text-xs text-slate-500">{selected.invoice}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-white/10"><X size={18} /></button></div><dl className="grid gap-4 p-5 sm:grid-cols-2"><Detail label="Member" value={selected.member} /><Detail label="Metode" value={selected.product} /><Detail label="Nominal" value={formatRupiah(selected.sale)} /><Detail label="Total bayar" value={formatRupiah(selected.price)} /><Detail label="Dibuat" value={formatDate(selected.createdAt)} /><Detail label="Keterangan" value={selected.description || '-'} /></dl></div>
        </div>
      )}
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs uppercase tracking-wide text-slate-600">{label}</dt><dd className="mt-1 break-words text-sm text-slate-200">{value}</dd></div>
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'
}
