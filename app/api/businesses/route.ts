import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getPlanLimits, isUnlimited } from '@/lib/plans'
import { getUserIdFromRequest } from '@/lib/auth'
import { createBusiness, SLUG_PATTERN } from '@/lib/business-setup'

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
    // The account comes from the login token, never from the request body
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
    }
    const { name, slug, location, timezone, businessType } = await request.json()

    console.log('🟢 Business creation request:', { name, slug, location, timezone, businessType, userId })

    if (!name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: 'Booking URL can only use lowercase letters, numbers and dashes' }, { status: 400 })
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
    
    // Starter allows 1 business; Pro is unlimited
    if (currentBusinessCount >= planLimits.maxLocations && !isUnlimited(planLimits.maxLocations)) {
      console.log('🔴 Plan business limit exceeded for plan:', user.plan)
      return NextResponse.json({ 
        error: 'Your Starter plan includes 1 business. Upgrade to Pro ($59.99/mo) for unlimited businesses.',
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

    const business = await createBusiness({ userId, name: String(name).trim().slice(0, 100), slug, location, timezone, businessType })

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
