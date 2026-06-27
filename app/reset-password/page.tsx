'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react'

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!token) return setError('Tautan reset password tidak valid')
    if (password.length < 8) return setError('Password minimal 8 karakter')
    if (password !== confirmation) return setError('Konfirmasi password tidak cocok')
    setLoading(true)
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
    })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok) return setError(data.error || 'Reset password gagal')
    setSuccess(data.message)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Lock size={22} /></div>
        <h1 className="text-2xl font-bold text-gray-900">Buat password baru</h1>
        <p className="mt-2 text-sm text-gray-500">Gunakan minimal 8 karakter yang sulit ditebak.</p>
        {success ? (
          <div className="mt-6 space-y-4"><p className="flex gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 size={17} />{success}</p><Link href="/login" className="gradient-primary block rounded-xl py-3.5 text-center font-bold text-white">Masuk Sekarang</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {[
              { label: 'Password baru', value: password, set: setPassword, visible: showPassword, toggle: setShowPassword },
              { label: 'Konfirmasi password', value: confirmation, set: setConfirmation, visible: showConfirmation, toggle: setShowConfirmation },
            ].map(field => (
              <label key={field.label} className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{field.label}</span>
                <div className="relative">
                  <input type={field.visible ? 'text' : 'password'} required value={field.value} onChange={event => field.set(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-11 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
                  <button type="button" onClick={() => field.toggle(value => !value)} aria-label={field.visible ? `Sembunyikan ${field.label}` : `Tampilkan ${field.label}`} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {field.visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            ))}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
            <button disabled={loading} className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white disabled:opacity-60">{loading && <Loader2 size={17} className="animate-spin" />}{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</button>
          </form>
        )}
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><ResetPasswordForm /></Suspense>
}
