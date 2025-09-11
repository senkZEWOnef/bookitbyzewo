'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createBusiness(businessData: {
  name: string
  slug: string
  timezone: string
  location: string
  businessType: string
}) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    console.log('Server: Creating business for user:', user.id)

    // Ensure profile exists first
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || ''
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Server: Profile upsert error:', profileError)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: businessData.name,
        slug: businessData.slug,
        timezone: businessData.timezone,
        location: businessData.location,
        messaging_mode: 'manual'
      })
      .select()
      .single()

    if (businessError) {
      console.error('Server: Business creation error:', businessError)
      throw new Error(`Failed to create business: ${businessError.message}`)
    }

    console.log('Server: Business created successfully:', business.id)
    return { business, error: null }

  } catch (error) {
    console.error('Server: Business creation failed:', error)
    return { 
      business: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}