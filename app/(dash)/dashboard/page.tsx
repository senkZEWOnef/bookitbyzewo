'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Alert, Button, Badge, Table, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { createSupabaseClientClient } from '@/lib/supabase'
import { createWhatsAppLink } from '@/lib/whatsapp'

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
  const supabase = createSupabaseClientClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (businessError) {
        if (businessError.code === 'PGRST116') {
          // No business found, redirect to onboarding
          window.location.href = '/dashboard/onboarding'
          return
        }
        throw businessError
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
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
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

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card>
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
    </Container>
  )
}