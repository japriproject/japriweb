'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { applyHotelMarkup, HOTEL_MARKUP_PERCENT } from '@/lib/hotel-pricing'
import { formatRupiah } from '@/lib/utils'
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Hotel,
  Loader2,
  MapPin,
  Search,
  Star,
  UserRound,
  Wallet,
} from 'lucide-react'

type City = {
  id: string
  name: string
  province_name?: string
}

type HotelItem = {
  id: string
  name: string
  star?: number
  city_name?: string
  main_photo?: string
  address?: { area?: string }
  room_summary?: {
    min_total_price?: number
    total_available_room?: number
  }
}

type RoomGroup = {
  group_id: string
  plan?: string
  plan_label?: string
  cancel_plan?: string
  total_price?: number
  is_smoking?: boolean
}

type Room = {
  name: string
  photos?: string[]
  min_total_price?: number
  groups?: RoomGroup[]
}

type Guest = {
  salutation: 'Mr' | 'Ms' | 'Mrs'
  firstName: string
  lastName: string
  email: string
  phone: string
}

function today(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function normalizeCities(payload: unknown): City[] {
  const root = asRecord(payload)
  const data = asRecord(root.data)
  const cities = Array.isArray(data.cities) ? data.cities : Array.isArray(root.cities) ? root.cities : []
  return cities
    .map((item) => asRecord(item))
    .map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      province_name: item.province_name ? String(item.province_name) : '',
    }))
    .filter((item) => item.id && item.name)
}

function normalizeHotels(payload: unknown): HotelItem[] {
  const root = asRecord(payload)
  const data = asRecord(root.data)
  const list =
    Array.isArray(data.properties) ? data.properties :
    Array.isArray(data.hotels) ? data.hotels :
    Array.isArray(data) ? data :
    Array.isArray(root.properties) ? root.properties :
    []

  return list
    .map((item) => asRecord(item))
    .map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      star: Number(item.star ?? 0),
      city_name: item.city_name ? String(item.city_name) : '',
      main_photo: item.main_photo ? String(item.main_photo) : '',
      address: asRecord(item.address) as HotelItem['address'],
      room_summary: (() => {
        const summary = asRecord(item.room_summary)
        return {
          min_total_price: applyHotelMarkup(Number(summary.min_total_price ?? 0)),
          total_available_room: Number(summary.total_available_room ?? 0),
        }
      })(),
    }))
    .filter((item) => item.id && item.name)
}

function normalizeSession(payload: unknown) {
  const root = asRecord(payload)
  const meta = asRecord(root.meta)
  return String(meta.session ?? root.session ?? '')
}

function normalizeRooms(payload: unknown): Room[] {
  const root = asRecord(payload)
  const data = asRecord(root.data)
  const property = asRecord(data.property)
  const rooms =
    Array.isArray(data.rooms) ? data.rooms :
    Array.isArray(property.rooms) ? property.rooms :
    Array.isArray(root.rooms) ? root.rooms :
    []

  return rooms
    .map((item) => asRecord(item))
    .map((item) => ({
      name: String(item.name ?? 'Room'),
      photos: Array.isArray(item.photos) ? item.photos.map(String) : [],
      min_total_price: applyHotelMarkup(Number(item.min_total_price ?? 0)),
      groups: Array.isArray(item.groups)
        ? item.groups.map((group) => {
            const raw = asRecord(group)
            return {
              group_id: String(raw.group_id ?? ''),
              plan: raw.plan ? String(raw.plan) : '',
              plan_label: raw.plan_label ? String(raw.plan_label) : '',
              cancel_plan: raw.cancel_plan ? String(raw.cancel_plan) : '',
              total_price: applyHotelMarkup(Number(raw.total_price ?? 0)),
              is_smoking: Boolean(raw.is_smoking),
            }
          }).filter((group) => group.group_id)
        : [],
    }))
}

function normalizeRecheckAmount(payload: unknown, fallback: number) {
  const rooms = normalizeRooms(payload)
  const firstGroup = rooms.flatMap((room) => room.groups ?? [])[0]
  return firstGroup?.total_price || fallback
}

export default function HotelPage() {
  const router = useRouter()
  const [saldo, setSaldo] = useState(0)
  const [keyword, setKeyword] = useState('jakarta')
  const [cities, setCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [checkIn, setCheckIn] = useState(today(1))
  const [checkOut, setCheckOut] = useState(today(2))
  const [totalRoom, setTotalRoom] = useState(1)
  const [totalAdult, setTotalAdult] = useState(1)
  const [stars, setStars] = useState<number[]>([3, 4, 5])
  const [sessionId, setSessionId] = useState('')
  const [hotels, setHotels] = useState<HotelItem[]>([])
  const [selectedHotel, setSelectedHotel] = useState<HotelItem | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<RoomGroup | null>(null)
  const [guest, setGuest] = useState<Guest>({ salutation: 'Mr', firstName: '', lastName: '', email: '', phone: '' })
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedAmount = useMemo(() => selectedGroup?.total_price || selectedRoom?.min_total_price || 0, [selectedGroup, selectedRoom])

  useEffect(() => {
    fetch('/api/saldo')
      .then((response) => response.ok ? response.json() : { saldo: 0 })
      .then((data) => setSaldo(data.saldo ?? 0))
      .catch(() => setSaldo(0))
  }, [])

  async function readJson(response: Response) {
    const text = await response.text()
    const data = text ? JSON.parse(text) : {}
    if (!response.ok) throw new Error(data.error || 'Request gagal')
    return data
  }

  function toggleStar(star: number) {
    setStars((current) => current.includes(star) ? current.filter((item) => item !== star) : [...current, star].sort())
  }

  async function searchDestination() {
    setError('')
    setSuccess('')
    setLoading('destination')
    setSelectedCity(null)
    setHotels([])
    setRooms([])
    setSelectedHotel(null)
    setSelectedRoom(null)
    setSelectedGroup(null)

    try {
      const params = new URLSearchParams({ keyword, stars: stars.join(',') })
      const data = await readJson(await fetch(`/api/hotel/search?${params}`))
      const list = normalizeCities(data)
      setCities(list)
      if (list.length === 0) {
        setError('Destinasi tidak ditemukan')
        return
      }

      const normalizedKeyword = keyword.trim().toLowerCase()
      const destination = list.find((city) => city.name.trim().toLowerCase() === normalizedKeyword) ?? list[0]
      await findHotels(destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencari destinasi')
    } finally {
      setLoading('')
    }
  }

  async function findHotels(city = selectedCity) {
    if (!city) return setError('Pilih kota terlebih dahulu')
    setError('')
    setSuccess('')
    setLoading('hotels')
    setSelectedCity(city)
    setHotels([])
    setRooms([])
    setSelectedHotel(null)
    setSelectedRoom(null)
    setSelectedGroup(null)

    try {
      const data = await readJson(await fetch('/api/hotel/initiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: city.id,
          checkIn,
          checkOut,
          totalRoom,
          totalAdult,
          totalChild: 0,
          childAge: [],
          stars,
        }),
      }))

      setSessionId(normalizeSession(data))
      const list = normalizeHotels(data)
      setHotels(list)
      if (list.length === 0) setError('Hotel tidak tersedia untuk pencarian ini')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencari hotel')
    } finally {
      setLoading('')
    }
  }

  async function loadPropertyDetail(hotel: HotelItem) {
    if (!sessionId) return setError('Session pencarian hotel tidak tersedia')
    setError('')
    setSuccess('')
    setLoading(`detail-${hotel.id}`)
    setSelectedHotel(hotel)
    setRooms([])
    setSelectedRoom(null)
    setSelectedGroup(null)

    try {
      const data = await readJson(await fetch('/api/hotel/property-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, propertyId: hotel.id }),
      }))
      const roomList = normalizeRooms(data)
      setRooms(roomList)
      if (roomList.length === 0) setError('Kamar belum tersedia untuk hotel ini')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kamar')
    } finally {
      setLoading('')
    }
  }

  async function recheckRoom(room: Room, group: RoomGroup) {
    setError('')
    setSuccess('')
    setLoading(`recheck-${group.group_id}`)

    try {
      const data = await readJson(await fetch('/api/hotel/recheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, groupId: group.group_id }),
      }))
      const amount = normalizeRecheckAmount(data, group.total_price || room.min_total_price || 0)
      setSelectedRoom(room)
      setSelectedGroup({ ...group, total_price: amount })
      setSuccess('Harga kamar berhasil divalidasi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal validasi harga')
    } finally {
      setLoading('')
    }
  }

  async function bookHotel() {
    if (!selectedHotel || !selectedRoom || !selectedGroup) return setError('Pilih kamar terlebih dahulu')
    if (!guest.firstName.trim() || !guest.lastName.trim()) return setError('Lengkapi nama tamu')
    if (guest.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) return setError('Format email tamu tidak valid')
    if (guest.phone.trim() && guest.phone.replace(/\D/g, '').length < 8) return setError('Nomor HP tamu minimal 8 digit')
    if (selectedAmount <= 0) return setError('Harga booking tidak valid')
    if (saldo < selectedAmount) return setError(`Saldo tidak cukup. Kurang ${formatRupiah(selectedAmount - saldo)}`)

    setError('')
    setSuccess('')
    setLoading('booking')

    try {
      const data = await readJson(await fetch('/api/hotel/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sessionId,
          groupId: selectedGroup.group_id,
          propertyId: selectedHotel.id,
          propertyName: selectedHotel.name,
          cityName: selectedHotel.city_name || selectedCity?.name || '',
          roomName: selectedRoom.name,
          checkIn,
          checkOut,
          guest,
        }),
      }))

      setSuccess(`Booking dibuat. Invoice ${data.invoice} status ${data.status}`)
      setSaldo((current) => Math.max(0, current - selectedAmount))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking hotel gagal')
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 safe-pb">
      <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-50 rounded-t-3xl" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/70 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Booking Hotel</h1>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
              <Wallet size={14} />
              <span className="text-sm font-bold">{formatRupiah(saldo)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5">
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Destinasi</label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Jakarta, Bandung, hotel"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check in</span>
              <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check out</span>
              <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kamar</span>
              <input type="number" min={1} max={8} value={totalRoom} onChange={(event) => setTotalRoom(Number(event.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamu dewasa</span>
              <input type="number" min={1} max={16} value={totalAdult} onChange={(event) => setTotalAdult(Number(event.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold" />
            </label>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bintang</p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => toggleStar(star)}
                  className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 ${stars.includes(star) ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                >
                  {star}<Star size={11} fill="currentColor" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={searchDestination}
            disabled={loading === 'destination'}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-violet-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 btn-press disabled:opacity-50"
          >
            {loading === 'destination' ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
            Cari Destinasi
          </button>
        </div>

        {cities.length > 0 && (
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pilih Kota</p>
            <div className="space-y-2">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => findHotels(city)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left btn-press ${selectedCity?.id === city.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <MapPin size={17} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{city.name}</p>
                      <p className="text-xs text-gray-400">{city.province_name || 'Indonesia'}</p>
                    </div>
                  </div>
                  {loading === 'hotels' && selectedCity?.id === city.id ? <Loader2 size={16} className="animate-spin text-blue-500" /> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        {hotels.length > 0 && !selectedHotel && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Hotel Tersedia</p>
            <div className="grid grid-cols-2 gap-3">
              {hotels.map((hotel) => (
                <button
                  key={hotel.id}
                  onClick={() => loadPropertyDetail(hotel)}
                  className="w-full min-w-0 bg-white rounded-2xl overflow-hidden card-shadow border border-gray-100/80 text-left btn-press"
                >
                {hotel.main_photo ? (
                  <img src={hotel.main_photo} alt={hotel.name} className="w-full h-32 object-cover bg-gray-100" />
                ) : (
                  <div className="h-24 bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
                    <Hotel size={32} className="text-blue-400" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{hotel.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{hotel.address?.area || hotel.city_name || selectedCity?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold">
                      {hotel.star || '-'}<Star size={11} fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">{hotel.room_summary?.total_available_room ?? '-'} kamar</span>
                    <span className="text-sm font-bold text-blue-600">
                      {hotel.room_summary?.min_total_price ? formatRupiah(hotel.room_summary.min_total_price) : 'Lihat kamar'}
                    </span>
                  </div>
                  {loading === `detail-${hotel.id}` ? (
                    <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold">
                      <Loader2 size={14} className="animate-spin" /> Memuat kamar...
                    </div>
                  ) : null}
                </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedHotel && !selectedGroup && (
          <div className="overflow-hidden rounded-3xl bg-white card-shadow border border-gray-100/80">
            <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-sky-500 to-blue-600 p-4 text-white">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                    <BedDouble size={17} />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/75">Pilih Kamar</p>
                </div>
                <p className="text-base font-bold leading-tight">{selectedHotel.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                  <CalendarDays size={13} /> {checkIn} — {checkOut}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedHotel(null)
                  setRooms([])
                  setSelectedRoom(null)
                  setSelectedGroup(null)
                }}
                className="shrink-0 flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white btn-press"
              >
                <ArrowLeft size={14} /> Hotel
              </button>
            </div>

            {loading === `detail-${selectedHotel.id}` && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-blue-500">
                <Loader2 size={18} className="animate-spin" /> Memuat pilihan kamar...
              </div>
            )}

            {loading !== `detail-${selectedHotel.id}` && rooms.length === 0 && (
              <p className="m-4 rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Kamar belum tersedia untuk hotel ini.
              </p>
            )}

            {rooms.map((room) => (
              <div key={room.name} className="m-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative">
                  {room.photos?.[0] ? (
                    <img src={room.photos[0]} alt={room.name} className="h-36 w-full bg-gray-100 object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50">
                      <BedDouble size={34} className="text-blue-400" />
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-xl bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                    {room.min_total_price ? `Mulai ${formatRupiah(room.min_total_price)}` : 'Cek harga'}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-base font-bold text-gray-900">{room.name}</p>
                      <p className="mt-1 text-xs text-gray-400">Pilih paket yang sesuai untuk melanjutkan</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <BedDouble size={18} />
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(room.groups ?? []).map((group) => (
                      <button
                        key={group.group_id}
                        onClick={() => recheckRoom(room, group)}
                        className="group w-full rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-left transition hover:border-blue-300 hover:bg-blue-50 btn-press"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800">{group.plan_label || group.plan || 'Room plan'}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{group.cancel_plan || 'Kebijakan pembatalan tersedia'}</p>
                            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 size={12} /> Harga akan divalidasi
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
                            <p className="mt-0.5 text-sm font-extrabold text-blue-600">{group.total_price ? formatRupiah(group.total_price) : '-'}</p>
                            {loading === `recheck-${group.group_id}` ? <Loader2 size={14} className="mt-1 inline-block animate-spin text-blue-500" /> : <span className="mt-1 inline-block text-[11px] font-bold text-blue-500">Pilih →</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedGroup && (
          <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserRound size={17} className="text-blue-500" />
                <p className="text-sm font-bold text-gray-800">Data Tamu</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRoom(null)
                  setSelectedGroup(null)
                }}
                className="shrink-0 flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 btn-press"
              >
                <ArrowLeft size={14} /> Kamar
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Mr', 'Ms', 'Mrs'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setGuest((current) => ({ ...current, salutation: item }))}
                  className={`py-2.5 rounded-xl border text-xs font-bold ${guest.salutation === item ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={guest.firstName} onChange={(event) => setGuest((current) => ({ ...current, firstName: event.target.value }))} placeholder="Nama depan" className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />
              <input value={guest.lastName} onChange={(event) => setGuest((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nama belakang" className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />
            </div>
            <input type="email" value={guest.email} onChange={(event) => setGuest((current) => ({ ...current, email: event.target.value }))} placeholder="Email tamu (opsional)" className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />
            <input type="tel" inputMode="numeric" value={guest.phone} onChange={(event) => setGuest((current) => ({ ...current, phone: event.target.value }))} placeholder="Nomor HP tamu (opsional)" className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" />

            <div className="bg-blue-50 rounded-2xl p-3 space-y-2 border border-blue-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Hotel</span>
                <span className="font-bold text-gray-800 text-right max-w-[65%]">{selectedHotel?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tanggal</span>
                <span className="font-bold text-gray-800">{checkIn} - {checkOut}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-blue-600 text-base">{formatRupiah(selectedAmount)}</span>
              </div>
              <p className="text-right text-[10px] font-semibold text-blue-500">Sudah termasuk markup {HOTEL_MARKUP_PERCENT}%</p>
            </div>

            {saldo < selectedAmount && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <p>Saldo belum cukup. Saldo Anda {formatRupiah(saldo)}, masih kurang {formatRupiah(selectedAmount - saldo)}.</p>
              </div>
            )}

            <button
              onClick={bookHotel}
              disabled={loading === 'booking' || saldo < selectedAmount}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-violet-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 btn-press disabled:opacity-50"
            >
              {loading === 'booking' ? <Loader2 size={17} className="animate-spin" /> : <CalendarDays size={17} />}
              Booking Sekarang
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <p className="text-emerald-700 text-sm font-medium">{success}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
