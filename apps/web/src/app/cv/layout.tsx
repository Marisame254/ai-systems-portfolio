import type { Metadata } from 'next'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: `CV | ${site.name}`,
}

export default function CVLayout({ children }: { children: React.ReactNode }) {
  return children
}
