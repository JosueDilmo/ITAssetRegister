import type { Metadata } from 'next'
import './globals.css'
import { Montserrat, Oxanium } from 'next/font/google'

export const metadata: Metadata = {
  title: 'IT Asset Reg',
  description: 'IT asset register',
}

const montserrat = Montserrat({
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-montserrat',
})

const oxanium = Oxanium({
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-oxanium',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${oxanium.variable}`}>
      <body className="bg-gray-900 text-gray-50 antialiased">
        <main className="max-w-screen px-5 py-6 md:py-0">
          <h1 className="flex justify-center p-4 font-bold font-heading text-4xl">
            {' '}
            IT Asset Register
          </h1>
          {children}
        </main>
      </body>
    </html>
  )
}
