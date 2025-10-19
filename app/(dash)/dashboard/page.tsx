'use client'

import { useState, useEffect, useRef } from 'react'
import { Row, Col, Alert, Button, Badge, Spinner, Modal } from 'react-bootstrap'
import Link from 'next/link'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { createWhatsAppLink } from '@/lib/whatsapp'
import QRCode from 'qrcode'

interface Business {
  id: string
  name: string
  slug: string
}

interface DashboardStats {
  todayAppointments: number
  tomorrowAppointments: number
  pendingPayments: number
  totalRevenue: number
}

interface RecentAppointment {
  id: string
  customer_name: string
  customer_phone: string
  starts_at: string
  status: string
  service_name: string
  deposit_amount?: number
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function DashboardPage() {
  console.log('🚀 DASHBOARD COMPONENT: Rendering DashboardPage component')
  console.log('🚀 DASHBOARD COMPONENT: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    console.log('🚀 DASHBOARD COMPONENT: useEffect triggered, fetching real data')
    fetchDashboardData()

    // Listen for business switch events
    const handleBusinessSwitch = (event: CustomEvent) => {
      console.log('🔄 DASHBOARD: Business switched, refreshing data')
      // Reset loading state and fetch new data
      fetchingRef.current = false // Reset to allow new fetch
      setLoading(true)
      setError('')
      fetchDashboardData()
    }

    window.addEventListener('businessSwitched', handleBusinessSwitch as EventListener)
    return () => {
      window.removeEventListener('businessSwitched', handleBusinessSwitch as EventListener)
    }
  }, [])

  useEffect(() => {
    if (business) {
      generateDashboardQRCode()
    }
  }, [business])

  const fetchDashboardData = async () => {
    if (fetchingRef.current) {
      return
    }
    
    fetchingRef.current = true
    
    try {
      // Get user from localStorage
      const userString = localStorage.getItem('user')
      if (!userString) {
        window.location.href = '/login'
        return
      }
      
      const user = JSON.parse(userString)
      console.log('✅ DASHBOARD: User found:', user.id)

      // Check if there's a current business selected in localStorage
      const currentBusinessString = localStorage.getItem('currentBusiness')
      let targetBusiness = null

      if (currentBusinessString) {
        // Use the selected business
        targetBusiness = JSON.parse(currentBusinessString)
        console.log('✅ DASHBOARD: Using selected business:', targetBusiness.name)
        setBusiness(targetBusiness)
      } else {
        // Fetch user's businesses from API and use the first one
        const response = await fetch(`/api/user/businesses?userId=${user.id}`)
        const result = await response.json()
        
        if (response.ok && result.businesses && result.businesses.length > 0) {
          // Use the first business (preferring owned businesses)
          targetBusiness = result.businesses[0]
          setBusiness(targetBusiness)
          
          // Store it as the current business
          localStorage.setItem('currentBusiness', JSON.stringify(targetBusiness))
          console.log('✅ DASHBOARD: Using first available business:', targetBusiness.name)
        } else {
          console.log('❌ DASHBOARD: No businesses found for user')
          setError('No businesses found. Please create a business first.')
          return
        }
      }

      // Load stats and appointments for the selected business
      if (targetBusiness) {
        setStats({
          todayAppointments: 0,
          tomorrowAppointments: 0,
          pendingPayments: 0,
          totalRevenue: 0
        })
        setRecentAppointments([])
        console.log('✅ DASHBOARD: Dashboard data loaded for business:', targetBusiness.name)
      }
      
    } catch (err) {
      console.error('Dashboard loading error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMessage)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge bg="success">Confirmed</Badge>
      case 'pending':
        return <Badge bg="warning">Pending</Badge>
      case 'canceled':
        return <Badge bg="danger">Canceled</Badge>
      case 'completed':
        return <Badge bg="info">Completed</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const sendWhatsAppMessage = (phone: string, name: string) => {
    const message = `Hola ${name}! 👋 Este es un mensaje desde ${business?.name}. ¿En qué te puedo ayudar?`
    const link = createWhatsAppLink({ phone, message })
    window.open(link, '_blank')
  }

  const generateDashboardQRCode = async () => {
    if (!business) return
    
    const bookingUrl = `${window.location.origin}/page/${business.slug}`
    setQrCodeUrl(bookingUrl)
    
    try {
      // Generate high-res QR code data URL for download and display
      const dataUrl = await QRCode.toDataURL(bookingUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const generateQRCode = async () => {
    if (!business) return
    
    try {
      if (canvasRef.current && qrCodeUrl) {
        await QRCode.toCanvas(canvasRef.current, qrCodeUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      }
      setShowQRModal(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `${business?.name}-booking-qr.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="d-flex justify-content-center align-items-center min-vh-50">
          <div>
            <Spinner animation="border" variant="success" />
            <p className="mt-3 text-muted">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <Alert variant="danger" className="mb-0">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="position-relative">
        {/* Floating Background Elements */}
        <div 
          className="position-absolute"
          style={{ 
            top: '10%', 
            left: '10%', 
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            opacity: '0.05'
          }}
        ></div>
        <div 
          className="position-absolute"
          style={{ 
            top: '60%', 
            right: '15%', 
            width: '150px',
            height: '150px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: '50%',
            opacity: '0.05'
          }}
        ></div>
        
        <div className="text-center py-5">
          <div className="mb-5">
            <div 
              className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
              style={{ 
                width: '120px', 
                height: '120px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}
            >
              <i className="fas fa-store fs-1"></i>
            </div>
            <h1 className="display-6 fw-bold mb-3">Welcome to BookIt by Zewo!</h1>
            <p className="lead text-muted mb-5 mx-auto" style={{ maxWidth: '600px' }}>
              Transform your business with our WhatsApp booking system. Set up your profile and start accepting appointments in minutes.
            </p>
          </div>
          
          <Row className="justify-content-center">
            <Col lg={8}>
              <div 
                className="glass-card p-5 rounded-4"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Row className="align-items-center">
                  <Col md={7} className="text-start">
                    <h3 className="fw-bold mb-3">
                      <i className="fas fa-rocket text-success me-2"></i>
                      Set Up Your Business
                    </h3>
                    <p className="text-muted mb-4">
                      Create your business profile and configure services, staff, and availability. Your customers will be able to book appointments directly through WhatsApp.
                    </p>
                    <div className="d-flex flex-wrap gap-3 mb-4">
                      <div className="d-flex align-items-center text-success">
                        <i className="fas fa-check-circle me-2"></i>
                        <small className="fw-medium">WhatsApp Integration</small>
                      </div>
                      <div className="d-flex align-items-center text-success">
                        <i className="fas fa-check-circle me-2"></i>
                        <small className="fw-medium">Automated Reminders</small>
                      </div>
                      <div className="d-flex align-items-center text-success">
                        <i className="fas fa-check-circle me-2"></i>
                        <small className="fw-medium">Payment Processing</small>
                      </div>
                    </div>
                    <Link href="/dashboard/onboarding">
                      <Button 
                        variant="success" 
                        size="lg" 
                        className="px-5 py-3"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Create Your Business
                      </Button>
                    </Link>
                  </Col>
                  <Col md={5} className="text-center">
                    <div 
                      className="position-relative d-inline-block"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                        borderRadius: '24px',
                        padding: '2rem'
                      }}
                    >
                      <i className="fab fa-whatsapp" style={{ fontSize: '5rem', color: '#25D366' }}></i>
                      <div 
                        className="position-absolute top-0 end-0 bg-success rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '30px', height: '30px' }}
                      >
                        <i className="fas fa-plus text-white small"></i>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Action Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          {business && (
            <div 
              className="rounded-3 bg-gradient p-3 text-white d-flex align-items-center"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <i className="fas fa-store fs-4"></i>
            </div>
          )}
          <div>
            <h2 className="mb-0 fw-bold text-gray-900">
              {business ? business.name : 'Your Business Dashboard'}
            </h2>
            <p className="text-muted mb-0">
              {business ? 'Manage your WhatsApp bookings' : 'Set up your first business to get started'}
            </p>
          </div>
        </div>
        {business && (
          <div className="d-flex gap-2">
            <Link href={`/page/${business?.slug}`} target="_blank">
              <Button variant="success" className="px-3">
                <i className="fas fa-external-link-alt me-1"></i>
                View Booking Page
              </Button>
            </Link>
            <Link href="/dashboard/onboarding">
              <Button variant="outline-primary" className="px-3">
                <i className="fas fa-plus me-1"></i>
                New Business
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Modern Stats Grid */}
      <Row className="mb-5 g-4">
        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}
          >
            <div 
              className="position-absolute"
              style={{ 
                top: '-20px', 
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                opacity: '0.1'
              }}
            ></div>
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-calendar-day fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#059669' }}>
                {stats?.todayAppointments || 0}
              </h3>
              <p className="text-muted mb-0 fw-medium">Today's Appointments</p>
            </div>
          </div>
        </Col>
        
        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.1)'
            }}
          >
            <div 
              className="position-absolute"
              style={{ 
                top: '-20px', 
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                borderRadius: '50%',
                opacity: '0.1'
              }}
            ></div>
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-calendar-plus fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#4f46e5' }}>
                {stats?.tomorrowAppointments || 0}
              </h3>
              <p className="text-muted mb-0 fw-medium">Tomorrow's Appointments</p>
            </div>
          </div>
        </Col>
        
        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}
          >
            <div 
              className="position-absolute"
              style={{ 
                top: '-20px', 
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '50%',
                opacity: '0.1'
              }}
            ></div>
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-clock fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#d97706' }}>
                {stats?.pendingPayments || 0}
              </h3>
              <p className="text-muted mb-0 fw-medium">Pending Payments</p>
            </div>
          </div>
        </Col>
        
        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(190, 24, 93, 0.05) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.1)'
            }}
          >
            <div 
              className="position-absolute"
              style={{ 
                top: '-20px', 
                right: '-20px',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                borderRadius: '50%',
                opacity: '0.1'
              }}
            ></div>
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-dollar-sign fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#be185d' }}>
                ${stats?.totalRevenue || 0}
              </h3>
              <p className="text-muted mb-0 fw-medium">Monthly Revenue</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* QR Code & Quick Actions Row */}
      <Row className="mb-5 g-4">
        <Col lg={4}>
          <div className="glass-card p-4 rounded-4 h-100">
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-qrcode fs-5"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Booking QR Code</h5>
                <small className="text-muted">Share with clients</small>
              </div>
            </div>
            
            <div className="text-center mb-4">
              {qrCodeDataUrl ? (
                <div 
                  className="d-inline-block p-3 bg-white rounded-3 shadow-sm"
                  style={{ border: '2px dashed #e2e8f0' }}
                >
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Booking QR Code" 
                    style={{ width: '120px', height: '120px' }} 
                  />
                </div>
              ) : (
                <div 
                  className="d-inline-flex align-items-center justify-content-center bg-gray-100 rounded-3"
                  style={{ width: '140px', height: '140px', border: '2px dashed #cbd5e0' }}
                >
                  <i className="fas fa-qrcode fs-2 text-muted"></i>
                </div>
              )}
            </div>
            
            <div className="d-grid gap-2">
              <Button variant="outline-primary" size="sm" onClick={generateQRCode}>
                <i className="fas fa-expand-alt me-1"></i>
                View Large
              </Button>
              <Button variant="outline-success" size="sm" onClick={downloadQRCode}>
                <i className="fas fa-download me-1"></i>
                Download
              </Button>
            </div>
          </div>
        </Col>
        
        <Col lg={8}>
          <div className="glass-card p-4 rounded-4 h-100">
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-bolt fs-5"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Quick Actions</h5>
                <small className="text-muted">Manage your business</small>
              </div>
            </div>
            
            <Row className="g-3">
              <Col md={6}>
                <Link href="/dashboard/services" className="text-decoration-none">
                  <div 
                    className="p-3 rounded-3 border-0 w-100 text-start hover-lift"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-plus fs-4 text-success me-3"></i>
                      <div>
                        <div className="fw-semibold text-dark">Add Service</div>
                        <small className="text-muted">Create new offerings</small>
                      </div>
                    </div>
                  </div>
                </Link>
              </Col>
              
              <Col md={6}>
                <Link href="/dashboard/staff" className="text-decoration-none">
                  <div 
                    className="p-3 rounded-3 border-0 w-100 text-start hover-lift"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.1) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-user-plus fs-4 text-primary me-3"></i>
                      <div>
                        <div className="fw-semibold text-dark">Add Staff</div>
                        <small className="text-muted">Manage your team</small>
                      </div>
                    </div>
                  </div>
                </Link>
              </Col>
              
              <Col md={6}>
                <Link href="/dashboard/settings" className="text-decoration-none">
                  <div 
                    className="p-3 rounded-3 border-0 w-100 text-start hover-lift"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.1) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-cog fs-4 text-warning me-3"></i>
                      <div>
                        <div className="fw-semibold text-dark">Settings</div>
                        <small className="text-muted">Configure options</small>
                      </div>
                    </div>
                  </div>
                </Link>
              </Col>
              
              <Col md={6}>
                <div 
                  className="p-3 rounded-3 border-0 w-100 text-start hover-lift cursor-pointer"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(190, 24, 93, 0.1) 100%)',
                    border: '1px solid rgba(236, 72, 153, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const text = `Check out my booking page: ${window.location.origin}/page/${business?.slug}`
                    navigator.clipboard.writeText(text)
                    alert('Booking link copied to clipboard!')
                  }}
                >
                  <div className="d-flex align-items-center">
                    <i className="fas fa-share fs-4 me-3" style={{ color: '#be185d' }}></i>
                    <div>
                      <div className="fw-semibold text-dark">Share Link</div>
                      <small className="text-muted">Copy booking URL</small>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Recent Appointments */}
      <Row>
        <Col>
          <div className="glass-card p-0 rounded-4 overflow-hidden">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-calendar-alt fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Recent Appointments</h5>
                  <small className="text-muted">Latest booking activity</small>
                </div>
              </div>
              <Link href="/dashboard/calendar">
                <Button variant="outline-primary" size="sm">
                  <i className="fas fa-external-link-alt me-1"></i>
                  View All
                </Button>
              </Link>
            </div>
            
            {recentAppointments.length === 0 ? (
              <div className="text-center py-5">
                <div 
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)',
                    border: '2px dashed #d1d5db'
                  }}
                >
                  <i className="fas fa-calendar-plus fs-2 text-muted"></i>
                </div>
                <h6 className="fw-bold mb-2">No appointments yet</h6>
                <p className="text-muted mb-3">Create your first service to start accepting bookings</p>
                <Link href="/dashboard/services">
                  <Button variant="success" className="px-4">
                    <i className="fas fa-plus me-1"></i>
                    Create Your First Service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th className="border-0 fw-semibold text-gray-700 py-3">Customer</th>
                      <th className="border-0 fw-semibold text-gray-700 py-3">Service</th>
                      <th className="border-0 fw-semibold text-gray-700 py-3">Date & Time</th>
                      <th className="border-0 fw-semibold text-gray-700 py-3">Status</th>
                      <th className="border-0 fw-semibold text-gray-700 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map(appointment => (
                      <tr key={appointment.id} className="border-0">
                        <td className="py-3 border-0">
                          <div className="d-flex align-items-center">
                            <div 
                              className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '40px', 
                                height: '40px',
                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                color: '#64748b'
                              }}
                            >
                              <i className="fas fa-user"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">{appointment.customer_name}</div>
                              <small className="text-muted">{appointment.customer_phone}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 border-0">
                          <span className="fw-medium">{appointment.service_name}</span>
                        </td>
                        <td className="py-3 border-0">
                          <div className="fw-medium">{getDateLabel(appointment.starts_at)}</div>
                          <small className="text-muted">
                            {format(parseISO(appointment.starts_at), 'h:mm a')}
                          </small>
                        </td>
                        <td className="py-3 border-0">{getStatusBadge(appointment.status)}</td>
                        <td className="py-3 border-0">
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => sendWhatsAppMessage(appointment.customer_phone, appointment.customer_name)}
                              className="rounded-circle"
                              style={{ width: '32px', height: '32px', padding: '0' }}
                            >
                              <i className="fab fa-whatsapp"></i>
                            </Button>
                            <Link href={`/dashboard/calendar?appointment=${appointment.id}`}>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="rounded-circle"
                                style={{ width: '32px', height: '32px', padding: '0' }}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-qrcode me-2"></i>
            QR Code for Booking Page
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-3">
            <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
          </div>
          <p className="text-muted mb-3">
            Clients can scan this QR code to book appointments directly
          </p>
          <div className="mb-3">
            <strong>Booking URL:</strong><br />
            <small className="text-muted">{qrCodeUrl}</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              navigator.clipboard.writeText(qrCodeUrl)
              alert('Booking URL copied to clipboard!')
            }}
          >
            <i className="fas fa-copy me-1"></i>
            Copy URL
          </Button>
          <Button variant="primary" onClick={downloadQRCode}>
            <i className="fas fa-download me-1"></i>
            Download QR Code
          </Button>
          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}