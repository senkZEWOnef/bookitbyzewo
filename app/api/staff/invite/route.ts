import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'
import { sendStaffInvitationEmail } from '@/lib/email-service'
import { sendStaffInvitationWhatsApp, validatePhoneNumber, formatPhoneNumber } from '@/lib/whatsapp-service'

// POST /api/staff/invite - Send staff invitation
export async function POST(request: NextRequest) {
  try {
    const { businessId, email, phone, role = 'staff', displayName } = await request.json()

    if (!businessId || !email) {
      return NextResponse.json(
        { error: 'Business ID and email are required' },
        { status: 400 }
      )
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate and format phone number
    const formattedPhone = formatPhoneNumber(phone)
    if (!validatePhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use international format (e.g., +1234567890)' },
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
      const existingStaffCheck = await client.query(
        `SELECT id FROM staff WHERE business_id = $1 AND email = $2`,
        [businessId, email]
      )

      if (existingStaffCheck.rows.length > 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'User is already a staff member of this business' },
          { status: 400 }
        )
      }

      // Check for existing invitations
      const existingInvitationCheck = await client.query(
        `SELECT id, status, expires_at FROM staff_invitations 
         WHERE business_id = $1 AND email = $2`,
        [businessId, email]
      )

      if (existingInvitationCheck.rows.length > 0) {
        const existingInvitation = existingInvitationCheck.rows[0]
        if (existingInvitation.status === 'pending' && new Date(existingInvitation.expires_at) > new Date()) {
          await client.query('ROLLBACK')
          return NextResponse.json(
            { error: 'User already has a pending invitation to this business' },
            { status: 400 }
          )
        }
        
        // If invitation exists but is expired or declined, delete it so we can create a new one
        await client.query(
          `DELETE FROM staff_invitations WHERE business_id = $1 AND email = $2`,
          [businessId, email]
        )
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
        `INSERT INTO staff (business_id, display_name, email, phone, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [businessId, displayName || email.split('@')[0], email, formattedPhone, role, true]
      )

      await client.query('COMMIT')

      // Send invitation via email and WhatsApp
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/staff/accept-invitation?token=${invitationToken}`
      
      console.log(`📧📱 Sending staff invitation for ${email} (${formattedPhone}) to ${business.name}: ${invitationUrl}`)

      // Send both email and WhatsApp invitations
      const sendPromises = [
        sendStaffInvitationEmail({
          to: email,
          businessName: business.name,
          role,
          invitationUrl,
          inviterName: 'Business Owner' // You can get this from the user table
        }),
        sendStaffInvitationWhatsApp({
          to: formattedPhone,
          businessName: business.name,
          role,
          invitationUrl,
          inviterName: 'Business Owner'
        })
      ]

      // Send both messages (don't wait for them to complete)
      Promise.allSettled(sendPromises).then(results => {
        results.forEach((result, index) => {
          const channel = index === 0 ? 'Email' : 'WhatsApp'
          if (result.status === 'rejected') {
            console.error(`${channel} sending failed:`, result.reason)
          } else {
            console.log(`${channel} invitation sent successfully`)
          }
        })
      })

      return NextResponse.json({
        message: 'Invitation sent successfully via email and WhatsApp',
        invitationId: invitation.id,
        email,
        phone: formattedPhone,
        role,
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

