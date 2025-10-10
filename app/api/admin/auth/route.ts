import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin credentials (hardcoded as requested)
const ADMIN_CREDENTIALS = {
  username: 'zewo',
  password: 'Poesie509$$$'
}

export async function POST(request: NextRequest) {

  try {
    const { username, password } = await request.json()

    // Verify admin credentials
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate admin session token
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store session in database (create table if it doesn't exist)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `)
      
      await query(
        'INSERT INTO admin_sessions (session_token, expires_at) VALUES ($1, $2)',
        [sessionToken, expiresAt.toISOString()]
      )
    } catch (dbError) {
      console.error('Admin session creation error:', dbError)
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      token: sessionToken,
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Verify admin session
export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  try {
    const result = await query(
      'SELECT expires_at FROM admin_sessions WHERE session_token = $1',
      [token]
    )

    if (result.rows.length === 0 || new Date(result.rows[0].expires_at) < new Date()) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    return NextResponse.json({ valid: true })

  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}