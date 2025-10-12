import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// POST /api/staff/invite - Send staff invitation
export async function POST(request: NextRequest) {
  try {
    const { businessId, email, role = 'staff', displayName } = await request.json()

    if (!businessId || !email) {
      return NextResponse.json(
        { error: 'Business ID and email are required' },
        { status: 400 }
      )
    }

    // Get the current user (inviter) from headers or session
    // For now, we'll use a placeholder - you'll need to implement proper auth
    const inviterId = request.headers.get('x-user-id') // This should come from your auth system

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Check if business exists and user has permission to invite
      const businessCheck = await client.query(
        `SELECT b.id, b.name, ub.role as user_role
         FROM businesses b
         LEFT JOIN user_businesses ub ON b.id = ub.business_id AND ub.user_id = $1
         WHERE b.id = $2`,
        [inviterId, businessId]
      )

      if (businessCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        )
      }

      const business = businessCheck.rows[0]
      
      // Check if user has permission to invite (owner or admin)
      if (!business.user_role || !['owner', 'admin'].includes(business.user_role)) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'You do not have permission to invite staff to this business' },
          { status: 403 }
        )
      }

      // Check if user is already staff or has pending invitation
      const existingCheck = await client.query(
        `SELECT 
           s.id as staff_id,
           si.id as invitation_id,
           si.status as invitation_status,
           u.id as user_id
         FROM users u
         LEFT JOIN staff s ON u.id = s.user_id AND s.business_id = $1
         LEFT JOIN staff_invitations si ON si.email = u.email AND si.business_id = $1
         WHERE u.email = $2`,
        [businessId, email]
      )

      if (existingCheck.rows.length > 0) {
        const existing = existingCheck.rows[0]
        if (existing.staff_id) {
          await client.query('ROLLBACK')
          return NextResponse.json(
            { error: 'User is already a staff member of this business' },
            { status: 400 }
          )
        }
        if (existing.invitation_id && existing.invitation_status === 'pending') {
          await client.query('ROLLBACK')
          return NextResponse.json(
            { error: 'User already has a pending invitation to this business' },
            { status: 400 }
          )
        }
      }

      // Generate invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Create invitation
      const invitationResult = await client.query(
        `INSERT INTO staff_invitations (business_id, email, role, invited_by, invitation_token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, invitation_token`,
        [businessId, email, role, inviterId, invitationToken, expiresAt]
      )

      const invitation = invitationResult.rows[0]

      // Create staff record (without user_id for now)
      await client.query(
        `INSERT INTO staff (business_id, display_name, email, role, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [businessId, displayName || email.split('@')[0], email, role, true]
      )

      await client.query('COMMIT')

      // Send invitation email (you'll need to implement this with your email service)
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/staff/accept-invitation?token=${invitationToken}`
      
      // For now, we'll just log the invitation URL
      console.log(`Staff invitation for ${email} to ${business.name}: ${invitationUrl}`)

      // TODO: Send actual email using your email service (SendGrid, Resend, etc.)
      await sendInvitationEmail({
        to: email,
        businessName: business.name,
        role,
        invitationUrl,
        inviterName: 'Business Owner' // You can get this from the user table
      })

      return NextResponse.json({
        message: 'Invitation sent successfully',
        invitationId: invitation.id,
        invitationUrl // Remove this in production
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error sending staff invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

// GET /api/staff/invite - Get pending invitations for a business
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      // Get pending invitations
      const result = await client.query(
        `SELECT 
           si.id,
           si.email,
           si.role,
           si.status,
           si.created_at,
           si.expires_at,
           u.full_name as invited_by_name
         FROM staff_invitations si
         LEFT JOIN users u ON si.invited_by = u.id
         WHERE si.business_id = $1
         ORDER BY si.created_at DESC`,
        [businessId]
      )

      return NextResponse.json({
        invitations: result.rows
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error fetching staff invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// Mock email sending function - replace with your actual email service
async function sendInvitationEmail({
  to,
  businessName,
  role,
  invitationUrl,
  inviterName
}: {
  to: string
  businessName: string
  role: string
  invitationUrl: string
  inviterName: string
}) {
  // TODO: Implement with your email service
  console.log(`
📧 Staff Invitation Email
To: ${to}
Subject: You've been invited to join ${businessName} team

Hello!

${inviterName} has invited you to join ${businessName} as a ${role}.

With BookIt by Zewo, you'll be able to:
• Manage your appointments and schedule
• View customer information
• Handle bookings through WhatsApp
• Access your staff dashboard

To accept this invitation and create your account (or link to your existing account), click here:
${invitationUrl}

This invitation will expire in 7 days.

If you already have a BookIt account with this email address, you'll be automatically added to the ${businessName} team when you accept the invitation. You'll be able to switch between your own business and ${businessName} from your dashboard.

Welcome to the team!

Best regards,
The BookIt by Zewo Team
  `)

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100))
}