'use client'

import { useLanguage } from '@/lib/i18n/provider'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-border py-8 text-center">
      <p className="font-mono text-sm text-text-muted">
        <span className="text-accent-green">{'>'}</span> {t.footer.builtBy}{' '}
        <span className="text-text-secondary">Marisame</span> {t.footer.with}{' '}
        <span className="text-accent-cyan">LangGraph</span> ·{' '}
        <span className="text-accent-cyan">LangChain</span> ·{' '}
        <span className="text-accent-cyan">Next.js</span>
      </p>
    </footer>
  )
}
