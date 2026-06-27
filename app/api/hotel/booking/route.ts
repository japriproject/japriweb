import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DigiflazzHotelError, sendDigiflazzHotelRequest } from '@/lib/digiflazz'
import { applyHotelMarkup, HOTEL_MARKUP_PERCENT } from '@/lib/hotel-pricing'
import { toInt } from '@/lib/money'
import { z } from 'zod'

const schema = z.object({
  session: z.string().min(1),
  groupId: z.string().min(1),
  propertyId: z.string().min(1),
  propertyName: z.string().min(1),
  cityName: z.string().optional().default(''),
  roomName: z.string().optional().default(''),
  checkIn: z.string().min(8),
  checkOut: z.string().min(8),
  guest: z.object({
    salutation: z.enum(['Mr', 'Ms', 'Mrs']).default('Mr'),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(8).optional().or(z.literal('')),
  }),
})

function generateHotelInvoice() {
  return 'HTL' + Date.now() + Math.floor(Math.random() * 1000)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function getRecheckPrice(response: unknown, groupId: string) {
  const root = asRecord(response)
  const data = asRecord(root.data)
  const rooms = Array.isArray(data.rooms) ? data.rooms : []

  for (const roomValue of rooms) {
    const room = asRecord(roomValue)
    const groups = Array.isArray(room.groups) ? room.groups : []
    for (const groupValue of groups) {
      const group = asRecord(groupValue)
      if (String(group.group_id ?? '') === groupId) return toInt(group.total_price)
    }
  }

  return 0
}

function resolveBookingStatus(response: unknown) {
  const raw = JSON.stringify(response).toLowerCase()
  if (raw.includes('gagal') || raw.includes('failed')) return 'FAILED'
  if (raw.includes('sukses') || raw.includes('success')) return 'SUCCESS'
  return 'PENDING'
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data booking hotel tidak valid' }, { status: 400 })

  const data = parsed.data
  let baseAmount = 0

  try {
    const recheck = await sendDigiflazzHotelRequest({
      endpoint: 'recheck',
      payload: { session: data.session, group_id: data.groupId },
    })
    baseAmount = getRecheckPrice(recheck, data.groupId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memvalidasi harga kamar'
    const status = error instanceof DigiflazzHotelError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }

  if (baseAmount <= 0) return NextResponse.json({ error: 'Harga kamar hasil recheck tidak valid' }, { status: 422 })

  const amount = applyHotelMarkup(baseAmount)
  const invoice = generateHotelInvoice()

  const memberRows = await prisma.$queryRaw<Array<{ phone: string; sososo: number }>>`
    SELECT phone, sososo FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  const member = memberRows[0] ?? null
  if (!member) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  if (toInt(member.sososo) < amount) return NextResponse.json({ error: 'Saldo tidak cukup' }, { status: 400 })

  const booking = await prisma.$transaction(async (tx) => {
    const updated = await tx.$executeRaw`
      UPDATE members
      SET sososo = sososo - ${amount}
      WHERE id = ${Number(session.userId)} AND sososo >= ${amount}
    `

    if (updated !== 1) throw new Error('Saldo tidak cukup')

    return tx.hotel_booking.create({
      data: {
        invoice,
        member_id: Number(session.userId),
        member_phone: member.phone,
        session_id: data.session,
        group_id: data.groupId,
        property_id: data.propertyId,
        property_name: data.propertyName,
        city_name: data.cityName,
        room_name: data.roomName,
        check_in: data.checkIn,
        check_out: data.checkOut,
        guest_name: `${data.guest.firstName} ${data.guest.lastName}`.trim(),
        guest_email: data.guest.email || null,
        guest_phone: data.guest.phone || null,
        total_price: amount,
        status: 'PENDING',
      },
    })
  }).catch((error) => {
    if (error instanceof Error && error.message === 'Saldo tidak cukup') return null
    throw error
  })

  if (!booking) return NextResponse.json({ error: 'Saldo tidak cukup' }, { status: 400 })

  try {
    const result = await sendDigiflazzHotelRequest({
      endpoint: 'booking',
      payload: {
        session: data.session,
        group_id: data.groupId,
        ref_id: invoice,
        pax: {
          salutation: data.guest.salutation,
          first_name: data.guest.firstName,
          last_name: data.guest.lastName,
        },
      },
    })

    const status = resolveBookingStatus(result)
    await prisma.hotel_booking.update({
      where: { id: booking.id },
      data: {
        status,
        provider_response: result as object,
        updated_at: new Date(),
      },
    })

    if (status === 'FAILED') {
      await prisma.$executeRaw`
        UPDATE members
        SET sososo = sososo + ${amount}
        WHERE id = ${Number(session.userId)}
      `
    }

    return NextResponse.json({
      id: booking.id,
      invoice,
      status,
      amount,
      baseAmount,
      markupPercent: HOTEL_MARKUP_PERCENT,
      provider: result,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Booking hotel gagal diproses provider'
    await prisma.$transaction(async (tx) => {
      await tx.hotel_booking.update({
        where: { id: booking.id },
        data: {
          status: 'FAILED',
          provider_response: { error: message },
          updated_at: new Date(),
        },
      })
      await tx.$executeRaw`
        UPDATE members
        SET sososo = sososo + ${amount}
        WHERE id = ${Number(session.userId)}
      `
    })

    const status = error instanceof DigiflazzHotelError ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}
