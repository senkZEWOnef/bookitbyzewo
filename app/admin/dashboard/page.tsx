'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge } from 'react-bootstrap'

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
  trial_users: number
  failed_payments: number
  recent_signups: number
  revenue_this_month: number
}

interface Business {
  id: string
  name: string
  slug: string
  subscription_status: string
  created_at: string
  profiles: {
    full_name: string
    phone: string
  }
  appointments: { count: number }[]
  services: { count: number }[]
  staff: { count: number }[]
}

interface User {
  id: string
  full_name: string
  phone: string
  email: string
  created_at: string
  businesses: Business[]
}

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  starts_at: string
  status: string
  businesses: {
    name: string
    slug: string
  }
  services: {
    name: string
    price_cents: number
  }
  payments: {
    amount_cents: number
    status: string
  }[]
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<CouponCode[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    free_trial_months: 1,
    max_uses: 1,
    expires_days: 30
  })
  const [message, setMessage] = useState({ type: '', content: '' })
  const [activeView, setActiveView] = useState('analytics')
  const router = useRouter()

  useEffect(() => {
    verifyAdminAccess()
  }, [])

  const verifyAdminAccess = async () => {
    const token = localStorage.getItem('admin_token')
    
    if (!token) {
      console.log('No admin token found')
      router.push('/admin/login')
      return
    }

    try {
      console.log('Verifying admin token:', token.substring(0, 8) + '...')
      const response = await fetch('/api/admin/auth', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Auth verification response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Auth verification success:', data)
        setAuthenticated(true)
        loadDashboardData()
      } else {
        console.log('Auth verification failed, removing token')
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Auth verification error:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    await Promise.all([
      loadCoupons(),
      loadAnalytics(),
      loadBusinesses(),
      loadUsers(),
      loadAppointments()
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

  const loadBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/businesses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.businesses)
      }
    } catch (error) {
      console.error('Failed to load businesses:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/admin/appointments?limit=20', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Failed to load appointments:', error)
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
          free_trial_months: 1,
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
    router.push('/')
  }

  const handleBusinessAction = async (action: string, businessId: string) => {
    try {
      setLoadingData(true)
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ action, businessId })
      })

      if (response.ok) {
        setMessage({ type: 'success', content: `Business ${action}d successfully` })
        loadBusinesses()
      } else {
        setMessage({ type: 'error', content: `Failed to ${action} business` })
      }
    } catch (error) {
      setMessage({ type: 'error', content: `Failed to ${action} business` })
    } finally {
      setLoadingData(false)
    }
  }

  const handleUserAction = async (action: string, userId: string) => {
    try {
      setLoadingData(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ action, userId })
      })

      if (response.ok) {
        setMessage({ type: 'success', content: `User ${action}ned successfully` })
        loadUsers()
      } else {
        setMessage({ type: 'error', content: `Failed to ${action} user` })
      }
    } catch (error) {
      setMessage({ type: 'error', content: `Failed to ${action} user` })
    } finally {
      setLoadingData(false)
    }
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
    <>
      <div className="bg-mesh text-white position-relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
        }}></div>
      
        <Container className="position-relative py-4" style={{ paddingTop: '6rem' }}>
          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center py-4 border-bottom" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <div className="d-flex align-items-center">
                  <i className="fab fa-whatsapp text-success me-3" style={{ fontSize: '2rem' }}></i>
                  <h2 className="text-white mb-0 fw-bold">BookIt Admin Panel</h2>
                </div>
                <div className="d-flex gap-3">
                  <Button 
                    variant="outline-success" 
                    onClick={() => window.open('/', '_blank')}
                    className="px-4 py-2 fw-medium"
                    style={{ 
                      border: '2px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '12px'
                    }}
                  >
                    <i className="fas fa-external-link-alt me-2"></i>
                    View Website
                  </Button>
                  <Button 
                    variant="outline-light" 
                    onClick={logout}
                    className="px-4 py-2 fw-medium"
                    style={{ 
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px'
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="mt-4 g-0">
            <Col md={3} lg={2}>
              <Card 
                className="border-0 shadow-lg h-100"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px'
                }}
              >
                <Card.Body className="p-0">
                  <div className="p-4 border-bottom" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <h6 className="text-white mb-0 fw-bold d-flex align-items-center">
                      <i className="fas fa-cog text-success me-2"></i>
                      Admin Menu
                    </h6>
                  </div>
                  <div className="p-2">
                    {[
                      { key: 'analytics', icon: 'fas fa-chart-line', label: 'Platform Analytics' },
                      { key: 'coupons', icon: 'fas fa-ticket-alt', label: 'Coupon Generator' },
                      { key: 'businesses', icon: 'fas fa-building', label: 'Business Management' },
                      { key: 'users', icon: 'fas fa-users', label: 'User Management' },
                      { key: 'appointments', icon: 'fas fa-calendar', label: 'Recent Appointments' }
                    ].map(item => (
                      <button
                        key={item.key}
                        className={`w-100 text-start border-0 rounded-3 p-3 mb-2 fw-medium d-flex align-items-center ${
                          activeView === item.key ? 'text-dark' : 'text-white'
                        }`}
                        style={{
                          background: activeView === item.key 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setActiveView(item.key)}
                        onMouseEnter={(e) => {
                          if (activeView !== item.key) {
                            (e.target as HTMLElement).style.background = 'rgba(16, 185, 129, 0.1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeView !== item.key) {
                            (e.target as HTMLElement).style.background = 'transparent'
                          }
                        }}
                      >
                        <i className={`${item.icon} me-3`} style={{ fontSize: '1.1rem', width: '20px' }}></i>
                        <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={9} lg={10} className="ps-4" style={{ paddingTop: '1rem' }}>
              {message.content && (
                <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
                  {message.content}
                </Alert>
              )}

              {activeView === 'analytics' && (
                <Row>
                  <Col md={12}>
                    <Card 
                      className="border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Header 
                        className="border-0 pb-0"
                        style={{ background: 'transparent' }}
                      >
                        <h5 className="text-white mb-0 fw-bold d-flex align-items-center">
                          <i className="fas fa-chart-line text-success me-2"></i>
                          Platform Overview
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        {analytics ? (
                          <Row className="g-4">
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                <i className="fas fa-building text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-success fw-bold mb-1">{analytics.total_businesses}</h3>
                                <p className="text-white-50 mb-0 small">Total Businesses</p>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}
                              >
                                <i className="fas fa-calendar-check text-info mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-info fw-bold mb-1">{analytics.total_appointments}</h3>
                                <p className="text-white-50 mb-0 small">Total Appointments</p>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid rgba(245, 158, 11, 0.2)'
                                }}
                              >
                                <i className="fas fa-star text-warning mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-warning fw-bold mb-1">{analytics.active_subscriptions}</h3>
                                <p className="text-white-50 mb-0 small">Paid Users</p>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(168, 85, 247, 0.1)',
                                  border: '1px solid rgba(168, 85, 247, 0.2)'
                                }}
                              >
                                <i className="fas fa-clock text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-primary fw-bold mb-1">{analytics.trial_users}</h3>
                                <p className="text-white-50 mb-0 small">Trial Users</p>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                              >
                                <i className="fas fa-exclamation-triangle text-danger mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-danger fw-bold mb-1">{analytics.failed_payments}</h3>
                                <p className="text-white-50 mb-0 small">Failed Payments</p>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(168, 85, 247, 0.1)',
                                  border: '1px solid rgba(168, 85, 247, 0.2)'
                                }}
                              >
                                <i className="fas fa-user-plus text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-primary fw-bold mb-1">{analytics.recent_signups}</h3>
                                <p className="text-white-50 mb-0 small">Recent Signups (7d)</p>
                              </div>
                            </Col>
                            <Col md={4}>
                              <div 
                                className="text-center p-4 rounded-3"
                                style={{ 
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                <i className="fas fa-dollar-sign text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-success fw-bold mb-1">${analytics.revenue_this_month}</h3>
                                <p className="text-white-50 mb-0 small">Revenue This Month</p>
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
              )}

              {activeView === 'coupons' && (
                <Row className="g-4">
                  <Col md={6}>
                    <Card 
                      className="border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Header 
                        className="border-0 pb-0"
                        style={{ background: 'transparent' }}
                      >
                        <h5 className="text-white mb-0 fw-bold d-flex align-items-center">
                          <i className="fas fa-plus-circle text-success me-2"></i>
                          Generate Solo Plan Trial Coupon
                        </h5>
                        <p className="text-white-50 mb-0 small">Coupons only work for Solo plan trials</p>
                      </Card.Header>
                      <Card.Body>
                        <Form>
                          <Form.Group className="mb-3">
                            <Form.Label className="text-white fw-medium">Free Trial Duration (Solo Plan Only)</Form.Label>
                            <Form.Select
                              value={newCoupon.free_trial_months}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, free_trial_months: parseInt(e.target.value) }))}
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                border: '1px solid rgba(255, 255, 255, 0.2)', 
                                color: '#fff',
                                borderRadius: '8px'
                              }}
                            >
                              <option value={1}>1 Month Free Trial</option>
                              <option value={2}>2 Months Free Trial</option>
                              <option value={3}>3 Months Free Trial</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label className="text-white fw-medium">Max Uses</Form.Label>
                            <Form.Control
                              type="number"
                              value={newCoupon.max_uses}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, max_uses: parseInt(e.target.value) }))}
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                border: '1px solid rgba(255, 255, 255, 0.2)', 
                                color: '#fff',
                                borderRadius: '8px'
                              }}
                            />
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label className="text-white fw-medium">Expires in Days</Form.Label>
                            <Form.Control
                              type="number"
                              value={newCoupon.expires_days}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, expires_days: parseInt(e.target.value) }))}
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                border: '1px solid rgba(255, 255, 255, 0.2)', 
                                color: '#fff',
                                borderRadius: '8px'
                              }}
                            />
                          </Form.Group>

                          <Button 
                            onClick={generateCoupon} 
                            className="w-100 fw-medium py-3"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '1.1rem'
                            }}
                          >
                            <i className="fas fa-magic me-2"></i>
                            Generate Coupon Code
                          </Button>
                        </Form>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card 
                      className="border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Header 
                        className="border-0 pb-0"
                        style={{ background: 'transparent' }}
                      >
                        <h5 className="text-white mb-0 fw-bold d-flex align-items-center">
                          <i className="fas fa-list text-success me-2"></i>
                          Generated Coupons
                        </h5>
                      </Card.Header>
                      <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <Table 
                          className="table-dark"
                          style={{ 
                            '--bs-table-bg': 'transparent',
                            '--bs-table-striped-bg': 'rgba(255, 255, 255, 0.05)'
                          } as React.CSSProperties}
                        >
                          <thead>
                            <tr>
                              <th className="text-white fw-medium border-0">Code</th>
                              <th className="text-white fw-medium border-0">Plan</th>
                              <th className="text-white fw-medium border-0">Trial Duration</th>
                              <th className="text-white fw-medium border-0">Used</th>
                              <th className="text-white fw-medium border-0">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {coupons.map(coupon => (
                              <tr key={coupon.id}>
                                <td className="border-0">
                                  <code 
                                    className="text-success fw-bold px-2 py-1 rounded"
                                    style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                                  >
                                    {coupon.code}
                                  </code>
                                </td>
                                <td className="border-0">
                                  <Badge 
                                    className="fw-medium px-2 py-1"
                                    style={{
                                      background: 'rgba(59, 130, 246, 0.2)',
                                      color: '#3b82f6',
                                      border: '1px solid #3b82f6',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Solo Only
                                  </Badge>
                                </td>
                                <td className="border-0 text-white fw-medium">
                                  {coupon.free_trial_months} month{coupon.free_trial_months > 1 ? 's' : ''} free
                                </td>
                                <td className="border-0 text-white">{coupon.used_count}/{coupon.max_uses}</td>
                                <td className="border-0">
                                  <Badge 
                                    className="fw-medium px-3 py-2"
                                    style={{
                                      background: coupon.is_active 
                                        ? 'rgba(16, 185, 129, 0.2)' 
                                        : 'rgba(239, 68, 68, 0.2)',
                                      color: coupon.is_active ? '#10b981' : '#ef4444',
                                      border: `1px solid ${coupon.is_active ? '#10b981' : '#ef4444'}`
                                    }}
                                  >
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
              )}

              {activeView === 'businesses' && (
                <Row>
                  <Col md={12}>
                    <Card 
                      className="border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Header 
                        className="border-0 pb-0"
                        style={{ background: 'transparent' }}
                      >
                        <h5 className="text-white mb-0 fw-bold d-flex align-items-center">
                          <i className="fas fa-building text-success me-2"></i>
                          All Businesses ({businesses.length})
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <Table 
                          className="table-dark"
                          style={{ 
                            '--bs-table-bg': 'transparent',
                            '--bs-table-striped-bg': 'rgba(255, 255, 255, 0.05)'
                          } as React.CSSProperties}
                        >
                          <thead>
                            <tr>
                              <th className="text-white fw-medium border-0">Business</th>
                              <th className="text-white fw-medium border-0">Owner</th>
                              <th className="text-white fw-medium border-0">Status</th>
                              <th className="text-white fw-medium border-0">Stats</th>
                              <th className="text-white fw-medium border-0">Created</th>
                              <th className="text-white fw-medium border-0">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {businesses.map(business => (
                              <tr key={business.id}>
                                <td className="border-0">
                                  <div>
                                    <div className="text-white fw-medium">{business.name}</div>
                                    <small className="text-white-50">/{business.slug}</small>
                                  </div>
                                </td>
                                <td className="border-0">
                                  <div>
                                    <div className="text-white">{business.profiles?.full_name}</div>
                                    <small className="text-white-50">{business.profiles?.phone}</small>
                                  </div>
                                </td>
                                <td className="border-0">
                                  <Badge 
                                    className="fw-medium px-3 py-2"
                                    style={{
                                      background: business.subscription_status === 'active' 
                                        ? 'rgba(16, 185, 129, 0.2)' 
                                        : business.subscription_status === 'trial'
                                        ? 'rgba(245, 158, 11, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)',
                                      color: business.subscription_status === 'active' 
                                        ? '#10b981' 
                                        : business.subscription_status === 'trial'
                                        ? '#f59e0b'
                                        : '#ef4444',
                                      border: `1px solid ${business.subscription_status === 'active' 
                                        ? '#10b981' 
                                        : business.subscription_status === 'trial'
                                        ? '#f59e0b'
                                        : '#ef4444'}`
                                    }}
                                  >
                                    {business.subscription_status}
                                  </Badge>
                                </td>
                                <td className="border-0">
                                  <small className="text-white-50">
                                    {business.appointments?.[0]?.count || 0} appointments<br/>
                                    {business.services?.[0]?.count || 0} services
                                  </small>
                                </td>
                                <td className="border-0 text-white-50">
                                  {new Date(business.created_at).toLocaleDateString()}
                                </td>
                                <td className="border-0">
                                  <div className="d-flex gap-2">
                                    {business.subscription_status === 'active' ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline-warning"
                                        onClick={() => handleBusinessAction('suspend', business.id)}
                                        disabled={loadingData}
                                        style={{ fontSize: '0.75rem' }}
                                      >
                                        Suspend
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline-success"
                                        onClick={() => handleBusinessAction('activate', business.id)}
                                        disabled={loadingData}
                                        style={{ fontSize: '0.75rem' }}
                                      >
                                        Activate
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {activeView === 'users' && (
                <Row>
                  <Col md={12}>
                    <Card 
                      className="border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Header 
                        className="border-0 pb-0"
                        style={{ background: 'transparent' }}
                      >
                        <h5 className="text-white mb-0 fw-bold d-flex align-items-center">
                          <i className="fas fa-users text-success me-2"></i>
                          All Users ({users.length})
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <Table 
                          className="table-dark"
                          style={{ 
                            '--bs-table-bg': 'transparent',
                            '--bs-table-striped-bg': 'rgba(255, 255, 255, 0.05)'
                          } as React.CSSProperties}
                        >
                          <thead>
                            <tr>
                              <th className="text-white fw-medium border-0">User</th>
                              <th className="text-white fw-medium border-0">Email</th>
                              <th className="text-white fw-medium border-0">Business</th>
                              <th className="text-white fw-medium border-0">Joined</th>
                              <th className="text-white fw-medium border-0">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map(user => (
                              <tr key={user.id}>
                                <td className="border-0">
                                  <div>
                                    <div className="text-white fw-medium">{user.full_name}</div>
                                    <small className="text-white-50">{user.phone}</small>
                                  </div>
                                </td>
                                <td className="border-0 text-white">{user.email}</td>
                                <td className="border-0">
                                  {user.businesses?.length > 0 ? (
                                    <div>
                                      <div className="text-white">{user.businesses[0].name}</div>
                                      <Badge 
                                        className="fw-medium px-2 py-1"
                                        style={{
                                          background: 'rgba(16, 185, 129, 0.2)',
                                          color: '#10b981',
                                          border: '1px solid #10b981',
                                          fontSize: '0.7rem'
                                        }}
                                      >
                                        Owner
                                      </Badge>
                                    </div>
                                  ) : (
                                    <small className="text-white-50">No business</small>
                                  )}
                                </td>
                                <td className="border-0 text-white-50">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="border-0">
                                  <div className="d-flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline-warning"
                                      onClick={() => handleUserAction('ban', user.id)}
                                      disabled={loadingData}
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      Ban
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline-danger"
                                      onClick={() => handleUserAction('delete', user.id)}
                                      disabled={loadingData}
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {activeView === 'appointments' && (
                <Row>
                  <Col md={12}>
                    <Card 
                      className="border-0 shadow-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Header 
                        className="border-0 pb-0"
                        style={{ background: 'transparent' }}
                      >
                        <h5 className="text-white mb-0 fw-bold d-flex align-items-center">
                          <i className="fas fa-calendar text-success me-2"></i>
                          Recent Appointments ({appointments.length})
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <Table 
                          className="table-dark"
                          style={{ 
                            '--bs-table-bg': 'transparent',
                            '--bs-table-striped-bg': 'rgba(255, 255, 255, 0.05)'
                          } as React.CSSProperties}
                        >
                          <thead>
                            <tr>
                              <th className="text-white fw-medium border-0">Customer</th>
                              <th className="text-white fw-medium border-0">Business</th>
                              <th className="text-white fw-medium border-0">Service</th>
                              <th className="text-white fw-medium border-0">Date</th>
                              <th className="text-white fw-medium border-0">Status</th>
                              <th className="text-white fw-medium border-0">Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map(appointment => (
                              <tr key={appointment.id}>
                                <td className="border-0">
                                  <div>
                                    <div className="text-white fw-medium">{appointment.customer_name}</div>
                                    <small className="text-white-50">{appointment.customer_phone}</small>
                                  </div>
                                </td>
                                <td className="border-0 text-white">{appointment.businesses?.name}</td>
                                <td className="border-0">
                                  <div>
                                    <div className="text-white">{appointment.services?.name}</div>
                                    <small className="text-white-50">
                                      ${(appointment.services?.price_cents / 100).toFixed(2)}
                                    </small>
                                  </div>
                                </td>
                                <td className="border-0 text-white-50">
                                  {new Date(appointment.starts_at).toLocaleDateString()}
                                </td>
                                <td className="border-0">
                                  <Badge 
                                    className="fw-medium px-3 py-2"
                                    style={{
                                      background: appointment.status === 'confirmed' 
                                        ? 'rgba(16, 185, 129, 0.2)' 
                                        : appointment.status === 'pending'
                                        ? 'rgba(245, 158, 11, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)',
                                      color: appointment.status === 'confirmed' 
                                        ? '#10b981' 
                                        : appointment.status === 'pending'
                                        ? '#f59e0b'
                                        : '#ef4444',
                                      border: `1px solid ${appointment.status === 'confirmed' 
                                        ? '#10b981' 
                                        : appointment.status === 'pending'
                                        ? '#f59e0b'
                                        : '#ef4444'}`
                                    }}
                                  >
                                    {appointment.status}
                                  </Badge>
                                </td>
                                <td className="border-0">
                                  {appointment.payments?.length > 0 ? (
                                    <Badge 
                                      className="fw-medium px-2 py-1"
                                      style={{
                                        background: appointment.payments[0].status === 'succeeded' 
                                          ? 'rgba(16, 185, 129, 0.2)' 
                                          : 'rgba(245, 158, 11, 0.2)',
                                        color: appointment.payments[0].status === 'succeeded' 
                                          ? '#10b981' 
                                          : '#f59e0b',
                                        border: `1px solid ${appointment.payments[0].status === 'succeeded' 
                                          ? '#10b981' 
                                          : '#f59e0b'}`,
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      ${(appointment.payments[0].amount_cents / 100).toFixed(2)} {appointment.payments[0].status}
                                    </Badge>
                                  ) : (
                                    <small className="text-white-50">No payment</small>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}