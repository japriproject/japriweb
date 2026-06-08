'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { formatRupiah, formatDate } from '@/lib/utils'
import { ArrowLeft, Loader2, Gift } from 'lucide-react'
import Link from 'next/link'

type Bonus = {
  id: number
  invoice: string
  desc: string
  sale: number
  created_at: string
}

export default function RiwayatBonusPage() {
  const router = useRouter()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transaksi?type=6')
      .then(r => r.ok ? r.json() : { bonuses: [] })
      .then(d => { 
        const data = Array.isArray(d) ? d : (d.bonuses || [])
        setBonuses(data)
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium hover:text-white transition-colors">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Riwayat Bonus</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Lihat semua bonus yang kamu terima</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 pb-6">
        {!bonuses || bonuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Gift size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Belum ada riwayat bonus</p>
            <p className="text-gray-400 text-sm mt-1">Bonus akan muncul di sini ketika kamu menerimanya</p>
          </div>
        ) : (
          bonuses.map((bonus: Bonus) => (
            <Link key={bonus.id} href={`/transaksi/${bonus.id}`}
              className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 hover:shadow-lg hover:border-violet-200/50 transition-all active:scale-95">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Gift size={20} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{bonus.desc || 'Bonus'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(bonus.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">+{formatRupiah(bonus.sale)}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
