import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Manually trigger generation of recurring appointments
export async function POST(request: NextRequest) {
  try {
    const { businessId, recurringId } = await request.json()

    console.log('🔄 GENERATE: Generating recurring appointments', { businessId, recurringId })

    if (recurringId) {
      // Generate for specific recurring appointment
      await query(`
        SELECT generate_recurring_appointments()
        WHERE EXISTS (
          SELECT 1 FROM recurring_appointments 
          WHERE id = $1 AND business_id = $2 AND is_active = TRUE
        )
      `, [recurringId, businessId])
    } else {
      // Generate for all active recurring appointments
      await query('SELECT generate_recurring_appointments()')
    }

    console.log('✅ GENERATE: Recurring appointments generated successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Recurring appointments generated successfully'
    })

  } catch (error) {
    console.error('🔴 GENERATE: Error generating recurring appointments:', error)
    return NextResponse.json({ 
      error: 'Failed to generate recurring appointments' 
    }, { status: 500 })
  }
}

// Get upcoming appointments for next 30 days
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId')
    const staffId = url.searchParams.get('staffId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    if (!businessId) {
      return NextResponse.json({ 
        error: 'Business ID is required' 
      }, { status: 400 })
    }

    console.log('🔄 GENERATE: Fetching upcoming appointments', { businessId, staffId, startDate, endDate, limit })

    let queryText = `
      SELECT 
        a.*,
        s.name as service_name,
        s.duration_minutes as service_duration,
        s.price_cents as service_price,
        st.display_name as staff_name,
        ra.frequency as recurring_frequency,
        ra.customer_email as customer_email
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN staff st ON a.staff_id = st.id
      LEFT JOIN recurring_appointments ra ON a.recurring_id = ra.id
      WHERE a.business_id = $1 
      AND a.status IN ('confirmed', 'pending')
    `
    const params: any[] = [businessId]

    // Add date filtering
    if (startDate && endDate) {
      queryText += ' AND a.starts_at >= $2 AND a.starts_at <= $3'
      params.push(startDate, endDate + ' 23:59:59')
    } else {
      queryText += ' AND a.starts_at >= NOW() AND a.starts_at <= NOW() + INTERVAL \'30 days\''
    }

    if (staffId) {
      const staffParamIndex = params.length + 1
      queryText += ` AND (a.staff_id = $${staffParamIndex} OR a.staff_id IS NULL)`
      params.push(staffId)
    }

    queryText += ' ORDER BY a.starts_at ASC LIMIT $' + (params.length + 1)
    params.push(limit)

    const result = await query(queryText, params)

    return NextResponse.json({ 
      appointments: result.rows,
      totalCount: result.rows.length
    })

  } catch (error) {
    console.error('🔴 GENERATE: Error fetching upcoming appointments:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch upcoming appointments' 
    }, { status: 500 })
  }
}