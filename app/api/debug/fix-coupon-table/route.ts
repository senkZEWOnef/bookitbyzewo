import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Fixing coupon_codes table constraints...')

    // Drop the old check constraint
    await query(`
      ALTER TABLE coupon_codes 
      DROP CONSTRAINT IF EXISTS coupon_codes_discount_type_check
    `).catch(() => {})
    
    // Add new check constraint that allows 'solo_trial'
    await query(`
      ALTER TABLE coupon_codes 
      ADD CONSTRAINT coupon_codes_discount_type_check 
      CHECK (discount_type IN ('percentage', 'free_trial', 'solo_trial'))
    `).catch(() => {})

    // Add applicable_plan column if it doesn't exist
    await query(`
      ALTER TABLE coupon_codes 
      ADD COLUMN IF NOT EXISTS applicable_plan VARCHAR(20) DEFAULT 'solo'
    `).catch(() => {})

    console.log('✅ Coupon table constraints fixed')

    return NextResponse.json({
      success: true,
      message: 'Coupon table constraints updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Fix coupon table error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}