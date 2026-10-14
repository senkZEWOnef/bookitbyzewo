import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// No look-alike characters (0/O, 1/I) so codes are easy to read out loud
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const TIERS: Record<string, { plan: string; prefix: string }> = {
  full: { plan: 'pro', prefix: 'FULL' },
  basic: { plan: 'solo', prefix: 'BASIC' }
}

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

function randomSuffix(length = 6) {
  let out = ''
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return out
}

// POST { tier: 'full' | 'basic', free_trial_months: 1-12, max_uses: 1-100, expires_days: 1-365, label? }
export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token || !await verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tier, free_trial_months, max_uses, expires_days } = body
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 100) : ''

    if (!TIERS[tier]) {
      return NextResponse.json({ error: 'Tier must be "full" or "basic".' }, { status: 400 })
    }
    if (!Number.isInteger(free_trial_months) || free_trial_months < 1 || free_trial_months > 12) {
      return NextResponse.json({ error: 'Trial duration must be between 1 and 12 months.' }, { status: 400 })
    }
    if (!Number.isInteger(max_uses) || max_uses < 1 || max_uses > 100) {
      return NextResponse.json({ error: 'Max uses must be between 1 and 100.' }, { status: 400 })
    }
    if (!Number.isInteger(expires_days) || expires_days < 1 || expires_days > 365) {
      return NextResponse.json({ error: 'Code validity must be between 1 and 365 days.' }, { status: 400 })
    }

    const { plan, prefix } = TIERS[tier]

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_days)

    await query(`
      CREATE TABLE IF NOT EXISTS coupon_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(20) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'solo_trial',
        discount_value INTEGER NOT NULL DEFAULT 0,
        free_trial_months INTEGER NOT NULL DEFAULT 1,
        applicable_plan VARCHAR(20) NOT NULL DEFAULT 'solo',
        max_uses INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await query(`ALTER TABLE coupon_codes ADD COLUMN IF NOT EXISTS applicable_plan VARCHAR(20) DEFAULT 'solo'`)
    await query(`ALTER TABLE coupon_codes ADD COLUMN IF NOT EXISTS label VARCHAR(100)`)

    for (let attempt = 0; attempt < 3; attempt++) {
      const code = `${prefix}${free_trial_months}M-${randomSuffix()}`
      try {
        await query(
          `INSERT INTO coupon_codes (
             code, discount_type, discount_value, free_trial_months,
             applicable_plan, max_uses, expires_at, is_active, label
           ) VALUES ($1, 'trial', 0, $2, $3, $4, $5, true, $6)`,
          [code, free_trial_months, plan, max_uses, expiresAt.toISOString(), label || null]
        )
        return NextResponse.json({ success: true, code, expires_at: expiresAt.toISOString() })
      } catch (error: any) {
        if (error.code !== '23505') throw error // only retry on a code collision
      }
    }

    return NextResponse.json({ error: 'Could not generate a unique code, try again.' }, { status: 500 })
  } catch (error) {
    console.error('Generate coupon error:', error)
    return NextResponse.json({ error: 'Failed to generate coupon' }, { status: 500 })
  }
}
