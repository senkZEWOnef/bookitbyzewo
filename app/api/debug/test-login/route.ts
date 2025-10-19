import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 Test login endpoint hit!')
    const body = await request.json()
    console.log('🟢 Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Test login endpoint working',
      receivedData: body
    })
  } catch (error) {
    console.error('🔴 Test login error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}