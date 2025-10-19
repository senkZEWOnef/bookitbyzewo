import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }
    
    console.log('🟡 USER CHECK: Looking for user with email:', email)
    
    const result = await query(
      'SELECT id, email, full_name, created_at FROM users WHERE email = $1',
      [email]
    )
    
    console.log('🟡 USER CHECK: Query result:', {
      found: result.rows.length > 0,
      user: result.rows[0] || null
    })
    
    return NextResponse.json({
      success: true,
      found: result.rows.length > 0,
      user: result.rows[0] || null
    })
  } catch (error) {
    console.error('🔴 USER CHECK: Error:', error)
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    )
  }
}