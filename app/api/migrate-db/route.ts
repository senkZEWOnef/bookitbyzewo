import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🟡 Starting database migration for plan restrictions...')

    // Add plan and subscription fields to users table
    console.log('🟡 Adding plan columns to users table...')
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'solo',
      ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'trial',
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP
    `)

    // Add subscription limits tracking
    console.log('🟡 Adding usage tracking columns to users table...')
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS monthly_bookings_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS monthly_bookings_limit INTEGER DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS staff_limit INTEGER DEFAULT NULL
    `)

    // Add payment processing settings to businesses table
    console.log('🟡 Adding payment settings to businesses table...')
    await query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS stripe_publishable_key VARCHAR(500),
      ADD COLUMN IF NOT EXISTS stripe_secret_key VARCHAR(500),
      ADD COLUMN IF NOT EXISTS ath_movil_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS ath_movil_public_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS ath_movil_private_key VARCHAR(255)
    `)

    // Create subscription_changes table for audit
    console.log('🟡 Creating subscription_changes table...')
    await query(`
      CREATE TABLE IF NOT EXISTS subscription_changes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          from_plan VARCHAR(20),
          to_plan VARCHAR(20),
          from_status VARCHAR(20),
          to_status VARCHAR(20),
          reason VARCHAR(255),
          changed_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Plan limits function
    console.log('🟡 Creating get_plan_limits function...')
    await query(`
      CREATE OR REPLACE FUNCTION get_plan_limits(plan_type VARCHAR(20))
      RETURNS TABLE(
          staff_limit INTEGER,
          monthly_bookings_limit INTEGER,
          can_use_advanced_calendar BOOLEAN,
          can_use_automated_whatsapp BOOLEAN,
          can_use_custom_domain BOOLEAN,
          can_use_api BOOLEAN,
          can_use_advanced_reports BOOLEAN
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
          CASE plan_type
              WHEN 'solo' THEN
                  RETURN QUERY SELECT 1, 500, false, false, false, false, false;
              WHEN 'team' THEN
                  RETURN QUERY SELECT 5, 2000, true, false, false, false, true;
              WHEN 'pro' THEN
                  RETURN QUERY SELECT 10, NULL, true, true, true, true, true;
              ELSE
                  RETURN QUERY SELECT 0, 0, false, false, false, false, false;
          END CASE;
      END;
      $$
    `)

    // Function to check if user can perform action based on their plan
    console.log('🟡 Creating user_can_perform_action function...')
    await query(`
      CREATE OR REPLACE FUNCTION user_can_perform_action(
          p_user_id UUID,
          p_action VARCHAR(50)
      ) 
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      AS $$
      DECLARE
          user_plan VARCHAR(20);
          user_status VARCHAR(20);
          user_trial_ends TIMESTAMP;
          current_staff_count INTEGER;
          current_bookings_count INTEGER;
          limits RECORD;
      BEGIN
          -- Get user plan info
          SELECT plan, plan_status, trial_ends_at, staff_count, monthly_bookings_count
          INTO user_plan, user_status, user_trial_ends, current_staff_count, current_bookings_count
          FROM users 
          WHERE id = p_user_id;
          
          -- If user doesn't exist or has expired trial/inactive subscription
          IF user_plan IS NULL THEN
              RETURN FALSE;
          END IF;
          
          -- Check if trial is expired and no active subscription
          IF user_status = 'trial' AND user_trial_ends < NOW() THEN
              RETURN FALSE;
          END IF;
          
          -- Check if subscription is inactive
          IF user_status NOT IN ('trial', 'active') THEN
              RETURN FALSE;
          END IF;
          
          -- Get plan limits
          SELECT * INTO limits FROM get_plan_limits(user_plan);
          
          -- Check specific actions
          CASE p_action
              WHEN 'add_staff' THEN
                  RETURN current_staff_count < limits.staff_limit;
              WHEN 'create_booking' THEN
                  RETURN limits.monthly_bookings_limit IS NULL OR current_bookings_count < limits.monthly_bookings_limit;
              WHEN 'use_advanced_calendar' THEN
                  RETURN limits.can_use_advanced_calendar;
              WHEN 'use_automated_whatsapp' THEN
                  RETURN limits.can_use_automated_whatsapp;
              WHEN 'use_custom_domain' THEN
                  RETURN limits.can_use_custom_domain;
              WHEN 'use_api' THEN
                  RETURN limits.can_use_api;
              WHEN 'use_advanced_reports' THEN
                  RETURN limits.can_use_advanced_reports;
              ELSE
                  RETURN TRUE;
          END CASE;
      END;
      $$
    `)

    // Function to update usage counters
    console.log('🟡 Creating update_user_usage_counters function...')
    await query(`
      CREATE OR REPLACE FUNCTION update_user_usage_counters(p_user_id UUID)
      RETURNS VOID
      LANGUAGE plpgsql
      AS $$
      DECLARE
          current_month_start DATE;
          staff_cnt INTEGER;
          bookings_cnt INTEGER;
      BEGIN
          current_month_start := date_trunc('month', NOW())::DATE;
          
          -- Count staff members for user's businesses
          SELECT COUNT(DISTINCT s.id) INTO staff_cnt
          FROM staff s
          JOIN businesses b ON s.business_id = b.id
          WHERE b.owner_id = p_user_id AND s.is_active = true;
          
          -- Count bookings for current month for user's businesses
          SELECT COUNT(*) INTO bookings_cnt
          FROM appointments a
          JOIN businesses b ON a.business_id = b.id
          WHERE b.owner_id = p_user_id 
          AND a.created_at >= current_month_start
          AND a.status NOT IN ('cancelled', 'no_show');
          
          -- Update user counters
          UPDATE users 
          SET 
              staff_count = staff_cnt,
              monthly_bookings_count = bookings_cnt
          WHERE id = p_user_id;
      END;
      $$
    `)

    // Trigger function to update usage counters when staff or appointments change
    console.log('🟡 Creating trigger function...')
    await query(`
      CREATE OR REPLACE FUNCTION trigger_update_usage_counters()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
          owner_id UUID;
      BEGIN
          -- Get business owner
          IF TG_TABLE_NAME = 'staff' THEN
              SELECT b.owner_id INTO owner_id 
              FROM businesses b 
              WHERE b.id = COALESCE(NEW.business_id, OLD.business_id);
          ELSIF TG_TABLE_NAME = 'appointments' THEN
              SELECT b.owner_id INTO owner_id 
              FROM businesses b 
              WHERE b.id = COALESCE(NEW.business_id, OLD.business_id);
          END IF;
          
          IF owner_id IS NOT NULL THEN
              PERFORM update_user_usage_counters(owner_id);
          END IF;
          
          RETURN COALESCE(NEW, OLD);
      END;
      $$
    `)

    // Create triggers
    console.log('🟡 Creating triggers...')
    await query(`DROP TRIGGER IF EXISTS trigger_staff_update_usage ON staff`)
    await query(`
      CREATE TRIGGER trigger_staff_update_usage
          AFTER INSERT OR UPDATE OR DELETE ON staff
          FOR EACH ROW
          EXECUTE FUNCTION trigger_update_usage_counters()
    `)

    await query(`DROP TRIGGER IF EXISTS trigger_appointments_update_usage ON appointments`)
    await query(`
      CREATE TRIGGER trigger_appointments_update_usage
          AFTER INSERT OR UPDATE OR DELETE ON appointments
          FOR EACH ROW
          EXECUTE FUNCTION trigger_update_usage_counters()
    `)

    // Create indexes
    console.log('🟡 Creating indexes...')
    await query(`CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan, plan_status)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON subscription_changes(user_id)`)

    // Initialize existing users with trial plans
    console.log('🟡 Initializing existing users with trial plans...')
    await query(`
      UPDATE users 
      SET 
          plan = 'solo',
          plan_status = 'trial',
          trial_ends_at = NOW() + INTERVAL '30 days'
      WHERE plan IS NULL OR plan = ''
    `)

    // Update usage counters for all existing users
    console.log('🟡 Updating usage counters for existing users...')
    const existingUsers = await query('SELECT id FROM users')
    
    for (const user of existingUsers.rows) {
      await query('SELECT update_user_usage_counters($1)', [user.id])
    }

    console.log('🟢 Database migration completed successfully!')

    return NextResponse.json({ 
      success: true, 
      message: 'Plan restrictions migration completed successfully',
      usersUpdated: existingUsers.rows.length
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Failed to run migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}