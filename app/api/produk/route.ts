import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const kategori = searchParams.get('kategori') ?? ''
  const brand = searchParams.get('brand') ?? searchParams.get('operator') ?? ''
  const type = searchParams.get('type') ?? 'prabayar'

  try {
    let rows: any[] = []

    if (type === 'pasca') {
      if (kategori && brand) {
        rows = await prisma.$queryRaw<any[]>`
          SELECT * FROM pasca
          WHERE LOWER(kategori) LIKE LOWER(CONCAT('%', ${kategori}, '%'))
          AND LOWER(brand) = LOWER(${brand})
          ORDER BY sale ASC
        `
      } else if (kategori) {
        rows = await prisma.$queryRaw<any[]>`
          SELECT * FROM pasca
          WHERE LOWER(kategori) LIKE LOWER(CONCAT('%', ${kategori}, '%'))
          ORDER BY sale ASC
        `
      } else if (brand) {
        rows = await prisma.$queryRaw<any[]>`
          SELECT * FROM pasca
          WHERE LOWER(brand) = LOWER(${brand})
          ORDER BY sale ASC
        `
      } else {
        rows = await prisma.$queryRaw<any[]>`
          SELECT * FROM pasca
          ORDER BY sale ASC
          LIMIT 50
        `
      }

      return NextResponse.json(rows.map((row) => ({
        ...row,
        id: String(row.id),
        nama: row.name,
        hargaJual: row.sale,
        operator: row.brand,
      })))
    }

    if (kategori && brand) {
      rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM pulsa 
        WHERE LOWER(kategori) LIKE LOWER(CONCAT('%', ${kategori}, '%'))
        AND LOWER(brand) = LOWER(${brand})
        ORDER BY sale ASC
      `
    } else if (kategori) {
      rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM pulsa 
        WHERE LOWER(kategori) LIKE LOWER(CONCAT('%', ${kategori}, '%'))
        ORDER BY sale ASC
      `
    } else if (brand) {
      rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM pulsa 
        WHERE LOWER(brand) = LOWER(${brand})
        ORDER BY sale ASC
      `
    } else {
      rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM pulsa 
        ORDER BY sale ASC 
        LIMIT 50
      `
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching produk:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
