import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const result = await query('SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC')
    
    return NextResponse.json({
      success: true,
      users: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Check users error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check users'
    }, { status: 500 })
  }
}