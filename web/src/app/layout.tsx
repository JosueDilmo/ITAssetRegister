import type { Metadata } from 'next'
import './globals.css'
import { IBM_Plex_Mono, Montserrat, Oxanium } from 'next/font/google'
import { APP_VERSION } from '@/shared/constants/version'

export const metadata: Metadata = {
  title: 'IT Asset Reg',
  description: 'IT asset register',
}

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
})

const oxanium = Oxanium({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-oxanium',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${oxanium.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-gray-900 text-gray-50 antialiased">
        <main className="max-w-screen">
          <header className="flex items-center justify-center gap-3 px-6 py-5 border-b border-gray-600">
            <h1 className="font-heading font-bold text-3xl tracking-widest uppercase text-gray-50">
              IT Asset Register
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded border border-blue-500 text-blue bg-blue-500">
              v{APP_VERSION}
            </span>
          </header>
          {children}
        </main>
      </body>
    </html>
  )
}
