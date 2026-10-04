import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
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
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
