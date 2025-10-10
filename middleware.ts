import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Just pass everything through - handle auth client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhook endpoints that don't need auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/payments/stripe-webhook|api/payments/ath-callback).*)',
  ],
}