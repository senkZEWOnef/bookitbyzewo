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
    // Get all coupons using Neon
    const result = await query(`
      SELECT id, code, discount_type, discount_value, free_trial_months, 
             applicable_plan, max_uses, used_count, expires_at, is_active, 
             created_at, updated_at
      FROM coupon_codes 
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ coupons: result.rows })

  } catch (error) {
    console.error('Coupons fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}