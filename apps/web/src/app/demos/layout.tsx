import type { Metadata } from 'next'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: `Demos | ${site.name}`,
}

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return children
}
