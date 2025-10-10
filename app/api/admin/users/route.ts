import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to verify admin token
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
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get users from Neon database
    const result = await query('SELECT id, email, full_name, phone, created_at FROM users ORDER BY created_at DESC')
    
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, userId } = await request.json()

    // For now, just log the action since we need to implement proper user management
    console.log(`Admin action: ${action} for user ${userId}`)

    // TODO: Implement with Neon database
    // if (action === 'ban') {
    //   // Add banned_until column to users table and update it
    // } else if (action === 'unban') {
    //   // Remove ban from users table
    // } else if (action === 'delete') {
    //   // Delete user from users table
    // }

    return NextResponse.json({ success: true, message: `User ${action} action logged` })
  } catch (error) {
    console.error('Admin user action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}