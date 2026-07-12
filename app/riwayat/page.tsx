'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { formatRupiah, formatDate } from '@/lib/utils'
import {
  Smartphone, Wifi, Zap, Gamepad2, CreditCard, Inbox,
  ChevronLeft, ChevronRight, Loader2, ArrowUpRight, ArrowDownLeft,
  Filter
} from 'lucide-react'

type Transaksi = {
  id: number
  nomorTujuan: string
  harga: number
  status: string
  createdAt: string
  produk: { nama: string; kategori: string; operator: string }
}

const statusStyle: Record<string, { text: string; bg: string; dot: string; label: string }> = {
  SUKSES: { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', label: 'Sukses' },
  GAGAL: { text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', label: 'Gagal' },
  PENDING: { text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', label: 'Pending' },
}

const KategoriIcon: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  PULSA: Smartphone,
  PAKET_DATA: Wifi,
  PLN: Zap,
  GAME: Gamepad2,
  EMONEY: CreditCard,
}

const KategoriColor: Record<string, string> = {
  PULSA: 'bg-violet-100 text-violet-600',
  PAKET_DATA: 'bg-blue-100 text-blue-600',
  PLN: 'bg-yellow-100 text-yellow-600',
  GAME: 'bg-pink-100 text-pink-600',
  EMONEY: 'bg-green-100 text-green-600',
}

const FILTERS = ['Semua', 'SUKSES', 'PENDING', 'GAGAL'] as const
type Filter = typeof FILTERS[number]

export default function RiwayatPage() {
  const [data, setData] = useState<Transaksi[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('Semua')

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transaksi?page=${p}&exclude_type=7`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json.data ?? [])
      setTotalPages(json.totalPages ?? 1)
      setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(page) }, [page, fetchData])

  const filtered = filter === 'Semua' ? data : data.filter(t => t.status === filter)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-slate-50 rounded-t-3xl" />
        <div className="relative z-10">
          <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">{total} total transaksi</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Filter */}
        <div className="bg-white rounded-2xl p-1 card-shadow border border-gray-100/80 flex gap-1">
          {FILTERS.map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all btn-press ${
                filter === f
                  ? f === 'Semua' ? 'gradient-primary text-white shadow-sm'
                    : f === 'SUKSES' ? 'bg-emerald-500 text-white'
                    : f === 'PENDING' ? 'bg-amber-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'text-gray-400'
              }`}
            >
              {f === 'Semua' ? <><Filter size={10} className="inline mr-1" />Semua</> : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-violet-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl card-shadow border border-gray-100/80 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold">Belum ada transaksi</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter !== 'Semua' ? `Tidak ada transaksi ${filter.toLowerCase()}` : 'Mulai beli pulsa atau paket data'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl card-shadow border border-gray-100/80 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map((t, i) => {
                const s = statusStyle[t.status] ?? statusStyle.PENDING
                const Icon = KategoriIcon[t.produk?.kategori ?? 'PULSA'] ?? Smartphone
                const iconColor = KategoriColor[t.produk?.kategori ?? 'PULSA'] ?? 'bg-gray-100 text-gray-600'
                return (
                  <Link
                    key={t.id}
                    href={`/transaksi/${t.id}`}
                    className={`flex items-center gap-3 px-4 py-4 hover:bg-gray-50/60 transition-colors fade-in`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon size={19} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{t.produk?.nama ?? 'Transaksi'}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{t.nomorTujuan}</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">{formatDate(t.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <ArrowUpRight size={13} className="text-red-400" />
                        <p className="text-sm font-bold text-gray-900">{formatRupiah(t.harga)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${s.text} ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl p-3 card-shadow border border-gray-100/80">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors btn-press"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm font-bold text-gray-700">
              {page} <span className="text-gray-300 font-normal">dari</span> {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors btn-press"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
