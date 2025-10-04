// Simplified auth for development
// This replaces the complex Supabase auth during migration

export function useAuth() {
  // Return a mock user for now
  return {
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    signIn: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    signUp: async () => ({ error: null })
  }
}

export const auth = {
  getUser: () => Promise.resolve({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
  signIn: () => Promise.resolve({ error: null }),
  signOut: () => Promise.resolve({ error: null }),
  signUp: () => Promise.resolve({ error: null })
}