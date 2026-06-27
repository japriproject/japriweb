import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { DigiflazzHotelError, sendDigiflazzHotelRequest } from '@/lib/digiflazz'
import { z } from 'zod'

const schema = z.object({
  cityId: z.string().min(1),
  checkIn: z.string().min(8),
  checkOut: z.string().min(8),
  totalRoom: z.number().int().min(1).max(8).default(1),
  totalAdult: z.number().int().min(1).max(16).default(1),
  totalChild: z.number().int().min(0).max(8).default(0),
  childAge: z.array(z.number().int().min(0).max(17)).default([]),
  stars: z.array(z.number().int().min(1).max(5)).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data pencarian hotel tidak valid' }, { status: 400 })

  const data = parsed.data

  try {
    const result = await sendDigiflazzHotelRequest({
      endpoint: 'initiation',
      payload: {
        city_id: data.cityId,
        check_in: data.checkIn,
        check_out: data.checkOut,
        stars: data.stars,
        pax_count: {
          total_room: data.totalRoom,
          total_adult: data.totalAdult,
          total_child: data.totalChild,
          child_age: data.childAge,
        },
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memulai pencarian hotel'
    const status = error instanceof DigiflazzHotelError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}
