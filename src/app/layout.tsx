import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SwissHash — Bitcoin Mining Hashrate Hosting',
  description: 'Miete Bitcoin-Mining-Hashrate auf Abruf. Sofortige Aktivierung, eigener Pool, flexible Laufzeiten.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-slate-950">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
