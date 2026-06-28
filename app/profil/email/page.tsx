'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react'

type Account = { email: string | null; emailVerified: boolean }

export default function UpdateEmailPage() {
  const router = useRouter()
  const [account, setAccount] = useState<Account | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data) {
          setAccount(data)
          setEmail(data.email || '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setMessage(null)
    try {
      const response = await fetch('/api/auth/email-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => ({}))
      setMessage({ type: response.ok ? 'success' : 'error', text: data.message || data.error || 'Permintaan gagal' })
    } catch {
      setMessage({ type: 'error', text: 'Tidak dapat terhubung ke server' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <main className="min-h-screen grid place-items-center bg-slate-50"><Loader2 className="animate-spin text-violet-600" /></main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="gradient-primary px-5 pb-7 pt-12 text-white">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-white/70"><ArrowLeft size={16} /> Kembali</button>
        <h1 className="text-xl font-bold">Verifikasi Email</h1>
        <p className="mt-1 text-sm text-white/70">Aktifkan email yang benar untuk login dan pemulihan akun.</p>
      </header>

      <section className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className={`flex gap-3 rounded-2xl border p-4 ${account?.emailVerified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          {account?.emailVerified ? <ShieldCheck className="shrink-0 text-emerald-600" /> : <Mail className="shrink-0 text-amber-600" />}
          <div>
            <p className="text-sm font-bold text-gray-900">{account?.emailVerified ? 'Email sudah aktif' : 'Email belum diverifikasi'}</p>
            <p className="mt-1 break-all text-xs text-gray-600">Email saat ini: {account?.email || 'Belum ada'}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 card-shadow">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Email baru yang aktif</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@email.com" className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">Email akun tidak langsung berubah. Buka kotak masuk email baru dan klik tautan verifikasi dalam 30 menit.</p>
          </div>

          {message && <div className={`flex gap-2 rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{message.type === 'success' && <CheckCircle2 size={17} className="shrink-0" />}{message.text}</div>}

          <button disabled={sending} className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white disabled:opacity-60">
            {sending ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
            {sending ? 'Mengirim...' : 'Kirim Tautan Verifikasi'}
          </button>
        </form>
      </section>
    </main>
  )
}
