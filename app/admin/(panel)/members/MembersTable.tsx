'use client'

import { FormEvent, useState } from 'react'
import { Eye, KeyRound, Loader2, LogIn, LogOut, Save, Wallet, X } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export type MemberRow = {
  id: number
  name: string
  phone: string
  email: string
  saldo: number
  loginStatus: 0 | 1
  lastLogin: string | null
  createdAt: string
}

type MemberDetail = MemberRow & {
  address: string
  provinsi: string
  kabupaten: string
  kecamatan: string
  kelurahan: string
  perusahaan: string
  dateLogout: string | null
}

type EditMode = 'password' | 'saldo' | 'loginStatus'

export default function MembersTable({ initialMembers }: { initialMembers: MemberRow[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [selected, setSelected] = useState<MemberDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null)
  const [editMode, setEditMode] = useState<EditMode | null>(null)
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function showDetail(id: number) {
    setLoadingDetail(id)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/members/${id}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Gagal mengambil detail member')
      setSelected(data.member)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal mengambil detail member')
    } finally {
      setLoadingDetail(null)
    }
  }

  function startEdit(mode: EditMode) {
    setEditMode(mode)
    setMessage('')
    if (mode === 'saldo') setValue(String(selected?.saldo ?? 0))
    else if (mode === 'loginStatus') setValue(String(selected?.loginStatus ?? 0))
    else setValue('')
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !editMode) return
    setPending(true)
    setMessage('')
    const payload = editMode === 'password'
      ? { password: value }
      : editMode === 'saldo'
        ? { saldo: Number(value) }
        : { loginStatus: Number(value) }

    try {
      const response = await fetch(`/api/admin/members/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Perubahan gagal disimpan')

      const updated = { ...selected, ...data.member }
      setSelected(updated)
      setMembers((current) => current.map((member) => member.id === selected.id ? { ...member, ...data.member } : member))
      setEditMode(null)
      setValue('')
      setMessage(data.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Perubahan gagal disimpan')
    } finally {
      setPending(false)
    }
  }

  function closeModal() {
    if (pending) return
    setSelected(null)
    setEditMode(null)
    setMessage('')
  }

  return (
    <>
      {message && !selected && <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{message}</p>}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Kontak</th><th className="px-5 py-3">Saldo</th><th className="px-5 py-3">Status login</th><th className="px-5 py-3">Terdaftar</th><th className="px-5 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-medium">{member.name}</td>
                  <td className="px-5 py-4"><p>{member.phone}</p><p className="text-xs text-slate-500">{member.email || '-'}</p></td>
                  <td className="px-5 py-4 font-medium">{formatRupiah(member.saldo)}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${member.loginStatus === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>{member.loginStatus === 1 ? 'Sedang login' : 'Logout'}</span></td>
                  <td className="px-5 py-4 text-slate-400">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(member.createdAt))}</td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => showDetail(member.id)} disabled={loadingDetail === member.id} className="inline-flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50">{loadingDetail === member.id ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Detail</button></td>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Member tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="member-detail-title">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-slate-900 px-5 py-4">
              <div><h2 id="member-detail-title" className="font-bold">Detail member</h2><p className="text-xs text-slate-500">{selected.name} · {selected.phone}</p></div>
              <button type="button" onClick={closeModal} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={19} /></button>
            </div>

            <div className="space-y-6 p-5">
              <dl className="grid gap-4 rounded-xl bg-slate-950/60 p-4 sm:grid-cols-2">
                <Detail label="Nama" value={selected.name} />
                <Detail label="Nomor HP" value={selected.phone} />
                <Detail label="Email" value={selected.email || '-'} />
                <Detail label="Perusahaan" value={selected.perusahaan || '-'} />
                <Detail label="Saldo" value={formatRupiah(selected.saldo)} />
                <Detail label="Status login" value={selected.loginStatus === 1 ? 'Sedang login' : 'Logout'} />
                <Detail label="Login terakhir" value={formatDate(selected.lastLogin)} />
                <Detail label="Logout terakhir" value={formatDate(selected.dateLogout)} />
                <Detail label="Alamat" value={[selected.address, selected.kelurahan, selected.kecamatan, selected.kabupaten, selected.provinsi].filter(Boolean).join(', ') || '-'} wide />
              </dl>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-300">Tindakan admin</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ActionButton icon={<KeyRound size={16} />} label="Ubah password" onClick={() => startEdit('password')} />
                  <ActionButton icon={<Wallet size={16} />} label="Ubah saldo" onClick={() => startEdit('saldo')} />
                  <ActionButton icon={selected.loginStatus === 1 ? <LogOut size={16} /> : <LogIn size={16} />} label="Status login" onClick={() => startEdit('loginStatus')} />
                </div>
              </div>

              {editMode && (
                <form onSubmit={submitUpdate} className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <label className="mb-2 block text-sm font-semibold">{editMode === 'password' ? 'Password baru' : editMode === 'saldo' ? 'Saldo baru' : 'Status login baru'}</label>
                  {editMode === 'loginStatus' ? (
                    <select value={value} onChange={(event) => setValue(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm outline-none focus:border-violet-500"><option value="0">Logout</option><option value="1">Sedang login</option></select>
                  ) : (
                    <input type={editMode === 'password' ? 'password' : 'number'} min={editMode === 'saldo' ? 0 : undefined} max={editMode === 'saldo' ? 2147483647 : undefined} minLength={editMode === 'password' ? 6 : undefined} required value={value} onChange={(event) => setValue(event.target.value)} autoComplete={editMode === 'password' ? 'new-password' : 'off'} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm outline-none focus:border-violet-500" />
                  )}
                  <div className="mt-3 flex gap-2"><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">{pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan</button><button type="button" onClick={() => setEditMode(null)} disabled={pending} className="rounded-lg px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5">Batal</button></div>
                </form>
              )}

              {message && <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{message}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><dt className="text-xs uppercase tracking-wide text-slate-600">{label}</dt><dd className="mt-1 text-sm text-slate-200">{value}</dd></div>
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-medium text-slate-300 hover:border-violet-500/40 hover:text-white">{icon}{label}</button>
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'
}
