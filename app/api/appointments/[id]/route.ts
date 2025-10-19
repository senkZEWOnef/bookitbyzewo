import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  
  try {
    const appointmentResult = await query(`
      SELECT 
        a.*,
        s.name as service_name,
        s.price_cents,
        s.deposit_cents,
        b.name as business_name,
        b.location as business_location
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN businesses b ON a.business_id = b.id
      WHERE a.id = $1
    `, [params.id])
    
    const appointment = appointmentResult.rows[0]

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Format response
    const formattedAppointment = {
      id: appointment.id,
      service_name: appointment.service_name,
      starts_at: appointment.starts_at,
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      customer_locale: appointment.customer_locale,
      business_name: appointment.business_name,
      business_location: appointment.business_location,
      deposit_amount: appointment.deposit_cents,
      total_amount: appointment.price_cents,
      status: appointment.status
    }

    return NextResponse.json({ appointment: formattedAppointment })
  } catch (error) {
    console.error('Appointment API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}