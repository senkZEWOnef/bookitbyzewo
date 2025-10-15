import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const { userId, avatar_url, full_name, phone } = await request.json()

    console.log('🟡 Profile update request:', { userId, hasAvatar: !!avatar_url, full_name, phone })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // First check if user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId])
    if (userCheck.rows.length === 0) {
      console.log('🔴 User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if avatar_url column exists by trying to add it if it doesn't
    try {
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT')
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()')
    } catch (alterError) {
      console.log('🟡 Column already exists or permission issue (this is OK)')
    }

    // Update user profile in Neon database
    const updateFields: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount}`)
      values.push(avatar_url)
      paramCount++
    }

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramCount}`)
      values.push(full_name)
      paramCount++
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`)
      values.push(phone)
      paramCount++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(userId)

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, phone, avatar_url, updated_at
    `

    console.log('🟡 Executing query:', updateQuery)
    console.log('🟡 With values:', values)

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      console.log('🔴 No rows updated for user:', userId)
      return NextResponse.json({ error: 'User not found or no changes made' }, { status: 404 })
    }

    console.log('🟢 Profile updated successfully:', result.rows[0])

    return NextResponse.json({ 
      success: true, 
      user: result.rows[0] 
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await query(
      'SELECT id, email, full_name, phone, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      user: result.rows[0] 
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}