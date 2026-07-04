'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function AdminLogout() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  return <button type="button" onClick={logout} disabled={pending} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-50"><LogOut size={16} /> {pending ? 'Keluar…' : 'Keluar'}</button>
}
