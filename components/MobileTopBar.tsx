'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

type MobileTopBarProps = {
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  accent?: 'violet' | 'blue' | 'emerald'
}

const accents = {
  violet: 'bg-violet-600',
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-600',
}

export default function MobileTopBar({ title, subtitle, trailing, accent = 'violet' }: MobileTopBarProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-3">
        <button onClick={() => router.back()} aria-label="Kembali"
          className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-700 active:bg-gray-100">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      <div className={`h-0.5 w-12 rounded-r-full ${accents[accent]}`} />
    </header>
  )
}
