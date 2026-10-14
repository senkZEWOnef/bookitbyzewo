import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // Check user's subscription status
    const { query } = await import('@/lib/db')

    const result = await query(
      `SELECT plan, plan_status, trial_ends_at FROM users WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'user_not_found'
      }, { status: 404 })
    }

    const user = result.rows[0]

    // Check if subscription is active
    if (user.plan_status === 'active') {
      return NextResponse.json({
        hasAccess: true,
        reason: 'active_subscription'
      })
    }

    // Check if trial is still valid
    if (user.plan_status === 'trial' && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at)
      if (trialEnd > new Date()) {
        return NextResponse.json({
          hasAccess: true,
          reason: 'active_trial'
        })
      }
    }

    return NextResponse.json({
      hasAccess: false,
      reason: 'subscription_expired'
    })

  } catch (error) {
    console.error('Access check error:', error)
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    )
  }
}