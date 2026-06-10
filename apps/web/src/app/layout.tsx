import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LanguageProvider } from '@/lib/i18n/provider'
import { Analytics } from '@vercel/analytics/next'

const description =
  'AI Systems Engineer specializing in LangGraph, RAG systems, multi-agent architectures, and LLM applications.'

export const metadata: Metadata = {
  metadataBase: new URL('https://marisame.dev'),
  title: 'Marisame | AI Systems Engineer',
  description,
  keywords: ['AI Engineer', 'LangGraph', 'RAG', 'Multi-agent', 'FastAPI', 'Next.js'],
  openGraph: {
    title: 'Marisame | AI Systems Engineer',
    description,
    siteName: 'Marisame',
    type: 'website',
    locale: 'es_ES',
    url: 'https://marisame.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marisame | AI Systems Engineer',
    description,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
