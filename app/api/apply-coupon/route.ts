import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { addMonths } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, plan } = await request.json()

    if (!code || !plan) {
      return NextResponse.json({
        error: 'Coupon code and plan are required'
      }, { status: 400 })
    }

    console.log('🎫 Applying coupon:', { code, userId, plan })

    // Validate coupon first
    const couponResult = await query(
      'SELECT * FROM coupon_codes WHERE code = $1 AND is_active = true',
      [code.toUpperCase()]
    )

    if (couponResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired coupon code' 
      }, { status: 400 })
    }

    const coupon = couponResult.rows[0]

    // Validate coupon constraints
    if (new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Coupon has expired' 
      }, { status: 400 })
    }

    if (coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ 
        error: 'Coupon has reached maximum usage limit' 
      }, { status: 400 })
    }

    if (coupon.applicable_plan !== plan) {
      return NextResponse.json({ 
        error: `This coupon is only valid for ${coupon.applicable_plan.charAt(0).toUpperCase() + coupon.applicable_plan.slice(1)} plan` 
      }, { status: 400 })
    }

    // Apply coupon to user account using proper date calculation
    const newTrialEnd = addMonths(new Date(), coupon.free_trial_months)

    // Use a transaction to prevent race conditions on coupon usage
    // First, try to increment usage count atomically with a check
    const updateResult = await query(
      `UPDATE coupon_codes
       SET used_count = used_count + 1, updated_at = NOW()
       WHERE id = $1 AND used_count < max_uses
       RETURNING id`,
      [coupon.id]
    )

    if (updateResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Coupon has reached maximum usage limit'
      }, { status: 400 })
    }

    // Update user's trial period
    await query(
      `UPDATE users
       SET plan_status = 'trial',
           trial_ends_at = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [newTrialEnd.toISOString(), userId]
    )

    // Record coupon usage (table should already exist)
    try {
      await query(
        'INSERT INTO coupon_usage (coupon_id, user_id) VALUES ($1, $2)',
        [coupon.id, userId]
      )
    } catch {
      // If table doesn't exist or insert fails, log but don't fail the request
      console.log('Could not record coupon usage - table may not exist')
    }

    console.log('🟢 Coupon applied successfully:', {
      code: coupon.code,
      userId,
      trialExtension: coupon.free_trial_months
    })

    return NextResponse.json({ 
      success: true,
      message: `Coupon applied! You now have ${coupon.free_trial_months} month${coupon.free_trial_months > 1 ? 's' : ''} free trial`,
      trial_ends_at: newTrialEnd.toISOString()
    })

  } catch (error) {
    console.error('🔴 Coupon application error:', error)
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    )
  }
}