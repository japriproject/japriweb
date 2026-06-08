'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type PendingStatusRefresherProps = {
  enabled: boolean
}

export function PendingStatusRefresher({ enabled }: PendingStatusRefresherProps) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    const interval = window.setInterval(() => {
      router.refresh()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [enabled, router])

  if (!enabled) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
      <Loader2 size={16} className="text-amber-600 animate-spin shrink-0" />
      <p className="text-sm font-medium text-amber-700">
        Transaksi sedang diproses. Detail akan diperbarui otomatis saat callback provider diterima.
      </p>
    </div>
  )
}
