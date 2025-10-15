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

    console.log('🟡 Fetching availability for business:', businessId)

    // Create tables if they don't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS availability_rules (
          id SERIAL PRIMARY KEY,
          business_id UUID NOT NULL,
          staff_id UUID NULL,
          weekday INTEGER NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS availability_exceptions (
          id SERIAL PRIMARY KEY,
          business_id UUID NOT NULL,
          staff_id UUID NULL,
          date DATE NOT NULL,
          is_closed BOOLEAN DEFAULT FALSE,
          start_time TIME NULL,
          end_time TIME NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
    } catch (createError) {
      console.log('🟡 Tables already exist or permission issue (this is OK)')
    }

    // Get availability rules
    const rulesResult = await query(
      `SELECT 
        id,
        weekday,
        start_time,
        end_time,
        is_active
      FROM availability_rules 
      WHERE business_id = $1 AND is_active = true
      ORDER BY weekday ASC`,
      [businessId]
    )

    // Get availability exceptions
    const exceptionsResult = await query(
      `SELECT 
        id,
        date,
        is_closed,
        start_time,
        end_time,
        reason
      FROM availability_exceptions 
      WHERE business_id = $1 
      ORDER BY date ASC`,
      [businessId]
    )

    const availability = {
      rules: rulesResult.rows,
      exceptions: exceptionsResult.rows
    }

    console.log('🟢 Found', availability.rules.length, 'rules and', availability.exceptions.length, 'exceptions for business', businessId)

    return NextResponse.json({ 
      success: true, 
      availability 
    })

  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const { type, data } = await request.json()

    console.log('🟡 Creating availability for business:', businessId, 'type:', type)

    if (type === 'rule') {
      const { weekday, start_time, end_time } = data
      
      if (weekday === undefined || !start_time || !end_time) {
        return NextResponse.json({ error: 'Missing required fields for rule' }, { status: 400 })
      }

      const result = await query(
        `INSERT INTO availability_rules (
          business_id,
          weekday,
          start_time,
          end_time,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING id, weekday, start_time, end_time`,
        [businessId, weekday, start_time, end_time]
      )

      return NextResponse.json({ 
        success: true, 
        rule: result.rows[0] 
      })

    } else if (type === 'exception') {
      const { date, is_closed, start_time, end_time, reason } = data
      
      if (!date || is_closed === undefined) {
        return NextResponse.json({ error: 'Missing required fields for exception' }, { status: 400 })
      }

      const result = await query(
        `INSERT INTO availability_exceptions (
          business_id,
          date,
          is_closed,
          start_time,
          end_time,
          reason,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, date, is_closed, start_time, end_time, reason`,
        [businessId, date, is_closed, start_time || null, end_time || null, reason || null]
      )

      return NextResponse.json({ 
        success: true, 
        exception: result.rows[0] 
      })

    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "rule" or "exception"' }, { status: 400 })
    }

  } catch (error) {
    console.error('Availability creation error:', error)
    return NextResponse.json({ error: 'Failed to create availability' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    
    console.log('🟡 Deleting availability rules for business:', businessId)

    // Delete all availability rules for the business
    await query(
      'DELETE FROM availability_rules WHERE business_id = $1',
      [businessId]
    )

    console.log('🟢 Deleted availability rules for business', businessId)

    return NextResponse.json({ 
      success: true,
      message: 'Availability rules deleted successfully'
    })

  } catch (error) {
    console.error('Availability deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete availability rules' }, { status: 500 })
  }
}