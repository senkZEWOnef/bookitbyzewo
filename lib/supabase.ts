import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Singleton client for browser usage
let browserClient: any = null

// For client-side usage - singleton pattern to avoid multiple instances
export const createSupabaseClient = () => {
  // If we're on the server, create a new client each time
  if (typeof window === 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // If we're on the browser, use singleton
  if (!browserClient) {
    console.log('🔄 Creating new Supabase client instance')
    browserClient = createClientComponentClient()
  }

  return browserClient
}

// Legacy export for compatibility
export const createSupabaseClientClient = createSupabaseClient