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

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token || !await verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { discount_type, discount_value, free_trial_months, max_uses, expires_days } = body

    // Generate unique coupon code
    const prefix = discount_type === 'percentage' ? 'SAVE' : 'FREE'
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `${prefix}${randomSuffix}`

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expires_days || 30))

    // Insert coupon
    const { data: coupon, error } = await supabase
      .from('coupon_codes')
      .insert({
        code,
        discount_type,
        discount_value: discount_type === 'percentage' ? discount_value : null,
        free_trial_months: discount_type === 'free_trial' ? free_trial_months : null,
        max_uses: max_uses || 1,
        expires_at: expiresAt.toISOString(),
        created_by: '00000000-0000-0000-0000-000000000001' // Admin user ID
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      code: coupon.code,
      coupon 
    })

  } catch (error: any) {
    console.error('Coupon generation error:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Coupon code already exists, please try again' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate coupon' },
      { status: 500 }
    )
  }
}