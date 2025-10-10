import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Ensure the webpage_settings table exists
async function ensureTableExists() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS webpage_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(business_id)
      )
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_webpage_settings_business_id ON webpage_settings(business_id)
    `)
    
    console.log('✅ WEBPAGE SETTINGS: Table ensured')
  } catch (error) {
    console.error('🔴 WEBPAGE SETTINGS: Error ensuring table:', error)
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')

  if (!businessId) {
    return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
  }

  try {
    await ensureTableExists()

    console.log('🔍 WEBPAGE SETTINGS: Fetching settings for business:', businessId)

    const result = await query(
      'SELECT settings FROM webpage_settings WHERE business_id = $1',
      [businessId]
    )

    if (result.rows.length === 0) {
      console.log('📄 WEBPAGE SETTINGS: No settings found, returning defaults')
      return NextResponse.json({ settings: {} })
    }

    console.log('✅ WEBPAGE SETTINGS: Found settings')
    return NextResponse.json({ settings: result.rows[0].settings })

  } catch (error) {
    console.error('🔴 WEBPAGE SETTINGS: Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, settings } = await request.json()

    if (!businessId || !settings) {
      return NextResponse.json({ error: 'Business ID and settings required' }, { status: 400 })
    }

    await ensureTableExists()

    console.log('💾 WEBPAGE SETTINGS: Saving settings for business:', businessId)

    // Use UPSERT (INSERT ... ON CONFLICT)
    await query(
      `INSERT INTO webpage_settings (business_id, settings, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (business_id) 
       DO UPDATE SET settings = $2, updated_at = NOW()`,
      [businessId, JSON.stringify(settings)]
    )

    console.log('✅ WEBPAGE SETTINGS: Settings saved successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('🔴 WEBPAGE SETTINGS: Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}