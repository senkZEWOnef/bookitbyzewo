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

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token || !await verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { discount_type, discount_value, free_trial_months, max_uses, expires_days } = body

    // Generate unique coupon code
    const prefix = discount_type === 'percentage' ? 'SAVE' : 'FREE'
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `${prefix}${randomSuffix}`

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_days)

    // Create coupons table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS coupon_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(20) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'free_trial')),
        discount_value INTEGER NOT NULL DEFAULT 0,
        free_trial_months INTEGER NOT NULL DEFAULT 0,
        max_uses INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Insert the new coupon using Neon
    await query(`
      INSERT INTO coupon_codes (
        code, discount_type, discount_value, free_trial_months, 
        max_uses, expires_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
    `, [
      code,
      discount_type,
      discount_value || 0,
      free_trial_months || 0,
      max_uses,
      expiresAt.toISOString()
    ])

    return NextResponse.json({ 
      success: true, 
      code,
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Generate coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to generate coupon' },
      { status: 500 }
    )
  }
}