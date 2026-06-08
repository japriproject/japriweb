'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, UserPlus, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nama: '', noHp: '', email: '', password: '', konfirmasi: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.konfirmasi) return setError('Konfirmasi password tidak cocok')
    if (form.password.length < 8) return setError('Password minimal 8 karakter')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: form.nama, noHp: form.noHp, email: form.email, password: form.password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    router.push('/dashboard')
    router.refresh()
  }

  const fields = [
    { key: 'nama', label: 'Nama Lengkap', type: 'text', placeholder: 'John Doe', icon: User },
    { key: 'noHp', label: 'Nomor HP', type: 'tel', placeholder: '08xxxxxxxxxx', icon: Phone },
    { key: 'email', label: 'Email (opsional)', type: 'email', placeholder: 'email@contoh.com', icon: Mail },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="gradient-primary px-6 pt-12 pb-10 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/60 text-sm font-medium mb-5 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
          <p className="text-white/60 text-sm mt-1.5 font-medium">Daftar gratis & mulai top up sekarang</p>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-5 relative z-10 pb-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder, icon: Icon }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={type} placeholder={placeholder}
                    required={key !== 'email'}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-sm font-medium transition-all"
                  />
                </div>
              </div>
            ))}

            {(['password', 'konfirmasi'] as const).map(key => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {key === 'password' ? 'Password' : 'Konfirmasi Password'}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder={key === 'password' ? 'Min. 8 karakter' : 'Ulangi password'}
                    required value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-sm font-medium transition-all"
                  />
                  {key === 'password' && (
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">atau</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-violet-600 font-bold hover:text-violet-700">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
