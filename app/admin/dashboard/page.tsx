'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge, Tab, Tabs } from 'react-bootstrap'

interface CouponCode {
  id: string
  code: string
  discount_type: string
  discount_value: number
  free_trial_months: number
  max_uses: number
  used_count: number
  expires_at: string
  is_active: boolean
}

interface AnalyticsData {
  total_businesses: number
  total_appointments: number
  active_subscriptions: number
  failed_payments: number
  recent_signups: number
  revenue_this_month: number
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<CouponCode[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [newCoupon, setNewCoupon] = useState({
    discount_type: 'percentage',
    discount_value: 25,
    free_trial_months: 0,
    max_uses: 1,
    expires_days: 30
  })
  const [message, setMessage] = useState({ type: '', content: '' })
  const router = useRouter()

  useEffect(() => {
    verifyAdminAccess()
  }, [])

  const verifyAdminAccess = async () => {
    const token = localStorage.getItem('admin_token')
    
    if (!token) {
      router.push('/admin/login')
      return
    }

    try {
      const response = await fetch('/api/admin/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setAuthenticated(true)
        loadDashboardData()
      } else {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    await Promise.all([
      loadCoupons(),
      loadAnalytics()
    ])
  }

  const loadCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons)
      }
    } catch (error) {
      console.error('Failed to load coupons:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const generateCoupon = async () => {
    try {
      const response = await fetch('/api/admin/generate-coupon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(newCoupon)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', content: `Coupon code generated: ${data.code}` })
        loadCoupons()
        // Reset form
        setNewCoupon({
          discount_type: 'percentage',
          discount_value: 25,
          free_trial_months: 0,
          max_uses: 1,
          expires_days: 30
        })
      } else {
        setMessage({ type: 'error', content: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'Failed to generate coupon' })
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#1a1a1a' }}>
        <div className="text-warning">Loading admin panel...</div>
      </Container>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <Container fluid style={{ background: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
            <h2 className="text-warning mb-0">⚡ BookIt Admin Panel</h2>
            <Button variant="outline-warning" onClick={logout}>
              Logout
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Tabs defaultActiveKey="analytics" className="mb-4">
            {/* Analytics Tab */}
            <Tab eventKey="analytics" title="📊 Platform Analytics">
              <Row>
                <Col md={12}>
                  <Card className="bg-dark border-secondary">
                    <Card.Header>
                      <h5 className="text-warning mb-0">Platform Overview</h5>
                    </Card.Header>
                    <Card.Body>
                      {analytics ? (
                        <Row>
                          <Col md={4}>
                            <div className="text-center p-3">
                              <h3 className="text-success">{analytics.total_businesses}</h3>
                              <p className="text-muted">Total Businesses</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3">
                              <h3 className="text-info">{analytics.total_appointments}</h3>
                              <p className="text-muted">Total Appointments</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3">
                              <h3 className="text-warning">{analytics.active_subscriptions}</h3>
                              <p className="text-muted">Active Subscriptions</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3">
                              <h3 className="text-danger">{analytics.failed_payments}</h3>
                              <p className="text-muted">Failed Payments</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3">
                              <h3 className="text-primary">{analytics.recent_signups}</h3>
                              <p className="text-muted">Recent Signups (7d)</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3">
                              <h3 className="text-success">${analytics.revenue_this_month}</h3>
                              <p className="text-muted">Revenue This Month</p>
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        <p className="text-muted">Loading analytics...</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            {/* Coupon Generator Tab */}
            <Tab eventKey="coupons" title="🎟️ Coupon Generator">
              <Row>
                <Col md={6}>
                  <Card className="bg-dark border-secondary">
                    <Card.Header>
                      <h5 className="text-warning mb-0">Generate New Coupon</h5>
                    </Card.Header>
                    <Card.Body>
                      {message.content && (
                        <Alert variant={message.type === 'success' ? 'success' : 'danger'}>
                          {message.content}
                        </Alert>
                      )}

                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label className="text-light">Discount Type</Form.Label>
                          <Form.Select
                            value={newCoupon.discount_type}
                            onChange={(e) => setNewCoupon(prev => ({ ...prev, discount_type: e.target.value }))}
                            style={{ background: '#2d2d2d', border: '1px solid #444', color: '#fff' }}
                          >
                            <option value="percentage">Percentage Discount</option>
                            <option value="free_trial">Free Trial</option>
                          </Form.Select>
                        </Form.Group>

                        {newCoupon.discount_type === 'percentage' ? (
                          <Form.Group className="mb-3">
                            <Form.Label className="text-light">Discount Percentage</Form.Label>
                            <Form.Select
                              value={newCoupon.discount_value}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, discount_value: parseInt(e.target.value) }))}
                              style={{ background: '#2d2d2d', border: '1px solid #444', color: '#fff' }}
                            >
                              <option value={25}>25% Off</option>
                              <option value={50}>50% Off</option>
                              <option value={75}>75% Off</option>
                            </Form.Select>
                          </Form.Group>
                        ) : (
                          <Form.Group className="mb-3">
                            <Form.Label className="text-light">Free Trial Months</Form.Label>
                            <Form.Select
                              value={newCoupon.free_trial_months}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, free_trial_months: parseInt(e.target.value) }))}
                              style={{ background: '#2d2d2d', border: '1px solid #444', color: '#fff' }}
                            >
                              <option value={1}>1 Month</option>
                              <option value={3}>3 Months</option>
                              <option value={6}>6 Months</option>
                              <option value={12}>12 Months</option>
                            </Form.Select>
                          </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                          <Form.Label className="text-light">Max Uses</Form.Label>
                          <Form.Control
                            type="number"
                            value={newCoupon.max_uses}
                            onChange={(e) => setNewCoupon(prev => ({ ...prev, max_uses: parseInt(e.target.value) }))}
                            style={{ background: '#2d2d2d', border: '1px solid #444', color: '#fff' }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label className="text-light">Expires in Days</Form.Label>
                          <Form.Control
                            type="number"
                            value={newCoupon.expires_days}
                            onChange={(e) => setNewCoupon(prev => ({ ...prev, expires_days: parseInt(e.target.value) }))}
                            style={{ background: '#2d2d2d', border: '1px solid #444', color: '#fff' }}
                          />
                        </Form.Group>

                        <Button variant="warning" onClick={generateCoupon} className="w-100">
                          Generate Coupon Code
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="bg-dark border-secondary">
                    <Card.Header>
                      <h5 className="text-warning mb-0">Generated Coupons</h5>
                    </Card.Header>
                    <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table variant="dark" striped>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Used</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map(coupon => (
                            <tr key={coupon.id}>
                              <td>
                                <code className="text-warning">{coupon.code}</code>
                              </td>
                              <td>
                                {coupon.discount_type === 'percentage' ? 'Discount' : 'Free Trial'}
                              </td>
                              <td>
                                {coupon.discount_type === 'percentage' 
                                  ? `${coupon.discount_value}%` 
                                  : `${coupon.free_trial_months}m`
                                }
                              </td>
                              <td>{coupon.used_count}/{coupon.max_uses}</td>
                              <td>
                                <Badge bg={coupon.is_active ? 'success' : 'danger'}>
                                  {coupon.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  )
}