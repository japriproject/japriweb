'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp,
  Smartphone, Wifi, CreditCard, Gamepad2, PhoneCall, Send, Gift, Globe, Signal, Phone, Package,
  Bolt, Shield, Droplets, Tv, Landmark, Receipt, MonitorSmartphone, Building2, Waves
} from 'lucide-react'
import type { MenuItemIcon } from '@/app/dashboard/page'

const ICON_MAP: Record<string, React.ComponentType<{ size: number; className?: string; strokeWidth?: number }>> = {
  Smartphone, Wifi, CreditCard, Gamepad2, PhoneCall, Send, Gift, Globe, Signal, Phone, Package,
  Bolt, Shield, Droplets, Tv, Landmark, Receipt, MonitorSmartphone, Building2, Waves,
}

const SHOW_DEFAULT = 4

function MenuGrid({ items, accentColor }: { items: MenuItemIcon[]; accentColor: string }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, SHOW_DEFAULT)
  const hasMore = items.length > SHOW_DEFAULT

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {visible.map((item) => {
          const Icon = ICON_MAP[item.iconName] ?? Package
          const targetHref = item.href.startsWith('/pascabayar') ? item.href : `/produk-kategori?kategori=${encodeURIComponent(item.kategoriAsli)}`
          return (
            <Link key={item.href + item.label} href={targetHref} className="flex flex-col items-center gap-1.5 btn-press">
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center`}>
                <Icon size={22} className={item.text} strokeWidth={1.8} />
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight ${item.text}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(v => !v)}
          className={`w-full mt-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${accentColor}`}
        >
          {expanded ? (
            <><ChevronUp size={13} /> Tampilkan Lebih Sedikit</>
          ) : (
            <><ChevronDown size={13} /> Lihat {items.length - SHOW_DEFAULT} Lainnya</>
          )}
        </button>
      )}
    </>
  )
}

export default function DashboardMenus({
  prabayarMenus,
  pascabayarMenus,
}: {
  prabayarMenus: MenuItemIcon[]
  pascabayarMenus: MenuItemIcon[]
}) {
  return (
    <>
      {prabayarMenus.length > 0 && (
        <div className="bg-white rounded-2xl p-4 card-shadow border border-white/80">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-800">Prabayar</p>
            <span className="text-[10px] text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full font-bold">ISI ULANG</span>
          </div>
          <MenuGrid items={prabayarMenus} accentColor="text-violet-600 bg-violet-50" />
        </div>
      )}

      {pascabayarMenus.length > 0 && (
        <div className="bg-white rounded-2xl p-4 card-shadow border border-white/80">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-800">Pascabayar</p>
            <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-bold">CEK TAGIHAN</span>
          </div>
          <MenuGrid items={pascabayarMenus} accentColor="text-blue-600 bg-blue-50" />
        </div>
      )}
    </>
  )
}
