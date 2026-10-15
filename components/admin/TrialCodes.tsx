'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Form, Alert, Table, Badge, Row, Col } from 'react-bootstrap'

interface TrialCode {
  id: string
  code: string
  label: string | null
  free_trial_months: number
  applicable_plan: string
  max_uses: number
  used_count: number
  expires_at: string
  is_active: boolean
}

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px'
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function TrialCodes() {
  const [codes, setCodes] = useState<TrialCode[]>([])
  const [form, setForm] = useState({ tier: 'full', free_trial_months: 3, max_uses: 1, expires_days: 30, label: '' })
  const [lastCode, setLastCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: string; content: string }>({ type: '', content: '' })

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
  })

  const load = async () => {
    try {
      const response = await fetch('/api/admin/coupons', { headers: authHeaders() })
      if (response.ok) setCodes((await response.json()).coupons)
    } catch (error) {
      console.error('Failed to load trial codes:', error)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    setBusy(true)
    setMessage({ type: '', content: '' })
    try {
      const response = await fetch('/api/admin/generate-coupon', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form)
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage({ type: 'danger', content: data.error || 'Failed to create code' })
        return
      }
      setLastCode(data.code)
      setForm(prev => ({ ...prev, label: '' }))
      load()
    } catch {
      setMessage({ type: 'danger', content: 'Failed to create code' })
    } finally {
      setBusy(false)
    }
  }

  const copy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', content: `${what} copied.` })
  }

  const shareText = (code: string) => `${window.location.origin}/signup?code=${code}`

  const status = (c: TrialCode) => {
    if (!c.is_active) return <Badge bg="secondary">Disabled</Badge>
    if (new Date(c.expires_at) < new Date()) return <Badge bg="secondary">Expired</Badge>
    if (c.used_count >= c.max_uses) return <Badge bg="warning" text="dark">Used up</Badge>
    return <Badge bg="success">Active</Badge>
  }

  return (
    <Row className="g-4">
      <Col lg={5}>
        <Card className="border-0 shadow-lg" style={cardStyle}>
          <Card.Header className="border-0 pb-0" style={{ background: 'transparent' }}>
            <h5 className="text-white mb-0 fw-bold">
              <i className="fas fa-plus-circle text-success me-2"></i>Create Trial Code
            </h5>
            <p className="text-white-50 mb-0 small">
              Share the code with a client. They enter it when signing up and get the trial with no card.
            </p>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Package</Form.Label>
              <Form.Select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))}>
                <option value="full">Pro (unlimited businesses & staff)</option>
                <option value="basic">Starter (1 business, 10 staff)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-white">Trial length</Form.Label>
              <Form.Select
                value={form.free_trial_months}
                onChange={e => setForm(p => ({ ...p, free_trial_months: parseInt(e.target.value) }))}
              >
                {MONTH_OPTIONS.map(m => (
                  <option key={m} value={m}>{m === 12 ? '1 year' : `${m} month${m > 1 ? 's' : ''}`}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="text-white">Times it can be used</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={100}
                    value={form.max_uses}
                    onChange={e => setForm(p => ({ ...p, max_uses: parseInt(e.target.value) || 1 }))}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="text-white">Code valid for (days)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={365}
                    value={form.expires_days}
                    onChange={e => setForm(p => ({ ...p, expires_days: parseInt(e.target.value) || 1 }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-white">Note (optional)</Form.Label>
              <Form.Control
                type="text"
                maxLength={100}
                placeholder="e.g. Carlos - mechanic"
                value={form.label}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              />
            </Form.Group>

            <Button variant="success" className="w-100" onClick={create} disabled={busy}>
              {busy ? 'Creating...' : 'Generate code'}
            </Button>
          </Card.Body>
        </Card>

        {message.content && (
          <Alert className="mt-3" variant={message.type} dismissible onClose={() => setMessage({ type: '', content: '' })}>
            {message.content}
          </Alert>
        )}

        {lastCode && (
          <Card className="border-0 shadow-lg mt-3" style={cardStyle}>
            <Card.Body className="text-center">
              <div className="text-white-50 small mb-1">New code</div>
              <code className="fs-3 text-success fw-bold">{lastCode}</code>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <Button size="sm" variant="outline-light" onClick={() => copy(lastCode, 'Code')}>Copy code</Button>
                <Button size="sm" variant="outline-success" onClick={() => copy(shareText(lastCode), 'Signup link')}>
                  Copy signup link
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </Col>

      <Col lg={7}>
        <Card className="border-0 shadow-lg" style={cardStyle}>
          <Card.Header className="border-0 pb-0" style={{ background: 'transparent' }}>
            <h5 className="text-white mb-0 fw-bold">
              <i className="fas fa-list text-success me-2"></i>Trial Codes ({codes.length})
            </h5>
          </Card.Header>
          <Card.Body style={{ maxHeight: '600px', overflow: 'auto' }}>
            <Table className="table-dark" style={{ '--bs-table-bg': 'transparent' } as React.CSSProperties}>
              <thead>
                <tr><th>Code</th><th>Package</th><th>Trial</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.id}>
                    <td>
                      <code className="text-success fw-bold">{c.code}</code>
                      {c.label && <div className="small text-white-50">{c.label}</div>}
                    </td>
                    <td>{c.applicable_plan === 'pro' ? 'Pro' : 'Starter'}</td>
                    <td>{c.free_trial_months === 12 ? '1 year' : `${c.free_trial_months} mo`}</td>
                    <td>{c.used_count}/{c.max_uses}</td>
                    <td>{new Date(c.expires_at).toLocaleDateString()}</td>
                    <td>{status(c)}</td>
                    <td>
                      <Button size="sm" variant="outline-light" onClick={() => copy(shareText(c.code), 'Signup link')}>
                        Copy link
                      </Button>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr><td colSpan={7} className="text-white-50">No codes yet.</td></tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
