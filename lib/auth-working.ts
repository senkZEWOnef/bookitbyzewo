// Working auth that bypasses the hanging Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const workingAuth = {
  async signIn(email: string, password: string) {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()
      
      if (response.ok) {
        // Store the session manually
        if (typeof window !== 'undefined') {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user,
            expires_at: Date.now() + (result.expires_in * 1000)
          }))
        }
        
        return { data: { user: result.user }, error: null }
      } else {
        console.error('Auth API error:', result)
        return { data: null, error: { message: result.error_description || result.msg || `HTTP ${response.status}` } }
      }
    } catch (err) {
      console.error('Auth catch error:', err)
      return { data: null, error: { message: `Network error: ${err}` } }
    }
  },

  async getUser() {
    try {
      if (typeof window === 'undefined') return { data: { user: null }, error: null }
      
      const stored = localStorage.getItem('supabase.auth.token')
      if (!stored) return { data: { user: null }, error: null }
      
      const session = JSON.parse(stored)
      
      // Check if expired
      if (Date.now() > session.expires_at) {
        localStorage.removeItem('supabase.auth.token')
        return { data: { user: null }, error: null }
      }
      
      return { data: { user: session.user }, error: null }
    } catch {
      return { data: { user: null }, error: null }
    }
  },

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
    }
    return { error: null }
  }
}