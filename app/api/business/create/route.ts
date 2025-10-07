import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BusinessCreateRequest {
  name: string
  slug: string
  location: string
  timezone: string
  businessType: string
  userId: string
}

const getStarterServices = (businessType: string) => {
  switch (businessType) {
    case 'barber':
      return [
        { name: 'Haircut', duration_min: 45, price_cents: 3500, deposit_cents: 1000 },
        { name: 'Beard Trim', duration_min: 20, price_cents: 1500, deposit_cents: 500 },
        { name: 'Haircut & Beard', duration_min: 60, price_cents: 4500, deposit_cents: 1500 }
      ]
    case 'beauty':
      return [
        { name: 'Manicure', duration_min: 60, price_cents: 3000, deposit_cents: 1000 },
        { name: 'Pedicure', duration_min: 90, price_cents: 4000, deposit_cents: 1500 },
        { name: 'Gel Nails', duration_min: 120, price_cents: 6000, deposit_cents: 2000 }
      ]
    case 'cleaning':
      return [
        { name: 'House Cleaning (Small)', duration_min: 120, price_cents: 8000, deposit_cents: 2000 },
        { name: 'House Cleaning (Large)', duration_min: 240, price_cents: 15000, deposit_cents: 3000 },
        { name: 'Deep Cleaning', duration_min: 300, price_cents: 20000, deposit_cents: 5000 }
      ]
    case 'tutor':
      return [
        { name: '1-on-1 Tutoring', duration_min: 60, price_cents: 5000, deposit_cents: 1000 },
        { name: 'Group Session', duration_min: 90, price_cents: 7500, deposit_cents: 1500 }
      ]
    default:
      return [
        { name: 'Consultation', duration_min: 30, price_cents: 2500, deposit_cents: 500 },
        { name: 'Service', duration_min: 60, price_cents: 5000, deposit_cents: 1000 }
      ]
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BusinessCreateRequest = await request.json()
    const { name, slug, location, timezone, businessType, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      )
    }

    // Validate required fields
    if (!name || !slug || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, timezone' },
        { status: 400 }
      )
    }

    // Create service role client for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // For free users, delete any existing businesses first (assuming all users are free for now)
    const { data: existingBusinesses } = await adminSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
    
    if (existingBusinesses && existingBusinesses.length > 0) {
      for (const existingBusiness of existingBusinesses) {
        await adminSupabase
          .from('businesses')
          .delete()
          .eq('id', existingBusiness.id)
          .eq('owner_id', userId)
      }
    }

    // Create business using service role client
    const businessInsertData = {
      owner_id: userId,
      name,
      slug,
      timezone,
      location,
      messaging_mode: 'manual'
    }
    
    const { data: business, error: businessError } = await adminSupabase
      .from('businesses')
      .insert(businessInsertData)
      .select()
      .single()

    if (businessError) {
      console.error('Business creation error:', businessError)
      if (businessError.code === '23505') {
        return NextResponse.json(
          { error: 'Business URL is already taken. Please choose a different business name.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `Failed to create business: ${businessError.message}` },
        { status: 500 }
      )
    }

    // Create default staff entry for owner
    const { error: staffError } = await adminSupabase
      .from('staff')
      .insert({
        business_id: business.id,
        user_id: userId,
        display_name: 'Owner',
        phone: '',
        role: 'admin'
      })

    if (staffError) {
      console.error('Staff creation error:', staffError)
      return NextResponse.json(
        { error: `Failed to create staff entry: ${staffError.message}` },
        { status: 500 }
      )
    }

    // Create starter services based on business type
    const starterServices = getStarterServices(businessType)
    if (starterServices.length > 0) {
      const { error: servicesError } = await adminSupabase
        .from('services')
        .insert(
          starterServices.map(service => ({
            ...service,
            business_id: business.id
          }))
        )

      if (servicesError) {
        console.error('Services creation error:', servicesError)
        return NextResponse.json(
          { error: `Failed to create services: ${servicesError.message}` },
          { status: 500 }
        )
      }
    }

    // Create default availability (Mon-Fri 9-5)
    const defaultAvailability = []
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      defaultAvailability.push({
        business_id: business.id,
        staff_id: null, // Business-wide availability
        weekday: day,
        start_time: '09:00',
        end_time: '17:00'
      })
    }

    const { error: availabilityError } = await adminSupabase
      .from('availability_rules')
      .insert(defaultAvailability)

    if (availabilityError) {
      console.error('Availability creation error:', availabilityError)
      return NextResponse.json(
        { error: `Failed to create availability: ${availabilityError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug
      }
    })

  } catch (error) {
    console.error('Business creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}