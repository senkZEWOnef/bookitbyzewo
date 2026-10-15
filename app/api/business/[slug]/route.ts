import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ensureModerationColumns, BUSINESS_IS_OPEN } from '@/lib/moderation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    console.log('🔍 BOOKING API: Fetching business data for slug:', slug)

    // Get business by slug
    await ensureModerationColumns()
    const businessResult = await query(
      `SELECT b.id, b.name, b.slug, b.description, b.location, b.phone, b.email, b.timezone
       FROM businesses b LEFT JOIN users u ON u.id = b.owner_id
       WHERE b.slug = $1 AND ${BUSINESS_IS_OPEN}`,
      [slug]
    )

    if (businessResult.rows.length === 0) {
      console.log('❌ BOOKING API: Business not found for slug:', slug)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const business = businessResult.rows[0]
    console.log('✅ BOOKING API: Found business:', business.name)

    // Get services for this business
    const servicesResult = await query(
      `SELECT id, name, description, duration_minutes as duration_min, price_cents, deposit_cents, is_active 
       FROM services 
       WHERE business_id = $1 AND is_active = true 
       ORDER BY price_cents ASC`,
      [business.id]
    )

    const services = servicesResult.rows
    console.log('✅ BOOKING API: Found', services.length, 'services for business')

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        location: business.location,
        phone: business.phone,
        email: business.email,
        timezone: business.timezone,
        // Default payment settings (can be expanded later)
        ath_movil_enabled: false,
        stripe_enabled: false
      },
      services
    })

  } catch (error) {
    console.error('🔴 BOOKING API: Error fetching business data:', error)
    return NextResponse.json({ error: 'Failed to fetch business data' }, { status: 500 })
  }
}