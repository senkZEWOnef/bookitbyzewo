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

    const result = await query(
      `SELECT
        id, name, slug, location, timezone, messaging_mode,
        deposit_enabled, deposit_amount, deposit_policy,
        ath_movil_enabled, ath_movil_public_token,
        stripe_enabled, stripe_publishable_key,
        created_at, updated_at
      FROM businesses WHERE id = $1`,
      [businessId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      business: result.rows[0]
    })

  } catch (error) {
    console.error('Business fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 })
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
      name,
      slug,
      location,
      timezone,
      messaging_mode,
      deposit_enabled,
      deposit_amount,
      deposit_policy,
      ath_movil_enabled,
      ath_movil_public_token,
      ath_movil_private_token,
      stripe_enabled,
      stripe_publishable_key,
      stripe_secret_key
    } = await request.json()

    // If slug is being changed, check if the new slug is available
    if (slug) {
      const slugCheck = await query(
        'SELECT id FROM businesses WHERE slug = $1 AND id != $2',
        [slug, businessId]
      )
      if (slugCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Booking URL already taken' }, { status: 400 })
      }
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const fields: Record<string, any> = {
      name,
      slug,
      location,
      timezone,
      messaging_mode,
      deposit_enabled,
      deposit_amount,
      deposit_policy,
      ath_movil_enabled,
      ath_movil_public_token,
      ath_movil_private_token,
      stripe_enabled,
      stripe_publishable_key,
      stripe_secret_key
    }

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(businessId)

    const result = await query(
      `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, slug, location, timezone, messaging_mode,
         deposit_enabled, deposit_amount, deposit_policy,
         ath_movil_enabled, stripe_enabled, updated_at`,
      values
    )

    console.log('🟢 Business updated:', result.rows[0])

    return NextResponse.json({
      success: true,
      business: result.rows[0]
    })

  } catch (error) {
    console.error('Business update error:', error)
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
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

    // Check for active appointments before deletion
    const appointmentsCheck = await query(
      `SELECT COUNT(*) as count FROM appointments
       WHERE business_id = $1 AND status IN ('confirmed', 'pending') AND starts_at > NOW()`,
      [businessId]
    )

    if (parseInt(appointmentsCheck.rows[0].count) > 0) {
      return NextResponse.json({
        error: 'Cannot delete business with upcoming appointments. Please cancel or complete them first.'
      }, { status: 400 })
    }

    // Soft delete by deactivating or hard delete based on your preference
    // For now, we'll do a hard delete with cascading
    await query('DELETE FROM businesses WHERE id = $1', [businessId])

    console.log('🟢 Business deleted:', businessId)

    return NextResponse.json({
      success: true,
      message: 'Business deleted successfully'
    })

  } catch (error) {
    console.error('Business deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}
