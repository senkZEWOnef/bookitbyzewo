'use client'

// Many pages call our own /api routes without an Authorization header, but those routes now require the login token.
// This adds the stored token to same-origin /api requests that don't already carry one.
// The module runs when the bundle loads, before any component effect can fire a request.
if (typeof window !== 'undefined' && !(window as any).__authFetchInstalled) {
  ;(window as any).__authFetchInstalled = true
  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const sameOriginApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`)
      if (sameOriginApi) {
        const token = localStorage.getItem('token')
        const headers = new Headers(init?.headers || (typeof input === 'object' && 'headers' in input ? (input as Request).headers : undefined))
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`)
          return originalFetch(input, { ...init, headers })
        }
      }
    } catch {
      // fall through to the plain request
    }
    return originalFetch(input, init)
  }
}

export default function AuthFetch() {
  return null
}
