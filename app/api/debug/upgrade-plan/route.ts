import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, newPlan } = await request.json()
    
    if (!userId || !newPlan) {
      return NextResponse.json({ error: 'userId and newPlan required' }, { status: 400 })
    }
    
    const validPlans = ['solo', 'team', 'pro']
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be: solo, team, or pro' }, { status: 400 })
    }
    
    console.log('🟡 Upgrading user plan:', { userId, newPlan })
    
    // Update user plan
    const result = await query(
      `UPDATE users 
       SET plan = $1, 
           plan_status = 'active',
           updated_at = NOW()
       WHERE id = $2 
       RETURNING id, email, plan, plan_status, trial_ends_at`,
      [newPlan, userId]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const user = result.rows[0]
    console.log('🟢 User plan upgraded:', user)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        plan_status: user.plan_status,
        trial_ends_at: user.trial_ends_at
      },
      message: `Plan upgraded to ${newPlan}`
    })
    
  } catch (error) {
    console.error('🔴 Upgrade plan error:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade plan' },
      { status: 500 }
    )
  }
}