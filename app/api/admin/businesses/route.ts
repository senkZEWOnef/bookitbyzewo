import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ensureModerationColumns } from '@/lib/moderation'
import { AdminActionError, setBusinessSuspended } from '@/lib/admin-actions'

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
    console.error('Token verification error:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureModerationColumns()
    const result = await query(`
      SELECT 
        b.*,
        u.full_name as owner_name,
        u.phone as owner_phone,
        (SELECT COUNT(*) FROM appointments WHERE business_id = b.id) as appointment_count,
        (SELECT COUNT(*) FROM services WHERE business_id = b.id) as service_count
      FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      ORDER BY b.created_at DESC
    `)

    const businesses = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      location: row.location,
      timezone: row.timezone,
      subscription_status: row.suspended_at ? 'suspended' : 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
      profiles: {
        full_name: row.owner_name,
        phone: row.owner_phone
      },
      appointments: [{ count: parseInt(row.appointment_count) || 0 }],
      services: [{ count: parseInt(row.service_count) || 0 }],
      staff: [{ count: 0 }] // TODO: Add staff count when staff table is implemented
    }))

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error('Admin businesses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { businessId } = await request.json()

    // Delete business (cascade will handle related records)
    await query('DELETE FROM businesses WHERE id = $1', [businessId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete business error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, businessId } = await request.json()
    if (!businessId || !['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await setBusinessSuspended(businessId, action === 'suspend')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Admin business action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}