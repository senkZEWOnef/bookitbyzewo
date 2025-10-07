import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Auth routes that should redirect to dashboard if already logged in
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/services', '/staff', '/settings', '/calendar']
  
  // Public routes that don't require auth
  const publicRoutes = ['/book', '/api/book', '/api/slots', '/api/calendar', '/pricing']

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not logged in and trying to access protected routes, redirect to login
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check subscription access for authenticated users on protected routes
  if (session && protectedRoutes.some(route => pathname.startsWith(route))) {
    // Skip admin routes
    if (pathname.startsWith('/admin')) {
      return res
    }

    try {
      const accessCheckUrl = new URL('/api/check-access', request.url)
      accessCheckUrl.searchParams.set('userId', session.user.id)
      
      const accessCheck = await fetch(accessCheckUrl)

      if (accessCheck.ok) {
        const accessData = await accessCheck.json()
        
        if (!accessData.hasAccess) {
          // Redirect to payment required page with reason
          const paymentUrl = new URL('/payment-required', request.url)
          paymentUrl.searchParams.set('reason', accessData.reason)
          if (accessData.businessName) {
            paymentUrl.searchParams.set('business', accessData.businessName)
          }
          return NextResponse.redirect(paymentUrl)
        }
      }
    } catch (error) {
      // If access check fails, allow access but log error
      console.error('Access check failed:', error)
    }
  }

  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return res
  }

  // Handle root redirect
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Let unauthenticated users see the landing page
    return res
  }

  return res
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