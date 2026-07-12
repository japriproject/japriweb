import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type MemberRow = {
  id: number
  name: string
  phone: string
  reff: number
  created_at: Date
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owners = await prisma.$queryRaw<Array<{ reff: number }>>`
    SELECT reff FROM members WHERE id = ${Number(session.userId)} LIMIT 1
  `
  if (!owners[0]) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const levels: MemberRow[][] = []
  let parentRefs = [owners[0].reff]

  for (let level = 1; level <= 5; level += 1) {
    if (parentRefs.length === 0) {
      levels.push([])
      continue
    }

    const members = await prisma.members.findMany({
      where: { upline: { in: parentRefs } },
      select: { id: true, name: true, phone: true, reff: true, created_at: true },
      orderBy: { created_at: 'desc' },
    })
    levels.push(members)
    parentRefs = members.map(member => member.reff)
  }

  return NextResponse.json({
    levels: levels.map((members, index) => ({
      level: index + 1,
      total: members.length,
      members,
    })),
  })
}
