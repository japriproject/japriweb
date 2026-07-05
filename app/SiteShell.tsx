'use client'

import { usePathname } from 'next/navigation'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div className={isAdmin
      ? 'min-h-screen min-w-[1200px] w-full bg-slate-950'
      : 'relative mx-auto min-h-screen max-w-md bg-white shadow-lg'}>
      {children}
    </div>
  )
}
