import { query } from './db'

export interface PlanLimits {
  staffLimit: number
  monthlyBookingsLimit: number | null
  canUseAdvancedCalendar: boolean
  canUseAutomatedWhatsapp: boolean
  canUseCustomDomain: boolean
  canUseApi: boolean
  canUseAdvancedReports: boolean
}

export interface UserSubscription {
  id: string
  email: string
  plan: 'solo' | 'team' | 'pro'
  planStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'incomplete'
  trialEndsAt: Date | null
  staffCount: number
  monthlyBookingsCount: number
  subscriptionId: string | null
}

export function getPlanLimits(plan: 'solo' | 'team' | 'pro'): PlanLimits {
  switch (plan) {
    case 'solo':
      return {
        staffLimit: 1,
        monthlyBookingsLimit: 500,
        canUseAdvancedCalendar: false,
        canUseAutomatedWhatsapp: false,
        canUseCustomDomain: false,
        canUseApi: false,
        canUseAdvancedReports: false
      }
    case 'team':
      return {
        staffLimit: 5,
        monthlyBookingsLimit: 2000,
        canUseAdvancedCalendar: true,
        canUseAutomatedWhatsapp: false,
        canUseCustomDomain: false,
        canUseApi: false,
        canUseAdvancedReports: true
      }
    case 'pro':
      return {
        staffLimit: 10,
        monthlyBookingsLimit: null, // unlimited
        canUseAdvancedCalendar: true,
        canUseAutomatedWhatsapp: true,
        canUseCustomDomain: true,
        canUseApi: true,
        canUseAdvancedReports: true
      }
    default:
      return {
        staffLimit: 0,
        monthlyBookingsLimit: 0,
        canUseAdvancedCalendar: false,
        canUseAutomatedWhatsapp: false,
        canUseCustomDomain: false,
        canUseApi: false,
        canUseAdvancedReports: false
      }
  }
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const result = await query(`
      SELECT 
        id,
        email,
        plan,
        plan_status,
        trial_ends_at,
        staff_count,
        monthly_bookings_count,
        subscription_id
      FROM users 
      WHERE id = $1
    `, [userId])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    return {
      id: user.id,
      email: user.email,
      plan: user.plan || 'solo',
      planStatus: user.plan_status || 'trial',
      trialEndsAt: user.trial_ends_at ? new Date(user.trial_ends_at) : null,
      staffCount: user.staff_count || 0,
      monthlyBookingsCount: user.monthly_bookings_count || 0,
      subscriptionId: user.subscription_id
    }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return null
  }
}

export function isSubscriptionActive(subscription: UserSubscription): boolean {
  // Check if subscription is active
  if (subscription.planStatus === 'active') {
    return true
  }

  // Check if trial is still valid
  if (subscription.planStatus === 'trial' && subscription.trialEndsAt) {
    return subscription.trialEndsAt > new Date()
  }

  return false
}

export async function canUserPerformAction(
  userId: string, 
  action: 'add_staff' | 'create_booking' | 'use_advanced_calendar' | 'use_automated_whatsapp' | 'use_custom_domain' | 'use_api' | 'use_advanced_reports'
): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  
  if (!subscription || !isSubscriptionActive(subscription)) {
    return false
  }

  const limits = getPlanLimits(subscription.plan)

  switch (action) {
    case 'add_staff':
      return subscription.staffCount < limits.staffLimit
    case 'create_booking':
      return limits.monthlyBookingsLimit === null || subscription.monthlyBookingsCount < limits.monthlyBookingsLimit
    case 'use_advanced_calendar':
      return limits.canUseAdvancedCalendar
    case 'use_automated_whatsapp':
      return limits.canUseAutomatedWhatsapp
    case 'use_custom_domain':
      return limits.canUseCustomDomain
    case 'use_api':
      return limits.canUseApi
    case 'use_advanced_reports':
      return limits.canUseAdvancedReports
    default:
      return true
  }
}

export async function updateUserUsageCounters(userId: string): Promise<void> {
  try {
    await query('SELECT update_user_usage_counters($1)', [userId])
  } catch (error) {
    console.error('Error updating usage counters:', error)
  }
}

export function formatPlanName(plan: string): string {
  switch (plan) {
    case 'solo':
      return 'Solo Plan'
    case 'team':
      return 'Team Plan'
    case 'pro':
      return 'Pro Plan'
    default:
      return 'Unknown Plan'
  }
}

export function formatPlanStatus(status: string): { text: string; variant: string } {
  switch (status) {
    case 'active':
      return { text: 'Active', variant: 'success' }
    case 'trial':
      return { text: 'Trial', variant: 'info' }
    case 'past_due':
      return { text: 'Payment Due', variant: 'warning' }
    case 'cancelled':
      return { text: 'Cancelled', variant: 'danger' }
    case 'incomplete':
      return { text: 'Setup Required', variant: 'warning' }
    default:
      return { text: 'Unknown', variant: 'secondary' }
  }
}

export function getTrialDaysRemaining(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null
  
  const now = new Date()
  const diffTime = trialEndsAt.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

export function shouldShowUpgradePrompt(subscription: UserSubscription): boolean {
  // Show upgrade prompt if:
  // 1. On trial with less than 7 days remaining
  // 2. Approaching plan limits (80% usage)
  // 3. Plan status is not active
  
  if (subscription.planStatus !== 'active' && subscription.planStatus !== 'trial') {
    return true
  }

  if (subscription.planStatus === 'trial' && subscription.trialEndsAt) {
    const daysRemaining = getTrialDaysRemaining(subscription.trialEndsAt)
    if (daysRemaining !== null && daysRemaining <= 7) {
      return true
    }
  }

  const limits = getPlanLimits(subscription.plan)
  
  // Check staff usage
  if (subscription.staffCount >= limits.staffLimit * 0.8) {
    return true
  }

  // Check booking usage
  if (limits.monthlyBookingsLimit && subscription.monthlyBookingsCount >= limits.monthlyBookingsLimit * 0.8) {
    return true
  }

  return false
}