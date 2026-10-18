import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ | Builder & Mandate Panel',
  description: 'Manage real estate townships, projects, inventory, and leads on Λꜱᴛʀᴏɴɪx ʀᴇᴀʟᴛʏ.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-icon.png',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${inter.className} h-full`}>
        <GoogleAnalytics />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
