import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const kategori = searchParams.get('kategori') || ''
    const type = searchParams.get('type') || 'prabayar'

    if (type === 'pasca') {
      const brands = await prisma.$queryRaw<Array<{ brand: string }>>`
        SELECT DISTINCT brand FROM pasca
        WHERE LOWER(kategori) LIKE '%pasca%'
        AND LOWER(kategori) LIKE LOWER(CONCAT('%', ${kategori}, '%'))
        ORDER BY brand ASC
      `

      return NextResponse.json({
        brands: brands.map(b => b.brand)
      })
    }

    const brands = await prisma.$queryRaw<Array<{ brand: string }>>`
      SELECT DISTINCT brand FROM pulsa 
      WHERE LOWER(kategori) LIKE LOWER(CONCAT('%', ${kategori}, '%'))
      ORDER BY brand ASC
    `
    
    return NextResponse.json({
      brands: brands.map(b => b.brand)
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
