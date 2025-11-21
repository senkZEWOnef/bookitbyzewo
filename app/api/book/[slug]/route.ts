import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseISO, addMinutes } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const { serviceId, datetime, customerName, customerPhone, customerEmail, notes } = body

    if (!serviceId || !datetime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get business details using Neon
    const businessResult = await query(
      'SELECT * FROM businesses WHERE slug = $1',
      [params.slug]
    )

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const business = businessResult.rows[0]

    // Get service details using Neon
    const serviceResult = await query(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2 AND is_active = true',
      [serviceId, business.id]
    )

    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      )
    }

    const service = serviceResult.rows[0]

    // Check for time conflicts
    const startTime = parseISO(datetime)
    const endTime = addMinutes(startTime, service.duration_minutes)

    const conflictResult = await query(`
      SELECT id FROM appointments 
      WHERE business_id = $1 
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (starts_at <= $2 AND starts_at + INTERVAL '1 minute' * duration_minutes > $2) OR
        (starts_at < $3 AND starts_at + INTERVAL '1 minute' * duration_minutes >= $3) OR
        (starts_at >= $2 AND starts_at < $3)
      )
    `, [business.id, startTime.toISOString(), endTime.toISOString()])

    if (conflictResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 409 }
      )
    }

    // Create the appointment
    const appointmentResult = await query(`
      INSERT INTO appointments (
        business_id,
        service_id,
        customer_name,
        customer_phone,
        customer_email,
        starts_at,
        ends_at,
        duration_minutes,
        status,
        total_amount_cents,
        deposit_amount_cents,
        notes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, starts_at, ends_at, status
    `, [
      business.id,
      serviceId,
      customerName,
      customerPhone,
      customerEmail || null,
      startTime.toISOString(),
      endTime.toISOString(),
      service.duration_minutes,
      'confirmed', // Default status
      service.price_cents || 0,
      0, // No deposit for now
      notes || null
    ])

    const appointment = appointmentResult.rows[0]

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        starts_at: appointment.starts_at,
        status: appointment.status,
        business_name: business.name,
        service_name: service.name,
        customer_name: customerName,
        duration_minutes: service.duration_minutes
      }
    })

  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

// Get appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    // Get appointment with business and service details
    const result = await query(`
      SELECT 
        a.*,
        b.name as business_name,
        b.slug as business_slug,
        s.name as service_name,
        s.price_cents as service_price
      FROM appointments a
      JOIN businesses b ON a.business_id = b.id
      JOIN services s ON a.service_id = s.id
      WHERE a.id = $1 AND b.slug = $2
    `, [appointmentId, params.slug])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const appointment = result.rows[0]

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        starts_at: appointment.starts_at,
        status: appointment.status,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        customer_email: appointment.customer_email,
        business_name: appointment.business_name,
        service_name: appointment.service_name,
        duration_minutes: appointment.duration_minutes,
        total_amount_cents: appointment.total_amount_cents,
        notes: appointment.notes
      }
    })

  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}