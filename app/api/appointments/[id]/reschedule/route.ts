import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseISO, addMinutes } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const body = await request.json()
    const { datetime } = body

    if (!datetime) {
      return NextResponse.json(
        { error: 'New datetime is required' },
        { status: 400 }
      )
    }

    // Get existing appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        services (duration_min)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (appointment.status === 'canceled') {
      return NextResponse.json(
        { error: 'Cannot reschedule canceled appointment' },
        { status: 400 }
      )
    }

    // Calculate new end time
    const newStartsAt = parseISO(datetime)
    const newEndsAt = addMinutes(newStartsAt, appointment.services.duration_min)

    // Check if new slot is available
    let query = supabase
      .from('appointments')
      .select('id')
      .eq('business_id', appointment.business_id)
      .gte('starts_at', newStartsAt.toISOString())
      .lte('starts_at', newEndsAt.toISOString())
      .in('status', ['confirmed', 'pending'])
      .neq('id', params.id) // Exclude current appointment
    
    // Add staff filter if staff_id exists
    if (appointment.staff_id) {
      query = query.eq('staff_id', appointment.staff_id)
    } else {
      query = query.is('staff_id', null)
    }
    
    const { data: conflictingAppointments } = await query

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'New time slot is not available' },
        { status: 409 }
      )
    }

    // Update appointment
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        starts_at: newStartsAt.toISOString(),
        ends_at: newEndsAt.toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Appointment update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reschedule appointment' },
        { status: 500 }
      )
    }

    // TODO: Send WhatsApp notification about reschedule

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reschedule API error:', error)
    return NextResponse.json(
      { error: 'Failed to reschedule appointment' },
      { status: 500 }
    )
  }
}