import { NextRequest, NextResponse } from 'next/server'
import { query } from "@/lib/database"
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  
  try {
    // Get business details
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

    // Get services for this business
    const servicesResult = await query(
      'SELECT * FROM services WHERE business_id = $1 ORDER BY name',
      [business.id]
    )

    // Get staff for this business (optional, for multi-staff businesses)
    const staffResult = await query(
      'SELECT * FROM staff WHERE business_id = $1 ORDER BY display_name',
      [business.id]
    )

    return NextResponse.json({
      business,
      services: servicesResult.rows || [],
      staff: staffResult.rows || []
    })
  } catch (error) {
    console.error('Business API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business data' },
      { status: 500 }
    )
  }
}