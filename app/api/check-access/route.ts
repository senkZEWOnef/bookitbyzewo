import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // TEMPORARY: Always allow access for development
    return NextResponse.json({ 
      hasAccess: true, 
      reason: 'dev_mode_enabled' 
    })

  } catch (error) {
    console.error('Access check error:', error)
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    )
  }
}