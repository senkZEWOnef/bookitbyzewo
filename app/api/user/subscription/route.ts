import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getUserSubscription(userId: string) {
  try {
    const result = await query(`
      SELECT 
        id,
        email,
        plan,
        plan_status,
        trial_ends_at,
        staff_count,
        monthly_bookings_count,
        subscription_id
      FROM users 
      WHERE id = $1
    `, [userId])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    return {
      id: user.id,
      email: user.email,
      plan: user.plan || 'solo',
      planStatus: user.plan_status || 'trial',
      trialEndsAt: user.trial_ends_at ? new Date(user.trial_ends_at) : null,
      staffCount: user.staff_count || 0,
      monthlyBookingsCount: user.monthly_bookings_count || 0,
      subscriptionId: user.subscription_id
    }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return null
  }
}

function isSubscriptionActive(subscription: any): boolean {
  // Check if subscription is active
  if (subscription.planStatus === 'active') {
    return true
  }

  // Check if trial is still valid
  if (subscription.planStatus === 'trial' && subscription.trialEndsAt) {
    return subscription.trialEndsAt > new Date()
  }

  return false
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const subscription = await getUserSubscription(userId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isActive = isSubscriptionActive(subscription)

    return NextResponse.json({
      subscription: {
        ...subscription,
        isActive,
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null
      }
    })

  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}