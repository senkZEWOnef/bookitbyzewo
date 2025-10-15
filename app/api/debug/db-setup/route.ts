import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Running database setup...')

    // Test basic connectivity
    const connectTest = await query('SELECT NOW() as current_time')
    console.log('✅ Database connection successful:', connectTest.rows[0])

    // Enable UUID extension
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    console.log('✅ UUID extension enabled')

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Users table created/verified')

    // Add missing columns to users table
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`).catch(() => {})

    // Create businesses table
    await query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        location VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        timezone VARCHAR(100) DEFAULT 'America/New_York',
        messaging_mode VARCHAR(50) DEFAULT 'whatsapp',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Businesses table created/verified')

    // Create services table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        price_cents INTEGER NOT NULL DEFAULT 0,
        deposit_cents INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Services table created/verified')

    // Create appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255),
        starts_at TIMESTAMP NOT NULL,
        ends_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        total_amount_cents INTEGER DEFAULT 0,
        deposit_amount_cents INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Appointments table created/verified')

    // Add missing columns to appointments table
    await query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0`).catch(() => {})
    await query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount_cents INTEGER DEFAULT 0`).catch(() => {})
    await query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER DEFAULT 0`).catch(() => {})

    // Create availability_rules table
    await query(`
      CREATE TABLE IF NOT EXISTS availability_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(business_id, weekday, start_time, end_time)
      )
    `)
    console.log('✅ Availability rules table created/verified')

    // Create availability_exceptions table
    await query(`
      CREATE TABLE IF NOT EXISTS availability_exceptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        is_closed BOOLEAN DEFAULT false,
        start_time TIME,
        end_time TIME,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(business_id, date)
      )
    `)
    console.log('✅ Availability exceptions table created/verified')

    // Create staff table
    await query(`
      CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        display_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'staff',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Staff table created/verified')

    // Add missing columns to staff table
    await query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)`).catch(() => {})
    await query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS email VARCHAR(255)`).catch(() => {})
    await query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`).catch(() => {})

    // Create staff_invitations table
    await query(`
      CREATE TABLE IF NOT EXISTS staff_invitations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        invited_by UUID REFERENCES users(id),
        invitation_token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Staff invitations table created/verified')

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id)`).catch(() => {})
    await query(`CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug)`).catch(() => {})
    await query(`CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id)`).catch(() => {})
    await query(`CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id)`).catch(() => {})
    await query(`CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at)`).catch(() => {})
    console.log('✅ Database indexes created/verified')

    // Test user creation capability
    const testQuery = await query('SELECT COUNT(*) as user_count FROM users')
    console.log('✅ User count check successful:', testQuery.rows[0])

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      timestamp: new Date().toISOString(),
      userCount: testQuery.rows[0].user_count
    })

  } catch (error: any) {
    console.error('❌ Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}