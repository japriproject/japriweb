'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { formatRupiah } from '@/lib/utils'
import {
  ChevronRight, FileText, HelpCircle, Loader2, LogOut, Mail,
  PlusCircle, Shield, Smartphone, Star, Users, Wallet,
} from 'lucide-react'

type User = {
  id: string
  nama: string
  noHp: string
  email: string | null
  emailVerified: boolean
  saldo: number
  role: string
  createdAt: string
}

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.id) setUser(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7fb]">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  )

  const menuItems = [
    { label: 'Edit profil', description: 'Nama, nomor HP, dan data akun', href: '/profil/edit', icon: Smartphone, color: 'bg-violet-100 text-violet-600' },
    { label: user?.emailVerified ? 'Email terverifikasi' : 'Verifikasi email', description: user?.email || 'Tambahkan keamanan akun', href: '/profil/email', icon: Mail, color: user?.emailVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600' },
    { label: 'Mitra saya', description: 'Lihat jaringan mitra level 1–5', href: '/mitra', icon: Users, color: 'bg-sky-100 text-sky-600' },
    { label: 'Riwayat bonus', description: 'Cek bonus yang sudah diterima', href: '/riwayat-bonus', icon: Star, color: 'bg-amber-100 text-amber-600' },
  ]
  const infoMenus = [
    { label: 'Bantuan & FAQ', description: 'Pusat bantuan Japri Pay', href: '/support', icon: HelpCircle, color: 'bg-blue-100 text-blue-600' },
    { label: 'Syarat & ketentuan', description: 'Ketentuan penggunaan layanan', href: '/syarat-ketentuan', icon: FileText, color: 'bg-slate-100 text-slate-600' },
    { label: 'Kebijakan privasi', description: 'Cara kami melindungi data Anda', href: '/kebijakan-privasi', icon: Shield, color: 'bg-emerald-100 text-emerald-600' },
  ]
  const initial = user?.nama.charAt(0).toUpperCase() ?? '?'

  const renderMenu = (items: typeof menuItems) => (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
      {items.map(({ label, description, href, icon: Icon, color }, index) => (
        <button key={href} onClick={() => router.push(href)}
          className={`btn-press flex min-h-[72px] w-full items-center gap-4 px-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${index ? 'border-t border-gray-100' : ''}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-gray-300" />
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7fb] safe-pb">
      <header className="gradient-primary relative overflow-hidden px-5 pb-7 pt-12 text-white">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.05]" />
        <div className="relative z-10">
          <h1 className="mb-6 text-xl font-bold">Profil</h1>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="gradient-dark flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/25 text-2xl font-bold shadow-lg">{initial}</div>
              {user?.role === 'ADMIN' && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 ring-2 ring-violet-600">
                  <Star size={12} fill="white" strokeWidth={0} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold">{user?.nama}</h2>
              <p className="mt-0.5 text-sm font-medium text-white/70">{user?.noHp}</p>
              {user?.role === 'ADMIN' && <span className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Administrator</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 py-5 pb-24">
        <div className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Wallet size={22} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500">Saldo aktif</p>
            <p className="mt-0.5 truncate text-xl font-bold text-gray-900">{formatRupiah(user?.saldo ?? 0)}</p>
          </div>
          <button onClick={() => router.push('/topup')} className="btn-press flex min-h-11 items-center gap-1.5 rounded-full bg-violet-600 px-4 text-sm font-bold text-white shadow-md shadow-violet-200">
            <PlusCircle size={16} /> Isi
          </button>
        </div>

        <section>
          <h3 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">Akun</h3>
          {renderMenu(menuItems)}
        </section>

        <section>
          <h3 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">Informasi</h3>
          {renderMenu(infoMenus)}
        </section>

        <div className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
          <button onClick={handleLogout} disabled={loggingOut} className="btn-press flex min-h-14 w-full items-center gap-4 px-4 text-left text-red-600 active:bg-red-50 disabled:opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            </div>
            <span className="flex-1 text-sm font-semibold">{loggingOut ? 'Keluar...' : 'Keluar dari akun'}</span>
          </button>
        </div>
        <p className="pb-2 text-center text-[11px] font-medium text-gray-300">Japri Pay v1.0</p>
      </main>
      <BottomNav />
    </div>
  )
}
