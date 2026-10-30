import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://builder.astronixrealty.com'),
  title: {
    default: 'Astronix Realty | Real Estate Management Platform',
    template: '%s | Astronix Realty',
  },
  description: 'Explore the Astronix Realty platform for real estate projects, property management and builder services.',
  applicationName: 'Astronix Realty',
  authors: [{ name: 'Astronix Realty', url: 'https://astronixrealty.com' }],
  creator: 'Astronix Realty',
  publisher: 'Astronix Realty',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Astronix Realty | Real Estate Management Platform',
    description: 'Explore the Astronix Realty platform for real estate projects, property management and builder services.',
    url: 'https://builder.astronixrealty.com',
    siteName: 'Astronix Realty',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://builder.astronixrealty.com/og-image.png',
        secureUrl: 'https://builder.astronixrealty.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Astronix Realty | Real Estate Management Platform',
        type: 'image/png',
      },
      {
        url: 'https://builder.astronixrealty.com/og-image.jpg',
        secureUrl: 'https://builder.astronixrealty.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Astronix Realty | Real Estate Management Platform',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astronix Realty | Real Estate Management Platform',
    description: 'Explore the Astronix Realty platform for real estate projects, property management and builder services.',
    images: ['https://builder.astronixrealty.com/og-image.png'],
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
