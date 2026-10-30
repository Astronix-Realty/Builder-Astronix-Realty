import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://builder.astronixrealty.com'),
  title: {
    default: 'Astronix Realty | Builder & Mandate Portal',
    template: '%s | Astronix Realty',
  },
  description: 'Official Developer & Mandate Network of Astronix Realty. Manage RERA-registered projects, inventory, real-time leads, and partner distribution across Mumbai MMR.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Astronix Realty | Builder & Mandate Portal',
    description: 'Official Developer & Mandate Network of Astronix Realty. Manage RERA-registered projects, inventory, real-time leads, and partner distribution across Mumbai MMR.',
    url: 'https://builder.astronixrealty.com',
    siteName: 'Astronix Realty Builder Network',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://builder.astronixrealty.com/og-image.jpg',
        secureUrl: 'https://builder.astronixrealty.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Astronix Realty Builder & Mandate Portal',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astronix Realty | Builder & Mandate Portal',
    description: 'Official Developer & Mandate Network of Astronix Realty. Manage RERA-registered projects, inventory, real-time leads, and partner distribution across Mumbai MMR.',
    images: ['https://builder.astronixrealty.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
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
