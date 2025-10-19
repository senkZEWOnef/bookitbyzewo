import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone } = await request.json()

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

    // Create user with Solo plan and 30-day trial
    const result = await query(
      'INSERT INTO users (email, password, full_name, phone, plan, plan_status, trial_ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, plan, plan_status, trial_ends_at',
      [
        email, 
        hashedPassword, 
        full_name, 
        phone || null,
        'solo',
        'trial',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      ]
    )

    const newUser = result.rows[0]

    return NextResponse.json({
      message: 'User created successfully with Solo plan trial',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        plan: newUser.plan,
        plan_status: newUser.plan_status,
        trial_ends_at: newUser.trial_ends_at
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