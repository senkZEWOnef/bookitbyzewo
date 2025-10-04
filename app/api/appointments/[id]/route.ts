import { NextRequest, NextResponse } from 'next/server'
import { query } from "@/lib/database"
import { supabase } from "@/lib/supabase"
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services (name, price_cents, deposit_cents),
        businesses (name, location)
      `)
      .eq('id', params.id)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Format response
    const formattedAppointment = {
      id: appointment.id,
      service_name: appointment.services.name,
      starts_at: appointment.starts_at,
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      customer_locale: appointment.customer_locale,
      business_name: appointment.businesses.name,
      business_location: appointment.businesses.location,
      deposit_amount: appointment.services.deposit_cents,
      total_amount: appointment.services.price_cents,
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