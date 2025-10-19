import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    console.log('🟡 DB TEST: Starting database test...')
    console.log('🟡 DB TEST: DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('🟡 DB TEST: DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...')
    
    const result = await query('SELECT NOW() as current_time')
    console.log('🟡 DB TEST: Query successful:', result.rows[0])
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      currentTime: result.rows[0].current_time
    })
  } catch (error) {
    console.error('🔴 DB TEST: Database error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}