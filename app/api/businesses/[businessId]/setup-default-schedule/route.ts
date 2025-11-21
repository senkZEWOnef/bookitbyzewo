import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId

    console.log('🟡 Setting up default schedule for business:', businessId)

    // Check if business already has default hours
    const existingHours = await query(
      'SELECT id FROM business_default_hours WHERE business_id = $1',
      [businessId]
    )

    if (existingHours.rows.length > 0) {
      console.log('🟡 Business already has default hours, skipping setup')
      return NextResponse.json({ 
        success: true, 
        message: 'Business already has default hours' 
      })
    }

    // Create default business hours (Monday-Friday 9AM-5PM, Saturday 10AM-3PM, Sunday closed)
    const defaultSchedule = [
      { day_of_week: 0, is_closed: true }, // Sunday - closed
      { day_of_week: 1, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Monday
      { day_of_week: 2, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Tuesday
      { day_of_week: 3, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Wednesday
      { day_of_week: 4, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Thursday
      { day_of_week: 5, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Friday
      { day_of_week: 6, is_closed: false, open_time: '10:00', close_time: '15:00', slot_duration_minutes: 30 }  // Saturday
    ]
    
    for (const hours of defaultSchedule) {
      await query(
        `INSERT INTO business_default_hours (
          business_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes, break_times, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [businessId, hours.day_of_week, hours.is_closed, hours.open_time || null, hours.close_time || null, hours.slot_duration_minutes || 30, '[]']
      )
    }
    
    console.log('🟢 Default business hours created successfully for business', businessId)

    return NextResponse.json({ 
      success: true, 
      message: 'Default schedule created successfully',
      schedule: defaultSchedule
    })

  } catch (error) {
    console.error('Default schedule setup error:', error)
    return NextResponse.json({ error: 'Failed to setup default schedule' }, { status: 500 })
  }
}