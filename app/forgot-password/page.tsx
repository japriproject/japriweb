'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok) return setError(data.error || 'Permintaan gagal')
    setMessage(data.message)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-gray-500"><ArrowLeft size={16} /> Kembali</Link>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Mail size={22} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Lupa password?</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">Masukkan email yang terdaftar. Kami akan mengirim tautan untuk membuat password baru.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="email@contoh.com" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
            {message && <p className="flex gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 size={17} className="shrink-0" />{message}</p>}
            <button disabled={loading} className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white disabled:opacity-60">{loading && <Loader2 size={17} className="animate-spin" />}{loading ? 'Mengirim...' : 'Kirim Tautan Reset'}</button>
          </form>
        </div>
      </div>
    </main>
  )
}
