import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (length: ' + process.env.DATABASE_URL.length + ')' : 'Not set',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      timestamp: new Date().toISOString()
    }

    console.log('🔧 Environment check:', envCheck)

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables checked'
    })

  } catch (error: any) {
    console.error('❌ Environment check error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}