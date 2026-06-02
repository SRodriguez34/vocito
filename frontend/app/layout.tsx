import type { Metadata } from 'next'
import { Lora, DM_Sans } from 'next/font/google'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vocito — Cuentos en tu voz',
  description: 'Presencia emocional a distancia. Cuentos para tus hijos con tu propia voz.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lora.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full bg-[#0D0A12] text-[#F0EAE0] font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
