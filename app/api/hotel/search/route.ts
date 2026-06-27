import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { DigiflazzHotelError, sendDigiflazzHotelRequest } from '@/lib/digiflazz'

function parseStars(value: string | null) {
  if (!value) return undefined
  const stars = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 5)
  return stars.length > 0 ? stars : undefined
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('keyword')?.trim()
  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ error: 'Masukkan minimal 2 karakter destinasi' }, { status: 400 })
  }

  try {
    const data = await sendDigiflazzHotelRequest({
      endpoint: 'search-destination',
      payload: {
        keyword,
        stars: parseStars(searchParams.get('stars')),
      },
    })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mencari destinasi hotel'
    const status = error instanceof DigiflazzHotelError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}
