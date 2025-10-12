import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// POST /api/staff/accept-invitation - Accept staff invitation
export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get invitation details
      const invitationResult = await client.query(
        `SELECT 
           si.id,
           si.business_id,
           si.email,
           si.role,
           si.status,
           si.expires_at,
           b.name as business_name
         FROM staff_invitations si
         JOIN businesses b ON si.business_id = b.id
         WHERE si.invitation_token = $1`,
        [token]
      )

      if (invitationResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 404 }
        )
      }

      const invitation = invitationResult.rows[0]

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: `Invitation is ${invitation.status}` },
          { status: 400 }
        )
      }

      if (new Date(invitation.expires_at) < new Date()) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 400 }
        )
      }

      // If userId is provided, link the invitation to the user
      if (userId) {
        // Verify user exists and email matches
        const userResult = await client.query(
          'SELECT id, email FROM users WHERE id = $1',
          [userId]
        )

        if (userResult.rows.length === 0) {
          await client.query('ROLLBACK')
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        const user = userResult.rows[0]

        // Check if email matches (case insensitive)
        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
          await client.query('ROLLBACK')
          return NextResponse.json(
            { error: 'Email address does not match the invitation' },
            { status: 400 }
          )
        }

        // Update staff record with user_id
        await client.query(
          `UPDATE staff 
           SET user_id = $1 
           WHERE business_id = $2 AND email = $3`,
          [userId, invitation.business_id, invitation.email]
        )

        // Create user_business relationship
        await client.query(
          `INSERT INTO user_businesses (user_id, business_id, role, is_active)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (user_id, business_id) DO UPDATE SET
             role = EXCLUDED.role,
             is_active = EXCLUDED.is_active`,
          [userId, invitation.business_id, invitation.role]
        )
      }

      // Mark invitation as accepted
      await client.query(
        `UPDATE staff_invitations 
         SET status = 'accepted', updated_at = NOW()
         WHERE id = $1`,
        [invitation.id]
      )

      await client.query('COMMIT')

      return NextResponse.json({
        message: 'Invitation accepted successfully',
        businessName: invitation.business_name,
        role: invitation.role,
        businessId: invitation.business_id
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

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

    const client = await pool.connect()

    try {
      // Get invitation details
      const result = await client.query(
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

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error fetching invitation details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    )
  }
}