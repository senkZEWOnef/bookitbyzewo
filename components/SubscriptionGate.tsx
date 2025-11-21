'use client'

import { useState, useEffect } from 'react'
import { Card, Alert, Button, Badge, ProgressBar } from 'react-bootstrap'
import Link from 'next/link'
import { 
  UserSubscription, 
  PlanLimits,
  getPlanLimits,
  formatPlanName,
  formatPlanStatus,
  getTrialDaysRemaining,
  shouldShowUpgradePrompt
} from '@/lib/plan-restrictions'

interface SubscriptionGateProps {
  children: React.ReactNode
  requiredAction?: 'add_staff' | 'create_booking' | 'use_advanced_calendar' | 'use_automated_whatsapp' | 'use_custom_domain' | 'use_api' | 'use_advanced_reports'
  subscription: UserSubscription | null
  onUpgradeNeeded?: () => void
  fallbackMessage?: string
}

export default function SubscriptionGate({
  children,
  requiredAction,
  subscription,
  onUpgradeNeeded,
  fallbackMessage = "This feature requires an active subscription."
}: SubscriptionGateProps) {
  const [canAccess, setCanAccess] = useState(true)
  const [upgradeReason, setUpgradeReason] = useState('')

  useEffect(() => {
    if (!subscription) {
      setCanAccess(false)
      setUpgradeReason('No active subscription found.')
      return
    }

    // Check if subscription is active
    const isActive = subscription.planStatus === 'active' || 
      (subscription.planStatus === 'trial' && subscription.trialEndsAt && subscription.trialEndsAt > new Date())

    if (!isActive) {
      setCanAccess(false)
      setUpgradeReason(subscription.planStatus === 'trial' ? 'Trial period has expired.' : 'Subscription is not active.')
      return
    }

    // Check specific action requirements
    if (requiredAction) {
      const limits = getPlanLimits(subscription.plan)
      let blocked = false
      let reason = ''

      switch (requiredAction) {
        case 'add_staff':
          if (subscription.staffCount >= limits.staffLimit) {
            blocked = true
            reason = `You've reached your plan limit of ${limits.staffLimit} staff member${limits.staffLimit > 1 ? 's' : ''}.`
          }
          break
        case 'create_booking':
          if (limits.monthlyBookingsLimit && subscription.monthlyBookingsCount >= limits.monthlyBookingsLimit) {
            blocked = true
            reason = `You've reached your plan limit of ${limits.monthlyBookingsLimit} bookings this month.`
          }
          break
        case 'use_advanced_calendar':
          if (!limits.canUseAdvancedCalendar) {
            blocked = true
            reason = 'Advanced calendar features require Team plan or higher.'
          }
          break
        case 'use_automated_whatsapp':
          if (!limits.canUseAutomatedWhatsapp) {
            blocked = true
            reason = 'Automated WhatsApp messaging requires Pro plan.'
          }
          break
        case 'use_custom_domain':
          if (!limits.canUseCustomDomain) {
            blocked = true
            reason = 'Custom domain requires Pro plan.'
          }
          break
        case 'use_api':
          if (!limits.canUseApi) {
            blocked = true
            reason = 'API access requires Pro plan.'
          }
          break
        case 'use_advanced_reports':
          if (!limits.canUseAdvancedReports) {
            blocked = true
            reason = 'Advanced reports require Team plan or higher.'
          }
          break
      }

      if (blocked) {
        setCanAccess(false)
        setUpgradeReason(reason)
        return
      }
    }

    setCanAccess(true)
  }, [subscription, requiredAction])

  if (!subscription) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Subscription Required</Alert.Heading>
        <p>You need an active subscription to access this feature.</p>
        <Link href="/pricing">
          <Button variant="primary">View Plans</Button>
        </Link>
      </Alert>
    )
  }

  if (!canAccess) {
    return (
      <UpgradePrompt 
        subscription={subscription}
        reason={upgradeReason}
        onUpgradeNeeded={onUpgradeNeeded}
      />
    )
  }

  // Show usage warnings if approaching limits
  const showWarning = shouldShowUpgradePrompt(subscription)
  
  return (
    <>
      {showWarning && (
        <UsageWarning subscription={subscription} />
      )}
      {children}
    </>
  )
}

function UpgradePrompt({ 
  subscription, 
  reason, 
  onUpgradeNeeded 
}: { 
  subscription: UserSubscription
  reason: string
  onUpgradeNeeded?: () => void 
}) {
  const limits = getPlanLimits(subscription.plan)
  const planStatus = formatPlanStatus(subscription.planStatus)

  return (
    <Card className="border-warning">
      <Card.Header className="bg-warning text-dark">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="fas fa-crown me-2"></i>
            Upgrade Required
          </h6>
          <Badge bg={planStatus.variant}>
            {formatPlanName(subscription.plan)} - {planStatus.text}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <Alert variant="info" className="mb-3">
            <strong>{reason}</strong>
          </Alert>
          
          <h6 className="mb-3">Current Usage:</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <small className="text-muted">Staff Members</small>
              <ProgressBar 
                now={(subscription.staffCount / limits.staffLimit) * 100}
                label={`${subscription.staffCount} / ${limits.staffLimit}`}
                variant={subscription.staffCount >= limits.staffLimit ? 'danger' : 'primary'}
              />
            </div>
            {limits.monthlyBookingsLimit && (
              <div className="col-md-6">
                <small className="text-muted">Monthly Bookings</small>
                <ProgressBar 
                  now={(subscription.monthlyBookingsCount / limits.monthlyBookingsLimit) * 100}
                  label={`${subscription.monthlyBookingsCount} / ${limits.monthlyBookingsLimit}`}
                  variant={subscription.monthlyBookingsCount >= limits.monthlyBookingsLimit ? 'danger' : 'primary'}
                />
              </div>
            )}
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link href="/pricing">
            <Button variant="primary">
              <i className="fas fa-arrow-up me-2"></i>
              View Upgrade Options
            </Button>
          </Link>
          {onUpgradeNeeded && (
            <Button variant="outline-primary" onClick={onUpgradeNeeded}>
              <i className="fas fa-info-circle me-2"></i>
              Learn More
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

function UsageWarning({ subscription }: { subscription: UserSubscription }) {
  const limits = getPlanLimits(subscription.plan)
  const trialDays = getTrialDaysRemaining(subscription.trialEndsAt)

  return (
    <Alert variant="warning" className="mb-3">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <Alert.Heading className="h6 mb-2">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Usage Warning
          </Alert.Heading>
          {subscription.planStatus === 'trial' && trialDays !== null && trialDays <= 7 && (
            <p className="mb-2">
              Your trial expires in <strong>{trialDays} day{trialDays !== 1 ? 's' : ''}</strong>.
            </p>
          )}
          {subscription.staffCount >= limits.staffLimit * 0.8 && (
            <p className="mb-2">
              You're using {subscription.staffCount} of {limits.staffLimit} staff members.
            </p>
          )}
          {limits.monthlyBookingsLimit && subscription.monthlyBookingsCount >= limits.monthlyBookingsLimit * 0.8 && (
            <p className="mb-2">
              You're using {subscription.monthlyBookingsCount} of {limits.monthlyBookingsLimit} monthly bookings.
            </p>
          )}
        </div>
        <Link href="/pricing">
          <Button variant="warning" size="sm">
            Upgrade
          </Button>
        </Link>
      </div>
    </Alert>
  )
}