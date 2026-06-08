import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pulsa_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.$queryRaw<Array<{ reff: number }>>`
      SELECT reff FROM members WHERE phone = ${decoded.phone}
    `

    if (!user || user.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const reffCode = user[0].reff

    const mitras = await prisma.$queryRaw<Array<{
      id: number
      name: string
      phone: string
      created_at: Date
    }>>`
      SELECT id, name, phone, created_at 
      FROM members 
      WHERE upline = ${reffCode}
      ORDER BY created_at DESC
    `

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?ref=${reffCode}`

    return NextResponse.json({
      total: mitras.length,
      referralCode: reffCode.toString(),
      referralLink,
      mitras
    })
  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
