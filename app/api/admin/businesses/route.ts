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
    // Get all businesses with owner info and stats
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        *,
        profiles:owner_id (
          full_name,
          phone
        ),
        appointments:appointments (count),
        services:services (count),
        staff:staff (count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching businesses:', error)
      return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
    }

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error('Admin businesses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { businessId } = await request.json()

    // Delete business (cascade will handle related records)
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId)

    if (error) {
      console.error('Error deleting business:', error)
      return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete business error:', error)
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
    const { action, businessId, data } = await request.json()

    if (action === 'suspend') {
      // Suspend business by setting subscription to inactive
      const { error } = await supabase
        .from('businesses')
        .update({ 
          subscription_status: 'suspended',
          last_payment_failed: true
        })
        .eq('id', businessId)

      if (error) {
        return NextResponse.json({ error: 'Failed to suspend business' }, { status: 500 })
      }
    } else if (action === 'activate') {
      // Activate business
      const { error } = await supabase
        .from('businesses')
        .update({ 
          subscription_status: 'active',
          last_payment_failed: false,
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('id', businessId)

      if (error) {
        return NextResponse.json({ error: 'Failed to activate business' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin business action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}