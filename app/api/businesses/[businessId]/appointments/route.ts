import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    console.log('🟡 Fetching appointments for business:', businessId, 'from', startDate, 'to', endDate)

    // First add missing columns if they don't exist
    try {
      await query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER DEFAULT 0')
      await query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount_cents INTEGER DEFAULT 0')
    } catch (alterError) {
      console.log('🟡 Columns already exist or permission issue (this is OK)')
    }

    let queryText = `
      SELECT 
        a.id,
        a.customer_name,
        a.customer_phone,
        a.customer_email,
        a.starts_at,
        a.status,
        COALESCE(a.deposit_amount_cents, 0) as deposit_amount,
        COALESCE(a.total_amount_cents, 0) as total_amount,
        a.notes,
        s.name as service_name,
        s.duration_minutes as service_duration,
        a.created_at,
        a.updated_at
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.business_id = $1
    `
    
    const queryParams = [businessId]
    
    if (startDate) {
      queryText += ` AND a.starts_at >= $${queryParams.length + 1}`
      queryParams.push(startDate)
    }
    
    if (endDate) {
      queryText += ` AND a.starts_at <= $${queryParams.length + 1}`
      queryParams.push(endDate)
    }
    
    queryText += ` ORDER BY a.starts_at ASC`

    const result = await query(queryText, queryParams)

    const appointments = result.rows.map(apt => ({
      id: apt.id,
      customer_name: apt.customer_name,
      customer_phone: apt.customer_phone,
      customer_email: apt.customer_email,
      starts_at: apt.starts_at,
      status: apt.status,
      service_name: apt.service_name || 'Unknown Service',
      service_duration: apt.service_duration,
      deposit_amount: apt.deposit_amount,
      total_amount: apt.total_amount,
      notes: apt.notes,
      payment_status: apt.deposit_amount > 0 ? 'pending' : null, // TODO: Implement proper payment status
      payment_provider: null, // TODO: Implement payment provider tracking
      created_at: apt.created_at,
      updated_at: apt.updated_at
    }))

    console.log('🟢 Found', appointments.length, 'appointments for business', businessId)

    return NextResponse.json({ 
      success: true, 
      appointments 
    })

  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const appointmentData = await request.json()

    console.log('🟡 Creating appointment for business:', businessId, appointmentData)

    const {
      customer_name,
      customer_phone,
      customer_email,
      service_id,
      starts_at,
      notes,
      deposit_amount_cents = 0,
      total_amount_cents = 0
    } = appointmentData

    if (!customer_name || !customer_phone || !service_id || !starts_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO appointments (
        business_id,
        service_id,
        customer_name,
        customer_phone,
        customer_email,
        starts_at,
        status,
        deposit_amount_cents,
        total_amount_cents,
        notes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, customer_name, starts_at, status`,
      [
        businessId,
        service_id,
        customer_name,
        customer_phone,
        customer_email || null,
        starts_at,
        'confirmed', // Default status
        deposit_amount_cents,
        total_amount_cents,
        notes || null
      ]
    )

    const appointment = result.rows[0]
    console.log('🟢 Appointment created successfully:', appointment)

    return NextResponse.json({ 
      success: true, 
      appointment 
    })

  } catch (error) {
    console.error('Appointment creation error:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}