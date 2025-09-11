'use client'

import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Card, Alert, Button, Badge, Table, Spinner, Modal } from 'react-bootstrap'
import Link from 'next/link'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { createSupabaseClientClient } from '@/lib/supabase'
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

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createSupabaseClientClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (business) {
      generateDashboardQRCode()
    }
  }, [business])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found, redirecting to login')
        window.location.href = '/login'
        return
      }

      console.log('Current user ID:', user.id)

      // Ensure user profile exists first
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || ''
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile creation error in dashboard:', profileError)
      }

      // Get user's business
      console.log('Querying businesses table for user:', user.id)
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, slug, timezone, location, messaging_mode')
        .eq('owner_id', user.id)
        .maybeSingle()

      console.log('Business query result:', { businessData, businessError })

      if (businessError) {
        console.error('Business query error details:', {
          message: businessError.message,
          code: businessError.code,
          details: businessError.details,
          hint: businessError.hint
        })
        
        if (businessError.code === 'PGRST116' || businessError.message?.includes('JSON object requested')) {
          // No business found, redirect to onboarding
          console.log('No business found, redirecting to onboarding')
          window.location.href = '/dashboard/onboarding'
          return
        }
        
        throw new Error(`Business query failed: ${businessError.message}`)
      }

      // Handle case where no business is found
      if (!businessData) {
        console.log('No business data found, redirecting to onboarding')
        window.location.href = '/dashboard/onboarding'
        return
      }

      setBusiness(businessData)

      // Get dashboard stats
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [todayAppts, tomorrowAppts, pendingPayments, recentAppts] = await Promise.all([
        // Today's appointments
        supabase
          .from('appointments')
          .select('id')
          .eq('business_id', businessData.id)
          .gte('starts_at', `${today}T00:00:00`)
          .lt('starts_at', `${today}T23:59:59`)
          .in('status', ['confirmed', 'pending']),

        // Tomorrow's appointments  
        supabase
          .from('appointments')
          .select('id')
          .eq('business_id', businessData.id)
          .gte('starts_at', `${tomorrow}T00:00:00`)
          .lt('starts_at', `${tomorrow}T23:59:59`)
          .in('status', ['confirmed', 'pending']),

        // Pending payments
        supabase
          .from('appointments')
          .select('id')
          .eq('business_id', businessData.id)
          .eq('status', 'pending'),

        // Recent appointments
        supabase
          .from('appointments')
          .select(`
            id,
            customer_name,
            customer_phone,
            starts_at,
            status,
            services (name, deposit_cents)
          `)
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      setStats({
        todayAppointments: todayAppts.data?.length || 0,
        tomorrowAppointments: tomorrowAppts.data?.length || 0,
        pendingPayments: pendingPayments.data?.length || 0,
        totalRevenue: 0 // TODO: Calculate from payments
      })

      const formattedAppointments = recentAppts.data?.map(apt => ({
        id: apt.id,
        customer_name: apt.customer_name,
        customer_phone: apt.customer_phone,
        starts_at: apt.starts_at,
        status: apt.status,
        service_name: apt.services.name,
        deposit_amount: apt.services.deposit_cents
      })) || []

      setRecentAppointments(formattedAppointments)
      
    } catch (err) {
      console.error('Dashboard loading error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMessage)
    } finally {
      setLoading(false)
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
    
    const bookingUrl = `${window.location.origin}/book/${business.slug}`
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
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Dashboard</h1>
          <p className="text-muted">Welcome back to {business?.name}</p>
        </div>
        <div>
          <Button 
            variant="success" 
            as={Link} 
            href={`/book/${business?.slug}`}
            target="_blank"
            className="me-2"
          >
            <i className="fas fa-external-link-alt me-1"></i>
            View Booking Page
          </Button>
          <Button variant="outline-primary" as={Link} href="/calendar">
            <i className="fas fa-calendar me-1"></i>
            Calendar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="text-success mb-2">
                <i className="fas fa-calendar-day fa-2x"></i>
              </div>
              <h4 className="mb-1">{stats?.todayAppointments || 0}</h4>
              <small className="text-muted">Today's Appointments</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="text-primary mb-2">
                <i className="fas fa-calendar-plus fa-2x"></i>
              </div>
              <h4 className="mb-1">{stats?.tomorrowAppointments || 0}</h4>
              <small className="text-muted">Tomorrow's Appointments</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="text-warning mb-2">
                <i className="fas fa-clock fa-2x"></i>
              </div>
              <h4 className="mb-1">{stats?.pendingPayments || 0}</h4>
              <small className="text-muted">Pending Payments</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="text-info mb-2">
                <i className="fas fa-dollar-sign fa-2x"></i>
              </div>
              <h4 className="mb-1">${stats?.totalRevenue || 0}</h4>
              <small className="text-muted">This Month</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* QR Code Card */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-qrcode me-2"></i>
                Booking QR Code
              </h5>
            </Card.Header>
            <Card.Body className="text-center">
              <div className="mb-3">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Booking QR Code" 
                    style={{ 
                      maxWidth: '120px', 
                      height: 'auto'
                    }} 
                  />
                ) : (
                  <div 
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      backgroundColor: '#f8f9fa',
                      border: '2px dashed #dee2e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    <i className="fas fa-qrcode text-muted"></i>
                  </div>
                )}
              </div>
              <p className="text-muted small mb-3">
                Clients scan this to book appointments
              </p>
              {qrCodeUrl && (
                <small className="text-muted d-block mb-2">
                  {qrCodeUrl}
                </small>
              )}
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <Button size="sm" variant="outline-primary" onClick={generateQRCode}>
                  <i className="fas fa-expand-alt me-1"></i>
                  View Large
                </Button>
                <Button size="sm" variant="outline-success" onClick={downloadQRCode}>
                  <i className="fas fa-download me-1"></i>
                  Download
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Quick Actions */}
        <Col md={8}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-3 flex-wrap">
                <Button variant="outline-primary" as={Link} href="/services">
                  <i className="fas fa-plus me-1"></i>
                  Add Service
                </Button>
                <Button variant="outline-success" as={Link} href="/staff">
                  <i className="fas fa-user-plus me-1"></i>
                  Add Staff
                </Button>
                <Button variant="outline-info" as={Link} href="/settings">
                  <i className="fas fa-cog me-1"></i>
                  Settings
                </Button>
                <Button 
                  variant="outline-warning"
                  onClick={() => {
                    const text = `Check out my booking page: ${window.location.origin}/book/${business?.slug}`
                    navigator.clipboard.writeText(text)
                    alert('Booking link copied to clipboard!')
                  }}
                >
                  <i className="fas fa-share me-1"></i>
                  Share Booking Link
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Appointments */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Appointments</h5>
              <Button variant="link" as={Link} href="/calendar" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {recentAppointments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No appointments yet</p>
                  <Button variant="success" as={Link} href="/services">
                    Create Your First Service
                  </Button>
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>
                          <div className="fw-bold">{appointment.customer_name}</div>
                          <small className="text-muted">{appointment.customer_phone}</small>
                        </td>
                        <td>{appointment.service_name}</td>
                        <td>
                          <div>{getDateLabel(appointment.starts_at)}</div>
                          <small className="text-muted">
                            {format(parseISO(appointment.starts_at), 'h:mm a')}
                          </small>
                        </td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => sendWhatsAppMessage(appointment.customer_phone, appointment.customer_name)}
                            className="me-1"
                          >
                            <i className="fab fa-whatsapp"></i>
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            as={Link}
                            href={`/calendar?appointment=${appointment.id}`}
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
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
    </Container>
  )
}