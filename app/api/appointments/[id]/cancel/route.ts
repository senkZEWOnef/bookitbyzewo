import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  
  try {
    // Get existing appointment
    const appointmentResult = await query(
      'SELECT * FROM appointments WHERE id = $1',
      [params.id]
    )
    const appointment = appointmentResult.rows[0]

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (appointment.status === 'canceled') {
      return NextResponse.json(
        { error: 'Appointment is already canceled' },
        { status: 400 }
      )
    }

    // Update appointment status to canceled
    await query(
      'UPDATE appointments SET status = $1 WHERE id = $2',
      ['canceled', params.id]
    )


    // TODO: Handle deposit refund logic based on business policies
    // TODO: Send WhatsApp notification about cancellation

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel API error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    )
  }
}