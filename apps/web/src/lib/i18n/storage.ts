import type { Locale } from './index'

const STORAGE_KEY = 'portfolio.locale'

export function loadLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'es') return v
  } catch {
    // ignore
  }
  return null
}

export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // ignore
  }
}
