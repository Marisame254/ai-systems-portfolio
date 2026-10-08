'use client'

import { DemoCard } from '@/components/demos/demo-card'
import { demos } from '@/lib/demos'
import { useLanguage } from '@/lib/i18n/provider'

export default function DemosPage() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        {t.demosPage.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
        {t.demosPage.description}
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <DemoCard key={demo.id} {...demo} />
        ))}
      </div>
    </div>
  )
}
