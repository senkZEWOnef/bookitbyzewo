import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseISO, addMinutes } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  
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
    const appointmentResult = await query(`
      SELECT a.*, s.duration_minutes
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.id = $1
    `, [params.id])
    const appointment = appointmentResult.rows[0]

    if (!appointment) {
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
    const newEndsAt = addMinutes(newStartsAt, appointment.duration_minutes)

    // Check if new slot is available
    let conflictQuery = `
      SELECT id FROM appointments 
      WHERE business_id = $1 
      AND starts_at >= $2 
      AND starts_at <= $3 
      AND status IN ('confirmed', 'pending')
      AND id != $4
    `
    const queryParams = [appointment.business_id, newStartsAt.toISOString(), newEndsAt.toISOString(), params.id]
    
    if (appointment.staff_id) {
      conflictQuery += ' AND staff_id = $5'
      queryParams.push(appointment.staff_id)
    } else {
      conflictQuery += ' AND staff_id IS NULL'
    }
    
    const conflictResult = await query(conflictQuery, queryParams)
    const conflictingAppointments = conflictResult.rows

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'New time slot is not available' },
        { status: 409 }
      )
    }

    // Update appointment
    await query(
      'UPDATE appointments SET starts_at = $1, ends_at = $2 WHERE id = $3',
      [newStartsAt.toISOString(), newEndsAt.toISOString(), params.id]
    )


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