'use client'

import { DemoCard } from '@/components/demos/demo-card'
import { demos } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'

export default function DemosPage() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent-green sm:text-xs">
        {t.demosPage.label}
      </p>
      <h1 className="mb-4 text-2xl font-bold text-text-primary sm:text-4xl">{t.demosPage.title}</h1>
      <p className="mb-10 max-w-2xl text-sm text-text-secondary sm:mb-12 sm:text-base">
        {t.demosPage.description}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {demos.map((demo) => (
          <DemoCard key={demo.href} {...demo} />
        ))}
      </div>
    </div>
  )
}
