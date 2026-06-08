'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { formatRupiah } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Wallet, Home, QrCode, Building2, ChevronDown, Copy } from 'lucide-react'

const NOMINAL = [10000, 20000, 50000, 100000, 200000, 500000]
const ADMIN_FEE = 3500
const UNIQUE_CODE_MIN = 300
const UNIQUE_CODE_MAX = 499

type PaymentMethod = {
  value: string
  code: string
  label: string
  description: string
  icon: string
  automatic: boolean
  bankName: string
  accountNumber: string
}

type PaymentResponse = {
  invoice: string
  reference?: string
  paymentUrl?: string
  nominal: number
  biayaLayanan: number
  kodeUnik?: number
  totalTransfer: number
  metode: string
  qrCode?: string
  qrUrl?: string
  expired?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  status: string
}

function getMethodIcon(method: PaymentMethod) {
  return method.automatic ? QrCode : Building2
}

export default function TopupPage() {
  const router = useRouter()
  const [nominal, setNominal] = useState(0)
  const [customNominal, setCustomNominal] = useState('')
  const [metode, setMetode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showMetodeDropdown, setShowMetodeDropdown] = useState(false)
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [kodeUnik, setKodeUnik] = useState(0)

  const finalNominal = nominal || parseInt(customNominal.replace(/\D/g, '')) || 0
  const selectedMethod = useMemo(() => paymentMethods.find((item) => item.value === metode) || null, [paymentMethods, metode])

  useEffect(() => {
    fetch('/api/topup')
      .then(r => r.ok ? r.json() : { methods: [] })
      .then(d => setPaymentMethods(Array.isArray(d?.methods) ? d.methods : []))
      .finally(() => setLoadingMethods(false))
  }, [])

  useEffect(() => {
    if (finalNominal >= 10000 && metode) {
      setKodeUnik((current) => current || (Math.floor(Math.random() * 200) + 300))
      return
    }
    setKodeUnik(0)
  }, [finalNominal, metode])

  async function handleTopup() {
    if (finalNominal < 10000) return setError('Minimal top up Rp 10.000')
    if (!metode) return setError('Pilih metode pembayaran')
    setError('')
    setLoading(true)
    const res = await fetch('/api/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jumlah: finalNominal, metode, kodeUnik }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      return setError(d?.error || 'Top up gagal dibuat')
    }
    const data = await res.json()
    setPaymentData(data)
    setSuccess(true)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrImageUrl = paymentData?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(paymentData.qrCode)}`
    : paymentData?.qrUrl
      ? paymentData.qrUrl
    : null

  if (success && paymentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 bg-slate-50">
        <div className="bg-white rounded-3xl p-8 card-shadow border border-gray-100 w-full fade-in">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet size={40} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">Menunggu Pembayaran</h2>
          <p className="text-gray-500 text-sm mt-1 text-center">Silakan lakukan pembayaran</p>

          <div className="mt-5 pt-5 border-t border-gray-50 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nominal</span>
              <span className="font-bold text-gray-900">{formatRupiah(paymentData.nominal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Biaya Tambahan</span>
              <span className="font-semibold text-gray-700">{formatRupiah(paymentData.biayaLayanan + (paymentData.kodeUnik ?? 0))}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-700 font-semibold">Total Transfer</span>
              <span className="font-bold text-emerald-600 text-base">{formatRupiah(paymentData.totalTransfer)}</span>
            </div>
          </div>

          {paymentData.bankName && (
            <div className="mt-5 space-y-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Bank</p>
                <p className="text-sm font-bold text-gray-900">{paymentData.bankName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Nomor Rekening</p>
                    <p className="text-sm font-bold text-gray-900 break-all">{paymentData.accountNumber}</p>
                  </div>
                  {paymentData.accountNumber ? (
                    <button onClick={() => handleCopy(paymentData.accountNumber!)} className="ml-2 p-2 bg-emerald-50 rounded-lg shrink-0">
                      {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} className="text-emerald-600" />}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Atas Nama</p>
                <p className="text-sm font-bold text-gray-900">{paymentData.accountName}</p>
              </div>
            </div>
          )}

          {paymentData.qrCode && (
            <div className="mt-5 bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pembayaran QRIS</p>
              {qrImageUrl && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
                  <img
                    src={qrImageUrl}
                    alt="QRIS pembayaran top up"
                    className="w-full max-w-[280px] mx-auto rounded-xl"
                  />
                </div>
              )}
              {paymentData.reference && (
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">Reference</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{paymentData.reference}</p>
                  </div>
                  <button onClick={() => handleCopy(paymentData.reference!)} className="shrink-0 p-2 bg-emerald-50 rounded-lg">
                    {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} className="text-emerald-600" />}
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">
                Scan QRIS di atas untuk menyelesaikan pembayaran.
              </p>
            </div>
          )}

          {!paymentData.qrCode && paymentData.paymentUrl && (
            <div className="mt-5 bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pembayaran QRIS</p>
              {paymentData.reference && (
                <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">Reference</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{paymentData.reference}</p>
                  </div>
                  <button onClick={() => handleCopy(paymentData.reference!)} className="shrink-0 p-2 bg-emerald-50 rounded-lg">
                    {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} className="text-emerald-600" />}
                  </button>
                </div>
              )}
              <a href={paymentData.paymentUrl} className="block w-full py-3.5 gradient-success text-white text-center font-bold rounded-xl shadow-lg shadow-emerald-500/25 btn-press">
                Buka Halaman Pembayaran
              </a>
            </div>
          )}

          <button onClick={() => router.push('/dashboard')} className="w-full mt-6 py-3.5 gradient-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 btn-press">
            <Home size={17} /> Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      <div className="gradient-success px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-slate-50 rounded-t-3xl" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Top Up Saldo</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Isi saldo untuk bertransaksi</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5">
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Pilih Nominal</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {NOMINAL.map(n => (
              <button
                key={n}
                onClick={() => { setNominal(n); setCustomNominal('') }}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all btn-press border-2 ${
                  nominal === n
                    ? 'gradient-success text-white border-transparent shadow-md shadow-emerald-500/20'
                    : 'border-gray-100 bg-gray-50 text-gray-600'
                }`}
              >
                {formatRupiah(n)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nominal lain (min. Rp 10.000)"
              value={nominal > 0 ? formatRupiah(nominal) : customNominal}
              onChange={e => { setCustomNominal(e.target.value); setNominal(0) }}
              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-medium transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5">Metode Pembayaran</label>
          <div className="relative">
            <button
              onClick={() => setShowMetodeDropdown(!showMetodeDropdown)}
              disabled={loadingMethods}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-left text-sm font-medium hover:border-emerald-300 transition-all disabled:opacity-60"
            >
              {selectedMethod ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getMethodIcon(selectedMethod)
                    return <Icon size={16} className="text-emerald-600" />
                  })()}
                  <span className="text-gray-900">{selectedMethod.label}</span>
                </div>
              ) : (
                <span className="text-gray-400">{loadingMethods ? 'Memuat metode pembayaran...' : 'Pilih metode pembayaran'}</span>
              )}
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showMetodeDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showMetodeDropdown && paymentMethods.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                {paymentMethods.map(method => {
                  const Icon = getMethodIcon(method)
                  return (
                    <button
                      key={method.value}
                      onClick={() => {
                        setMetode(method.value)
                        setShowMetodeDropdown(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        metode === method.value ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} className={metode === method.value ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${metode === method.value ? 'text-emerald-600' : 'text-gray-800'}`}>{method.label}</p>
                        <p className="text-[10px] text-gray-500">{method.description}</p>
                      </div>
                      {metode === method.value ? <CheckCircle2 size={16} className="text-emerald-500" /> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 fade-in">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {finalNominal >= 10000 && selectedMethod && (
          <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 space-y-2.5 slide-up">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Ringkasan Top Up
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nominal</span>
              <span className="font-bold text-emerald-600 text-base">{formatRupiah(finalNominal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Biaya Sistem</span>
              <span className="font-semibold text-gray-800">{formatRupiah(ADMIN_FEE + kodeUnik)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-emerald-200/60">
              <span className="text-gray-700 font-semibold">Total Transfer</span>
              <span className="font-bold text-emerald-600">{formatRupiah(finalNominal + ADMIN_FEE + kodeUnik)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Metode</span>
              <span className="font-semibold text-gray-800">{selectedMethod.label}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        <button
          onClick={handleTopup}
          disabled={finalNominal < 10000 || !metode || loading || loadingMethods}
          className="w-full py-4 gradient-success disabled:bg-gray-100 disabled:shadow-none disabled:text-gray-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 btn-press disabled:pointer-events-none"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Memproses...' : finalNominal >= 10000 ? `Top Up ${formatRupiah(finalNominal)}` : 'Top Up Sekarang'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
