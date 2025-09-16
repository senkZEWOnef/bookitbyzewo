import { createClient } from '@supabase/supabase-js'

// Singleton client for browser usage
let browserClient: any = null

// For client-side usage - singleton pattern to avoid multiple instances
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // If we're on the server, create a new client each time
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // If we're on the browser, use singleton
  if (!browserClient) {
    console.log('🔄 Creating new Supabase client instance')
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  return browserClient
}

// Legacy export for compatibility
export const createSupabaseClientClient = createSupabaseClient