import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.$queryRaw<Array<{ sososo: number }>>`
    SELECT sososo FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  return NextResponse.json({ saldo: rows[0]?.sososo ?? 0 })
}
