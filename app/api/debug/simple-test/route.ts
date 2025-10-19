import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🟢 SIMPLE TEST: Request received!')
  
  try {
    const body = await request.json()
    console.log('🟢 SIMPLE TEST: Body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Simple test working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 SIMPLE TEST: Error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}