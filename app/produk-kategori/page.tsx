'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { detectBrand, formatRupiah } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Wallet, Phone, ShieldCheck, X, Search, ChevronDown } from 'lucide-react'

type Brand = string

type Produk = {
  id: number
  code: string
  name: string
  kategori: string
  brand: string
  price: number
  sale: number
  stats: number
  status: string
}

type PascaInquiry = {
  refId: string
  productCode: string
  productName: string
  brand: string
  customerNo: string
  customerName: string | null
  message: string
  status: string
  rc: string
  billCount: number | null
  admin: number
  price: number
  sellingPrice: number
  totalAmount: number
  desc: unknown
}

function ProdukKategoriContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const kategori = searchParams.get('kategori') || 'Pulsa'
  const brandParam = searchParams.get('brand')
  const isPascabayar = kategori.toLowerCase().includes('pasca') || Boolean(brandParam)
  const isPulsaOrData = !isPascabayar && (kategori.toLowerCase().includes('pulsa') || kategori.toLowerCase().includes('data'))
  const lockedPascaBrand = isPascabayar ? (brandParam || kategori) : null

  const [noHp, setNoHp] = useState('')
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(brandParam)
  const [produks, setProduks] = useState<Produk[]>([])
  const [selected, setSelected] = useState<Produk | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadBrand, setLoadBrand] = useState(!isPulsaOrData)
  const [loadProduk, setLoadProduk] = useState(false)
  const [loadingInquiry, setLoadingInquiry] = useState(false)
  const [error, setError] = useState('')
  const [saldo, setSaldo] = useState(0)
  const [detectedBrand, setDetectedBrand] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')
  const [showProdukDropdown, setShowProdukDropdown] = useState(false)
  const [produkSearch, setProdukSearch] = useState('')
  const [inquiry, setInquiry] = useState<PascaInquiry | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => setSaldo(d?.saldo || 0))
  }, [])

  useEffect(() => {
    if (lockedPascaBrand) {
      setSelectedBrand(lockedPascaBrand)
      setBrands([lockedPascaBrand])
      return
    }

    if (isPulsaOrData && noHp.length >= 9) {
      const detected = detectBrand(noHp)
      setDetectedBrand(detected)
      if (detected) {
        setSelectedBrand(detected)
      }
    } else if (isPulsaOrData) {
      setDetectedBrand(null)
      setSelectedBrand(null)
      setProduks([])
      setInquiry(null)
    }
  }, [noHp, isPulsaOrData, lockedPascaBrand])

  useEffect(() => {
    setSelectedBrand(lockedPascaBrand || brandParam)
  }, [brandParam, kategori, lockedPascaBrand])

  useEffect(() => {
    if (lockedPascaBrand) {
      setLoadBrand(false)
      return
    }

    if (isPulsaOrData) {
      setLoadBrand(false)
      return
    }

    setLoadBrand(true)
    fetch(`/api/produk/brands?kategori=${encodeURIComponent(kategori)}${isPascabayar ? '&type=pasca' : ''}`)
      .then(r => r.ok ? r.json() : { brands: [] })
      .then(d => setBrands(d.brands || []))
      .finally(() => setLoadBrand(false))
  }, [kategori, isPulsaOrData, isPascabayar, lockedPascaBrand])

  useEffect(() => {
    if (!selectedBrand) {
      setProduks([])
      setInquiry(null)
      return
    }

    if (!isPascabayar && noHp.length < 9) {
      setProduks([])
      setInquiry(null)
      return
    }

    setLoadProduk(true)
    const produkUrl = isPascabayar
      ? `/api/produk?brand=${encodeURIComponent(selectedBrand)}&type=pasca`
      : `/api/produk?brand=${encodeURIComponent(selectedBrand)}&kategori=${encodeURIComponent(kategori)}`

    fetch(produkUrl)
      .then(r => r.ok ? r.json() : [])
      .then(d => setProduks(Array.isArray(d) ? d : []))
      .finally(() => setLoadProduk(false))
  }, [selectedBrand, kategori, noHp, isPascabayar])

  async function handleBeli() {
    if (!selected || !noHp) return setError('Nomor HP dan produk harus diisi')
    const totalHarga = isPascabayar ? (inquiry?.totalAmount ?? 0) : selected.sale
    if (saldo < totalHarga) return setError('Saldo tidak cukup')

    setError('')
    setLoading(true)
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produkId: String(selected.id),
        nomorTujuan: noHp,
        productType: isPascabayar ? 'pasca' : 'prabayar',
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      return setError(d.error || 'Terjadi kesalahan')
    }
    const data = await res.json()
    router.push(`/transaksi/${data.id}`)
  }

  async function handleCekTagihan() {
    if (!noHp.trim()) return setError('Nomor pelanggan harus diisi')
    if (!selected) return setError('Pilih name terlebih dahulu')

    setError('')
    setLoadingInquiry(true)
    const res = await fetch('/api/pascabayar/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produkId: String(selected.id),
        nomorPelanggan: noHp,
      }),
    })
    setLoadingInquiry(false)

    if (!res.ok) {
      const d = await res.json().catch(() => null)
      return setError(d?.error || 'Gagal cek tagihan')
    }

    const data = await res.json()
    setInquiry(data)
    setShowModal(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{lockedPascaBrand || kategori}</h1>
              <p className="text-white/60 text-sm mt-0.5 font-medium">
                {isPulsaOrData ? 'Masukkan nomor untuk deteksi otomatis' : isPascabayar ? 'Masukkan nomor pelanggan dan pilih name sesuai brand' : 'Pilih brand dan produk'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
              <Wallet size={14} />
              <span className="text-sm font-bold">{formatRupiah(saldo)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-6">
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5">
            {isPulsaOrData ? 'Nomor HP Tujuan' : 'Nomor Pelanggan'}
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder={isPascabayar ? 'Masukkan nomor pelanggan' : '08xxxxxxxxxx'}
              value={noHp}
              onChange={e => {
                setNoHp(e.target.value)
                setSelected(null)
                setInquiry(null)
                setError('')
              }}
              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 text-sm font-medium transition-all"
            />
          </div>
          {detectedBrand && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full bg-violet-50 text-violet-600">
              <ShieldCheck size={12} /> {detectedBrand} terdeteksi
            </div>
          )}
        </div>

        {!isPulsaOrData && !lockedPascaBrand && (
          loadBrand ? (
            <div className="flex justify-center py-10">
              <Loader2 size={26} className="animate-spin text-violet-500" />
            </div>
          ) : brands.length > 0 ? (
            <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5">Pilih Brand</label>
              <div className="relative">
                <button
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-left text-sm font-medium hover:border-violet-300 transition-all"
                >
                  <span className={selectedBrand ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedBrand || 'Pilih Brand'}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showBrandDropdown && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-2.5">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari brand..."
                          value={brandSearch}
                          onChange={e => setBrandSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {brands
                        .filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
                        .map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedBrand(brand)
                              setSelected(null)
                              setInquiry(null)
                              setShowBrandDropdown(false)
                              setBrandSearch('')
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                              selectedBrand === brand
                                ? 'bg-violet-50 text-violet-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null
        )}

        {loadProduk ? (
          <div className="flex justify-center py-10">
            <Loader2 size={26} className="animate-spin text-violet-500" />
          </div>
        ) : produks.length > 0 ? (
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-3">{isPascabayar ? 'Pilih Name' : 'Pilih Produk'}</label>
            {isPascabayar ? (
              <div className="relative">
                <button
                  onClick={() => setShowProdukDropdown(!showProdukDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-left text-sm font-medium hover:border-violet-300 transition-all"
                >
                  <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
                    {selected?.name || 'Pilih Name'}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showProdukDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProdukDropdown && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-2.5">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari name..."
                          value={produkSearch}
                          onChange={e => setProdukSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {produks
                        .filter(p => p.status === '1')
                        .filter(p => p.name.toLowerCase().includes(produkSearch.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelected(p)
                              setInquiry(null)
                              setShowProdukDropdown(false)
                              setProdukSearch('')
                              setError('')
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                              selected?.id === p.id
                                ? 'bg-violet-50 text-violet-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {produks.map(p => {
                  const isAvailable = p.status === '1'
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (!isAvailable) return
                        setSelected(p)
                        setShowModal(true)
                      }}
                      disabled={!isAvailable}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        isAvailable
                          ? 'border-gray-100 bg-gray-50 btn-press'
                          : 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <p className="font-bold text-sm text-gray-800 leading-tight">{p.name}</p>
                      <p className={`text-sm font-bold mt-1.5 ${isAvailable ? 'text-gray-500' : 'text-red-500'}`}>
                        {formatRupiah(p.sale)}
                      </p>
                      {!isAvailable && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                          Tidak Tersedia
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : isPulsaOrData && noHp.length >= 9 && !detectedBrand ? (
          <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100/80 text-center">
            <p className="text-gray-500 text-sm font-semibold">Nomor tidak dikenali</p>
            <p className="text-gray-400 text-xs mt-1">Gunakan nomor yang valid</p>
          </div>
        ) : null}

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{isPascabayar ? 'Detail Tagihan' : 'Konfirmasi Pembelian'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="bg-violet-50 border border-violet-200/60 rounded-2xl p-4 space-y-2.5 mb-4">
              {[[isPascabayar ? 'Name' : 'Produk', selected!.name], ['Brand', selectedBrand], [isPascabayar ? 'Nomor Pelanggan' : 'Nomor Tujuan', noHp]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm gap-3">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800 text-right">{v}</span>
                </div>
              ))}
              {isPascabayar && inquiry?.customerName && (
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-gray-500">Atas Nama</span>
                  <span className="font-semibold text-gray-800 text-right">{inquiry.customerName}</span>
                </div>
              )}
              {isPascabayar && inquiry?.message && (
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-gray-500">Keterangan</span>
                  <span className="font-semibold text-gray-800 text-right">{inquiry.message}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-violet-200/60">
                <span className="text-gray-500">{isPascabayar ? 'Total Tagihan' : 'Total Bayar'}</span>
                <span className="font-bold text-violet-600 text-base">{formatRupiah(isPascabayar ? (inquiry?.totalAmount ?? 0) : selected!.sale)}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleBeli}
              disabled={!noHp || loading || (isPascabayar ? saldo < (inquiry?.totalAmount ?? 0) : saldo < selected!.sale)}
              className="w-full py-4 gradient-primary disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 btn-press"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Memproses...' : `Bayar ${formatRupiah(isPascabayar ? (inquiry?.totalAmount ?? 0) : selected!.sale)}`}
            </button>
          </div>
        </div>
      )}

      {isPascabayar && selected && !showModal && (
        <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
          <button
            onClick={handleCekTagihan}
            disabled={!noHp || loadingInquiry}
            className="w-full py-4 gradient-primary disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 btn-press shadow-lg"
          >
            {loadingInquiry ? <Loader2 size={18} className="animate-spin" /> : null}
            {loadingInquiry ? 'Mengecek Tagihan...' : 'Cek Tagihan'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProdukKategoriPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 size={28} className="animate-spin text-violet-500" /></div>}>
      <ProdukKategoriContent />
    </Suspense>
  )
}
