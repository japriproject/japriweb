import { NextResponse } from 'next/server'

export async function GET() {
  const raw = process.env.DIGIFLAZZ_BONUS_LEVELS || process.env.DIGIFLAZZ_BONUS_AMOUNTS || ''
  const levels = raw
    .split(',')
    .map(v => Math.floor(Number(v.trim())))
    .filter(v => Number.isFinite(v) && v > 0)
    .slice(0, 5)

  return NextResponse.json({ levels: levels.length ? levels : [500, 250, 150, 100, 50] })
}
