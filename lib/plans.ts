// Plan definitions and validation utilities

export interface PlanLimits {
  maxStaff: number
  maxLocations: number
  hasAdvancedCalendar: boolean
  hasStaffScheduling: boolean
  hasCustomerManagement: boolean
  hasBasicReports: boolean
  hasAdvancedReports: boolean
  hasCustomDomains: boolean
  hasApiAccess: boolean
  hasAutomatedWhatsApp: boolean
  hasAiAssistant: boolean
  supportLevel: 'email' | 'priority_email' | 'phone_email'
}

// "No limit" sentinel. Large enough that no real account reaches it.
export const UNLIMITED = 999999

// Both plans include the same features (automated WhatsApp, AI assistant, scheduling, reports...).
// They differ only in how many businesses and staff members an account may have.
// 'solo' is the Starter plan (1 business, 10 staff). 'pro' is unlimited businesses and staff.
const FULL_FEATURES = {
  hasAdvancedCalendar: true,
  hasStaffScheduling: true,
  hasCustomerManagement: true,
  hasBasicReports: true,
  hasAdvancedReports: true,
  hasCustomDomains: false, // not built yet
  hasApiAccess: false, // not built yet
  hasAutomatedWhatsApp: true,
  hasAiAssistant: true,
  supportLevel: 'email' as const
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  solo: { maxStaff: 10, maxLocations: 1, ...FULL_FEATURES },
  pro: { maxStaff: UNLIMITED, maxLocations: UNLIMITED, ...FULL_FEATURES }
}

export const PLAN_PRICES = {
  solo: { monthly: 29.99, hasFreeTrial: true },
  pro: { monthly: 59.99, hasFreeTrial: true }
}

export const PLAN_NAMES: Record<string, string> = { solo: 'Starter', pro: 'Pro' }

// The old Team plan no longer exists; any account still on it gets the Pro limits
export function normalizePlan(planName: string | null | undefined): 'solo' | 'pro' {
  return planName === 'pro' || planName === 'team' ? 'pro' : 'solo'
}

export function getPlanLimits(planName: string): PlanLimits {
  return PLAN_LIMITS[normalizePlan(planName)]
}

export function isUnlimited(value: number) {
  return value >= UNLIMITED
}

export function validatePlanLimit(
  planName: string, 
  limitType: keyof PlanLimits, 
  currentValue: number
): { valid: boolean; message?: string } {
  const limits = getPlanLimits(planName)
  
  switch (limitType) {
    case 'maxStaff':
      if (currentValue >= limits.maxStaff) {
        return {
          valid: false,
          message: `Your ${PLAN_NAMES[normalizePlan(planName)]} plan allows up to ${limits.maxStaff} staff member${limits.maxStaff === 1 ? '' : 's'}. Upgrade to Pro for unlimited staff.`
        }
      }
      break
      
    case 'maxLocations':
      if (currentValue >= limits.maxLocations && !isUnlimited(limits.maxLocations)) {
        return {
          valid: false,
          message: `Your ${PLAN_NAMES[normalizePlan(planName)]} plan allows ${limits.maxLocations} business${limits.maxLocations === 1 ? '' : 'es'}. Upgrade to Pro for unlimited businesses.`
        }
      }
      break
  }
  
  return { valid: true }
}

export function validateFeatureAccess(
  planName: string,
  feature: keyof PlanLimits
): { hasAccess: boolean; message?: string } {
  const limits = getPlanLimits(planName)
  const hasAccess = limits[feature] as boolean
  
  if (!hasAccess) {
    const featureNames = {
      hasAdvancedCalendar: 'Advanced Calendar Views',
      hasStaffScheduling: 'Staff Scheduling',
      hasCustomerManagement: 'Customer Management',
      hasBasicReports: 'Basic Reports',
      hasAdvancedReports: 'Advanced Reports',
      hasCustomDomains: 'Custom Domains',
      hasApiAccess: 'API Access',
      hasAutomatedWhatsApp: 'Automated WhatsApp Messages',
      hasAiAssistant: 'AI Assistant'
    }
    
    const featureName = featureNames[feature as keyof typeof featureNames] || feature.toString()
    const upgradePlan = 'Pro'
    
    return {
      hasAccess: false,
      message: `${featureName} requires ${upgradePlan} plan. Upgrade to unlock this feature.`
    }
  }
  
  return { hasAccess: true }
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) < new Date()
}

export function getDaysLeftInTrial(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, daysLeft)
}