'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gift, Store, Clock, User } from 'lucide-react'

const navs = [
  { href: '/dashboard', label: 'Beranda', icon: Home },
  { href: '/bonus', label: 'Bonus', icon: Gift },
  { href: '/toko', label: 'Toko', icon: Store },
  { href: '/riwayat', label: 'Riwayat', icon: Clock },
  { href: '/profil', label: 'Profil', icon: User },
]

const allowedPaths = ['/dashboard', '/bonus', '/toko', '/riwayat', '/profil']

export default function BottomNav() {
  const pathname = usePathname()
  const shouldShow = allowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
  
  if (!shouldShow) return null
  
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
      <div className="mx-3 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100/80 flex overflow-hidden backdrop-blur-xl">
        {navs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${active ? 'text-violet-600' : 'text-gray-400'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-violet-100' : ''}`}>
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`text-[9.5px] font-semibold tracking-wide leading-none ${active ? 'text-violet-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
