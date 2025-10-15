// Stub file to prevent import errors
// This project uses Neon database, not Supabase
export const createSupabaseClient = () => {
  console.warn('⚠️ Warning: This project uses Neon database, not Supabase. Please update the import.')
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase is disabled' } }),
      resetPasswordForEmail: () => Promise.resolve({ error: { message: 'Password reset not available' } }),
      updateUser: () => Promise.resolve({ error: { message: 'User update not available' } }),
      setSession: () => Promise.resolve({ data: null, error: null }),
      refreshSession: () => Promise.resolve({ data: { user: null }, error: { message: 'Session refresh not available' } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ error: { message: 'Database operations disabled' } }),
      update: () => ({ eq: () => Promise.resolve({ error: { message: 'Database operations disabled' } }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Database operations disabled' } }) })
    })
  }
}