import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    console.log('🟡 Updating user plan for:', email)
    
    // Update user with Solo plan and trial
    const result = await query(
      `UPDATE users 
       SET plan = 'solo', 
           plan_status = 'trial', 
           trial_ends_at = NOW() + INTERVAL '30 days'
       WHERE email = $1 
       RETURNING id, email, plan, plan_status, trial_ends_at`,
      [email]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const user = result.rows[0]
    console.log('🟢 User plan updated:', user)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        plan_status: user.plan_status,
        trial_ends_at: user.trial_ends_at
      }
    })
    
  } catch (error) {
    console.error('🔴 Update user plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update user plan' },
      { status: 500 }
    )
  }
}