const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkUser() {
  try {
    console.log('🔍 Checking user in database...')
    
    const client = await pool.connect()
    
    // Check if user exists
    const result = await client.query(
      'SELECT id, email, full_name, created_at FROM users WHERE email = $1',
      ['ralph.ulysse509@gmail.com']
    )
    
    if (result.rows.length > 0) {
      const user = result.rows[0]
      console.log('✅ User found:')
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.full_name}`)
      console.log(`  Created: ${user.created_at}`)
    } else {
      console.log('❌ User not found')
    }
    
    // Also show all users in database
    const allUsers = await client.query('SELECT email, full_name FROM users')
    console.log(`\n📋 Total users in database: ${allUsers.rows.length}`)
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name})`)
    })
    
    client.release()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkUser()