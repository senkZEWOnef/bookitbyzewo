import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Restore 30-day trials for all trial users
    await query(`
      UPDATE users 
      SET trial_ends_at = NOW() + INTERVAL '30 days'
      WHERE plan_status = 'trial'
    `)

    const result = await query(`
      SELECT id, email, plan, plan_status, trial_ends_at 
      FROM users 
      WHERE plan_status = 'trial'
    `)

    return NextResponse.json({
      message: 'All trials restored with 30 days',
      users: result.rows
    })

  } catch (error) {
    console.error('Error restoring trials:', error)
    return NextResponse.json(
      { error: 'Failed to restore trials' },
      { status: 500 }
    )
  }
}