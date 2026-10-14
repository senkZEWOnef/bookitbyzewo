import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BATCH = 20
const ALLOWED_TRIAL_DAYS = [30, 60, 90]
// No look-alike characters (0/O, 1/l/I) so passwords are easy to read out to a friend
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

async function verifyAdminToken(token: string) {
  try {
    const result = await query(
      'SELECT expires_at FROM admin_sessions WHERE session_token = $1',
      [token]
    )
    return result.rows.length > 0 && new Date(result.rows[0].expires_at) >= new Date()
  } catch {
    return false
  }
}

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return !!token && (await verifyAdminToken(token))
}

function generatePassword(length = 10) {
  let out = ''
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  return out
}

async function ensureBetaColumn() {
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_beta BOOLEAN DEFAULT false')
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureBetaColumn()
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.plan, u.plan_status, u.trial_ends_at, u.created_at,
              (SELECT COUNT(*) FROM businesses b WHERE b.owner_id = u.id)::int AS business_count
       FROM users u
       WHERE u.is_beta = true
       ORDER BY u.created_at DESC`
    )
    return NextResponse.json({ accounts: result.rows })
  } catch (error) {
    console.error('Beta accounts list error:', error)
    return NextResponse.json({ error: 'Failed to load beta accounts' }, { status: 500 })
  }
}

// POST { accounts: [{ email?, full_name? }], trial_days }  -> creates Pro-plan trial accounts
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { accounts, trial_days } = await request.json()

    if (!Array.isArray(accounts) || accounts.length === 0 || accounts.length > MAX_BATCH) {
      return NextResponse.json({ error: `Provide between 1 and ${MAX_BATCH} accounts` }, { status: 400 })
    }
    const days = ALLOWED_TRIAL_DAYS.includes(trial_days) ? trial_days : 60

    await ensureBetaColumn()

    const created: { email: string; full_name: string; password: string }[] = []
    const failed: { email: string; error: string }[] = []

    for (let i = 0; i < accounts.length; i++) {
      const given = accounts[i] || {}
      const email = (given.email || `beta-${randomBytes(3).toString('hex')}@beta.bookitbyzewo.com`)
        .toString().trim().toLowerCase()
      const fullName = (given.full_name || `Beta Tester ${i + 1}`).toString().trim().slice(0, 100)

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        failed.push({ email, error: 'Invalid email' })
        continue
      }

      const password = generatePassword()
      try {
        const hashed = await bcrypt.hash(password, 12)
        await query(
          `INSERT INTO users (email, password, full_name, plan, plan_status, trial_ends_at, is_beta)
           VALUES ($1, $2, $3, 'pro', 'trial', NOW() + ($4 || ' days')::interval, true)`,
          [email, hashed, fullName, String(days)]
        )
        created.push({ email, full_name: fullName, password })
      } catch (error: any) {
        failed.push({ email, error: error.code === '23505' ? 'Email already exists' : 'Failed to create' })
      }
    }

    return NextResponse.json({ created, failed, trial_days: days })
  } catch (error) {
    console.error('Beta accounts create error:', error)
    return NextResponse.json({ error: 'Failed to create beta accounts' }, { status: 500 })
  }
}

// PATCH { userId, action: 'extend' | 'revoke' | 'reset_password' }
export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, action } = await request.json()
    if (!userId || !['extend', 'revoke', 'reset_password'].includes(action)) {
      return NextResponse.json({ error: 'userId and a valid action are required' }, { status: 400 })
    }

    // Only ever touch accounts that were created as beta accounts
    const check = await query('SELECT id FROM users WHERE id = $1 AND is_beta = true', [userId])
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Beta account not found' }, { status: 404 })
    }

    if (action === 'extend') {
      await query(
        `UPDATE users
         SET plan_status = 'trial',
             trial_ends_at = GREATEST(COALESCE(trial_ends_at, NOW()), NOW()) + INTERVAL '30 days',
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'revoke') {
      await query(
        `UPDATE users SET plan_status = 'cancelled', trial_ends_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [userId]
      )
      return NextResponse.json({ success: true })
    }

    const password = generatePassword()
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [
      await bcrypt.hash(password, 12),
      userId
    ])
    return NextResponse.json({ success: true, password })
  } catch (error) {
    console.error('Beta accounts update error:', error)
    return NextResponse.json({ error: 'Failed to update beta account' }, { status: 500 })
  }
}
