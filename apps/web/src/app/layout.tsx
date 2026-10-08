import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LanguageProvider } from '@/lib/i18n/provider'
import { site } from '@/lib/site'
import { Analytics } from '@vercel/analytics/next'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

const title = `${site.name} | ${site.role}`
const description =
  'AI systems engineer building LLM agents with LangGraph: tool-calling, retrieval over your documents, and long-term memory. Live demos included.'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  authors: [{ name: site.name, url: site.url }],
  keywords: [
    site.name,
    site.handle,
    'AI Engineer',
    'LangGraph',
    'RAG',
    'Multi-agent',
    'FastAPI',
    'Next.js',
  ],
  openGraph: {
    title,
    description,
    siteName: site.name,
    type: 'website',
    locale: 'es_ES',
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0e12',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-background font-sans text-text-primary antialiased">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
