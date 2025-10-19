import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'
import { sendStaffInvitationEmail } from '@/lib/email-service'
import { sendStaffInvitationWhatsApp, validatePhoneNumber, formatPhoneNumber } from '@/lib/whatsapp-service'

// POST /api/staff/invite - Send staff invitation
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled - needs transaction support
    return NextResponse.json(
      { error: 'Staff invitation system temporarily disabled for maintenance' },
      { status: 503 }
    )
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

    // Get pending invitations
    const result = await query(
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

  } catch (error) {
    console.error('Error fetching staff invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

