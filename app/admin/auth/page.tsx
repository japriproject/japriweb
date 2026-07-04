'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, portal: 'admin' }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? 'Login admin gagal')
        return
      }

      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-auto bg-slate-950 px-5 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-7 shadow-2xl shadow-black/40 backdrop-blur sm:p-9">
        <div className="mb-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-950/60">
            <ShieldCheck size={25} />
          </div>
          <p className="text-sm font-semibold text-violet-400">Japri Pay</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Login admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Masuk dengan akun administrator untuk mengelola operasional.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Email atau nomor HP</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 focus-within:border-violet-500">
              <UserRound size={18} className="text-slate-500" />
              <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="username" placeholder="admin@domain.com" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 focus-within:border-violet-500">
              <LockKeyhole size={18} className="text-slate-500" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Masukkan password" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 hover:text-slate-300" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
            {pending && <Loader2 size={18} className="animate-spin" />}
            {pending ? 'Memeriksa...' : 'Masuk ke admin'}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-slate-600">Area terbatas untuk administrator Japri Pay.</p>
      </section>
    </main>
  )
}
