import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Get day availability for a specific date range
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const staffId = url.searchParams.get('staffId')

    if (!businessId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Business ID, start date, and end date are required' 
      }, { status: 400 })
    }

    console.log('📅 CALENDAR: Fetching day availability', { businessId, startDate, endDate, staffId })

    let queryText = `
      SELECT da.*, s.display_name as staff_name 
      FROM day_availability da
      LEFT JOIN staff s ON da.staff_id = s.id
      WHERE da.business_id = $1 
      AND da.date BETWEEN $2 AND $3
    `
    const params: any[] = [businessId, startDate, endDate]

    if (staffId) {
      queryText += ' AND (da.staff_id = $4 OR da.staff_id IS NULL)'
      params.push(staffId)
    }

    queryText += ' ORDER BY da.date, da.staff_id'

    const result = await query(queryText, params)

    return NextResponse.json({ 
      availability: result.rows,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error('🔴 CALENDAR: Error fetching day availability:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch day availability' 
    }, { status: 500 })
  }
}

// Set day availability (day off toggle or custom time slots)
export async function POST(request: NextRequest) {
  try {
    const { businessId, staffId, date, isDayOff, customTimeSlots, notes } = await request.json()

    if (!businessId || !date) {
      return NextResponse.json({ 
        error: 'Business ID and date are required' 
      }, { status: 400 })
    }

    console.log('📅 CALENDAR: Setting day availability', { 
      businessId, staffId, date, isDayOff, customTimeSlots 
    })

    // Upsert day availability
    const result = await query(`
      INSERT INTO day_availability (
        business_id, staff_id, date, is_day_off, custom_time_slots, notes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (business_id, staff_id, date) 
      DO UPDATE SET 
        is_day_off = $4,
        custom_time_slots = $5,
        notes = $6,
        updated_at = NOW()
      RETURNING *
    `, [
      businessId, 
      staffId || null, 
      date, 
      isDayOff || false, 
      JSON.stringify(customTimeSlots || []),
      notes || null
    ])

    // Log the action for insights
    await query(`
      INSERT INTO calendar_actions (
        business_id, action_type, action_date, details
      ) VALUES ($1, $2, $3, $4)
    `, [
      businessId,
      isDayOff ? 'day_off_toggle' : 'custom_slots_added',
      date,
      JSON.stringify({ 
        staffId, 
        isDayOff, 
        slotsCount: (customTimeSlots || []).length,
        notes 
      })
    ])

    console.log('✅ CALENDAR: Day availability updated successfully')
    
    return NextResponse.json({ 
      success: true, 
      availability: result.rows[0]
    })

  } catch (error) {
    console.error('🔴 CALENDAR: Error setting day availability:', error)
    return NextResponse.json({ 
      error: 'Failed to update day availability' 
    }, { status: 500 })
  }
}

// Delete day availability (reset to default)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId')
    const staffId = url.searchParams.get('staffId')
    const date = url.searchParams.get('date')

    if (!businessId || !date) {
      return NextResponse.json({ 
        error: 'Business ID and date are required' 
      }, { status: 400 })
    }

    console.log('📅 CALENDAR: Deleting day availability', { businessId, staffId, date })

    const result = await query(`
      DELETE FROM day_availability 
      WHERE business_id = $1 
      AND ($2::UUID IS NULL OR staff_id = $2::UUID OR (staff_id IS NULL AND $2::UUID IS NULL))
      AND date = $3
      RETURNING *
    `, [businessId, staffId || null, date])

    // Log the action
    await query(`
      INSERT INTO calendar_actions (
        business_id, action_type, action_date, details
      ) VALUES ($1, $2, $3, $4)
    `, [
      businessId,
      'availability_reset',
      date,
      JSON.stringify({ staffId, deletedCount: result.rowCount })
    ])

    console.log('✅ CALENDAR: Day availability deleted successfully')
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.rowCount
    })

  } catch (error) {
    console.error('🔴 CALENDAR: Error deleting day availability:', error)
    return NextResponse.json({ 
      error: 'Failed to delete day availability' 
    }, { status: 500 })
  }
}