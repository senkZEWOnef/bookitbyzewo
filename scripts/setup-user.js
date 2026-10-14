const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Usage: SETUP_USER_EMAIL=you@email.com SETUP_USER_PASSWORD=... node scripts/setup-user.js
const email = process.env.SETUP_USER_EMAIL
const password = process.env.SETUP_USER_PASSWORD
const fullName = process.env.SETUP_USER_NAME || 'Admin User'

async function createUser() {
  if (!email || !password) {
    console.error('❌ Set SETUP_USER_EMAIL and SETUP_USER_PASSWORD')
    process.exit(1)
  }
  try {
    console.log('🔗 Testing database connection...')
    
    // Test connection
    const client = await pool.connect()
    console.log('✅ Database connected!')
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
    const result = await client.query(
      'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email, hashedPassword, fullName]
    )
    
    console.log('✅ User created:', result.rows[0])
    
    client.release()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createUser()