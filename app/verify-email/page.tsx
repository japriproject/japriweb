'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react'

function VerificationResult() {
  const token = useSearchParams().get('token') || ''
  const requested = useRef(false)
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Memverifikasi email Anda...')

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    if (!token) {
      setState('error')
      setMessage('Tautan verifikasi tidak valid.')
      return
    }

    fetch('/api/auth/email-verification/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async response => ({ ok: response.ok, data: await response.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        setState(ok ? 'success' : 'error')
        setMessage(data.message || data.error || 'Verifikasi email gagal.')
      })
      .catch(() => {
        setState('error')
        setMessage('Tidak dapat terhubung ke server.')
      })
  }, [token])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-7 text-center shadow-xl">
        <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl ${state === 'success' ? 'bg-emerald-100 text-emerald-600' : state === 'error' ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-600'}`}>
          {state === 'loading' ? <Loader2 className="animate-spin" /> : state === 'success' ? <MailCheck /> : <XCircle />}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{state === 'loading' ? 'Verifikasi Email' : state === 'success' ? 'Email Aktif' : 'Verifikasi Gagal'}</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{message}</p>
        {state !== 'loading' && (
          <Link href={state === 'success' ? '/profil' : '/profil/email'} className="gradient-primary mt-6 flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white">
            {state === 'success' && <CheckCircle2 size={17} />}{state === 'success' ? 'Kembali ke Profil' : 'Kirim Tautan Baru'}
          </Link>
        )}
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="min-h-screen grid place-items-center bg-slate-50"><Loader2 className="animate-spin text-violet-600" /></main>}><VerificationResult /></Suspense>
}
