'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Gift, Loader2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export default function SyaratBonusPage() {
  const router = useRouter()
  const [levels, setLevels] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bonus/levels')
      .then(r => r.ok ? r.json() : { levels: [] })
      .then(d => setLevels(d.levels || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Syarat & Cara Bonus</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Pelajari cara kerja program bonus</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-20 space-y-3.5">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100/80">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Gift size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Program Bonus Referral</p>
              <p className="text-xs text-gray-500">Japri Pay</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">1. Apa itu Bonus?</h3>
              <ul className="space-y-2">
                {['Bonus adalah reward yang kamu dapatkan dari setiap transaksi downline kamu.', 'Bonus dihitung berdasarkan level referral, mulai dari level 1 hingga level 5.', 'Bonus masuk otomatis ke saldo bonus setelah transaksi downline berhasil.'].map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">2. Cara Mendapatkan Bonus</h3>
              <ul className="space-y-2">
                <li className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">Ajak teman untuk bergabung menggunakan kode referral kamu.</li>
                <li className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">Setiap kali downline kamu bertransaksi, kamu otomatis mendapat bonus.</li>
                {loading ? (
                  <li className="pl-4"><Loader2 size={14} className="animate-spin text-amber-400" /></li>
                ) : levels.map((amount, i) => (
                  <li key={i} className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                    Bonus level {i + 1}: <span className="font-semibold text-amber-600">{formatRupiah(amount)}</span> per transaksi downline.
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">3. Cara Menukar Bonus</h3>
              <ul className="space-y-2">
                {['Bonus dapat ditukar menjadi saldo utama untuk bertransaksi.', 'Minimal penukaran bonus adalah Rp 10.000.', 'Penukaran bonus diproses otomatis dan langsung masuk ke saldo.', 'Bonus yang sudah ditukar tidak dapat dikembalikan.'].map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">4. Ketentuan Bonus</h3>
              <ul className="space-y-2">
                {['Bonus hanya berlaku untuk transaksi yang berhasil (status sukses).', 'Bonus tidak berlaku untuk transaksi yang dibatalkan atau gagal.', 'Japri Pay berhak membatalkan bonus jika ditemukan kecurangan.', 'Bonus tidak dapat ditarik dalam bentuk uang tunai.'].map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
