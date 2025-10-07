import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // Check if user is admin or test account
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_test_account')
      .eq('id', userId)
      .single()

    if (profile?.is_admin || profile?.is_test_account) {
      return NextResponse.json({ 
        hasAccess: true, 
        reason: 'admin_or_test' 
      })
    }

    // Get user's business and subscription info
    const { data: business } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        subscription_status,
        subscription_plan,
        trial_ends_at,
        payment_method_required,
        last_payment_failed,
        payment_failure_count
      `)
      .eq('owner_id', userId)
      .single()

    if (!business) {
      return NextResponse.json({ 
        hasAccess: true, 
        reason: 'no_business' 
      })
    }

    const now = new Date()
    const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null

    // Check access conditions
    if (business.last_payment_failed && business.payment_failure_count > 2) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'payment_failed',
        businessName: business.name
      })
    }

    if (business.subscription_status === 'trial' && trialEndsAt && trialEndsAt < now) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'trial_expired',
        businessName: business.name
      })
    }

    if (business.payment_method_required && business.subscription_status !== 'active') {
      return NextResponse.json({
        hasAccess: false,
        reason: 'no_payment_method',
        businessName: business.name
      })
    }

    if (business.subscription_status === 'suspended' || business.subscription_status === 'cancelled') {
      return NextResponse.json({
        hasAccess: false,
        reason: 'subscription_inactive',
        businessName: business.name
      })
    }

    // All checks passed
    return NextResponse.json({ 
      hasAccess: true, 
      reason: 'valid_subscription',
      businessName: business.name
    })

  } catch (error) {
    console.error('Access check error:', error)
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    )
  }
}