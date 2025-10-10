import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const result = await loginUser(email, password)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }
}