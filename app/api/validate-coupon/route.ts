import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { code, plan } = await request.json()

    if (!code || !plan) {
      return NextResponse.json({ 
        error: 'Coupon code and plan are required' 
      }, { status: 400 })
    }

    console.log('🎫 Validating coupon:', { code, plan })

    // Get coupon details
    const result = await query(
      'SELECT * FROM coupon_codes WHERE code = $1 AND is_active = true',
      [code.toUpperCase()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        valid: false,
        error: 'Invalid or expired coupon code' 
      })
    }

    const coupon = result.rows[0]

    // Check if coupon has expired
    if (new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false,
        error: 'Coupon has expired' 
      })
    }

    // Check if coupon has reached max uses
    if (coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ 
        valid: false,
        error: 'Coupon has reached maximum usage limit' 
      })
    }

    // Check if coupon is applicable to the requested plan
    if (coupon.applicable_plan !== plan) {
      return NextResponse.json({ 
        valid: false,
        error: `This coupon is only valid for ${coupon.applicable_plan.charAt(0).toUpperCase() + coupon.applicable_plan.slice(1)} plan. Coupons do not work for Team or Pro plans.` 
      })
    }

    // Coupon is valid
    return NextResponse.json({ 
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        free_trial_months: coupon.free_trial_months,
        applicable_plan: coupon.applicable_plan
      },
      message: `Valid coupon: ${coupon.free_trial_months} month${coupon.free_trial_months > 1 ? 's' : ''} free trial for Solo plan`
    })

  } catch (error) {
    console.error('🔴 Coupon validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}