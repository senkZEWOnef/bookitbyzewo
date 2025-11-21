'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Card, Modal, Badge, ProgressBar } from 'react-bootstrap'
import Link from 'next/link'
// Client-side subscription types and utilities
interface UserSubscription {
  id: string
  email: string
  plan: 'solo' | 'team' | 'pro'
  planStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'incomplete'
  trialEndsAt: string | null
  staffCount: number
  monthlyBookingsCount: number
  subscriptionId: string | null
  isActive: boolean
}

function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null
  
  const now = new Date()
  const endDate = new Date(trialEndsAt)
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

function formatPlanName(plan: string): string {
  switch (plan) {
    case 'solo': return 'Solo Plan'
    case 'team': return 'Team Plan'  
    case 'pro': return 'Pro Plan'
    default: return 'Unknown Plan'
  }
}

function formatPlanStatus(status: string): { text: string; variant: string } {
  switch (status) {
    case 'active': return { text: 'Active', variant: 'success' }
    case 'trial': return { text: 'Trial', variant: 'info' }
    case 'past_due': return { text: 'Payment Due', variant: 'warning' }
    case 'cancelled': return { text: 'Cancelled', variant: 'danger' }
    case 'incomplete': return { text: 'Setup Required', variant: 'warning' }
    default: return { text: 'Unknown', variant: 'secondary' }
  }
}

interface SubscriptionCheckProps {
  children: React.ReactNode
  requireActiveSubscription?: boolean
}

export default function SubscriptionCheck({
  children,
  requireActiveSubscription = false
}: SubscriptionCheckProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUserSubscription()
  }, [])

  const checkUserSubscription = async () => {
    try {
      const userString = localStorage.getItem('user')
      if (!userString) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userString)
      
      // Fetch user's current subscription status
      const response = await fetch(`/api/user/subscription?userId=${user.id}`)
      const result = await response.json()

      if (response.ok && result.subscription) {
        setSubscription(result.subscription)
        
        // Check if subscription is active (using the server response)
        if (requireActiveSubscription && !result.subscription.isActive) {
          setShowPaymentModal(true)
        }
      } else {
        // No subscription found, redirect to payment
        if (requireActiveSubscription) {
          setShowPaymentModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Checking subscription...</p>
        </div>
      </div>
    )
  }

  // Show payment required modal
  if (showPaymentModal) {
    return (
      <PaymentRequiredModal 
        subscription={subscription}
        onClose={() => setShowPaymentModal(false)}
      />
    )
  }

  // Show trial warning if approaching expiration
  const showTrialWarning = subscription && 
    subscription.planStatus === 'trial' && 
    subscription.trialEndsAt && 
    getTrialDaysRemaining(subscription.trialEndsAt) !== null &&
    getTrialDaysRemaining(subscription.trialEndsAt)! <= 7

  return (
    <>
      {showTrialWarning && (
        <TrialWarning subscription={subscription!} />
      )}
      {children}
    </>
  )
}

function PaymentRequiredModal({ 
  subscription, 
  onClose 
}: { 
  subscription: UserSubscription | null
  onClose: () => void 
}) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/upgrade-plan')
  }

  const isTrialExpired = subscription && 
    subscription.planStatus === 'trial' && 
    subscription.trialEndsAt && 
    new Date(subscription.trialEndsAt) <= new Date()

  return (
    <Modal show={true} onHide={onClose} centered backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>
          <i className="fas fa-credit-card text-warning me-2"></i>
          {isTrialExpired ? 'Trial Expired' : 'Subscription Required'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          {subscription && (
            <div className="mb-4">
              <Badge bg={formatPlanStatus(subscription.planStatus).variant} className="mb-2">
                {formatPlanName(subscription.plan)} - {formatPlanStatus(subscription.planStatus).text}
              </Badge>
              
              {isTrialExpired ? (
                <p className="text-muted">
                  Your free trial has ended. Please upgrade to continue using BookIt by Zewo.
                </p>
              ) : (
                <p className="text-muted">
                  You need an active subscription to access this feature.
                </p>
              )}
            </div>
          )}

          <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={handleUpgrade}>
              <i className="fas fa-arrow-up me-2"></i>
              Choose Your Plan
            </Button>
            <Button variant="outline-secondary" onClick={onClose}>
              Continue with Limited Access
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}

function TrialWarning({ subscription }: { subscription: UserSubscription }) {
  const daysRemaining = getTrialDaysRemaining(subscription.trialEndsAt)
  
  return (
    <Alert variant="warning" className="mb-3">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <Alert.Heading className="h6 mb-2">
            <i className="fas fa-clock me-2"></i>
            Trial Ending Soon
          </Alert.Heading>
          <p className="mb-2">
            Your free trial expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>.
            Upgrade now to continue using all features.
          </p>
        </div>
        <Link href="/upgrade-plan">
          <Button variant="warning" size="sm">
            <i className="fas fa-crown me-1"></i>
            Upgrade
          </Button>
        </Link>
      </div>
    </Alert>
  )
}