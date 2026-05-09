const KEY = 'portfolio.chat.threadIds'
export const MAX_THREADS = 5

export function loadThreadIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const v = localStorage.getItem(KEY)
    if (!v) return []
    const parsed = JSON.parse(v)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveThreadIds(ids: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(ids))
  }
}

export function addThreadId(id: string): { ids: string[]; evicted: string | null } {
  const current = loadThreadIds().filter((x) => x !== id)
  const next = [id, ...current]
  let evicted: string | null = null
  if (next.length > MAX_THREADS) {
    evicted = next.pop() ?? null
  }
  saveThreadIds(next)
  return { ids: next, evicted }
}

export function removeThreadId(id: string): string[] {
  const next = loadThreadIds().filter((x) => x !== id)
  saveThreadIds(next)
  return next
}
