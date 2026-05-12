import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LanguageProvider } from '@/lib/i18n/provider'

export const metadata: Metadata = {
  title: 'Marisame | AI Systems Engineer',
  description:
    'AI Systems Engineer specializing in LangGraph, RAG systems, multi-agent architectures, and LLM applications.',
  keywords: ['AI Engineer', 'LangGraph', 'RAG', 'Multi-agent', 'FastAPI', 'Next.js'],
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
