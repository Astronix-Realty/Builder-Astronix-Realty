import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Builder Astronix Realty | Builder Panel',
  description: 'Manage your real estate townships, projects, and inventory.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
