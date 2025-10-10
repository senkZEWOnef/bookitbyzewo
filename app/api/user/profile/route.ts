import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const { userId, avatar_url, full_name, phone } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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

    updateFields.push(`updated_at = NOW()`)
    values.push(userId)

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, phone, avatar_url, updated_at
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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