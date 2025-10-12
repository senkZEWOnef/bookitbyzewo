import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL
})

// GET /api/user/businesses - Get all businesses a user is associated with
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      // Get all businesses the user is associated with
      const result = await client.query(
        `SELECT 
           b.id,
           b.name,
           b.slug,
           b.description,
           b.location,
           b.phone,
           b.email,
           b.created_at,
           ub.role,
           ub.is_active,
           ub.joined_at,
           CASE WHEN b.owner_id = $1 THEN true ELSE false END as is_owner
         FROM user_businesses ub
         JOIN businesses b ON ub.business_id = b.id
         WHERE ub.user_id = $1 AND ub.is_active = true
         ORDER BY 
           CASE WHEN b.owner_id = $1 THEN 0 ELSE 1 END, -- Owner businesses first
           ub.joined_at DESC`,
        [userId]
      )

      return NextResponse.json({
        businesses: result.rows
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error fetching user businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

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

    const client = await pool.connect()

    try {
      // Verify user has access to this business
      const accessCheck = await client.query(
        `SELECT 
           b.id,
           b.name,
           b.slug,
           ub.role,
           CASE WHEN b.owner_id = $1 THEN true ELSE false END as is_owner
         FROM user_businesses ub
         JOIN businesses b ON ub.business_id = b.id
         WHERE ub.user_id = $1 AND ub.business_id = $2 AND ub.is_active = true`,
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
          isOwner: business.is_owner
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error switching business context:', error)
    return NextResponse.json(
      { error: 'Failed to switch business context' },
      { status: 500 }
    )
  }
}