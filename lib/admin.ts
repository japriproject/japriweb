import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const requireAdmin = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/admin/auth')
  if (session.role === 'admin' && !session.mfa) redirect('/admin/auth')

  const rows = await prisma.$queryRaw<Array<{ id: number; name: string; phone: string; type: number }>>`
    SELECT id, name, phone, type
    FROM members
    WHERE id = ${Number(session.userId)}
    LIMIT 1
  `
  const admin = rows[0]

  if (!admin || admin.type !== 1) redirect('/dashboard')
  return admin
})

export async function getAdminSession() {
  const session = await getSession()
  if (!session) return null
  if (session.role === 'admin' && !session.mfa) return null

  const rows = await prisma.$queryRaw<Array<{ id: number; name: string; phone: string; type: number }>>`
    SELECT id, name, phone, type
    FROM members
    WHERE id = ${Number(session.userId)}
    LIMIT 1
  `
  const admin = rows[0]

  if (!admin || admin.type !== 1) return null
  return admin
}
