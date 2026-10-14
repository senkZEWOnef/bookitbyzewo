// Normalizes a user-entered website address. Returns null unless it is a valid http(s) URL.
export function normalizeWebsiteUrl(input?: string | null): string | null {
  const raw = (input || '').trim()
  if (!raw) return null
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}
