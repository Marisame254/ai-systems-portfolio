import { en, type Dictionary } from './en'
import { es } from './es'

export type Locale = 'en' | 'es'

export const DEFAULT_LOCALE: Locale = 'en'

export const dictionaries: Record<Locale, Dictionary> = { en, es }

export type { Dictionary }
