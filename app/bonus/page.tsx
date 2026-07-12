'use client'
import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Gift, History, Zap, ChevronRight, Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type BonusData = {
  total: number
  available: number
  pending: number
  history: Array<{ id: number; desc: string; sale: number; created_at: string; claim: number }>
}

type BonusTransaction = {
  id: number
  produk: { nama: string }
  harga: number
  createdAt: string
  claim: number
}

type TransactionsResponse = {
  data: BonusTransaction[]
}

type CurrentUser = {
  bonus?: number
}

export default function BonusPage() {
  const [data, setData] = useState<BonusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((user: CurrentUser | null) => {
        if (!user) return
        fetch('/api/transaksi?type=7&page=1')
          .then(async r => r.ok ? await r.json() as TransactionsResponse : { data: [] })
          .then(bonuses => {
            const arr = bonuses.data
            const now = new Date()
            const thisMonth = arr.filter(b => {
              const d = new Date(b.createdAt)
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            setData({
              total: arr.reduce((s, b) => s + (b.harga || 0), 0),
              available: user.bonus || 0,
              pending: thisMonth.reduce((s, b) => s + (b.harga || 0), 0),
              history: thisMonth.slice(0, 10).map(b => ({
                id: b.id,
                desc: b.produk?.nama || 'Bonus',
                sale: b.harga,
                created_at: b.createdAt,
                claim: b.claim,
              }))
            })
            setLoading(false)
          })
          .catch(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  )

  if (!data) return null

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      <div className="gradient-primary px-5 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/[0.04] rounded-full" />
        <div className="absolute top-8 right-16 w-20 h-20 bg-white/[0.06] rounded-full" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 gradient-dark rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <Gift size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bonus</h1>
            <p className="text-white/60 text-sm mt-0.5 font-medium">Kelola bonus mu di sini</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-3.5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3.5 card-shadow border border-white/80">
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Total</p>
            <p className="text-lg font-bold text-gray-900">{formatRupiah(data.total)}</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 card-shadow border border-white/80">
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Available</p>
            <p className="text-lg font-bold text-emerald-600">{formatRupiah(data.available)}</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 card-shadow border border-white/80">
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Bulan Ini</p>
            <p className="text-lg font-bold text-amber-600">{formatRupiah(data.pending)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/tukar-bonus" className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-violet-500" />
            </div>
            <p className="text-xs font-bold text-gray-700">Klaim Bonus</p>
          </Link>
          <Link href="/syarat-bonus" className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-700">Syarat & Cara</p>
          </Link>
        </div>

        {/* Riwayat Bonus Bulan Ini */}
        <div className="bg-white rounded-2xl card-shadow border border-white/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-amber-500" />
              <p className="text-sm font-bold text-gray-800">Bonus Bulan Ini</p>
            </div>
            <Link href="/riwayat-bonus" className="flex items-center gap-0.5 text-xs text-violet-600 font-semibold">
              Semua <ChevronRight size={13} />
            </Link>
          </div>

          {data.history.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Gift size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Belum ada bonus bulan ini</p>
              <p className="text-gray-300 text-xs mt-1">Bonus akan muncul ketika kamu menerimanya</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.history.map(bonus => (
                <Link key={bonus.id} href={`/transaksi/${bonus.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors active:scale-95">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bonus.claim ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <Gift size={16} className={bonus.claim ? 'text-emerald-500' : 'text-amber-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{bonus.desc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(bonus.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${bonus.claim ? 'text-emerald-600' : 'text-amber-600'}`}>+{formatRupiah(bonus.sale)}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${bonus.claim ? 'text-emerald-400' : 'text-amber-400'}`}>{bonus.claim ? 'Diklaim' : 'Pending'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
