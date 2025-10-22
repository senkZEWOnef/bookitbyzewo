import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Get all recurring appointments for a business
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId')
    const staffId = url.searchParams.get('staffId')
    const isActive = url.searchParams.get('isActive')

    if (!businessId) {
      return NextResponse.json({ 
        error: 'Business ID is required' 
      }, { status: 400 })
    }

    console.log('🔄 RECURRING: Fetching recurring appointments', { businessId, staffId, isActive })

    let queryText = `
      SELECT 
        ra.*,
        s.name as service_name,
        s.duration_minutes as service_duration,
        s.price_cents as service_price,
        st.display_name as staff_name,
        COUNT(a.id) as total_appointments,
        MAX(a.starts_at) as last_appointment_date
      FROM recurring_appointments ra
      LEFT JOIN services s ON ra.service_id = s.id
      LEFT JOIN staff st ON ra.staff_id = st.id
      LEFT JOIN appointments a ON a.recurring_id = ra.id
      WHERE ra.business_id = $1
    `
    const params: any[] = [businessId]

    if (staffId) {
      queryText += ' AND (ra.staff_id = $2 OR ra.staff_id IS NULL)'
      params.push(staffId)
    }

    if (isActive !== null) {
      const activeIndex = params.length + 1
      queryText += ` AND ra.is_active = $${activeIndex}`
      params.push(isActive === 'true')
    }

    queryText += `
      GROUP BY ra.id, s.name, s.duration_minutes, s.price_cents, st.display_name
      ORDER BY ra.created_at DESC
    `

    const result = await query(queryText, params)

    return NextResponse.json({ 
      recurringAppointments: result.rows 
    })

  } catch (error) {
    console.error('🔴 RECURRING: Error fetching recurring appointments:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch recurring appointments' 
    }, { status: 500 })
  }
}

// Create a new recurring appointment
export async function POST(request: NextRequest) {
  try {
    const {
      businessId,
      serviceId,
      staffId,
      customerName,
      customerPhone,
      customerEmail,
      frequency,
      startDate,
      endDate,
      timeOfDay,
      notes
    } = await request.json()

    if (!businessId || !serviceId || !customerName || !customerPhone || !frequency || !startDate || !timeOfDay) {
      return NextResponse.json({ 
        error: 'Missing required fields: businessId, serviceId, customerName, customerPhone, frequency, startDate, timeOfDay' 
      }, { status: 400 })
    }

    // Validate frequency
    if (!['weekly', 'bi-weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json({ 
        error: 'Frequency must be weekly, bi-weekly, or monthly' 
      }, { status: 400 })
    }

    console.log('🔄 RECURRING: Creating recurring appointment', {
      businessId, serviceId, customerName, frequency, startDate
    })

    // Get service duration
    const serviceResult = await query(
      'SELECT duration_minutes FROM services WHERE id = $1 AND business_id = $2',
      [serviceId, businessId]
    )

    if (serviceResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Service not found' 
      }, { status: 404 })
    }

    const durationMinutes = serviceResult.rows[0].duration_minutes

    // Create recurring appointment record
    const recurringResult = await query(`
      INSERT INTO recurring_appointments (
        business_id, service_id, staff_id, customer_name, customer_phone, customer_email,
        frequency, start_date, end_date, time_of_day, duration_minutes, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `, [
      businessId, serviceId, staffId || null, customerName, customerPhone, customerEmail || null,
      frequency, startDate, endDate || null, timeOfDay, durationMinutes, notes || null
    ])

    const recurringAppointment = recurringResult.rows[0]

    // Generate initial appointments (next 30 days)
    await query('SELECT generate_recurring_appointments()')

    // Log the action
    await query(`
      INSERT INTO calendar_actions (
        business_id, action_type, action_date, details
      ) VALUES ($1, $2, $3, $4)
    `, [
      businessId,
      'recurring_created',
      startDate,
      JSON.stringify({
        recurringId: recurringAppointment.id,
        customerName,
        frequency,
        serviceId,
        staffId
      })
    ])

    console.log('✅ RECURRING: Recurring appointment created successfully:', recurringAppointment.id)

    return NextResponse.json({ 
      success: true, 
      recurringAppointment: recurringAppointment
    })

  } catch (error) {
    console.error('🔴 RECURRING: Error creating recurring appointment:', error)
    return NextResponse.json({ 
      error: 'Failed to create recurring appointment' 
    }, { status: 500 })
  }
}

// Update a recurring appointment
export async function PUT(request: NextRequest) {
  try {
    const {
      id,
      businessId,
      serviceId,
      staffId,
      customerName,
      customerPhone,
      customerEmail,
      frequency,
      endDate,
      timeOfDay,
      notes,
      isActive
    } = await request.json()

    if (!id || !businessId) {
      return NextResponse.json({ 
        error: 'Recurring appointment ID and business ID are required' 
      }, { status: 400 })
    }

    console.log('🔄 RECURRING: Updating recurring appointment', { id, businessId })

    // Update the recurring appointment
    const result = await query(`
      UPDATE recurring_appointments SET
        service_id = COALESCE($3, service_id),
        staff_id = $4,
        customer_name = COALESCE($5, customer_name),
        customer_phone = COALESCE($6, customer_phone),
        customer_email = $7,
        frequency = COALESCE($8, frequency),
        end_date = $9,
        time_of_day = COALESCE($10, time_of_day),
        notes = $11,
        is_active = COALESCE($12, is_active),
        updated_at = NOW()
      WHERE id = $1 AND business_id = $2
      RETURNING *
    `, [
      id, businessId, serviceId, staffId || null, customerName, customerPhone,
      customerEmail || null, frequency, endDate || null, timeOfDay, notes || null, isActive
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Recurring appointment not found' 
      }, { status: 404 })
    }

    // If deactivated, cancel future appointments
    if (isActive === false) {
      await query(`
        UPDATE appointments SET
          status = 'canceled',
          notes = COALESCE(notes, '') || ' (Recurring series canceled)'
        WHERE recurring_id = $1 
        AND starts_at > NOW()
        AND status IN ('confirmed', 'pending')
      `, [id])
    }

    // Log the action
    await query(`
      INSERT INTO calendar_actions (
        business_id, action_type, action_date, details
      ) VALUES ($1, $2, $3, $4)
    `, [
      businessId,
      isActive === false ? 'recurring_canceled' : 'recurring_updated',
      new Date().toISOString().split('T')[0],
      JSON.stringify({ recurringId: id, isActive, customerName })
    ])

    console.log('✅ RECURRING: Recurring appointment updated successfully')

    return NextResponse.json({ 
      success: true, 
      recurringAppointment: result.rows[0]
    })

  } catch (error) {
    console.error('🔴 RECURRING: Error updating recurring appointment:', error)
    return NextResponse.json({ 
      error: 'Failed to update recurring appointment' 
    }, { status: 500 })
  }
}

// Delete a recurring appointment
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const businessId = url.searchParams.get('businessId')
    const cancelFutureAppointments = url.searchParams.get('cancelFuture') === 'true'

    if (!id || !businessId) {
      return NextResponse.json({ 
        error: 'Recurring appointment ID and business ID are required' 
      }, { status: 400 })
    }

    console.log('🔄 RECURRING: Deleting recurring appointment', { id, businessId, cancelFutureAppointments })

    if (cancelFutureAppointments) {
      // Cancel all future appointments
      await query(`
        UPDATE appointments SET
          status = 'canceled',
          notes = COALESCE(notes, '') || ' (Recurring series deleted)'
        WHERE recurring_id = $1 
        AND starts_at > NOW()
        AND status IN ('confirmed', 'pending')
      `, [id])
    }

    // Delete the recurring appointment record
    const result = await query(`
      DELETE FROM recurring_appointments 
      WHERE id = $1 AND business_id = $2
      RETURNING customer_name
    `, [id, businessId])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Recurring appointment not found' 
      }, { status: 404 })
    }

    // Log the action
    await query(`
      INSERT INTO calendar_actions (
        business_id, action_type, action_date, details
      ) VALUES ($1, $2, $3, $4)
    `, [
      businessId,
      'recurring_deleted',
      new Date().toISOString().split('T')[0],
      JSON.stringify({ 
        recurringId: id, 
        customerName: result.rows[0].customer_name,
        canceledFuture: cancelFutureAppointments 
      })
    ])

    console.log('✅ RECURRING: Recurring appointment deleted successfully')

    return NextResponse.json({ 
      success: true, 
      deletedCustomer: result.rows[0].customer_name
    })

  } catch (error) {
    console.error('🔴 RECURRING: Error deleting recurring appointment:', error)
    return NextResponse.json({ 
      error: 'Failed to delete recurring appointment' 
    }, { status: 500 })
  }
}