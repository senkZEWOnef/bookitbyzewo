import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { addMonths } from 'date-fns'
import { generateToken } from '@/lib/auth'
import { ensureDefaultBusiness } from '@/lib/business-setup'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, trial_code, locale } = await request.json()

    // Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Optional trial code: claim one use atomically before creating the account
    let coupon: any = null
    const code = typeof trial_code === 'string' ? trial_code.trim().toUpperCase() : ''
    if (code) {
      const claimed = await query(
        `UPDATE coupon_codes
         SET used_count = used_count + 1, updated_at = NOW()
         WHERE code = $1 AND is_active = true AND expires_at > NOW() AND used_count < max_uses
         RETURNING id, free_trial_months, applicable_plan`,
        [code]
      )
      if (claimed.rows.length === 0) {
        return NextResponse.json({ error: 'This trial code is invalid, expired or already used up' }, { status: 400 })
      }
      coupon = claimed.rows[0]
    }

    let newUser
    try {
      if (coupon) {
        // Trial code: start the trial right away on the plan the code grants
        const result = await query(
          'INSERT INTO users (email, password, full_name, phone, plan, plan_status, trial_ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, plan, plan_status, trial_ends_at',
          [
            email,
            hashedPassword,
            full_name,
            phone || null,
            coupon.applicable_plan === 'pro' ? 'pro' : 'solo',
            'trial',
            addMonths(new Date(), coupon.free_trial_months).toISOString()
          ]
        )
        newUser = result.rows[0]
      } else {
        // Create user with inactive status - payment required to activate
        const result = await query(
          'INSERT INTO users (email, password, full_name, phone, plan, plan_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name, plan, plan_status',
          [email, hashedPassword, full_name, phone || null, 'solo', 'incomplete']
        )
        newUser = result.rows[0]
      }
    } catch (insertError) {
      if (coupon) {
        // Give the use back if the account could not be created
        await query('UPDATE coupon_codes SET used_count = used_count - 1 WHERE id = $1', [coupon.id]).catch(() => {})
      }
      throw insertError
    }

    if (coupon) {
      // The trial starts now, so the store is ready the moment they land on the dashboard
      await ensureDefaultBusiness(newUser.id, locale === 'en' ? 'en' : 'es').catch(error => console.error('Default business setup failed:', error))
      await query('INSERT INTO coupon_usage (coupon_id, user_id) VALUES ($1, $2)', [coupon.id, newUser.id]).catch(() => {})
    }

    return NextResponse.json({
      token: generateToken(newUser.id),
      message: coupon
        ? 'Account created successfully. Your free trial has started.'
        : 'Account created successfully. Payment required to activate.',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        plan: newUser.plan,
        plan_status: newUser.plan_status,
        trial_ends_at: newUser.trial_ends_at || null
      }
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table
    })
    
    // Provide more specific error messages
    if (error.code === '42P01') {
      return NextResponse.json({ 
        error: 'Database table does not exist. Please contact support.',
        details: 'users table not found'
      }, { status: 500 })
    }
    
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: 'An account with this email already exists' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}