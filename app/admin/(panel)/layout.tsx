import Link from 'next/link'
import type { Viewport } from 'next'
import { FileText, Gift, LayoutDashboard, Network, ReceiptText, Smartphone, Users, WalletCards } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import AdminLogout from './AdminLogout'

export const viewport: Viewport = {
  width: 1200,
  initialScale: 1,
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="admin-shell fixed inset-0 z-50 min-w-[1200px] overflow-hidden bg-slate-950 text-slate-100">
      <div className="grid h-full grid-cols-[260px_minmax(0,1fr)]">
        <aside className="fixed inset-y-0 w-[260px] border-r border-white/10 bg-slate-950/95">
          <div className="flex h-20 items-center gap-3 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-950">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="font-bold tracking-tight">Japri Pay</p>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>

          <nav className="block space-y-1 px-4 pb-0">
            <NavLink href="/admin" label="Ringkasan" icon={<LayoutDashboard size={18} />} />
            <NavLink href="/admin/members" label="Member" icon={<Users size={18} />} />
            <div className="min-w-fit pt-2">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Produk</p>
              <div className="block space-y-1">
                <NavLink href="/admin/prabayar" label="Prabayar" icon={<Smartphone size={18} />} nested />
                <NavLink href="/admin/pascabayar" label="Pascabayar" icon={<FileText size={18} />} nested />
              </div>
            </div>
            <div className="min-w-fit pt-2">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Transaksi</p>
              <div className="block space-y-1">
                <NavLink href="/admin/transaksi" label="History Transactions" icon={<ReceiptText size={18} />} nested />
                <NavLink href="/admin/topup" label="Top Up" icon={<WalletCards size={18} />} nested />
                <NavLink href="/admin/bonus" label="History Bonus" icon={<Gift size={18} />} nested />
              </div>
            </div>
            <div className="min-w-fit pt-2">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Laporan User</p>
              <NavLink href="/admin/user-history" label="History User" icon={<Network size={18} />} nested />
            </div>
          </nav>

          <div className="absolute inset-x-0 bottom-0 block border-t border-white/10 p-4">
            <p className="truncate text-sm font-semibold">{admin.name}</p>
            <p className="mb-3 truncate text-xs text-slate-500">Administrator</p>
            <AdminLogout />
          </div>
        </aside>
        <main className="col-start-2 h-full min-w-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ href, label, icon, nested = false }: { href: string; label: string; icon: React.ReactNode; nested?: boolean }) {
  return <Link href={href} className={`flex min-w-fit items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white ${nested ? 'px-3 pl-5' : 'px-3'}`}>{icon}{label}</Link>
}
