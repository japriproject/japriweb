import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/digiflazz/callback',
  '/api/digiflazz/prabayar/sync',
  '/api/topup/callback',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('pulsa_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const payload = await verifyToken(token)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('pulsa_token')
    return res
  }

  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
