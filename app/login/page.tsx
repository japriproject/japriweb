'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, Lock, Eye, EyeOff, Zap, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone')
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    setLoading(false)
    if (!res.ok) return setError(data.error ?? 'Terjadi kesalahan, coba lagi')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top decoration */}
      <div className="gradient-primary px-6 pt-16 pb-14 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-5 border border-white/20">
            <Zap size={28} fill="white" strokeWidth={0} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Masuk ke Akun</h1>
          <p className="text-white/60 text-sm mt-1.5 font-medium">Top up pulsa lebih mudah & cepat</p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5 -mt-5 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
              <button type="button" onClick={() => { setLoginType('phone'); setForm(f => ({ ...f, identifier: '' })) }} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${loginType === 'phone' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}>
                <Phone size={15} /> Nomor HP
              </button>
              <button type="button" onClick={() => { setLoginType('email'); setForm(f => ({ ...f, identifier: '' })) }} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${loginType === 'email' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}>
                <Mail size={15} /> Email
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{loginType === 'phone' ? 'Nomor HP' : 'Email'}</label>
              <div className="relative">
                {loginType === 'phone' ? <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /> : <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />}
                <input
                  type={loginType === 'phone' ? 'tel' : 'email'} placeholder={loginType === 'phone' ? '08xxxxxxxxxx atau 628xxxxxxxxxx' : 'email@contoh.com'} required
                  value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-violet-600 hover:text-violet-700">Lupa password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Masukkan password" required
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-sm font-medium transition-all"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 gradient-primary text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-60 disabled:scale-100 mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">atau</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link href="/register" className="text-violet-600 font-bold hover:text-violet-700">Daftar Gratis</Link>
          </p>
        </div>


      </div>
      <div className="h-8" />
    </div>
  )
}
