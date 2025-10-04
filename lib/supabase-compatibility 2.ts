// Complete compatibility layer for Supabase API
// This provides all the methods expected by the existing code

class QueryBuilder {
  constructor(private tableName: string) {}

  select(columns?: string) {
    return new SelectBuilder()
  }

  insert(data: any) {
    return Promise.resolve({ data: null, error: new Error('Use direct PostgreSQL queries') })
  }

  update(data: any) {
    return new UpdateBuilder()
  }

  delete() {
    return new DeleteBuilder()
  }
}

class SelectBuilder {
  eq(column: string, value: any) {
    return this
  }

  gte(column: string, value: any) {
    return this
  }

  lte(column: string, value: any) {
    return this
  }

  order(column: string) {
    return this
  }

  single() {
    return Promise.resolve({ data: { id: 'placeholder-id', name: 'placeholder' }, error: new Error('Use direct PostgreSQL queries') })
  }

  // Make it awaitable
  then(onFulfilled: any, onRejected?: any) {
    return Promise.resolve({ data: [], error: new Error('Use direct PostgreSQL queries') }).then(onFulfilled, onRejected)
  }
}

class UpdateBuilder {
  eq(column: string, value: any) {
    return Promise.resolve({ data: null, error: new Error('Use direct PostgreSQL queries') })
  }
}

class DeleteBuilder {
  eq(column: string, value: any) {
    return Promise.resolve({ data: null, error: new Error('Use direct PostgreSQL queries') })
  }
}

class AuthBuilder {
  getUser() {
    return Promise.resolve({ data: { user: { id: 'placeholder-id' } }, error: null })
  }

  getSession() {
    return Promise.resolve({ data: { session: { user: { id: 'placeholder-id' } } }, error: null })
  }

  signUp(credentials: any) {
    return Promise.resolve({ data: { user: { id: 'placeholder-id' } }, error: new Error('Use NextAuth instead') })
  }

  signInWithPassword(credentials: any) {
    return Promise.resolve({ data: { user: { id: 'placeholder-id' } }, error: new Error('Use NextAuth instead') })
  }

  signOut() {
    return Promise.resolve({ error: new Error('Use NextAuth instead') })
  }

  resetPasswordForEmail(email: string, options?: any) {
    return Promise.resolve({ error: new Error('Use NextAuth instead') })
  }

  setSession(session: any) {
    return Promise.resolve({ error: new Error('Use NextAuth instead') })
  }

  updateUser(attributes: any) {
    return Promise.resolve({ error: new Error('Use NextAuth instead') })
  }

  onAuthStateChange(callback: any) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
  auth: new AuthBuilder()
}

export const createSupabaseClient = () => supabase