import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getSession()
  if (session) {
    await prisma.$executeRaw`UPDATE members SET login_status = 0, date_logout = NOW() WHERE id = ${Number(session.userId)}`
  }
  const res = NextResponse.json({ message: 'Logout berhasil' })
  res.cookies.delete('pulsa_token')
  return res
}
