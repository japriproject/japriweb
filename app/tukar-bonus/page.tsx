'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Loader2, Gift } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export default function TukarBonusPage() {
  const router = useRouter()
  const [pending, setPending] = useState(0)
  const [claimed, setClaimed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadData() {
    const res = await fetch('/api/bonus').then(r => r.ok ? r.json() : null)
    if (res) {
      setPending(res.pending || 0)
      setClaimed(res.terkumpul || 0)
    }
    setLoadingData(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleKlaim() {
    setMsg(null)
    setLoading(true)
    const res = await fetch('/api/bonus', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setMsg({ type: 'success', text: `Berhasil klaim ${formatRupiah(data.total)} bonus!` })
      loadData()
    } else {
      setMsg({ type: 'error', text: data.error || 'Gagal klaim bonus' })
    }
  }

  if (loadingData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Klaim Bonus</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Klaim bonus referral kamu</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-20">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-600">{formatRupiah(pending)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Terkumpul</p>
            <p className="text-xl font-bold text-emerald-600">{formatRupiah(claimed)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Gift size={22} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Bonus Siap Diklaim</p>
              <p className="text-2xl font-bold text-amber-600">{formatRupiah(pending)}</p>
            </div>
          </div>

          {msg && (
            <p className={`text-xs font-semibold px-3 py-2 rounded-xl ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </p>
          )}

          <button onClick={handleKlaim} disabled={loading || pending === 0}
            className="w-full gradient-primary text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
            {pending === 0 ? 'Tidak Ada Bonus Pending' : 'Klaim Sekarang'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">Bonus yang diklaim langsung masuk ke saldo aktif kamu.</p>
      </div>
    </div>
  )
}
