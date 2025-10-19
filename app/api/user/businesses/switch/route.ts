import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// POST /api/user/businesses/switch - Switch active business context
export async function POST(request: NextRequest) {
  try {
    const { userId, businessId } = await request.json()

    if (!userId || !businessId) {
      return NextResponse.json(
        { error: 'User ID and Business ID are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this business
    const accessCheck = await query(
      `SELECT 
         b.id,
         b.name,
         b.slug,
         COALESCE(ub.role, 'owner') as role,
         CASE WHEN b.owner_id = $1 THEN true ELSE false END as is_owner
       FROM businesses b
       LEFT JOIN user_businesses ub ON ub.business_id = b.id AND ub.user_id = $1
       WHERE 
         b.id = $2 AND 
         ((b.owner_id = $1) OR (ub.user_id = $1 AND ub.is_active = true))`,
      [userId, businessId]
    )

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    const business = accessCheck.rows[0]

    return NextResponse.json({
      message: 'Business context switched successfully',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        role: business.role,
        is_owner: business.is_owner
      }
    })

  } catch (error) {
    console.error('Error switching business context:', error)
    return NextResponse.json(
      { error: 'Failed to switch business context' },
      { status: 500 }
    )
  }
}