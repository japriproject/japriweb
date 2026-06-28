import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/email-verification/confirm',
  '/api/digiflazz/callback',
  '/api/digiflazz/prabayar/sync',
  '/api/digiflazz/pascabayar/sync',
  '/api/topup/callback',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApiRequest = pathname.startsWith('/api/')

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('pulsa_token')?.value
  if (!token) {
    if (isApiRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    if (isApiRequest) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      res.cookies.delete('pulsa_token')
      return res
    }

    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('pulsa_token')
    return res
  }

  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    if (isApiRequest) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}


