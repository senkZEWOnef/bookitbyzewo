import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function verifyAdminToken(token: string) {
  try {
    const result = await query(
      'SELECT expires_at FROM admin_sessions WHERE session_token = $1',
      [token]
    )

    if (result.rows.length === 0 || new Date(result.rows[0].expires_at) < new Date()) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token || !await verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get analytics data using Neon
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      businessesResult,
      appointmentsResult,
      activeUsersResult,
      trialUsersResult,
      recentSignupsResult,
      paymentsResult
    ] = await Promise.all([
      // Total businesses
      query('SELECT COUNT(*) as count FROM businesses'),
      
      // Total appointments
      query('SELECT COUNT(*) as count FROM appointments'),
      
      // Active paid users
      query("SELECT COUNT(*) as count FROM users WHERE plan_status = 'active'"),
      
      // Trial users
      query("SELECT COUNT(*) as count FROM users WHERE plan_status = 'trial'"),
      
      // Recent signups (last 7 days)
      query('SELECT COUNT(*) as count FROM users WHERE created_at >= $1', [sevenDaysAgo.toISOString()]),
      
      // Failed payments (if payments table exists)
      query("SELECT COUNT(*) as count FROM payments WHERE status = 'failed'").catch(() => ({ rows: [{ count: '0' }] }))
    ])

    // Calculate revenue from successful payments this month
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    let revenue_this_month = 0
    try {
      const revenueResult = await query(
        "SELECT SUM(amount_cents) as total FROM payments WHERE status = 'succeeded' AND created_at >= $1",
        [firstOfMonth.toISOString()]
      )
      revenue_this_month = Math.round((parseInt(revenueResult.rows[0]?.total) || 0) / 100) // Convert cents to dollars
    } catch (error) {
      revenue_this_month = 0
    }

    const analytics = {
      total_businesses: parseInt(businessesResult.rows[0].count) || 0,
      total_appointments: parseInt(appointmentsResult.rows[0].count) || 0,
      active_subscriptions: parseInt(activeUsersResult.rows[0].count) || 0,
      trial_users: parseInt(trialUsersResult.rows[0].count) || 0,
      failed_payments: parseInt(paymentsResult.rows[0].count) || 0,
      recent_signups: parseInt(recentSignupsResult.rows[0].count) || 0,
      revenue_this_month
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}