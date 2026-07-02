'use client'

import { useEffect, useState } from 'react'
import { ContactRound, History, Loader2, Phone } from 'lucide-react'

type RecentCustomer = {
  id: number
  nomorTujuan: string
  produk: string
  createdAt: string
}

type ContactManager = {
  select(properties: string[], options: { multiple: boolean }): Promise<Array<{ name?: string[]; tel?: string[] }>>
}

export default function CustomerInput({
  value,
  onChange,
  label = 'Data Pelanggan',
  placeholder = '08xxxxxxxxxx',
  inputMode = 'tel',
  accent = 'violet',
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  inputMode?: 'tel' | 'text' | 'numeric'
  accent?: 'violet' | 'blue'
}) {
  const [history, setHistory] = useState<RecentCustomer[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [contactError, setContactError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/transaksi/recent-customers')
      .then(response => response.ok ? response.json() : { data: [] })
      .then(result => {
        if (!cancelled) setHistory(Array.isArray(result.data) ? result.data : [])
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoadingHistory(false) })
    return () => { cancelled = true }
  }, [])

  async function pickContact() {
    setContactError('')
    const contacts = (navigator as Navigator & { contacts?: ContactManager }).contacts
    if (!contacts?.select) {
      setContactError('Ambil kontak tersedia di Chrome Android melalui HTTPS. Nomor tetap bisa diketik manual.')
      return
    }

    try {
      const selected = await contacts.select(['name', 'tel'], { multiple: false })
      const phone = selected[0]?.tel?.[0]
      if (phone) onChange(phone.replace(/[^\d+]/g, ''))
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') setContactError('Kontak tidak dapat dibuka. Periksa izin browser.')
    }
  }

  const focusClass = accent === 'blue'
    ? 'focus:border-blue-500 focus:ring-blue-500/25'
    : 'focus:border-violet-500 focus:ring-violet-500/25'

  return (
    <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
        <button type="button" onClick={pickContact} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
          <ContactRound size={14} /> Ambil Kontak
        </button>
      </div>
      <div className="relative">
        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={inputMode === 'tel' ? 'tel' : 'text'}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${focusClass}`}
        />
      </div>
      {contactError && <p className="mt-2 text-xs leading-relaxed text-amber-600">{contactError}</p>}

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <History size={13} /> 5 Transaksi Terakhir
        </p>
        {loadingHistory ? (
          <div className="flex items-center gap-2 py-2 text-xs text-gray-400"><Loader2 size={13} className="animate-spin" /> Memuat riwayat...</div>
        ) : history.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {history.map(item => (
              <button key={item.id} type="button" onClick={() => onChange(item.nomorTujuan)} className="min-w-[145px] rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left transition active:scale-95">
                <p className="truncate text-xs font-bold text-gray-800">{item.nomorTujuan}</p>
                <p className="mt-1 truncate text-[10px] text-gray-400">{item.produk}</p>
              </button>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400">Belum ada transaksi sebelumnya.</p>}
      </div>
    </div>
  )
}
