'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Loader2, Save, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'

type UserData = { id: string; nama: string; noHp: string; email: string | null; emailVerified: boolean; createdAt: string }

export default function UpdateProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nama: '', email: '', oldPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.id) {
          setUser(d)
          setForm({ ...form, nama: d.nama, email: d.email || '' })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (form.newPassword || form.oldPassword || form.confirmPassword) {
      if (!form.oldPassword) return setMessage({ type: 'error', text: 'Password lama harus diisi' })
      if (!form.newPassword) return setMessage({ type: 'error', text: 'Password baru harus diisi' })
      if (form.newPassword.length < 6) return setMessage({ type: 'error', text: 'Password minimal 6 karakter' })
      if (form.newPassword !== form.confirmPassword) return setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' })
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui' })
        setTimeout(() => router.push('/profil'), 1500)
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Gagal memperbarui profil' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium hover:text-white transition-colors">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Update Profile</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4 pb-20">
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100/80 space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Informasi Akun</p>
              <p className="text-xs text-gray-500 mt-0.5">Update data profil Anda</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nomor HP</label>
              <input
                type="text"
                value={user?.noHp || ''}
                disabled
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1.5">Nomor HP tidak dapat diubah</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nama Lengkap</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  disabled
                  placeholder="email@example.com"
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-500"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className={`text-xs font-medium ${user?.emailVerified ? 'text-emerald-600' : 'text-amber-600'}`}>{user?.emailVerified ? 'Email sudah terverifikasi' : 'Email belum terverifikasi'}</p>
                <button type="button" onClick={() => router.push('/profil/email')} className="text-xs font-bold text-violet-600">Ubah & Verifikasi</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100/80 space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Ubah Password</p>
              <p className="text-xs text-gray-500 mt-0.5">Kosongkan jika tidak ingin mengubah</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Password Lama</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={form.oldPassword}
                  onChange={e => setForm({ ...form, oldPassword: e.target.value })}
                  placeholder="Masukkan password lama"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Password Baru</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Ulangi password baru"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 gradient-primary text-white font-bold rounded-2xl shadow-md shadow-violet-500/20 btn-press flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="/support"
              className="py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl text-center hover:bg-gray-200 transition-colors"
            >
              Bantuan & FAQ
            </a>
            <a
              href="/syarat-ketentuan"
              className="py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl text-center hover:bg-gray-200 transition-colors"
            >
              Syarat & Ketentuan
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
