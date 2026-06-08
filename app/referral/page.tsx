'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Link as LinkIcon, Copy, CheckCircle2, User } from 'lucide-react'

type Mitra = {
  id: number
  name: string
  phone: string
  created_at: string
}

export default function ReferralPage() {
  const router = useRouter()
  const [totalReferral, setTotalReferral] = useState(0)
  const [mitras, setMitras] = useState<Mitra[]>([])
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setTotalReferral(d.total || 0)
          setMitras(d.mitras || [])
          setReferralCode(d.referralCode || '')
          setReferralLink(d.referralLink || '')
        }
      })
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Program Referral</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Ajak teman dan dapatkan bonus</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-20">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white card-shadow">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} />
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Total Mitra</span>
          </div>
          <p className="text-4xl font-bold mt-2">{totalReferral}</p>
          <p className="text-xs opacity-75 mt-1">Orang telah bergabung</p>
        </div>

        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon size={16} className="text-violet-600" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Link Referral</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
            <p className="text-xs text-gray-500 mb-1 font-medium">Kode Referral</p>
            <p className="text-sm font-bold text-gray-900">{referralCode}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-gray-900 font-medium truncate">{referralLink}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white rounded-lg text-xs font-bold hover:bg-violet-600 transition-all btn-press"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? 'Tersalin' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-violet-600" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Mitra</span>
          </div>
          {mitras.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Belum ada mitra</p>
              <p className="text-xs text-gray-400 mt-1">Bagikan link referral Anda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mitras.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-violet-600 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
