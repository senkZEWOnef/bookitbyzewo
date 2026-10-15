'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TrialCodes from '@/components/admin/TrialCodes'
import AssistantChat from '@/components/AssistantChat'
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
  mrr: number
  active_starter: number
  active_pro: number
  past_due: number
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
  plan: string
  plan_status: string
  trial_ends_at: string | null
  banned_at: string | null
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const router = useRouter()

  useEffect(() => {
    verifyAdminAccess()
    try {
      if (localStorage.getItem('admin_theme') === 'light') setTheme('light')
    } catch {}
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem('admin_theme', next)
    } catch {}
  }

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
        setMessage({ type: 'success', content: `Business ${action === 'suspend' ? 'suspended' : 'activated'} successfully` })
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

  const handleUserAction = async (action: 'ban' | 'unban' | 'delete', userId: string) => {
    const warnings: Record<string, string> = {
      ban: 'Ban this user? They will lose access and their booking pages will go offline.',
      delete: 'PERMANENTLY delete this user and all their businesses, services and appointments? Their subscription will be cancelled. This cannot be undone.'
    }
    if (warnings[action] && !window.confirm(warnings[action])) return
    const done = { ban: 'banned', unban: 'unbanned', delete: 'deleted' }[action]
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
        setMessage({ type: 'success', content: `User ${done} successfully` })
        loadUsers()
      } else {
        const data = await response.json().catch(() => ({}))
        setMessage({ type: 'error', content: data.error || `Failed to ${action} user` })
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
      <div className="admin-modern" data-theme={theme}>
        <header className="adm-topbar">
          <div className="adm-topbar-inner">
            <div className="adm-brand">
              <span className="adm-brand-mark"><i className="fas fa-calendar-check"></i></span>
              <span>BookIt <small>Admin</small></span>
            </div>
            <div className="d-flex gap-2">
              <button
                className="adm-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button className="adm-btn" onClick={() => window.open('/', '_blank')}>
                <i className="fas fa-external-link-alt me-2"></i>
                <span className="adm-btn-label">View website</span>
              </button>
              <button className="adm-btn" onClick={logout}>
                <i className="fas fa-sign-out-alt me-2"></i>
                <span className="adm-btn-label">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="adm-shell">
          <nav className="adm-sidebar">
            {[
              { key: 'analytics', icon: 'fas fa-chart-line', label: 'Analytics' },
              { key: 'coupons', icon: 'fas fa-ticket-alt', label: 'Trial Codes' },
              { key: 'businesses', icon: 'fas fa-building', label: 'Businesses' },
              { key: 'users', icon: 'fas fa-users', label: 'Users' },
              { key: 'appointments', icon: 'fas fa-calendar', label: 'Appointments' }
            ].map(item => (
              <button
                key={item.key}
                className={`adm-nav-item ${activeView === item.key ? 'active' : ''}`}
                onClick={() => setActiveView(item.key)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <main style={{ minWidth: 0 }}>
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
                                <p className="text-white-50 mb-0 small">Booking Deposits This Month</p>
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
                                <i className="fas fa-sync-alt text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-success fw-bold mb-1">${analytics.mrr.toFixed(2)}</h3>
                                <p className="text-white-50 mb-0 small">Monthly Recurring Revenue</p>
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
                                <i className="fas fa-layer-group text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-success fw-bold mb-1">{analytics.active_starter} / {analytics.active_pro}</h3>
                                <p className="text-white-50 mb-0 small">Paying: Starter / Pro</p>
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
                                <i className="fas fa-exclamation-circle text-success mb-2" style={{ fontSize: '1.5rem' }}></i>
                                <h3 className="text-success fw-bold mb-1">{analytics.past_due}</h3>
                                <p className="text-white-50 mb-0 small">Payment Past Due</p>
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

              {activeView === 'coupons' && <TrialCodes />}

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
                              <th className="text-white fw-medium border-0">Plan</th>
                              <th className="text-white fw-medium border-0">Status</th>
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
                                <td className="border-0 text-white">
                                  {user.plan === 'pro' || user.plan === 'team' ? 'Pro' : 'Starter'}
                                </td>
                                <td className="border-0">
                                  <Badge
                                    bg={
                                      user.plan_status === 'active' ? 'success'
                                        : user.plan_status === 'trial' ? 'info'
                                        : user.plan_status === 'past_due' ? 'warning'
                                        : 'secondary'
                                    }
                                  >
                                    {user.plan_status === 'trial' && user.trial_ends_at
                                      ? `Trial until ${new Date(user.trial_ends_at).toLocaleDateString()}`
                                      : user.plan_status}
                                  </Badge>
                                  {user.banned_at && <Badge bg="danger" className="ms-1">Banned</Badge>}
                                </td>
                                <td className="border-0 text-white-50">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="border-0">
                                  <div className="d-flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant={user.banned_at ? 'outline-success' : 'outline-warning'}
                                      onClick={() => handleUserAction(user.banned_at ? 'unban' : 'ban', user.id)}
                                      disabled={loadingData}
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      {user.banned_at ? 'Unban' : 'Ban'}
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
          </main>
        </div>

        <AssistantChat
          endpoint="/api/admin/assistant"
          confirmEndpoint="/api/admin/assistant/confirm"
          getToken={() => localStorage.getItem('admin_token')}
          title="Admin Agent"
          subtitle="Tell me what to do on the platform"
          theme={theme}
          suggestions={[
            'How many users are on trial right now?',
            'Create a 3 month full-features trial code for Carlos',
            'Show businesses with no appointments'
          ]}
        />
      </div>
    </>
  )
}