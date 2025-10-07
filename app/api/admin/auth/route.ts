import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin credentials (hardcoded as requested)
const ADMIN_CREDENTIALS = {
  username: 'zewo',
  password: 'Poesie509$$$'
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

    // Store session in database
    const { error } = await supabase
      .from('admin_sessions')
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      console.error('Admin session creation error:', error)
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  try {
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('expires_at')
      .eq('session_token', token)
      .single()

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    return NextResponse.json({ valid: true })

  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}