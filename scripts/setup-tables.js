const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function setupTables() {
  try {
    console.log('🔗 Testing database connection...')
    
    const client = await pool.connect()
    console.log('✅ Database connected!')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'init.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Creating tables...')
    await client.query(sql)
    
    console.log('✅ All tables created successfully!')
    
    // Check what tables we have
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)
    
    console.log('\n📋 Tables in database:')
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    client.release()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupTables()