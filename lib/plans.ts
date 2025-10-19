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
  supportLevel: 'email' | 'priority_email' | 'phone_email'
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  solo: {
    maxStaff: 1,
    maxLocations: 1,
    hasAdvancedCalendar: false,
    hasStaffScheduling: false,
    hasCustomerManagement: false,
    hasBasicReports: false,
    hasAdvancedReports: false,
    hasCustomDomains: false,
    hasApiAccess: false,
    hasAutomatedWhatsApp: false,
    supportLevel: 'email'
  },
  team: {
    maxStaff: 5,
    maxLocations: 999, // unlimited
    hasAdvancedCalendar: true,
    hasStaffScheduling: true,
    hasCustomerManagement: true,
    hasBasicReports: true,
    hasAdvancedReports: false,
    hasCustomDomains: false,
    hasApiAccess: false,
    hasAutomatedWhatsApp: false,
    supportLevel: 'priority_email'
  },
  pro: {
    maxStaff: 10,
    maxLocations: 999, // unlimited
    hasAdvancedCalendar: true,
    hasStaffScheduling: true,
    hasCustomerManagement: true,
    hasBasicReports: true,
    hasAdvancedReports: true,
    hasCustomDomains: true,
    hasApiAccess: true,
    hasAutomatedWhatsApp: true,
    supportLevel: 'phone_email'
  }
}

export const PLAN_PRICES = {
  solo: { monthly: 19, yearly: 190, hasFreeTrial: true },
  team: { monthly: 39, yearly: 390, hasFreeTrial: false },
  pro: { monthly: 79, yearly: 790, hasFreeTrial: false }
}

export function getPlanLimits(planName: string): PlanLimits {
  return PLAN_LIMITS[planName] || PLAN_LIMITS.solo
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
          message: `Your ${planName.charAt(0).toUpperCase() + planName.slice(1)} plan allows up to ${limits.maxStaff} staff member${limits.maxStaff === 1 ? '' : 's'}. Upgrade to add more.`
        }
      }
      break
      
    case 'maxLocations':
      if (currentValue >= limits.maxLocations && limits.maxLocations < 999) {
        return {
          valid: false,
          message: `Your ${planName.charAt(0).toUpperCase() + planName.slice(1)} plan allows up to ${limits.maxLocations} location${limits.maxLocations === 1 ? '' : 's'}. Upgrade to add more.`
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
      hasAutomatedWhatsApp: 'Automated WhatsApp Messages'
    }
    
    const featureName = featureNames[feature as keyof typeof featureNames] || feature.toString()
    const upgradePlan = feature === 'hasAdvancedReports' || feature === 'hasCustomDomains' || 
                       feature === 'hasApiAccess' || feature === 'hasAutomatedWhatsApp' ? 'Pro' : 'Team'
    
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