'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Form, Alert, Table, Badge } from 'react-bootstrap'

interface BetaAccount {
  id: string
  email: string
  full_name: string
  plan: string
  plan_status: string
  trial_ends_at: string | null
  business_count: number
}

interface Credential {
  email: string
  full_name: string
  password: string
}

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px'
}

export default function BetaAccounts() {
  const [accounts, setAccounts] = useState<BetaAccount[]>([])
  const [count, setCount] = useState(10)
  const [trialDays, setTrialDays] = useState(60)
  const [emails, setEmails] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: string; content: string }>({ type: '', content: '' })

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
  })

  const load = async () => {
    try {
      const response = await fetch('/api/admin/beta-accounts', { headers: authHeaders() })
      if (response.ok) setAccounts((await response.json()).accounts)
    } catch (error) {
      console.error('Failed to load beta accounts:', error)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    // One friend per line: "email, name" (name optional). Blank lines are ignored.
    const lines = emails.split('\n').map(l => l.trim()).filter(Boolean)
    const list = lines.length > 0
      ? lines.map(line => {
          const [email, ...name] = line.split(',')
          return { email: email.trim(), full_name: name.join(',').trim() || undefined }
        })
      : Array.from({ length: count }, () => ({}))

    setBusy(true)
    setMessage({ type: '', content: '' })
    try {
      const response = await fetch('/api/admin/beta-accounts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ accounts: list, trial_days: trialDays })
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage({ type: 'danger', content: data.error || 'Failed to create accounts' })
        return
      }
      setCredentials(data.created)
      setEmails('')
      const failedText = data.failed.length
        ? ` Failed: ${data.failed.map((f: any) => `${f.email} (${f.error})`).join(', ')}`
        : ''
      setMessage({
        type: data.failed.length ? 'warning' : 'success',
        content: `Created ${data.created.length} account(s). Copy the passwords now - they are shown only once.${failedText}`
      })
      load()
    } catch {
      setMessage({ type: 'danger', content: 'Failed to create accounts' })
    } finally {
      setBusy(false)
    }
  }

  const act = async (userId: string, action: 'extend' | 'revoke' | 'reset_password') => {
    if (action === 'revoke' && !confirm('Revoke access for this tester?')) return
    const response = await fetch('/api/admin/beta-accounts', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ userId, action })
    })
    const data = await response.json()
    if (!response.ok) {
      setMessage({ type: 'danger', content: data.error || 'Action failed' })
      return
    }
    if (action === 'reset_password') {
      const account = accounts.find(a => a.id === userId)
      setCredentials([{ email: account?.email || '', full_name: account?.full_name || '', password: data.password }])
      setMessage({ type: 'success', content: 'New password generated. Copy it now - it is shown only once.' })
    }
    load()
  }

  const copyAll = () => {
    const text = credentials
      .map(c => `${c.full_name}\nLogin: ${window.location.origin}/login\nEmail: ${c.email}\nPassword: ${c.password}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', content: 'Credentials copied to clipboard.' })
  }

  const statusBadge = (a: BetaAccount) => {
    const active = a.plan_status === 'trial' && a.trial_ends_at && new Date(a.trial_ends_at) > new Date()
    return <Badge bg={active ? 'success' : 'secondary'}>{active ? 'Active trial' : a.plan_status === 'active' ? 'Paying' : 'Expired'}</Badge>
  }

  return (
    <div className="d-flex flex-column gap-4">
      {message.content && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', content: '' })}>
          {message.content}
        </Alert>
      )}

      <Card className="border-0 shadow-lg" style={cardStyle}>
        <Card.Header className="border-0 pb-0" style={{ background: 'transparent' }}>
          <h5 className="text-white mb-0 fw-bold">
            <i className="fas fa-user-plus text-success me-2"></i>Create Beta Tester Accounts
          </h5>
          <p className="text-white-50 mb-0 small">
            Pro plan (all features, up to 10 staff, unlimited bookings), free for the trial period. No card required.
          </p>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="text-white">Friends&apos; emails (optional, one per line: email, name)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder={'carlos@email.com, Carlos (mechanic)\nleave empty to auto-generate accounts'}
              value={emails}
              onChange={e => setEmails(e.target.value)}
            />
          </Form.Group>
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <Form.Group>
              <Form.Label className="text-white">Auto-generate</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={20}
                value={count}
                disabled={emails.trim().length > 0}
                onChange={e => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="text-white">Free trial</Form.Label>
              <Form.Select value={trialDays} onChange={e => setTrialDays(parseInt(e.target.value))}>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </Form.Select>
            </Form.Group>
            <Button variant="success" onClick={create} disabled={busy}>
              {busy ? 'Creating...' : 'Create accounts'}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {credentials.length > 0 && (
        <Card className="border-0 shadow-lg" style={cardStyle}>
          <Card.Header className="border-0 d-flex justify-content-between align-items-center" style={{ background: 'transparent' }}>
            <h5 className="text-white mb-0 fw-bold">Login details (shown once)</h5>
            <Button size="sm" variant="outline-light" onClick={copyAll}>Copy all</Button>
          </Card.Header>
          <Card.Body>
            <Table className="table-dark" style={{ '--bs-table-bg': 'transparent' } as React.CSSProperties}>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Password</th></tr>
              </thead>
              <tbody>
                {credentials.map(c => (
                  <tr key={c.email}>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td><code className="text-success">{c.password}</code></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Card className="border-0 shadow-lg" style={cardStyle}>
        <Card.Header className="border-0 pb-0" style={{ background: 'transparent' }}>
          <h5 className="text-white mb-0 fw-bold">
            <i className="fas fa-users text-success me-2"></i>Beta Testers ({accounts.length})
          </h5>
        </Card.Header>
        <Card.Body style={{ overflowX: 'auto' }}>
          <Table className="table-dark" style={{ '--bs-table-bg': 'transparent' } as React.CSSProperties}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Trial ends</th><th>Businesses</th><th></th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td>{a.full_name}</td>
                  <td>{a.email}</td>
                  <td>{statusBadge(a)}</td>
                  <td>{a.trial_ends_at ? new Date(a.trial_ends_at).toLocaleDateString() : '-'}</td>
                  <td>{a.business_count}</td>
                  <td className="text-nowrap">
                    <Button size="sm" variant="outline-success" className="me-1" onClick={() => act(a.id, 'extend')}>+30 days</Button>
                    <Button size="sm" variant="outline-light" className="me-1" onClick={() => act(a.id, 'reset_password')}>Reset password</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => act(a.id, 'revoke')}>Revoke</Button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={6} className="text-white-50">No beta testers yet.</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}
