import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // This is for testing - expire all trials immediately
    await query(`
      UPDATE users 
      SET trial_ends_at = NOW() - INTERVAL '1 day'
      WHERE plan_status = 'trial' AND trial_ends_at > NOW()
    `)

    const result = await query(`
      SELECT id, email, plan, plan_status, trial_ends_at 
      FROM users 
      WHERE plan_status = 'trial'
    `)

    return NextResponse.json({
      message: 'All trials expired for testing',
      users: result.rows
    })

  } catch (error) {
    console.error('Error expiring trials:', error)
    return NextResponse.json(
      { error: 'Failed to expire trials' },
      { status: 500 }
    )
  }
}