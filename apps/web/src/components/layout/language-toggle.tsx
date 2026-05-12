'use client'

import { useLanguage } from '@/lib/i18n/provider'
import type { Locale } from '@/lib/i18n'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage()
  const options: Locale[] = ['en', 'es']
  return (
    <div
      className={`inline-flex overflow-hidden rounded-md border border-border font-mono text-xs ${className}`}
      role="group"
      aria-label="Language"
    >
      {options.map((opt, i) => {
        const active = locale === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setLocale(opt)}
            aria-pressed={active}
            className={`px-2 py-1 transition-colors ${
              active
                ? 'bg-accent-green/15 text-accent-green'
                : 'text-text-muted hover:text-text-primary'
            } ${i === 0 ? 'border-r border-border' : ''}`}
          >
            {opt.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
