'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Badge, Alert } from 'react-bootstrap'
import { PLAN_NAMES, normalizePlan } from '@/lib/plans'

interface BillingStatus {
  plan: string
  plan_status: string
  trial_ends_at: string | null
  has_subscription: boolean
  can_manage_billing: boolean
}

const PRICES: Record<string, string> = { solo: '$29.99', pro: '$59.99' }

// Kept here because lib/plan-restrictions pulls in the database driver, which can't run in the browser
const STATUS_BADGES: Record<string, { text: string; variant: string }> = {
  active: { text: 'Active', variant: 'success' },
  trial: { text: 'Trial', variant: 'info' },
  past_due: { text: 'Payment Due', variant: 'warning' },
  cancelled: { text: 'Cancelled', variant: 'danger' },
  incomplete: { text: 'Setup Required', variant: 'warning' }
}

function trialDaysLeft(trialEndsAt: string) {
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export default function BillingCard() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

  useEffect(() => {
    fetch('/api/billing/status', { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
  }, [])

  const openPortal = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST', headers: authHeaders() })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) throw new Error(data.error || 'Could not open billing.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open billing.')
      setBusy(false)
    }
  }

  if (!status) return null

  const badge = STATUS_BADGES[status.plan_status] || { text: 'Unknown', variant: 'secondary' }
  const trialDays = status.plan_status === 'trial' && status.trial_ends_at
    ? trialDaysLeft(status.trial_ends_at)
    : null

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h5 className="mb-0 fw-bold">{PLAN_NAMES[normalizePlan(status.plan)]} Plan</h5>
            <Badge bg={badge.variant}>{badge.text}</Badge>
          </div>
          <div className="text-muted small">
            {status.plan_status === 'active' && `${PRICES[status.plan === 'pro' ? 'pro' : 'solo']}/month`}
            {trialDays !== null && `Free trial: ${trialDays} day${trialDays === 1 ? '' : 's'} left`}
            {status.plan_status === 'past_due' && 'Your last payment failed. Update your card to keep your account active.'}
            {status.plan_status === 'cancelled' && 'Your subscription has ended.'}
            {status.plan_status === 'incomplete' && 'Choose a plan to get started.'}
          </div>
        </div>
        <div className="d-flex gap-2">
          {status.can_manage_billing && (
            <Button variant="outline-secondary" disabled={busy} onClick={openPortal}>
              <i className="fas fa-credit-card me-2"></i>Manage billing
            </Button>
          )}
          {status.plan_status !== 'active' && (
            <Link href="/upgrade-plan" className="btn btn-success">
              {status.plan_status === 'trial' ? 'Subscribe' : 'Choose a plan'}
            </Link>
          )}
        </div>
      </Card.Body>
      {error && <Alert variant="danger" className="m-3 mt-0">{error}</Alert>}
    </Card>
  )
}
