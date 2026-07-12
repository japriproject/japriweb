import type { Metadata, Viewport } from 'next'
import './globals.css'
import SiteShell from './SiteShell'

export const metadata: Metadata = {
  title: 'Japri Pay',
  description: 'Aplikasi Pulsa & Paket Data',
  icons: { icon: '/logo.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 min-h-screen antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
