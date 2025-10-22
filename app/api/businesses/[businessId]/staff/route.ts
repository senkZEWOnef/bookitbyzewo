import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { validatePlanLimit, getPlanLimits } from '@/lib/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId

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
    const { email, fullName, role, userId } = await request.json()
    const businessId = params.businessId

    console.log('🟢 Staff addition request:', { businessId, email, fullName, role, userId })

    if (!email || !fullName || !role || !userId) {
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