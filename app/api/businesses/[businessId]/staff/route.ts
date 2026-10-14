import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { validatePlanLimit, getPlanLimits } from '@/lib/plans'
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

    // Get staff members for this business
    const result = await query(
      'SELECT id, display_name as full_name, email, role, CASE WHEN is_active THEN \'active\' ELSE \'inactive\' END as status, created_at FROM staff WHERE business_id = $1 ORDER BY created_at ASC',
      [businessId]
    )

    return NextResponse.json({
      success: true,
      staff: result.rows
    })

  } catch (error) {
    console.error('Staff fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { email, fullName, role } = await request.json()
    const businessId = params.businessId
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🟢 Staff addition request:', { businessId, email, fullName, role, userId })

    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify business ownership and get user's plan
    const businessResult = await query(
      'SELECT b.id, b.name, u.plan, u.plan_status FROM businesses b JOIN users u ON b.owner_id = u.id WHERE b.id = $1 AND b.owner_id = $2',
      [businessId, userId]
    )

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 })
    }

    const business = businessResult.rows[0]
    console.log('🟡 Business and plan info:', { business: business.name, plan: business.plan })

    // Check current staff count
    const currentStaffResult = await query(
      'SELECT COUNT(*) as count FROM business_staff WHERE business_id = $1 AND status = $2',
      [businessId, 'active']
    )

    const currentStaffCount = parseInt(currentStaffResult.rows[0].count)
    console.log('🟡 Current staff count:', currentStaffCount)

    // Validate against plan limits
    const planLimits = getPlanLimits(business.plan)
    
    if (currentStaffCount >= planLimits.maxStaff) {
      console.log('🔴 Staff limit exceeded for plan:', business.plan)
      const suggestedPlan = planLimits.maxStaff === 1 ? 'team' : 'pro'
      return NextResponse.json({ 
        error: `Your ${business.plan.charAt(0).toUpperCase() + business.plan.slice(1)} plan allows up to ${planLimits.maxStaff} staff member${planLimits.maxStaff === 1 ? '' : 's'}. Upgrade to ${suggestedPlan.charAt(0).toUpperCase() + suggestedPlan.slice(1)} plan to add more staff.`,
        planLimit: true,
        currentPlan: business.plan,
        suggestedPlan: suggestedPlan,
        maxStaff: planLimits.maxStaff,
        currentStaff: currentStaffCount
      }, { status: 403 })
    }

    // Check if staff member already exists
    const existingStaff = await query(
      'SELECT id FROM business_staff WHERE business_id = $1 AND email = $2',
      [businessId, email]
    )

    if (existingStaff.rows.length > 0) {
      return NextResponse.json({ error: 'Staff member with this email already exists' }, { status: 400 })
    }

    // Add staff member
    const result = await query(
      `INSERT INTO business_staff (
        business_id, email, full_name, role, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'active', NOW(), NOW()) 
      RETURNING id, email, full_name, role, status, created_at`,
      [businessId, email, fullName, role]
    )

    const newStaff = result.rows[0]
    console.log('🟢 Staff member added successfully:', newStaff)

    return NextResponse.json({
      success: true,
      staff: newStaff,
      message: 'Staff member added successfully'
    })

  } catch (error) {
    console.error('Staff addition error:', error)
    return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 })
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

    const { id, display_name, email, phone, role, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount}`)
      values.push(display_name)
      paramCount++
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`)
      values.push(email)
      paramCount++
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`)
      values.push(phone)
      paramCount++
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`)
      values.push(role)
      paramCount++
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`)
      values.push(is_active)
      paramCount++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)
    values.push(businessId)

    const result = await query(
      `UPDATE staff SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND business_id = $${paramCount + 1}
       RETURNING id, display_name, email, phone, role, is_active, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    console.log('🟢 Staff member updated:', result.rows[0])

    return NextResponse.json({
      success: true,
      staff: result.rows[0]
    })

  } catch (error) {
    console.error('Staff update error:', error)
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('id')

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Soft delete - deactivate staff member
    await query(
      'UPDATE staff SET is_active = false, updated_at = NOW() WHERE id = $1 AND business_id = $2',
      [staffId, businessId]
    )

    console.log('🟢 Staff member deactivated:', staffId)

    return NextResponse.json({
      success: true,
      message: 'Staff member deactivated'
    })

  } catch (error) {
    console.error('Staff deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
  }
}