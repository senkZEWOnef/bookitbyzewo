import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing signup process...')
    
    const { email, password, full_name, phone } = await request.json()
    console.log('📝 Signup attempt for:', { email, full_name, phone: phone ? 'provided' : 'not provided' })

    // Step 1: Test database connection
    try {
      const dbTest = await query('SELECT NOW() as current_time')
      console.log('✅ Database connection successful:', dbTest.rows[0])
    } catch (dbError: any) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError.message,
        step: 'database_connection'
      }, { status: 500 })
    }

    // Step 2: Check if users table exists
    try {
      const tableCheck = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `)
      console.log('✅ Users table structure:', tableCheck.rows)
      
      if (tableCheck.rows.length === 0) {
        return NextResponse.json({
          error: 'Users table does not exist',
          details: 'Run /api/debug/db-setup first',
          step: 'table_check'
        }, { status: 500 })
      }
    } catch (tableError: any) {
      console.error('❌ Table check failed:', tableError)
      return NextResponse.json({
        error: 'Table verification failed',
        details: tableError.message,
        step: 'table_verification'
      }, { status: 500 })
    }

    // Step 3: Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json({
        error: 'Missing required fields',
        provided: { email: !!email, password: !!password, full_name: !!full_name },
        step: 'input_validation'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters',
        step: 'password_validation'
      }, { status: 400 })
    }

    // Step 4: Check for existing user
    try {
      const existingUser = await query(
        'SELECT id, email FROM users WHERE email = $1',
        [email]
      )
      console.log('🔍 Existing user check:', existingUser.rows.length > 0 ? 'User exists' : 'User does not exist')

      if (existingUser.rows.length > 0) {
        return NextResponse.json({
          error: 'User already exists',
          step: 'duplicate_check'
        }, { status: 400 })
      }
    } catch (duplicateError: any) {
      console.error('❌ Duplicate check failed:', duplicateError)
      return NextResponse.json({
        error: 'Failed to check for existing user',
        details: duplicateError.message,
        step: 'duplicate_check'
      }, { status: 500 })
    }

    // Step 5: Test password hashing
    try {
      console.log('🔐 Testing password hashing...')
      const hashedPassword = await bcrypt.hash(password, 12)
      console.log('✅ Password hashed successfully, length:', hashedPassword.length)
    } catch (hashError: any) {
      console.error('❌ Password hashing failed:', hashError)
      return NextResponse.json({
        error: 'Password hashing failed',
        details: hashError.message,
        step: 'password_hashing'
      }, { status: 500 })
    }

    // Step 6: Test user insertion
    try {
      console.log('💾 Attempting to create user...')
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const result = await query(
        'INSERT INTO users (email, password, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, created_at',
        [email, hashedPassword, full_name, phone || null]
      )

      const newUser = result.rows[0]
      console.log('✅ User created successfully:', {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at
      })

      return NextResponse.json({
        success: true,
        message: 'User created successfully in test mode',
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          created_at: newUser.created_at
        },
        step: 'user_creation'
      })

    } catch (insertError: any) {
      console.error('❌ User insertion failed:', insertError)
      console.error('Error details:', {
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        constraint: insertError.constraint,
        table: insertError.table,
        column: insertError.column
      })

      return NextResponse.json({
        error: 'Failed to create user',
        details: {
          message: insertError.message,
          code: insertError.code,
          detail: insertError.detail,
          constraint: insertError.constraint
        },
        step: 'user_creation'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in test signup:', error)
    return NextResponse.json({
      error: 'Unexpected error occurred',
      details: error.message,
      step: 'unexpected_error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test signup endpoint',
    usage: 'POST with { email, password, full_name, phone? } to test signup process',
    endpoints: {
      'Database setup': '/api/debug/db-setup',
      'Test signup': '/api/debug/test-signup (POST)',
      'Regular signup': '/api/auth/signup'
    }
  })
}