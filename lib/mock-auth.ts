// Mock authentication for development when Supabase is unreachable
export const mockAuth = {
  // Mock user data
  mockUser: {
    id: '7d2b3588-4e45-4a72-a0cc-14859a3496e8',
    email: 'ralph.ulysse509@gmail.com',
    user_metadata: {
      full_name: 'Ralph Ulysse',
      phone: '+1787555001'
    }
  },

  // Mock login function
  signInWithPassword: async (credentials: { email: string; password: string }) => {
    console.log('🔧 MOCK AUTH: Simulating login for:', credentials.email)
    
    // Simulate correct credentials
    if (credentials.email === 'ralph.ulysse509@gmail.com' && credentials.password === 'Poesie509$$$') {
      // Store in localStorage to persist across page reloads
      localStorage.setItem('mock_session', JSON.stringify({
        user: mockAuth.mockUser,
        session: { access_token: 'mock_token_12345' }
      }))
      
      return {
        data: {
          user: mockAuth.mockUser,
          session: { access_token: 'mock_token_12345' }
        },
        error: null
      }
    }
    
    return {
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    }
  },

  // Mock get user function
  getUser: async () => {
    console.log('🔧 MOCK AUTH: Getting current user')
    
    const mockSession = localStorage.getItem('mock_session')
    if (mockSession) {
      const { user } = JSON.parse(mockSession)
      return {
        data: { user },
        error: null
      }
    }
    
    return {
      data: { user: null },
      error: null
    }
  },

  // Mock sign out function
  signOut: async () => {
    console.log('🔧 MOCK AUTH: Signing out')
    localStorage.removeItem('mock_session')
    return { error: null }
  },

  // Mock auth state change listener
  onAuthStateChange: (callback: any) => {
    console.log('🔧 MOCK AUTH: Setting up auth state listener')
    
    // Check initial state
    const mockSession = localStorage.getItem('mock_session')
    if (mockSession) {
      const { user, session } = JSON.parse(mockSession)
      setTimeout(() => callback('SIGNED_IN', { user, ...session }), 100)
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 100)
    }
    
    // Return mock subscription
    return {
      data: {
        subscription: {
          unsubscribe: () => console.log('🔧 MOCK AUTH: Unsubscribed from auth changes')
        }
      }
    }
  }
}

// Check if we should use mock auth
export const shouldUseMockAuth = () => {
  if (typeof window === 'undefined') return false
  
  // Use mock auth if localStorage has the flag set, or if we detect connectivity issues
  const useMock = localStorage.getItem('use_mock_auth') === 'true'
  const hasConnectivityIssues = localStorage.getItem('supabase_connectivity_failed') === 'true'
  
  return useMock || hasConnectivityIssues
}

// Enable mock auth mode
export const enableMockAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('use_mock_auth', 'true')
    console.log('🔧 MOCK AUTH: Enabled mock authentication mode')
  }
}

// Disable mock auth mode
export const disableMockAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('use_mock_auth')
    localStorage.removeItem('supabase_connectivity_failed')
    console.log('🔧 MOCK AUTH: Disabled mock authentication mode')
  }
}