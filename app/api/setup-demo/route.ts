import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🟡 Setting up demo business...')

    // Check if demo business exists
    let demoBusinessResult = await query(
      'SELECT id FROM businesses WHERE slug = $1',
      ['demo']
    )

    let demoBusinessId: string

    if (demoBusinessResult.rows.length === 0) {
      console.log('🟡 Demo business not found, creating it...')
      
      // Get the first user to be the demo business owner
      const userResult = await query('SELECT id FROM users LIMIT 1')
      if (userResult.rows.length === 0) {
        throw new Error('No users found in database')
      }
      
      const ownerId = userResult.rows[0].id
      console.log('🟡 Using user as demo owner:', ownerId)
      
      // Create demo business
      const createBusinessResult = await query(
        `INSERT INTO businesses (
          name, slug, location, timezone, owner_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
        RETURNING id`,
        [
          'Demo Business - Hair Salon',
          'demo',
          'San Juan, Puerto Rico',
          'America/Puerto_Rico',
          ownerId
        ]
      )
      
      demoBusinessId = createBusinessResult.rows[0].id
      console.log('🟢 Demo business created:', demoBusinessId)

      // Create demo services
      const demoServices = [
        { name: 'Haircut', duration_min: 45, price_cents: 3500, deposit_cents: 1000 },
        { name: 'Beard Trim', duration_min: 20, price_cents: 1500, deposit_cents: 500 },
        { name: 'Haircut & Beard', duration_min: 60, price_cents: 4500, deposit_cents: 1500 },
        { name: 'Hair Wash & Style', duration_min: 30, price_cents: 2500, deposit_cents: 0 }
      ]
      
      for (const service of demoServices) {
        await query(
          `INSERT INTO services (
            business_id, name, duration_minutes, price_cents, deposit_cents, 
            is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
          [
            demoBusinessId,
            service.name,
            service.duration_min,
            service.price_cents,
            service.deposit_cents
          ]
        )
      }
      console.log('🟢 Demo services created')
    } else {
      demoBusinessId = demoBusinessResult.rows[0].id
      console.log('🟡 Demo business already exists:', demoBusinessId)
    }

    // Check if it already has default hours
    const existingHours = await query(
      'SELECT id FROM business_default_hours WHERE business_id = $1',
      [demoBusinessId]
    )

    if (existingHours.rows.length > 0) {
      console.log('🟡 Demo business already has default hours')
      return NextResponse.json({ 
        success: true, 
        message: 'Demo business already configured',
        businessId: demoBusinessId
      })
    }

    // Create default business hours for demo
    const defaultSchedule = [
      { day_of_week: 0, is_closed: true }, // Sunday - closed
      { day_of_week: 1, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Monday
      { day_of_week: 2, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Tuesday
      { day_of_week: 3, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Wednesday
      { day_of_week: 4, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Thursday
      { day_of_week: 5, is_closed: false, open_time: '09:00', close_time: '17:00', slot_duration_minutes: 30 }, // Friday
      { day_of_week: 6, is_closed: false, open_time: '10:00', close_time: '15:00', slot_duration_minutes: 30 }  // Saturday
    ]
    
    console.log('🟡 Creating default business hours for demo...')
    for (const hours of defaultSchedule) {
      await query(
        `INSERT INTO business_default_hours (
          business_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes, break_times, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [demoBusinessId, hours.day_of_week, hours.is_closed, hours.open_time || null, hours.close_time || null, hours.slot_duration_minutes || 30, '[]']
      )
    }

    console.log('🟢 Demo business setup completed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Demo business configured with default hours',
      businessId: demoBusinessId
    })

  } catch (error) {
    console.error('Demo setup error:', error)
    return NextResponse.json({ 
      error: 'Failed to setup demo business',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}