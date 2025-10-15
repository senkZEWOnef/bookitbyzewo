import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 Fetching all businesses from database...')
    
    // First check if table exists
    try {
      await query('SELECT 1 FROM businesses LIMIT 1')
    } catch (tableError) {
      console.log('🔴 Businesses table might not exist:', tableError)
      return NextResponse.json({ 
        businesses: [],
        count: 0,
        error: 'Businesses table not found'
      })
    }
    
    const result = await query(
      'SELECT id, name, slug, owner_id, created_at FROM businesses ORDER BY created_at DESC'
    )

    console.log('🔍 Found', result.rows.length, 'businesses:')
    result.rows.forEach((business, index) => {
      console.log(`🔍 ${index + 1}. ${business.name} (${business.slug}) - Owner: ${business.owner_id}`)
    })

    return NextResponse.json({ 
      businesses: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('🔴 Error fetching businesses:', error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}