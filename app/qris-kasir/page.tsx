'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, QrCode, Receipt, Wallet, Clock3 } from 'lucide-react'

const quickActions = [
  { title: 'Buat QRIS Baru', desc: 'Generate QR untuk pembayaran pelanggan', icon: QrCode, accent: 'bg-emerald-50 text-emerald-600' },
  { title: 'Riwayat Pembayaran', desc: 'Lihat transaksi QRIS yang sudah masuk', icon: Receipt, accent: 'bg-blue-50 text-blue-600' },
  { title: 'Settlement', desc: 'Pantau dana yang siap dicairkan', icon: Wallet, accent: 'bg-violet-50 text-violet-600' },
]

export default function QrisKasirPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/70 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <QrCode size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Qris Kasir</h1>
              <p className="text-white/70 text-sm mt-1">Satu halaman untuk generate, cek, dan pantau pembayaran QRIS.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-6 space-y-4">
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status Kasir</p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">Belum ada QR aktif</h2>
              <p className="text-sm text-gray-500 mt-1">Mulai dengan membuat QRIS baru untuk menerima pembayaran pelanggan.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Clock3 size={22} className="text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {quickActions.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                type="button"
                className="w-full bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.accent}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Catatan</p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Halaman ini sudah disiapkan sebagai landing page `Qris Kasir`. Kalau mau, langkah berikutnya saya bisa sambungkan ke generator QRIS dinamis dan riwayat transaksi kasir.
          </p>
        </div>
      </div>
    </div>
  )
}
