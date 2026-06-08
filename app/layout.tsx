import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Japri Pay',
  description: 'Aplikasi Pulsa & Paket Data',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 min-h-screen antialiased">
        <div className="mx-auto max-w-md min-h-screen relative bg-white shadow-lg">
          {children}
        </div>
      </body>
    </html>
  )
}
