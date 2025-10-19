import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

    // Get all businesses the user is associated with (owned businesses + staff businesses)
    const result = await query(
      `SELECT 
         b.id,
         b.name,
         b.slug,
         b.description,
         b.location,
         b.phone,
         b.email,
         b.created_at,
         COALESCE(ub.role, 'owner') as role,
         COALESCE(ub.is_active, true) as is_active,
         COALESCE(ub.joined_at, b.created_at) as joined_at,
         CASE WHEN b.owner_id = $1 THEN true ELSE false END as is_owner
       FROM businesses b
       LEFT JOIN user_businesses ub ON ub.business_id = b.id AND ub.user_id = $1
       WHERE 
         (b.owner_id = $1) OR 
         (ub.user_id = $1 AND ub.is_active = true)
       ORDER BY 
         CASE WHEN b.owner_id = $1 THEN 0 ELSE 1 END, -- Owner businesses first
         COALESCE(ub.joined_at, b.created_at) DESC`,
      [userId]
    )

    return NextResponse.json({
      businesses: result.rows
    })

  } catch (error) {
    console.error('Error fetching user businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

