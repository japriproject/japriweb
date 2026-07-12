'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import MobileTopBar from '@/components/MobileTopBar'
import CustomerInput from '@/components/CustomerInput'
import { formatRupiah } from '@/lib/utils'
import {
  Zap, CreditCard, Droplets, Phone, Tv, Receipt,
  Wifi, ShoppingBag, CheckCircle2, Loader2, AlertCircle, Search,
} from 'lucide-react'

type ProdukPasca = { id: string; nama: string; hargaJual: number; operator: string; kategori: string }
type InquiryResult = {
  refId: string
  inquiryToken: string
  customerName: string | null
  billCount: number | null
  admin: number
  providerAmount: number
  margin: number
  totalAmount: number
  message: string
}

type TipePasca = {
  key: string; label: string
  icon: React.ComponentType<{ size: number; className?: string; strokeWidth?: number }>
  color: string; bg: string; gradient: string; placeholder: string; inputLabel: string; desc: string
}

const TIPE_LIST: TipePasca[] = [
  { key: 'pln', label: 'PLN Postpaid', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', gradient: 'from-yellow-500 to-orange-500', placeholder: '123456789012', inputLabel: 'ID Pelanggan', desc: 'Tagihan Listrik' },
  { key: 'bpjs', label: 'BPJS Kesehatan', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50', gradient: 'from-green-500 to-emerald-600', placeholder: '0001234567890', inputLabel: 'Nomor VA BPJS', desc: 'Asuransi Kesehatan' },
  { key: 'pdam', label: 'PDAM', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', gradient: 'from-cyan-500 to-blue-500', placeholder: '123456789', inputLabel: 'Nomor Pelanggan', desc: 'Air Bersih' },
  { key: 'telkom', label: 'IndiHome', icon: Phone, color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-500 to-pink-500', placeholder: '02112345678', inputLabel: 'Nomor Telepon', desc: 'Telkom IndiHome' },
  { key: 'tv', label: 'TV Kabel', icon: Tv, color: 'text-pink-600', bg: 'bg-pink-50', gradient: 'from-pink-500 to-rose-500', placeholder: '1234567890', inputLabel: 'ID Pelanggan', desc: 'Berlangganan TV' },
  { key: 'cicilan', label: 'Cicilan', icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50', gradient: 'from-orange-500 to-amber-500', placeholder: '1234567890', inputLabel: 'Nomor Kontrak', desc: 'Angsuran Kredit' },
  { key: 'internet', label: 'Internet', icon: Wifi, color: 'text-indigo-600', bg: 'bg-indigo-50', gradient: 'from-indigo-500 to-violet-500', placeholder: '02112345678', inputLabel: 'Nomor Pelanggan', desc: 'Broadband / ISP' },
  { key: 'lainnya', label: 'Lainnya', icon: ShoppingBag, color: 'text-gray-600', bg: 'bg-gray-100', gradient: 'from-gray-500 to-gray-600', placeholder: '1234567890', inputLabel: 'ID / Nomor', desc: 'Tagihan Lainnya' },
]

const BRANDS_BY_TIPE: Record<string, string[]> = {
  pln: ['PLN'],
  bpjs: ['BPJS Kesehatan'],
  pdam: ['PDAM Jakarta', 'PDAM Surabaya', 'PDAM Bandung', 'PDAM Medan'],
  telkom: ['IndiHome', 'Telkom'],
  tv: ['MNC Vision', 'First Media', 'Transvision', 'Nexmedia'],
  cicilan: ['Adira Finance', 'FIF', 'BAF', 'WOM Finance', 'OTO'],
  internet: ['Biznet', 'MyRepublic', 'CBN', 'Iconnet', 'FirstMedia'],
  lainnya: [],
}

function PascabayarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipeParam = searchParams.get('tipe') ?? ''
  const brandParam = searchParams.get('brand') ?? ''

  const [activeTipe, setActiveTipe] = useState<TipePasca>(
    TIPE_LIST.find(t => t.key === tipeParam) ?? TIPE_LIST[0]
  )
  const [brand, setBrand] = useState(brandParam)
  const [idPelanggan, setIdPelanggan] = useState('')
  const [produks, setProduks] = useState<ProdukPasca[]>([])
  const [selected, setSelected] = useState<ProdukPasca | null>(null)
  const [loadProduk, setLoadProduk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [produkError, setProdukError] = useState('')
  const [saldo, setSaldo] = useState(0)
  const [step, setStep] = useState<'form' | 'konfirmasi'>('form')
  const [inquiry, setInquiry] = useState<InquiryResult | null>(null)

  const brands = BRANDS_BY_TIPE[activeTipe.key] ?? []
  const brandQuery = brand || brands[0] || activeTipe.label

  useEffect(() => {
    fetch('/api/saldo').then(r => r.ok ? r.json() : { saldo: 0 }).then(d => setSaldo(d.saldo ?? 0))
  }, [])

  useEffect(() => {
    if (brands.length === 1 && brand !== brands[0]) {
      setBrand(brands[0])
      return
    }

    if (brands.length > 1 && brand && !brands.includes(brand)) {
      setBrand('')
      return
    }

    if (!brandQuery) {
      setProduks([])
      setSelected(null)
      return
    }

    let cancelled = false

    async function fetchProduk() {
      setLoadProduk(true)
      setProdukError('')

      try {
        const res = await fetch(`/api/produk?type=pasca&kategori=${activeTipe.key.toUpperCase()}&brand=${encodeURIComponent(brandQuery)}`)
        const data = await res.json()
        const list: ProdukPasca[] = Array.isArray(data) ? data : []

        if (cancelled) return

        setProduks(list)
        setSelected((current) => list.find(item => item.id === current?.id) ?? null)

        if (list.length === 0) {
          setProdukError('Produk tidak tersedia untuk layanan ini')
        }
      } catch {
        if (!cancelled) {
          setProduks([])
          setSelected(null)
          setProdukError('Gagal memuat pilihan produk')
        }
      } finally {
        if (!cancelled) {
          setLoadProduk(false)
        }
      }
    }

    fetchProduk()

    return () => {
      cancelled = true
    }
  }, [activeTipe, brand, brandQuery, brands])

  function resetFormState(nextBrand = '') {
    setBrand(nextBrand)
    setStep('form')
    setSelected(null)
    setInquiry(null)
    setError('')
    setProdukError('')
  }

  async function handleLanjut() {
    if (!idPelanggan.trim()) return setError('Masukkan nomor/ID pelanggan')
    if (brands.length > 1 && !brand) return setError('Pilih penyedia layanan')
    if (!selected) return setError('Pilih name produk sesuai brand yang dipilih')
    setError('')
    setLoading(true)
    setInquiry(null)
    try {
      const response = await fetch('/api/pascabayar/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produkId: selected.id, nomorPelanggan: idPelanggan.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? 'Gagal mengecek tagihan')
      setInquiry(data)
      setStep('konfirmasi')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengecek tagihan')
    } finally {
      setLoading(false)
    }
  }

  async function handleBayar() {
    if (!selected || !inquiry) return setError('Cek tagihan terlebih dahulu')
    setError('')
    setLoading(true)
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produkId: selected.id, nomorTujuan: idPelanggan.trim(), productType: 'pasca', inquiryToken: inquiry.inquiryToken }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    const data = await res.json()
    router.push(`/transaksi/${data.id}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      <MobileTopBar title="Bayar Tagihan" subtitle="Pascabayar · Cek & bayar"
        trailing={<span className="rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">{formatRupiah(saldo)}</span>} />

      <div className="flex-1 px-4 py-4 space-y-3.5">
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pilih Layanan</p>
          <div className="grid grid-cols-4 gap-2">
            {TIPE_LIST.map(t => {
              const active = activeTipe.key === t.key
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTipe(t)
                    resetFormState('')
                    setProduks([])
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all btn-press ${active ? 'border-violet-500 bg-violet-50' : 'border-transparent bg-gray-50'}`}
                >
                  <div className={`w-9 h-9 ${active ? 'bg-violet-100' : t.bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={17} className={active ? 'text-violet-600' : t.color} strokeWidth={1.8} />
                  </div>
                  <span className={`text-[10px] font-bold leading-tight text-center ${active ? 'text-violet-600' : 'text-gray-500'}`}>
                    {t.label.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r ${activeTipe.gradient} rounded-2xl text-white`}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
            <activeTipe.icon size={20} strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-sm">{activeTipe.label}</p>
            <p className="text-white/70 text-xs">{activeTipe.desc}</p>
          </div>
        </div>

        {brands.length > 1 && (
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Penyedia Layanan</p>
            <div className="grid grid-cols-2 gap-2">
              {brands.map(b => (
                <button
                  key={b}
                  onClick={() => resetFormState(b)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all btn-press text-left ${brand === b ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        <CustomerInput
          value={idPelanggan}
          onChange={value => { setIdPelanggan(value); setStep('form'); setInquiry(null); setError('') }}
          label={activeTipe.inputLabel}
          placeholder={activeTipe.placeholder}
          inputMode="numeric"
        />

        <div className="bg-white rounded-2xl card-shadow border border-gray-100/80 overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pilih Name</p>
              <p className="text-xs text-gray-400 mt-1">Pilihan mengikuti brand yang sedang aktif</p>
            </div>
            {loadProduk ? <Loader2 size={16} className="animate-spin text-violet-500" /> : null}
          </div>

          {loadProduk ? (
            <div className="px-4 pb-4 text-sm text-gray-500">Memuat pilihan produk...</div>
          ) : produks.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {produks.map(p => {
                const active = selected?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p)
                      setStep('form')
                      setInquiry(null)
                      setError('')
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 transition-all text-left btn-press ${active ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-violet-500' : activeTipe.bg}`}>
                        <activeTipe.icon size={17} className={active ? 'text-white' : activeTipe.color} strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.nama}</p>
                        <p className="text-xs text-gray-400">{p.operator}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${active ? 'text-violet-600' : 'text-gray-700'}`}>{formatRupiah(p.hargaJual)}</p>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 pb-4 text-sm text-gray-500">
              {produkError || 'Belum ada produk untuk brand ini'}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 fade-in">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 'form' && (
          <button
            onClick={handleLanjut}
            disabled={loadProduk || loading || !idPelanggan || !selected}
            className={`w-full py-4 bg-gradient-to-r ${activeTipe.gradient} text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-40 disabled:pointer-events-none shadow-lg`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? 'Mengecek tagihan...' : 'Cek Tagihan'}
          </button>
        )}

        {step === 'konfirmasi' && selected && inquiry && (
          <>
            <div className="bg-violet-50 border border-violet-200/60 rounded-2xl p-4 space-y-3 slide-up">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-violet-500" />
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Konfirmasi Pembayaran</p>
              </div>
              {[
                ['Layanan', activeTipe.label],
                ['Name', selected!.nama],
                [activeTipe.inputLabel, idPelanggan],
                ['Nama Pelanggan', inquiry.customerName || '-'],
                ['Penyedia', selected!.operator],
                ['Nomor Invoice', inquiry.refId],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm gap-3">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-violet-200/60"><span className="text-gray-500">Tagihan Provider</span><span className="font-semibold text-gray-800">{formatRupiah(inquiry.providerAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Margin</span><span className="font-semibold text-gray-800">{formatRupiah(inquiry.margin)}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t border-violet-200/60">
                <span className="text-gray-500">Total Bayar</span>
                <span className="font-bold text-violet-600 text-base">{formatRupiah(inquiry.totalAmount)}</span>
              </div>
              {saldo < inquiry.totalAmount && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">
                    Saldo tidak cukup.{' '}
                    <Link href="/topup" className="font-bold underline">Top Up</Link>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-3.5 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 btn-press text-sm"
              >
                Kembali
              </button>
              <button
                onClick={handleBayar}
                disabled={loading || saldo < inquiry.totalAmount}
                className={`flex-1 py-3.5 bg-gradient-to-r ${activeTipe.gradient} text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg btn-press disabled:opacity-40 disabled:pointer-events-none text-sm`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Memproses...' : `Bayar ${formatRupiah(inquiry.totalAmount)}`}
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default function PascabayarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-violet-500" />
      </div>
    }>
      <PascabayarContent />
    </Suspense>
  )
}
