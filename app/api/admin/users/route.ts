import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ensureModerationColumns } from '@/lib/moderation'
import { AdminActionError, deleteUserAccount, setUserBanned } from '@/lib/admin-actions'

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
    await ensureModerationColumns()
    const result = await query('SELECT id, email, full_name, phone, plan, plan_status, trial_ends_at, banned_at, created_at FROM users ORDER BY created_at DESC')
    
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
    if (!userId || !['ban', 'unban', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'delete') await deleteUserAccount(userId)
    else await setUserBanned(userId, action === 'ban')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Admin user action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}