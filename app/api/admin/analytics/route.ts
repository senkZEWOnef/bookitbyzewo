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
      activeSubscriptionsResult,
      recentSignupsResult
    ] = await Promise.all([
      // Total businesses
      query('SELECT COUNT(*) as count FROM businesses'),
      
      // Total appointments
      query('SELECT COUNT(*) as count FROM appointments'),
      
      // Active subscriptions
      query("SELECT COUNT(*) as count FROM businesses WHERE subscription_status = 'active'"),
      
      // Recent signups (last 7 days)
      query('SELECT COUNT(*) as count FROM users WHERE created_at >= $1', [sevenDaysAgo.toISOString()])
    ])

    // Calculate revenue (simulated for now - you'd integrate with actual payment data)
    const revenue_this_month = 0 // This would come from your payment processor

    const analytics = {
      total_businesses: parseInt(businessesResult.rows[0].count) || 0,
      total_appointments: parseInt(appointmentsResult.rows[0].count) || 0,
      active_subscriptions: parseInt(activeSubscriptionsResult.rows[0].count) || 0,
      failed_payments: 0, // TODO: Implement when payment tracking is added
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