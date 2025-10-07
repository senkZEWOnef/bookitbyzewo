// Test Supabase database connection
// Run with: node test-db-connection.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Test 1: Check if we can connect
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connection successful!')
    
    // Test 2: Check if required tables exist
    const tables = [
      'profiles', 'businesses', 'staff', 'services', 
      'appointments', 'payments', 'availability_rules'
    ]
    
    console.log('\n🔍 Checking required tables...')
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (tableError) {
          console.log(`❌ Table '${table}': ${tableError.message}`)
        } else {
          console.log(`✅ Table '${table}': exists`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`)
      }
    }
    
    // Test 3: Check if we can create and read a profile
    console.log('\n🔍 Testing profile operations...')
    
    // This should work with service role
    const testUserId = '00000000-0000-0000-0000-000000000001'
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .upsert({ 
        id: testUserId, 
        full_name: 'Test User',
        phone: '+1787555-0123'
      })
      .select()
    
    if (insertError) {
      console.log('❌ Profile insert failed:', insertError.message)
    } else {
      console.log('✅ Profile insert successful')
    }
    
    // Clean up
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId)
    
    console.log('\n🎉 Database connection test completed!')
    return true
    
  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return false
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1)
})