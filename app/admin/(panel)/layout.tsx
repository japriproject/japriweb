import Link from 'next/link'
import { FileText, LayoutDashboard, ReceiptText, Smartphone, Users, WalletCards } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import AdminLogout from './AdminLogout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 lg:overflow-hidden">
      <div className="min-h-screen lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/95 lg:fixed lg:inset-y-0 lg:w-[260px] lg:border-b-0 lg:border-r">
          <div className="flex h-20 items-center gap-3 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-950">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="font-bold tracking-tight">Japri Pay</p>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:pb-0">
            <NavLink href="/admin" label="Ringkasan" icon={<LayoutDashboard size={18} />} />
            <NavLink href="/admin/members" label="Member" icon={<Users size={18} />} />
            <div className="min-w-fit lg:pt-2">
              <p className="hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 lg:block">Produk</p>
              <div className="flex gap-2 lg:block lg:space-y-1">
                <NavLink href="/admin/prabayar" label="Prabayar" icon={<Smartphone size={18} />} nested />
                <NavLink href="/admin/pascabayar" label="Pascabayar" icon={<FileText size={18} />} nested />
              </div>
            </div>
            <div className="min-w-fit lg:pt-2">
              <p className="hidden px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 lg:block">Transaksi</p>
              <div className="flex gap-2 lg:block lg:space-y-1">
                <NavLink href="/admin/transaksi" label="Transaksi" icon={<ReceiptText size={18} />} nested />
                <NavLink href="/admin/topup" label="Top Up" icon={<WalletCards size={18} />} nested />
              </div>
            </div>
          </nav>

          <div className="hidden border-t border-white/10 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
            <p className="truncate text-sm font-semibold">{admin.name}</p>
            <p className="mb-3 truncate text-xs text-slate-500">Administrator</p>
            <AdminLogout />
          </div>
        </aside>
        <main className="min-w-0 lg:col-start-2 lg:h-full lg:overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ href, label, icon, nested = false }: { href: string; label: string; icon: React.ReactNode; nested?: boolean }) {
  return <Link href={href} className={`flex min-w-fit items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white ${nested ? 'px-3 lg:pl-5' : 'px-3'}`}>{icon}{label}</Link>
}
