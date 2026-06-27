import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import {
  Bell, Zap,
  Smartphone, Wifi, Package, Gift, Globe, Send, PhoneCall,
  CreditCard, Gamepad2, Signal,
  Bolt, Shield, Droplets, Phone, Tv, Landmark,
  MonitorSmartphone, Building2, Waves, HeadsetIcon, UserPlus, QrCode, Hotel
} from 'lucide-react'
import DashboardMenus from '@/components/DashboardMenus'

export type MenuItemIcon = {
  iconName: string
  bg: string
  text: string
  label: string
  href: string
  kategoriAsli: string
}

function getKategoriMeta(kategori: string): MenuItemIcon {
  const k = kategori.toLowerCase()
  const label = kategori.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  if (k.includes('pulsa')) return { iconName: 'Smartphone', bg: 'bg-violet-50', text: 'text-violet-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('data')) return { iconName: 'Wifi', bg: 'bg-blue-50', text: 'text-blue-600', label, href: '/paket-data', kategoriAsli: kategori }
  if (k.includes('emoney') || k.includes('e-money') || k.includes('ewallet')) return { iconName: 'CreditCard', bg: 'bg-emerald-50', text: 'text-emerald-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('game')) return { iconName: 'Gamepad2', bg: 'bg-pink-50', text: 'text-pink-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('masa aktif') || k.includes('aktivasi')) return { iconName: 'PhoneCall', bg: 'bg-orange-50', text: 'text-orange-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('transfer')) return { iconName: 'Send', bg: 'bg-teal-50', text: 'text-teal-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('voucher')) return { iconName: 'Gift', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('roaming')) return { iconName: 'Globe', bg: 'bg-indigo-50', text: 'text-indigo-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('paket sms') || k.includes('sms')) return { iconName: 'Signal', bg: 'bg-sky-50', text: 'text-sky-600', label, href: '/pulsa', kategoriAsli: kategori }
  if (k.includes('nelpon') || k.includes('telpon') || k.includes('voice')) return { iconName: 'Phone', bg: 'bg-lime-50', text: 'text-lime-600', label, href: '/pulsa', kategoriAsli: kategori }
  return { iconName: 'Package', bg: 'bg-gray-100', text: 'text-gray-500', label, href: '/pulsa', kategoriAsli: kategori }
}

function getBrandMeta(brand: string): MenuItemIcon {
  const k = brand.toLowerCase()
  const label = brand.length > 10 ? brand.substring(0, 9) + '…' : brand
  const href = `/pascabayar-kategori?kategori=PASCABAYAR&brand=${encodeURIComponent(brand)}`
  if (k.includes('pln')) return { iconName: 'Bolt', bg: 'bg-yellow-50', text: 'text-yellow-600', label, href, kategoriAsli: brand }
  if (k.includes('bpjs')) return { iconName: 'Shield', bg: 'bg-green-50', text: 'text-green-600', label, href, kategoriAsli: brand }
  if (k.includes('pdam')) return { iconName: 'Droplets', bg: 'bg-cyan-50', text: 'text-cyan-600', label, href, kategoriAsli: brand }
  if (k.includes('telkom') || k.includes('indihome')) return { iconName: 'Phone', bg: 'bg-red-50', text: 'text-red-600', label, href, kategoriAsli: brand }
  if (k.includes('tv') || k.includes('mnc') || k.includes('vision') || k.includes('transvision')) return { iconName: 'Tv', bg: 'bg-pink-50', text: 'text-pink-600', label, href, kategoriAsli: brand }
  if (k.includes('internet') || k.includes('biznet') || k.includes('myrepublic') || k.includes('iconnet')) return { iconName: 'MonitorSmartphone', bg: 'bg-indigo-50', text: 'text-indigo-600', label, href, kategoriAsli: brand }
  if (k.includes('adira') || k.includes('fif') || k.includes('baf') || k.includes('wom') || k.includes('oto')) return { iconName: 'Landmark', bg: 'bg-orange-50', text: 'text-orange-600', label, href, kategoriAsli: brand }
  if (k.includes('cicilan') || k.includes('angsuran') || k.includes('kredit')) return { iconName: 'Tv', bg: 'bg-amber-50', text: 'text-amber-600', label, href, kategoriAsli: brand }
  if (k.includes('asuransi') || k.includes('jiwa')) return { iconName: 'Shield', bg: 'bg-emerald-50', text: 'text-emerald-600', label, href, kategoriAsli: brand }
  if (k.includes('air') || k.includes('gas')) return { iconName: 'Waves', bg: 'bg-blue-50', text: 'text-blue-600', label, href, kategoriAsli: brand }
  if (k.includes('pajak') || k.includes('retribusi')) return { iconName: 'Building2', bg: 'bg-slate-100', text: 'text-slate-600', label, href, kategoriAsli: brand }
  return { iconName: 'Tv', bg: 'bg-gray-100', text: 'text-gray-500', label, href, kategoriAsli: brand }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [memberRows, prabayarRows, pascabayarRows] = await Promise.all([
    prisma.$queryRaw<Array<{ name: string; phone: string; sososo: number; bobobo: number }>>`
      SELECT name, phone, sososo, bobobo FROM members WHERE id = ${Number(session.userId)} LIMIT 1
    `,
    prisma.$queryRaw<Array<{ kategori: string }>>`
      SELECT DISTINCT kategori FROM pulsa ORDER BY kategori ASC
    `,
    prisma.$queryRaw<Array<{ brand: string }>>`
      SELECT DISTINCT brand FROM pasca ORDER BY brand ASC
    `,
  ])

  const member = memberRows[0]
  if (!member) redirect('/login')

  const saldo = member.sososo || 0
  const bonus = member.bobobo || 0
  const saldoClassName = saldo >= 100000000 ? 'text-sm' : saldo >= 10000000 ? 'text-base' : 'text-lg'

  const prabayarMenus: MenuItemIcon[] = prabayarRows.map(r => getKategoriMeta(r.kategori))
  const pascabayarMenus: MenuItemIcon[] = pascabayarRows.map(r => getBrandMeta(r.brand))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      <div className="gradient-primary px-5 pt-12 pb-28 text-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/[0.04] rounded-full" />
        <div className="absolute top-10 right-20 w-24 h-24 bg-white/[0.06] rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/[0.03] rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-medium tracking-wide uppercase">Halo, 👋</p>
            <h2 className="text-xl font-bold mt-0.5 tracking-tight">{member.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <Bell size={16} />
            </button>
            <Link href="/profil" className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center font-bold text-sm border border-white/20">
              {member.name.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-20 relative z-10 space-y-3.5">
        <div className="grid grid-cols-2 gap-3 slide-up">
          <div className="bg-white rounded-2xl p-4 card-shadow border border-white/80 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-violet-500/80" />
            <div className="pl-1">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Saldo</p>
                <p className={`${saldoClassName} font-bold text-gray-900 mt-1.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis`}>{formatRupiah(saldo)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 card-shadow border border-white/80 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-400/90" />
            <div className="pl-1">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Bonus</p>
                <p className="text-xl font-bold text-amber-600 mt-1.5">{formatRupiah(bonus)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl card-shadow border border-white/80 overflow-hidden">
          <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
            <Link href="/topup" className="min-w-[62px] flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-95">
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-violet-500" />
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">Top Up</span>
            </Link>
            <Link href="/hotel" className="min-w-[62px] flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-95">
              <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                <Hotel size={18} className="text-sky-500" />
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">Hotel</span>
            </Link>
            <Link href="/qris-kasir" className="min-w-[62px] flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-95">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <QrCode size={18} className="text-emerald-500" />
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">Qris Kasir</span>
            </Link>
            <Link href="/register-mitra" className="min-w-[62px] flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-95">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <UserPlus size={18} className="text-emerald-500" />
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">Register</span>
            </Link>
            <Link href="/support" className="min-w-[62px] flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-gray-50 transition-colors active:scale-95">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <HeadsetIcon size={18} className="text-indigo-500" />
              </div>
              <span className="text-[9px] font-semibold text-gray-700 text-center leading-tight">Support</span>
            </Link>
          </div>
        </div>

        <DashboardMenus
          prabayarMenus={prabayarMenus}
          pascabayarMenus={pascabayarMenus}
        />

        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 rounded-2xl p-4 text-white relative overflow-hidden btn-press">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold bg-white/25 px-2.5 py-1 rounded-full uppercase tracking-wide">🔥 Promo Spesial</span>
              <p className="text-base font-bold mt-1.5 leading-tight">Cashback 10%<br />Paket Data!</p>
              <p className="text-xs text-white/70 mt-0.5">Berlaku hingga akhir bulan</p>
            </div>
            <Wifi size={40} className="text-white/30" strokeWidth={1} />
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-300 font-medium pb-2">Japri Pay · Transaksi Aman & Terpercaya 🔒</p>
      </div>

      <BottomNav />
    </div>
  )
}
