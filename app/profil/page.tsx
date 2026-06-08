'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { formatRupiah, formatDate } from '@/lib/utils'
import {
  Smartphone, PlusCircle, Loader2, Receipt, Star, Shield,
  HelpCircle, FileText, LogOut, ChevronRight, Wallet
} from 'lucide-react'

type User = { id: string; nama: string; noHp: string; email: string | null; saldo: number; role: string; createdAt: string }

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setUser(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { label: 'Update Profile', href: '/profil/edit', icon: Smartphone, color: 'text-violet-500 bg-violet-50' },
    { label: 'Riwayat Bonus', href: '/riwayat-bonus', icon: Star, color: 'text-amber-500 bg-amber-50' },
  ]

  const infoMenus = [
    { label: 'Bantuan & FAQ', href: '/support', icon: HelpCircle, color: 'text-sky-500 bg-sky-50' },
    { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan', icon: FileText, color: 'text-gray-500 bg-gray-100' },
    { label: 'Kebijakan Privasi', href: '/kebijakan-privasi', icon: Shield, color: 'text-emerald-500 bg-emerald-50' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 size={28} className="animate-spin text-violet-500" />
    </div>
  )

  const saldo = user?.saldo ?? 0
  const initial = user?.nama.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-24 text-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/[0.04] rounded-full" />
        <div className="absolute top-8 right-16 w-20 h-20 bg-white/[0.06] rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 gradient-dark rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/20">
              {initial}
            </div>
            {user?.role === 'ADMIN' && (
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg">
                <Star size={14} fill="white" className="text-white" strokeWidth={0} />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold">{user?.nama}</h2>
          <p className="text-white/60 text-sm mt-0.5 font-medium">{user?.noHp}</p>
          {user?.role === 'ADMIN' && (
            <div className="mt-2 flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 px-3 py-1 rounded-full">
              <Shield size={11} className="text-amber-300" />
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">Administrator</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-14 relative z-10 space-y-3.5">
        {/* Saldo */}
        <div className="bg-white rounded-2xl p-5 card-shadow border border-white/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Saldo Aktif</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(saldo)}</p>
            </div>
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Wallet size={22} className="text-white" />
            </div>
          </div>
          <button onClick={() => router.push('/topup')}
            className="w-full py-3 gradient-primary text-white text-sm font-bold rounded-xl shadow-md shadow-violet-500/20 btn-press flex items-center justify-center gap-2">
            <PlusCircle size={15} /> Top Up Saldo
          </button>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl card-shadow border border-white/80 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {menuItems.map(({ label, href, icon: Icon, color }) => (
              <button key={href} onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 active:bg-gray-100 transition-colors btn-press">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-700 text-left">{label}</span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl card-shadow border border-white/80 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {infoMenus.map(({ label, href, icon: Icon, color }) => (
              <button key={label} onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors btn-press">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-700 text-left">{label}</span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} disabled={loggingOut}
          className="w-full py-4 bg-white border-2 border-red-100 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 btn-press card-shadow disabled:opacity-60">
          {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          {loggingOut ? 'Keluar...' : 'Keluar dari Akun'}
        </button>

        <p className="text-center text-[11px] text-gray-300 font-medium pb-2">
          Japri Pay v1.0 · Aman & Terpercaya 🔒
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
