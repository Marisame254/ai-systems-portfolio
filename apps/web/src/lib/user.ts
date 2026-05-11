const STORAGE_KEY = 'portfolio_user_id'

export function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = window.localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    window.localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
