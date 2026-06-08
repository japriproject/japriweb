'use client'
import BottomNav from '@/components/BottomNav'
import { Hammer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TokoPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium hover:text-white transition-colors">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Toko</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Belanja kebutuhan mu di sini</p>
        </div>
      </div>

      {/* Under Construction */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
          <Hammer size={40} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sedang Dikerjakan</h2>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            Fitur Toko sedang dalam tahap pengembangan. Kami akan segera meluncurkannya dengan produk-produk pilihan.
          </p>
        </div>
        <div className="pt-4 space-y-2 w-full">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full w-2/3 animate-pulse" />
          </div>
          <p className="text-xs text-gray-400 font-medium">Proses development: 66%</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
