import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to verify admin token
async function verifyAdminToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: session } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('session_token', token)
    .single()

  if (!session || new Date(session.expires_at) < new Date()) {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get all users with their business info
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        *,
        businesses:businesses!owner_id (
          id,
          name,
          subscription_status,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Also get auth users data
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth data' }, { status: 500 })
    }

    // Merge profile and auth data
    const enrichedUsers = users?.map(user => {
      const authUser = authUsers.users.find(au => au.id === user.id)
      return {
        ...user,
        email: authUser?.email,
        email_confirmed_at: authUser?.email_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        created_at: authUser?.created_at || user.created_at
      }
    })

    return NextResponse.json({ users: enrichedUsers })
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { action, userId, data } = await request.json()

    if (action === 'ban') {
      // Ban user by updating auth
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { ban_duration: '24h' } // Ban for 24 hours, adjust as needed
      )

      if (error) {
        return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
      }
    } else if (action === 'unban') {
      // Remove ban
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { ban_duration: 'none' }
      )

      if (error) {
        return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 })
      }
    } else if (action === 'delete') {
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}