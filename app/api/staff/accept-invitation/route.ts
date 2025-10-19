import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// POST /api/staff/accept-invitation - Accept staff invitation
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled - needs transaction support
    return NextResponse.json(
      { error: 'Staff invitation acceptance temporarily disabled for maintenance' },
      { status: 503 }
    )
  } catch (error) {
    console.error('Error accepting staff invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}

// GET /api/staff/accept-invitation - Get invitation details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Get invitation details
    const result = await query(
      `SELECT 
         si.id,
         si.business_id,
         si.email,
         si.role,
         si.status,
         si.expires_at,
         si.created_at,
         b.name as business_name,
         b.description as business_description,
         u.full_name as invited_by_name
       FROM staff_invitations si
       JOIN businesses b ON si.business_id = b.id
       LEFT JOIN users u ON si.invited_by = u.id
       WHERE si.invitation_token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    const invitation = result.rows[0]

    // Check if invitation has expired
    const isExpired = new Date(invitation.expires_at) < new Date()

    return NextResponse.json({
      invitation: {
        ...invitation,
        isExpired,
        isValid: invitation.status === 'pending' && !isExpired
      }
    })

  } catch (error) {
    console.error('Error fetching invitation details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    )
  }
}