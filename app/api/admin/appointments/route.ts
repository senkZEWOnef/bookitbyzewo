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
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')

    let query = supabase
      .from('appointments')
      .select(`
        *,
        businesses:business_id (
          name,
          slug
        ),
        services:service_id (
          name,
          price_cents
        ),
        staff:staff_id (
          display_name
        ),
        payments (
          amount_cents,
          status,
          provider
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting appointments:', countError)
    }

    return NextResponse.json({ 
      appointments,
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Admin appointments error:', error)
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
    const { action, appointmentId, data } = await request.json()

    if (action === 'cancel') {
      // Cancel appointment
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'canceled',
          notes: (data?.reason ? `Admin canceled: ${data.reason}` : 'Canceled by admin')
        })
        .eq('id', appointmentId)

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
      }
    } else if (action === 'refund') {
      // Mark payment as refunded (would need Stripe integration for actual refund)
      const { error } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('appointment_id', appointmentId)

      if (error) {
        return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
      }

      // Also cancel the appointment
      await supabase
        .from('appointments')
        .update({ status: 'canceled', notes: 'Refunded by admin' })
        .eq('id', appointmentId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin appointment action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}