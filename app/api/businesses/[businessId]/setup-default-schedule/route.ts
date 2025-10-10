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

    // Check if business already has availability rules
    const existingRules = await query(
      'SELECT id FROM availability_rules WHERE business_id = $1',
      [businessId]
    )

    if (existingRules.rows.length > 0) {
      console.log('🟡 Business already has availability rules, skipping setup')
      return NextResponse.json({ 
        success: true, 
        message: 'Business already has availability rules' 
      })
    }

    // Create default availability rules (Monday-Friday 9AM-5PM, Saturday 10AM-3PM)
    const defaultSchedule = [
      { weekday: 1, start_time: '09:00', end_time: '17:00' }, // Monday
      { weekday: 2, start_time: '09:00', end_time: '17:00' }, // Tuesday
      { weekday: 3, start_time: '09:00', end_time: '17:00' }, // Wednesday
      { weekday: 4, start_time: '09:00', end_time: '17:00' }, // Thursday
      { weekday: 5, start_time: '09:00', end_time: '17:00' }, // Friday
      { weekday: 6, start_time: '10:00', end_time: '15:00' }  // Saturday
    ]
    
    for (const rule of defaultSchedule) {
      await query(
        `INSERT INTO availability_rules (
          business_id, weekday, start_time, end_time, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [businessId, rule.weekday, rule.start_time, rule.end_time]
      )
    }
    
    console.log('🟢 Default availability rules created successfully for business', businessId)

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