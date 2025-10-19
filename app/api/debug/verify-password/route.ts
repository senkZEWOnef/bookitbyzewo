import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🟡 PWD CHECK: Verifying password for:', email)
    console.log('🟡 PWD CHECK: Password length:', password.length)
    
    const result = await query(
      'SELECT id, email, password FROM users WHERE email = $1',
      [email]
    )
    
    const user = result.rows[0]
    if (!user) {
      console.log('🔴 PWD CHECK: User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('🟡 PWD CHECK: User found, checking password...')
    console.log('🟡 PWD CHECK: Stored hash preview:', user.password.substring(0, 20) + '...')
    
    const isValid = await verifyPassword(password, user.password)
    console.log('🟡 PWD CHECK: Password valid:', isValid)
    
    return NextResponse.json({
      success: true,
      passwordValid: isValid,
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('🔴 PWD CHECK: Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    )
  }
}