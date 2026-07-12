'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserRound } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import MobileTopBar from '@/components/MobileTopBar'

type Member = {
  id: number
  name: string
  phone: string
  reff: number
  created_at: string
}

type LevelData = {
  level: number
  total: number
  members: Member[]
}

export default function MitraPage() {
  const router = useRouter()
  const [activeLevel, setActiveLevel] = useState(1)
  const [levels, setLevels] = useState<LevelData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/mitra')
      .then(async response => {
        if (!response.ok) throw new Error('Gagal memuat data mitra')
        return response.json() as Promise<{ levels: LevelData[] }>
      })
      .then(data => setLevels(data.levels))
      .catch(err => setError(err instanceof Error ? err.message : 'Terjadi kesalahan'))
      .finally(() => setLoading(false))
  }, [])

  const current = levels.find(item => item.level === activeLevel)
  const totalMitra = levels.reduce((total, item) => total + item.total, 0)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 safe-pb">
      <MobileTopBar title="Mitra Saya"
        trailing={<span className="flex min-w-10 items-center justify-center rounded-full bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700">{loading ? '—' : totalMitra}</span>} />

      <div className="flex-1 space-y-3.5 px-4 py-4 pb-24">
        <div className="grid grid-cols-5 gap-1.5 rounded-2xl border border-white/80 bg-white p-2 card-shadow">
          {[1, 2, 3, 4, 5].map(level => {
            return (
              <button key={level} onClick={() => setActiveLevel(level)}
                className={`rounded-xl px-1 py-2.5 text-center transition-colors ${activeLevel === level ? 'gradient-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <span className="block text-xs font-bold">Lv {level}</span>
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white card-shadow">
          <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3.5">
            <p className="text-sm font-bold text-gray-800">Mitra Level {activeLevel}</p>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-600">
              {current?.total ?? 0} Mitra
            </span>
          </div>
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-violet-500" /></div>
          ) : error ? (
            <p className="px-4 py-14 text-center text-sm text-red-500">{error}</p>
          ) : !current?.members.length ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <UserRound size={23} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Belum ada mitra level {activeLevel}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {current.members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800">{member.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{member.phone}</p>
                  </div>
                  <p className="shrink-0 text-[10px] text-gray-400">{new Date(member.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
