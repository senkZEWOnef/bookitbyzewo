import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
      }

      // Check if user has a business (completed onboarding)
      if (data.user) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', data.user.id)
          .single()

        // If no business, redirect to onboarding
        if (!business) {
          return NextResponse.redirect(new URL('/dashboard/onboarding', request.url))
        }
      }

      // Successful auth, redirect to intended destination
      return NextResponse.redirect(new URL(redirectTo, request.url))
    } catch (err) {
      console.error('Auth exchange error:', err)
      return NextResponse.redirect(new URL('/login?error=auth_exchange_error', request.url))
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login?error=no_auth_code', request.url))
}