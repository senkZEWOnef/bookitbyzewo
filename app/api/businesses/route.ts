import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { validatePlanLimit, getPlanLimits } from '@/lib/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('🟡 Fetching businesses for user:', userId)

    // Get businesses for the user
    const result = await query(
      'SELECT id, name, slug, location, timezone, created_at FROM businesses WHERE owner_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    console.log('🟢 Found', result.rows.length, 'businesses for user')

    return NextResponse.json({ 
      success: true, 
      businesses: result.rows 
    })

  } catch (error) {
    console.error('Businesses fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug, location, timezone, businessType, userId } = await request.json()

    console.log('🟢 Business creation request:', { name, slug, location, timezone, businessType, userId })

    if (!name || !slug || !userId) {
      console.log('🔴 Missing required fields:', { name: !!name, slug: !!slug, userId: !!userId })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's plan information and check subscription status
    console.log('🟡 Checking user subscription status...')
    const userResult = await query(
      'SELECT plan, plan_status, trial_ends_at FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      console.log('🔴 User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]
    console.log('🟡 User plan info:', { plan: user.plan, plan_status: user.plan_status })

    // Check if user has an active subscription
    const isSubscriptionActive = user.plan_status === 'active' || 
      (user.plan_status === 'trial' && user.trial_ends_at && new Date(user.trial_ends_at) > new Date())

    if (!isSubscriptionActive) {
      console.log('🔴 User subscription inactive or expired')
      return NextResponse.json({ 
        error: 'Active subscription required to create businesses. Please upgrade your plan.',
        subscriptionRequired: true,
        currentStatus: user.plan_status,
        trialEndsAt: user.trial_ends_at
      }, { status: 402 }) // Payment Required
    }

    // Check how many businesses this user already has
    const existingBusinesses = await query(
      'SELECT COUNT(*) as count FROM businesses WHERE owner_id = $1',
      [userId]
    )

    const currentBusinessCount = parseInt(existingBusinesses.rows[0].count)
    console.log('🟡 User currently has', currentBusinessCount, 'businesses')

    // Validate against plan limits
    const planLimits = getPlanLimits(user.plan)
    
    // For Solo plan: only 1 business allowed
    if (user.plan === 'solo' && currentBusinessCount >= 1) {
      console.log('🔴 Solo plan business limit exceeded')
      return NextResponse.json({ 
        error: 'Your Solo plan allows only 1 business. Upgrade to Team ($39/mo) to create additional businesses.',
        planLimit: true,
        currentPlan: 'solo',
        suggestedPlan: 'team'
      }, { status: 403 })
    }

    // For other plans, use the location limit as business limit for now
    if (currentBusinessCount >= planLimits.maxLocations && planLimits.maxLocations < 999) {
      console.log('🔴 Plan business limit exceeded for plan:', user.plan)
      return NextResponse.json({ 
        error: `Your ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} plan allows up to ${planLimits.maxLocations} business${planLimits.maxLocations === 1 ? '' : 'es'}. Upgrade to Pro plan for unlimited businesses.`,
        planLimit: true,
        currentPlan: user.plan,
        suggestedPlan: 'pro'
      }, { status: 403 })
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

    // Create default business hours (Sunday closed, Monday-Friday 9AM-5PM, Saturday 10AM-3PM)
    const defaultSchedule = [
      { day_of_week: 0, is_closed: true }, // Sunday - closed
      { day_of_week: 1, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Monday
      { day_of_week: 2, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Tuesday
      { day_of_week: 3, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Wednesday
      { day_of_week: 4, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Thursday
      { day_of_week: 5, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Friday
      { day_of_week: 6, is_closed: false, open_time: '10:00', close_time: '15:00', slot_duration_minutes: 30 }  // Saturday
    ]
    
    console.log('🟡 Creating default business hours...')
    for (const hours of defaultSchedule) {
      await query(
        `INSERT INTO business_default_hours (
          business_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes, break_times, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [business.id, hours.day_of_week, hours.is_closed, hours.open_time || null, hours.close_time || null, hours.slot_duration_minutes || 30, '[]']
      )
    }
    console.log('🟢 Default business hours created successfully')

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