import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Ensure the contact_messages table exists
async function ensureTableExists() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(500),
        message TEXT NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contact_messages_business_id ON contact_messages(business_id)
    `)
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)
    `)
    
    console.log('✅ CONTACT FORM: Table ensured')
  } catch (error) {
    console.error('🔴 CONTACT FORM: Error ensuring table:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, name, email, phone, subject, message } = await request.json()

    // Validate required fields
    if (!businessId || !name || !email || !message) {
      return NextResponse.json({ 
        error: 'Business ID, name, email, and message are required' 
      }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please provide a valid email address' 
      }, { status: 400 })
    }

    // Rate limiting check - max 5 messages per IP per hour
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await ensureTableExists()

    // Check rate limiting
    const rateLimitResult = await query(
      `SELECT COUNT(*) as count FROM contact_messages 
       WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [clientIP]
    )

    const messageCount = parseInt(rateLimitResult.rows[0].count)
    if (messageCount >= 5) {
      return NextResponse.json({ 
        error: 'Too many messages sent. Please wait before sending another message.' 
      }, { status: 429 })
    }

    // Verify business exists
    const businessResult = await query(
      'SELECT id, name FROM businesses WHERE id = $1',
      [businessId]
    )

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Business not found' 
      }, { status: 404 })
    }

    const business = businessResult.rows[0]

    console.log('📨 CONTACT FORM: Saving message for business:', business.name)

    // Insert contact message
    const result = await query(
      `INSERT INTO contact_messages 
       (business_id, name, email, phone, subject, message, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, created_at`,
      [businessId, name, email, phone || null, subject || null, message, clientIP, userAgent]
    )

    const savedMessage = result.rows[0]

    console.log('✅ CONTACT FORM: Message saved successfully:', savedMessage.id)

    // TODO: Send email notification to business owner
    // TODO: Send auto-reply to customer (optional)
    
    return NextResponse.json({ 
      success: true, 
      messageId: savedMessage.id,
      message: 'Thank you for your message! We will get back to you soon.'
    })

  } catch (error) {
    console.error('🔴 CONTACT FORM: Error saving message:', error)
    return NextResponse.json({ 
      error: 'Failed to send message. Please try again.' 
    }, { status: 500 })
  }
}

// GET endpoint to retrieve contact messages for business owners
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    await ensureTableExists()

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM contact_messages WHERE business_id = $1',
      [businessId]
    )

    const total = parseInt(countResult.rows[0].total)

    // Get messages with pagination
    const messagesResult = await query(
      `SELECT id, name, email, phone, subject, message, created_at
       FROM contact_messages 
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [businessId, limit, offset]
    )

    return NextResponse.json({
      messages: messagesResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('🔴 CONTACT FORM: Error fetching messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 })
  }
}