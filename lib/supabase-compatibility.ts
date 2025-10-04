// Complete compatibility layer for Supabase API
// This provides all the methods expected by the existing code

class QueryBuilder {
  constructor(private tableName: string) {}

  select(columns?: string) {
    return new SelectBuilder()
  }

  insert(data: any) {
    return new SelectBuilder()
  }

  upsert(data: any, options?: any) {
    return new SelectBuilder()
  }

  update(data: any) {
    return new UpdateBuilder()
  }

  delete() {
    return new DeleteBuilder()
  }
}

class SelectBuilder {
  select(columns?: string) {
    return this
  }

  eq(column: string, value: any) {
    return this
  }

  neq(column: string, value: any) {
    return this
  }

  gte(column: string, value: any) {
    return this
  }

  lte(column: string, value: any) {
    return this
  }

  lt(column: string, value: any) {
    return this
  }

  is(column: string, value: any) {
    return this
  }

  in(column: string, values: any[]) {
    return this
  }

  order(column: string, options?: any) {
    return this
  }

  limit(count: number) {
    return this
  }

  single() {
    // Generic mock data that includes properties from multiple tables
    const mockData = {
      // Business properties
      id: 'placeholder-id',
      owner_id: 'placeholder-id',
      name: 'placeholder',
      logo_url: '',
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      slug: 'placeholder',
      timezone: 'America/Puerto_Rico',
      location: 'Placeholder Location',
      has_hero_section: true,
      hero_title: 'Welcome to placeholder',
      hero_subtitle: 'Book your appointment in just a few clicks',
      hero_image_url: '',
      font_family: 'Inter',
      booking_button_text: 'Book Now',
      booking_button_style: 'solid',
      accent_color: '#28a745',
      whatsapp_enabled: true,
      whatsapp_message_template: 'Hi! I would like to book an appointment.',
      slogan: '',
      phone: '',
      email: '',
      whatsapp_number: '',
      about_text: '',
      social_facebook: '',
      social_instagram: '',
      social_twitter: '',
      social_linkedin: '',
      social_tiktok: '',
      business_hours: {},
      show_business_hours: true,
      call_to_action_text: 'Book Now',
      hero_overlay_opacity: 0.4,
      branding_completed: false,
      messaging_mode: 'manual' as const,
      // Profile properties
      full_name: 'Placeholder User',
      avatar_url: '',
      // Service properties
      description: 'Placeholder service',
      duration_min: 60,
      price_cents: 5000,
      deposit_cents: 1000,
      buffer_before_min: 0,
      buffer_after_min: 0,
      max_per_slot: 1,
      // Appointment properties
      status: 'confirmed',
      business_id: 'placeholder-id',
      service_id: 'placeholder-id',
      staff_id: 'placeholder-id',
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      customer_name: 'Placeholder Customer',
      customer_phone: '+1234567890',
      customer_email: 'customer@example.com',
      customer_locale: 'en' as const,
      created_at: new Date().toISOString(),
      // Payment properties
      meta: {
        appointment_id: 'placeholder-id'
      },
      // Related objects
      services: {
        name: 'Placeholder Service',
        description: 'Placeholder service description',
        duration_min: 60,
        price_cents: 5000,
        deposit_cents: 1000
      },
      businesses: {
        name: 'Placeholder Business',
        location: 'Placeholder Location'
      },
      // Add other common properties as needed
    }
    return Promise.resolve({ data: mockData, error: Object.assign(new Error('Use direct PostgreSQL queries'), { code: 'MOCK_ERROR', details: 'Mock error details', hint: 'Use direct PostgreSQL implementation' }) })
  }

  // Make it awaitable
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: [], error: Object.assign(new Error('Use direct PostgreSQL queries'), { code: 'MOCK_ERROR', details: 'Mock error details', hint: 'Use direct PostgreSQL implementation' }) }).then(onfulfilled, onrejected)
  }
}

class UpdateBuilder {
  eq(column: string, value: any) {
    return Promise.resolve({ data: null, error: Object.assign(new Error('Use direct PostgreSQL queries'), { code: 'MOCK_ERROR', details: 'Mock error details', hint: 'Use direct PostgreSQL implementation' }) })
  }
}

class DeleteBuilder {
  eq(column: string, value: any) {
    return this
  }

  is(column: string, value: any) {
    return this
  }

  // Make it awaitable
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: null, error: Object.assign(new Error('Use direct PostgreSQL queries'), { code: 'MOCK_ERROR', details: 'Mock error details', hint: 'Use direct PostgreSQL implementation' }) }).then(onfulfilled, onrejected)
  }
}

class AuthBuilder {
  private getStoredSession() {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('mock_session')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private setStoredSession(session: any) {
    if (typeof window === 'undefined') return
    if (session) {
      localStorage.setItem('mock_session', JSON.stringify(session))
    } else {
      localStorage.removeItem('mock_session')
    }
  }

  getUser() {
    const session = this.getStoredSession()
    return Promise.resolve({ data: { user: session?.user || null }, error: null })
  }

  getSession() {
    const session = this.getStoredSession()
    return Promise.resolve({ data: { session }, error: null })
  }

  signUp(credentials: any) {
    // For testing: simulate successful signup
    const userMetadata = { plan: 'free', subscription: 'free', full_name: '', phone: '', avatar_url: '' }
    const user = { id: 'test-user-id', email: credentials.email, user_metadata: userMetadata }
    const session = { user, access_token: 'mock-token' }
    
    console.log('Mock signUp called with:', credentials)
    this.setStoredSession(session)
    
    return Promise.resolve({ 
      data: { user, session }, 
      error: null 
    })
  }

  signInWithPassword(credentials: any) {
    // For testing: simulate successful login
    const userMetadata = { plan: 'free', subscription: 'free', full_name: '', phone: '', avatar_url: '' }
    const user = { id: 'test-user-id', email: credentials.email, user_metadata: userMetadata }
    const session = { user, access_token: 'mock-token' }
    
    console.log('Mock signIn called with:', credentials)
    this.setStoredSession(session)
    
    return Promise.resolve({ 
      data: { user, session }, 
      error: null 
    })
  }

  signOut() {
    // For testing: simulate successful logout
    console.log('Mock signOut called')
    this.setStoredSession(null)
    return Promise.resolve({ error: null })
  }

  resetPasswordForEmail(email: string, options?: any) {
    return Promise.resolve({ error: Object.assign(new Error('Use NextAuth instead'), { code: 'AUTH_DISABLED' }) })
  }

  setSession(session: any) {
    return Promise.resolve({ error: Object.assign(new Error('Use NextAuth instead'), { code: 'AUTH_DISABLED' }) })
  }

  updateUser(attributes: any) {
    return Promise.resolve({ error: Object.assign(new Error('Use NextAuth instead'), { code: 'AUTH_DISABLED' }) })
  }

  refreshSession() {
    const userMetadata = { plan: 'free', subscription: 'free', full_name: '', phone: '', avatar_url: '' }
    return Promise.resolve({ data: { user: { id: 'placeholder-id', email: 'placeholder@example.com', user_metadata: userMetadata } }, error: Object.assign(new Error('Use NextAuth instead'), { code: 'AUTH_DISABLED' }) })
  }

  onAuthStateChange(callback: any) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}

class StorageBuilder {
  listBuckets() {
    return Promise.resolve({ data: [{ name: 'placeholder-bucket' }], error: Object.assign(new Error('Use direct file storage'), { code: 'STORAGE_DISABLED' }) })
  }

  from(bucket: string) {
    return {
      upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: Object.assign(new Error('Use direct file storage'), { code: 'STORAGE_DISABLED' }) }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      remove: (paths: string[]) => Promise.resolve({ data: [], error: Object.assign(new Error('Use direct file storage'), { code: 'STORAGE_DISABLED' }) }),
    }
  }
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
  auth: new AuthBuilder(),
  storage: new StorageBuilder()
}

export const createSupabaseClient = () => supabase