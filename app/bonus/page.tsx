'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Gift, History, Zap, ChevronRight, Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type BonusData = {
  total: number
  available: number
  pending: number
  history: Array<{
    id: number
    desc: string
    sale: number
    created_at: string
  }>
}

export default function BonusPage() {
  const router = useRouter()
  const [data, setData] = useState<BonusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (!user) return
        
        // Get bonus data
        fetch('/api/transaksi?type=6')
          .then(r => r.ok ? r.json() : [])
          .then(bonuses => {
            const arr = Array.isArray(bonuses) ? bonuses : (bonuses.bonuses || [])
            
            // Calculate this month bonuses
            const now = new Date()
            const thisMonth = arr.filter((b: any) => {
              const date = new Date(b.created_at)
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
            })
            
            const total = arr.reduce((sum: number, b: any) => sum + (b.sale || 0), 0)
            const thisMonthTotal = thisMonth.reduce((sum: number, b: any) => sum + (b.sale || 0), 0)
            
            setData({
              total,
              available: user.bonus || 0,
              pending: thisMonthTotal,
              history: thisMonth.slice(0, 10)
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
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/[0.04] rounded-full" />
        <div className="absolute top-8 right-16 w-20 h-20 bg-white/[0.06] rounded-full" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 gradient-dark rounded-2xl flex items-center justify-center text-2xl border border-white/20 shadow-lg">
            <Gift size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bonus</h1>
            <p className="text-white/60 text-sm mt-0.5 font-medium">Kelola bonus mu di sini</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-3.5 pb-6">
        {/* Stats Cards */}
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
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Pending</p>
            <p className="text-lg font-bold text-amber-600">{formatRupiah(data.pending)}</p>
          </div>
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
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Gift size={16} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{bonus.desc || 'Bonus'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(bonus.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-600">+{formatRupiah(bonus.sale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-violet-500" />
            </div>
            <p className="text-xs font-bold text-gray-700">Tukar Bonus</p>
          </button>
          <button className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 hover:shadow-lg transition-all active:scale-95 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-700">Syarat & Cara</p>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
