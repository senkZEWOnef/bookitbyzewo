import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// DELETE /api/staff/invite/[id] - Delete a pending staff invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invitationId = params.id
    
    // Get user from headers for authorization
    const inviterId = request.headers.get('x-user-id')
    
    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get invitation details and verify permissions
      const invitationCheck = await client.query(
        `SELECT si.id, si.email, si.status, si.business_id, b.name as business_name, ub.role as user_role
         FROM staff_invitations si
         JOIN businesses b ON si.business_id = b.id
         LEFT JOIN user_businesses ub ON b.id = ub.business_id AND ub.user_id = $1
         WHERE si.id = $2`,
        [inviterId, invitationId]
      )

      if (invitationCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        )
      }

      const invitation = invitationCheck.rows[0]
      
      // Check if user has permission to delete (owner or admin)
      if (!invitation.user_role || !['owner', 'admin'].includes(invitation.user_role)) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'You do not have permission to delete this invitation' },
          { status: 403 }
        )
      }

      // Only allow deletion of pending invitations
      if (invitation.status !== 'pending') {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: `Cannot delete ${invitation.status} invitation` },
          { status: 400 }
        )
      }

      // Delete the invitation
      await client.query(
        'DELETE FROM staff_invitations WHERE id = $1',
        [invitationId]
      )

      // Also delete any associated staff record without user_id (invitation-only record)
      await client.query(
        `DELETE FROM staff 
         WHERE business_id = $1 AND email = $2 AND user_id IS NULL`,
        [invitation.business_id, invitation.email]
      )

      await client.query('COMMIT')

      return NextResponse.json({
        message: 'Invitation deleted successfully',
        deletedEmail: invitation.email
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error deleting staff invitation:', error)
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    )
  }
}