import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting database cleanup...')

    // Get all users except admin@test.com
    const usersToDelete = await query(
      'SELECT id, email FROM users WHERE email != $1',
      ['admin@test.com']
    )

    console.log(`🗑️ Found ${usersToDelete.rows.length} users to delete:`)
    usersToDelete.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`)
    })

    if (usersToDelete.rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users to delete',
        deletedCount: 0
      })
    }

    // Extract user IDs
    const userIds = usersToDelete.rows.map(user => user.id)
    const userIdPlaceholders = userIds.map((_, index) => `$${index + 1}`).join(', ')

    // Get businesses owned by these users
    const businessesToDelete = await query(
      `SELECT id, name, owner_id FROM businesses WHERE owner_id IN (${userIdPlaceholders})`,
      userIds
    )

    console.log(`🏢 Found ${businessesToDelete.rows.length} businesses to delete`)

    // Delete coupon usage records first (applies to all users, not just business owners)
    const deletedCouponUsage = await query(
      `DELETE FROM coupon_usage WHERE user_id IN (${userIdPlaceholders})`,
      userIds
    )
    console.log(`🗑️ Deleted ${deletedCouponUsage.rowCount} coupon usage records`)

    if (businessesToDelete.rows.length > 0) {
      const businessIds = businessesToDelete.rows.map(b => b.id)
      const businessIdPlaceholders = businessIds.map((_, index) => `$${index + 1}`).join(', ')

      // Delete in reverse dependency order to avoid foreign key constraints

      // 1. Delete appointments
      const deletedAppointments = await query(
        `DELETE FROM appointments WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedAppointments.rowCount} appointments`)

      // 2. Delete payments
      const deletedPayments = await query(
        `DELETE FROM payments WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedPayments.rowCount} payments`)

      // 3. Delete availability rules
      const deletedAvailabilityRules = await query(
        `DELETE FROM availability_rules WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedAvailabilityRules.rowCount} availability rules`)

      // 4. Delete availability exceptions
      const deletedAvailabilityExceptions = await query(
        `DELETE FROM availability_exceptions WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedAvailabilityExceptions.rowCount} availability exceptions`)

      // 5. Delete business staff relationships
      const deletedBusinessStaff = await query(
        `DELETE FROM business_staff WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedBusinessStaff.rowCount} business staff relationships`)

      // 6. Delete staff invitations
      const deletedStaffInvitations = await query(
        `DELETE FROM staff_invitations WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedStaffInvitations.rowCount} staff invitations`)

      // 7. Delete staff members
      const deletedStaff = await query(
        `DELETE FROM staff WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedStaff.rowCount} staff members`)

      // 8. Delete services
      const deletedServices = await query(
        `DELETE FROM services WHERE business_id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedServices.rowCount} services`)

      // 9. Delete businesses
      const deletedBusinesses = await query(
        `DELETE FROM businesses WHERE id IN (${businessIdPlaceholders})`,
        businessIds
      )
      console.log(`🗑️ Deleted ${deletedBusinesses.rowCount} businesses`)
    }

    // 10. Finally, delete the users
    const deletedUsers = await query(
      `DELETE FROM users WHERE id IN (${userIdPlaceholders})`,
      userIds
    )
    console.log(`🗑️ Deleted ${deletedUsers.rowCount} users`)

    // Get final user count
    const finalCount = await query('SELECT COUNT(*) as count FROM users')
    
    console.log('✅ Database cleanup completed successfully!')
    console.log(`📊 Final user count: ${finalCount.rows[0].count}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Database cleanup completed successfully',
      deletedUsers: deletedUsers.rowCount,
      deletedBusinesses: businessesToDelete.rows.length,
      finalUserCount: finalCount.rows[0].count,
      deletedUserEmails: usersToDelete.rows.map(u => u.email)
    })

  } catch (error) {
    console.error('❌ Database cleanup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use POST to run database cleanup. This will delete all users except admin@test.com and their associated data.' 
  })
}