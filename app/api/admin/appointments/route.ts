import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to verify admin token
async function verifyAdminToken(token: string) {
  try {
    const result = await query(
      'SELECT expires_at FROM admin_sessions WHERE session_token = $1',
      [token]
    )

    if (result.rows.length === 0 || new Date(result.rows[0].expires_at) < new Date()) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recent appointments with business and service info using Neon
    const result = await query(`
      SELECT 
        a.id,
        a.customer_name,
        a.customer_phone,
        a.starts_at,
        a.status,
        b.name as business_name,
        b.slug as business_slug,
        s.name as service_name,
        s.price_cents as service_price
      FROM appointments a
      LEFT JOIN businesses b ON a.business_id = b.id
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `, [limit])

    const appointments = result.rows.map(row => ({
      id: row.id,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      starts_at: row.starts_at,
      status: row.status,
      businesses: {
        name: row.business_name,
        slug: row.business_slug
      },
      services: {
        name: row.service_name,
        price_cents: row.service_price
      },
      payments: [] // TODO: Implement payments when payment table is available
    }))

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Admin appointments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}