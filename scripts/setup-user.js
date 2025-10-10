const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function createUser() {
  try {
    console.log('🔗 Testing database connection...')
    
    // Test connection
    const client = await pool.connect()
    console.log('✅ Database connected!')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Poesie509$$$', 12)
    
    // Create user
    const result = await client.query(
      'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      ['ralph.ulysse509@gmail.com', hashedPassword, 'Ralph Ulysse']
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