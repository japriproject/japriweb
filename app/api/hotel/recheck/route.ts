import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { DigiflazzHotelError, sendDigiflazzHotelRequest } from '@/lib/digiflazz'
import { z } from 'zod'

const schema = z.object({
  session: z.string().min(1),
  groupId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data recheck tidak valid' }, { status: 400 })

  try {
    const result = await sendDigiflazzHotelRequest({
      endpoint: 'recheck',
      payload: {
        session: parsed.data.session,
        group_id: parsed.data.groupId,
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal validasi harga hotel'
    const status = error instanceof DigiflazzHotelError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}
