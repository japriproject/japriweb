'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import CustomerInput from '@/components/CustomerInput'
import { detectBrand, formatRupiah } from '@/lib/utils'
import { ArrowLeft, Wifi, CheckCircle2, Loader2, AlertCircle, Wallet, ShieldCheck, ChevronDown, Phone } from 'lucide-react'

type Produk = {
  id: number
  code: string
  name: string
  kategori: string
  brand: string
  price: number
  sale: number
}

export default function PaketDataPage() {
  const router = useRouter()
  const [noHp, setNoHp] = useState('')
  const [brand, setBrand] = useState<string | null>(null)
  const [produks, setProduks] = useState<Produk[]>([])
  const [selected, setSelected] = useState<Produk | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadProduk, setLoadProduk] = useState(false)
  const [error, setError] = useState('')
  const [saldo, setSaldo] = useState(0)
  const [showAll, setShowAll] = useState(false)

  // Fetch saldo
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => setSaldo(d?.saldo || 0))
  }, [])

  // Auto-detect brand from phone and fetch products
  useEffect(() => {
    if (noHp.length >= 10) {
      const detected = detectBrand(noHp)
      setBrand(detected)
      setSelected(null)
      
      if (detected) {
        setLoadProduk(true)
        setShowAll(false)
        fetch(`/api/produk?brand=${encodeURIComponent(detected)}&kategori=Paket%20Data`)
          .then(r => r.ok ? r.json() : [])
          .then(d => setProduks(Array.isArray(d) ? d : []))
          .finally(() => setLoadProduk(false))
      }
    } else {
      setBrand(null)
      setProduks([])
    }
  }, [noHp])

  async function handleBeli() {
    if (!selected || !noHp) return
    if (saldo < selected.sale) return setError('Saldo tidak cukup')
    setError('')
    setLoading(true)
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produkId: String(selected.id), nomorTujuan: noHp, productType: 'prabayar' }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      return setError(d.error || 'Terjadi kesalahan')
    }
    const data = await res.json()
    router.push(`/transaksi/${data.id}`)
  }

  const visibleProduks = showAll ? produks : produks.slice(0, 6)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      {/* Header */}
      <div className="gradient-info px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Paket Data</h1>
              <p className="text-white/60 text-sm mt-0.5 font-medium">Internet cepat & hemat</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
              <Wallet size={14} />
              <span className="text-sm font-bold">{formatRupiah(saldo)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5">
        {/* Input Nomor */}
        <CustomerInput value={noHp} onChange={value => { setNoHp(value); setSelected(null) }} label="Data Pelanggan" accent="blue" />
        <div className="-mt-3.5 px-4">
          {brand && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-600">
              <ShieldCheck size={12} /> {brand} terdeteksi
            </div>
          )}
        </div>

        {/* Produk */}
        {loadProduk ? (
          <div className="flex justify-center py-10">
            <Loader2 size={26} className="animate-spin text-blue-500" />
          </div>
        ) : produks.length > 0 ? (
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 slide-up">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Pilih Paket</label>
            <div className="grid grid-cols-2 gap-2.5">
              {visibleProduks.map(p => {
                const active = selected?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all btn-press relative overflow-hidden ${
                      active ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 size={16} className="text-blue-500" />
                      </div>
                    )}
                    <p className="font-bold text-sm text-gray-800 pr-6 leading-tight">{p.name}</p>
                    <p className={`text-sm font-bold mt-1.5 ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                      {formatRupiah(p.sale)}
                    </p>
                  </button>
                )
              })}
            </div>
            {produks.length > 6 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full mt-3 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl flex items-center justify-center gap-1.5"
              >
                {showAll ? 'Tampilkan Lebih Sedikit' : `Lihat ${produks.length - 6} Produk Lainnya`}
                <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        ) : noHp.length >= 10 && !brand ? (
          <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100/80 text-center">
            <p className="text-gray-500 text-sm font-semibold">Nomor tidak dikenali</p>
            <p className="text-gray-400 text-xs mt-1">Gunakan nomor yang valid</p>
          </div>
        ) : brand ? (
          <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100/80 text-center">
            <p className="text-gray-500 text-sm font-semibold">Produk tidak tersedia</p>
            <p className="text-gray-400 text-xs mt-1">Coba nomor lain</p>
          </div>
        ) : null}

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 fade-in">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Summary */}
        {selected && noHp && (
          <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 space-y-2.5 slide-up">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Ringkasan Transaksi
            </p>
            {[['Paket', selected!.name], ['Tujuan', noHp], ['Operator', brand]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold text-gray-800">{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-blue-200/60">
              <span className="text-gray-500">Total Bayar</span>
              <span className="font-bold text-blue-600 text-base">{formatRupiah(selected!.sale)}</span>
            </div>
            {saldo < selected!.sale && (
              <p className="text-xs text-red-500 font-medium bg-red-50 rounded-lg px-3 py-2">
                Saldo tidak cukup. Saldo kamu: {formatRupiah(saldo)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        <button
          onClick={handleBeli}
          disabled={!selected || !noHp || loading || saldo < (selected?.sale ?? 0)}
          className="w-full py-4 gradient-info disabled:bg-gray-100 disabled:shadow-none disabled:text-gray-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 btn-press disabled:pointer-events-none"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Memproses...' : selected ? `Bayar ${formatRupiah(selected?.sale ?? 0)}` : 'Pilih Paket Dulu'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
