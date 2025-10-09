import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  }
})

export const createSupabaseClient = () => supabase

// Reliable auth functions that handle timeouts
export const signIn = async (email: string, password: string) => {
  try {
    // Try Supabase client first with timeout
    const authPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 5000)
    )
    
    const result = await Promise.race([authPromise, timeoutPromise])
    return result
  } catch (error) {
    if (error.message === 'timeout') {
      // Fallback to direct API call
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      
      if (result.error) {
        return { data: { user: null, session: null }, error: result }
      }
      
      // Store session in Supabase client format
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token
      })
      
      return { 
        data: { 
          user: result.user, 
          session: { 
            access_token: result.access_token,
            refresh_token: result.refresh_token
          }
        }, 
        error: null 
      }
    }
    throw error
  }
}

export const getUser = async () => {
  try {
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 3000)
    )
    
    return await Promise.race([userPromise, timeoutPromise])
  } catch (error) {
    if (error.message === 'timeout') {
      // Fallback to session check
      const { data: { session } } = await supabase.auth.getSession()
      return { data: { user: session?.user || null }, error: null }
    }
    throw error
  }
}

// Legacy export for compatibility
export const createSupabaseClientClient = createSupabaseClient