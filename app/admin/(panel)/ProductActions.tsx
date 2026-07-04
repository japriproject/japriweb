'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Save } from 'lucide-react'

type Props = {
  type: 'prabayar' | 'pascabayar'
  defaultMargin: number
}

export default function ProductActions({ type, defaultMargin }: Props) {
  const router = useRouter()
  const [margin, setMargin] = useState(String(defaultMargin || 0))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!message && !error) return
    const timer = window.setTimeout(() => {
      setMessage('')
      setError('')
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [message, error])

  async function runSync() {
    setSyncing(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`/api/admin/products/${type}/sync`, { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? 'Sinkronisasi gagal')
        return
      }
      setMessage(`Sync sukses. Total Digiflazz: ${Number(data.totalFetched ?? 0).toLocaleString('id-ID')}`)
      startTransition(() => router.refresh())
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setSyncing(false)
    }
  }

  async function saveMargin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`/api/admin/products/${type}/margin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ margin }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? 'Gagal menyimpan margin')
        return
      }
      setMessage(`Margin tersimpan untuk ${Number(data.updated ?? 0).toLocaleString('id-ID')} produk.`)
      startTransition(() => router.refresh())
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setSaving(false)
    }
  }

  const busy = syncing || saving || isPending

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-semibold">Aksi produk</h2>
          <p className="mt-1 text-xs text-slate-500">Sinkron Digiflazz dan atur margin jual massal.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={runSync} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
            {syncing ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
            Sinkron Digiflazz
          </button>
          <form onSubmit={saveMargin} className="flex gap-2">
            <input type="number" min="0" step="1" value={margin} onChange={(event) => setMargin(event.target.value)} className="h-11 w-36 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm outline-none focus:border-violet-500" placeholder="Margin" />
            <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              Simpan
            </button>
          </form>
        </div>
      </div>
      {(message || error) && (
        <p role="status" className={`fixed right-5 top-5 z-[90] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${error ? 'border-rose-500/20 bg-rose-950/90 text-rose-200' : 'border-emerald-500/20 bg-emerald-950/90 text-emerald-200'}`}>
          {error || message}
        </p>
      )}
    </div>
  )
}
