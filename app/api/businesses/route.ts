import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, slug, location, timezone, businessType, userId } = await request.json()

    console.log('🟢 Business creation request:', { name, slug, location, timezone, businessType, userId })

    if (!name || !slug || !userId) {
      console.log('🔴 Missing required fields:', { name: !!name, slug: !!slug, userId: !!userId })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if slug is already taken
    console.log('🟡 Checking if slug exists:', slug)
    const existingBusiness = await query(
      'SELECT id FROM businesses WHERE slug = $1',
      [slug]
    )

    if (existingBusiness.rows.length > 0) {
      console.log('🔴 Slug already taken:', slug)
      return NextResponse.json({ error: 'Booking URL already taken' }, { status: 400 })
    }

    // Create the business
    console.log('🟡 Creating business with data:', { name, slug, location, timezone, userId })
    const result = await query(
      `INSERT INTO businesses (
        name, slug, location, timezone, owner_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING id, name, slug`,
      [
        name,
        slug,
        location || null,
        timezone,
        userId
      ]
    )

    const business = result.rows[0]
    console.log('🟢 Business created successfully:', business)

    // Create default services based on business type
    const starterServices = getStarterServices(businessType)
    console.log('🟡 Creating', starterServices.length, 'starter services for business type:', businessType)
    
    for (const service of starterServices) {
      console.log('🟡 Creating service:', service.name)
      await query(
        `INSERT INTO services (
          business_id, name, duration_minutes, price_cents, deposit_cents, 
          is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
        [
          business.id,
          service.name,
          service.duration_min,
          service.price_cents,
          service.deposit_cents
        ]
      )
    }
    
    console.log('🟢 All services created successfully')

    // Create default availability rules (Monday-Friday 9AM-5PM, Saturday 10AM-3PM)
    const defaultSchedule = [
      { weekday: 1, start_time: '09:00', end_time: '17:00' }, // Monday
      { weekday: 2, start_time: '09:00', end_time: '17:00' }, // Tuesday
      { weekday: 3, start_time: '09:00', end_time: '17:00' }, // Wednesday
      { weekday: 4, start_time: '09:00', end_time: '17:00' }, // Thursday
      { weekday: 5, start_time: '09:00', end_time: '17:00' }, // Friday
      { weekday: 6, start_time: '10:00', end_time: '15:00' }  // Saturday
    ]
    
    console.log('🟡 Creating default availability rules...')
    for (const rule of defaultSchedule) {
      await query(
        `INSERT INTO availability_rules (
          business_id, weekday, start_time, end_time, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [business.id, rule.weekday, rule.start_time, rule.end_time]
      )
    }
    console.log('🟢 Default availability rules created successfully')

    return NextResponse.json({ 
      success: true, 
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug
      }
    })

  } catch (error) {
    console.error('Business creation error:', error)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}

function getStarterServices(businessType: string) {
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