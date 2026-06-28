import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { nama, oldPassword, newPassword } = await req.json()

    if (!nama?.trim()) {
      return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
    }

    if (oldPassword || newPassword) {
      if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: 'Password lama dan baru harus diisi' }, { status: 400 })
      }

      const memberRows = await prisma.$queryRaw<Array<{ password: string }>>`
        SELECT password FROM members WHERE id = ${Number(session.userId)} LIMIT 1
      `
      
      if (!memberRows || memberRows.length === 0) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      }

      const oldHash = createHash('md5').update(oldPassword).digest('hex')
      if (oldHash !== memberRows[0].password) {
        return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 })
      }

      const hashedPassword = createHash('md5').update(newPassword).digest('hex')
      
      await prisma.$executeRaw`
        UPDATE members 
        SET name = ${nama.trim()}, password = ${hashedPassword}
        WHERE id = ${Number(session.userId)}
        LIMIT 1
      `
    } else {
      await prisma.$executeRaw`
        UPDATE members 
        SET name = ${nama.trim()}
        WHERE id = ${Number(session.userId)}
        LIMIT 1
      `
    }

    return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
