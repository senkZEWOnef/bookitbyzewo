import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function verifyAdminToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: session } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('session_token', token)
    .single()

  return session && new Date(session.expires_at) > new Date()
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token || !await verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get analytics data
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      businessesResult,
      appointmentsResult,
      activeSubscriptionsResult,
      failedPaymentsResult,
      recentSignupsResult
    ] = await Promise.all([
      // Total businesses
      supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true }),
      
      // Total appointments
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true }),
      
      // Active subscriptions
      supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'active'),
      
      // Failed payments
      supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('last_payment_failed', true),
      
      // Recent signups (last 7 days)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
    ])

    // Calculate revenue (simulated for now - you'd integrate with actual payment data)
    const revenue_this_month = 0 // This would come from your payment processor

    const analytics = {
      total_businesses: businessesResult.count || 0,
      total_appointments: appointmentsResult.count || 0,
      active_subscriptions: activeSubscriptionsResult.count || 0,
      failed_payments: failedPaymentsResult.count || 0,
      recent_signups: recentSignupsResult.count || 0,
      revenue_this_month
    }

    // Track this analytics request
    await supabase
      .from('platform_analytics')
      .insert({
        event_type: 'admin_analytics_view',
        event_data: { timestamp: now.toISOString() },
        user_id: '00000000-0000-0000-0000-000000000001'
      })

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}