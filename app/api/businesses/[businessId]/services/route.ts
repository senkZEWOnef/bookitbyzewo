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

    console.log('🟡 Fetching services for business:', businessId)

    // Get services for the business
    const result = await query(
      `SELECT 
        id, 
        business_id, 
        name, 
        description, 
        duration_minutes as duration_min, 
        price_cents, 
        deposit_cents,
        is_active,
        created_at, 
        updated_at
      FROM services 
      WHERE business_id = $1 AND is_active = true
      ORDER BY created_at ASC`,
      [businessId]
    )

    const services = result.rows
    console.log('🟢 Found', services.length, 'services for business', businessId)

    return NextResponse.json({ 
      success: true, 
      services 
    })

  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}