import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function verifyBusinessOwnership(businessId: string, userId: string): Promise<boolean> {
  const result = await query(
    'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
    [businessId, userId]
  )
  return result.rows.length > 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isOwner = await verifyBusinessOwnership(businessId, userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

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

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isOwner = await verifyBusinessOwnership(businessId, userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const {
      name,
      description,
      duration_min,
      price_cents,
      deposit_cents,
      buffer_before_min,
      buffer_after_min,
      max_per_slot
    } = await request.json()

    if (!name || !duration_min || price_cents === undefined) {
      return NextResponse.json({ error: 'Name, duration, and price are required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO services (
        business_id, name, description, duration_minutes, price_cents, deposit_cents,
        buffer_before_min, buffer_after_min, max_per_slot, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
      RETURNING id, name, description, duration_minutes as duration_min, price_cents, deposit_cents, is_active`,
      [
        businessId,
        name,
        description || null,
        duration_min,
        price_cents,
        deposit_cents || 0,
        buffer_before_min || 0,
        buffer_after_min || 0,
        max_per_slot || 1
      ]
    )

    console.log('🟢 Service created:', result.rows[0])

    return NextResponse.json({
      success: true,
      service: result.rows[0]
    })

  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isOwner = await verifyBusinessOwnership(businessId, userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const {
      id,
      name,
      description,
      duration_min,
      price_cents,
      deposit_cents,
      buffer_before_min,
      buffer_after_min,
      max_per_slot,
      is_active
    } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    // Verify service belongs to this business
    const serviceCheck = await query(
      'SELECT id FROM services WHERE id = $1 AND business_id = $2',
      [id, businessId]
    )

    if (serviceCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const result = await query(
      `UPDATE services SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        duration_minutes = COALESCE($3, duration_minutes),
        price_cents = COALESCE($4, price_cents),
        deposit_cents = COALESCE($5, deposit_cents),
        buffer_before_min = COALESCE($6, buffer_before_min),
        buffer_after_min = COALESCE($7, buffer_after_min),
        max_per_slot = COALESCE($8, max_per_slot),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $10 AND business_id = $11
      RETURNING id, name, description, duration_minutes as duration_min, price_cents, deposit_cents, is_active`,
      [
        name,
        description,
        duration_min,
        price_cents,
        deposit_cents,
        buffer_before_min,
        buffer_after_min,
        max_per_slot,
        is_active,
        id,
        businessId
      ]
    )

    console.log('🟢 Service updated:', result.rows[0])

    return NextResponse.json({
      success: true,
      service: result.rows[0]
    })

  } catch (error) {
    console.error('Service update error:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isOwner = await verifyBusinessOwnership(businessId, userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('id')

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    // Soft delete - set is_active to false
    await query(
      'UPDATE services SET is_active = false, updated_at = NOW() WHERE id = $1 AND business_id = $2',
      [serviceId, businessId]
    )

    console.log('🟢 Service deactivated:', serviceId)

    return NextResponse.json({
      success: true,
      message: 'Service deactivated'
    })

  } catch (error) {
    console.error('Service deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}