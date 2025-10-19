import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { code, userId, plan } = await request.json()

    if (!code || !userId || !plan) {
      return NextResponse.json({ 
        error: 'Coupon code, user ID, and plan are required' 
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

    // Apply coupon to user account
    const newTrialEnd = new Date()
    newTrialEnd.setMonth(newTrialEnd.getMonth() + coupon.free_trial_months)

    await query(
      `UPDATE users 
       SET plan_status = 'trial', 
           trial_ends_at = $1,
           updated_at = NOW() 
       WHERE id = $2`,
      [newTrialEnd.toISOString(), userId]
    )

    // Increment coupon usage count
    await query(
      'UPDATE coupon_codes SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1',
      [coupon.id]
    )

    // Create coupon usage record
    await query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        coupon_id UUID REFERENCES coupon_codes(id),
        user_id UUID REFERENCES users(id),
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await query(
      'INSERT INTO coupon_usage (coupon_id, user_id) VALUES ($1, $2)',
      [coupon.id, userId]
    )

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