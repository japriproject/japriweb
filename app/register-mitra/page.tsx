'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Loader2, AlertCircle, CheckCircle2, Phone, Mail, User, Lock } from 'lucide-react'

export default function RegisterMitraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/register-mitra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setLoading(false)

    if (!res.ok) {
      const d = await res.json()
      return setError(d.error || 'Gagal mendaftarkan mitra')
    }

    setSuccess(true)
    setTimeout(() => router.push('/referral'), 2500)
  }

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 bg-slate-50">
      <div className="bg-white rounded-3xl p-8 card-shadow border border-gray-100 w-full max-w-md text-center fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Mitra Berhasil Terdaftar!</h2>
        <p className="text-gray-500 text-sm mt-2">Mitra baru telah ditambahkan</p>
        <p className="text-xs text-gray-400 mt-4">Mengarahkan ke halaman referral...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Daftarkan Mitra</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Tambahkan mitra baru ke jaringan Anda</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-20">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 card-shadow border border-gray-100/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <UserPlus size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Form Pendaftaran</p>
              <p className="text-xs text-gray-500">Isi data mitra dengan lengkap</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama lengkap"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nomor HP</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 btn-press shadow-lg shadow-emerald-500/30 disabled:shadow-none"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? 'Mendaftarkan...' : 'Daftarkan Mitra'}
          </button>
        </form>
      </div>
    </div>
  )
}
