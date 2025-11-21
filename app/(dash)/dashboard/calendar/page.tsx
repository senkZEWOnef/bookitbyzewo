'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Nav, Tab, Alert, Spinner, Badge } from 'react-bootstrap'
import MonthlyCalendar from '@/components/MonthlyCalendar'
import RecurringAppointments from '@/components/RecurringAppointments'

export const dynamic = 'force-dynamic'

interface Service {
  id: string
  name: string
  duration_min: number
  price_cents: number
}

interface Staff {
  id: string
  display_name: string
}

interface Business {
  id: string
  name: string
}

export default function CalendarPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('calendar')
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])

  useEffect(() => {
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    try {
      setLoading(true)
      setError('')

      // Get user from localStorage
      const userString = localStorage.getItem('user')
      if (!userString) {
        window.location.href = '/login'
        return
      }
      
      const user = JSON.parse(userString)
      
      // Fetch user's businesses
      const businessResponse = await fetch('/api/debug/businesses')
      const businessResult = await businessResponse.json()
      
      if (businessResponse.ok && businessResult.businesses && businessResult.businesses.length > 0) {
        const userBusiness = businessResult.businesses.find((b: any) => b.owner_id === user.id)
        
        if (userBusiness) {
          setBusiness(userBusiness)
          
          // Get business services and staff
          const [servicesResponse, staffResponse] = await Promise.all([
            fetch(`/api/businesses/${userBusiness.id}/services`),
            fetch(`/api/businesses/${userBusiness.id}/staff`)
          ])

          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json()
            setServices(servicesData.services || [])
          }

          if (staffResponse.ok) {
            const staffData = await staffResponse.json()
            setStaff(staffData.staff || [])
          }
        } else {
          throw new Error('No business found for user')
        }
      } else {
        throw new Error('Failed to fetch businesses')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateRecurringAppointments = async () => {
    if (!business) return
    
    try {
      const response = await fetch('/api/calendar/generate-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id })
      })
      
      if (response.ok) {
        // Refresh upcoming appointments
        const appointmentsResponse = await fetch(`/api/calendar/generate-appointments?businessId=${business.id}&limit=10`)
        if (appointmentsResponse.ok) {
          const appointmentsResult = await appointmentsResponse.json()
          setUpcomingAppointments(appointmentsResult.appointments || [])
        }
      }
    } catch (error) {
      console.error('Error generating appointments:', error)
    }
  }

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" />
          <p className="mt-3 text-muted">Loading calendar...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">
          <h4>Error Loading Calendar</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchBusinessData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    )
  }

  if (!business) {
    return (
      <Container fluid>
        <Alert variant="warning">
          <h4>No Business Found</h4>
          <p>You need to create a business first before managing your calendar.</p>
          <Button variant="primary" href="/dashboard/onboarding">
            Set Up Business
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="fas fa-calendar-alt me-2"></i>
            Calendar Management
          </h1>
          <p className="text-muted mb-0">
            Manage your availability, recurring appointments, and reminders
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-success" 
            onClick={generateRecurringAppointments}
            title="Generate upcoming recurring appointments"
          >
            <i className="fas fa-sync me-1"></i>
            Sync Recurring
          </Button>
        </div>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'calendar')}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="calendar">
              <i className="fas fa-calendar me-2"></i>
              Calendar
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="recurring">
              <i className="fas fa-repeat me-2"></i>
              Recurring Appointments
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="upcoming">
              <i className="fas fa-clock me-2"></i>
              Upcoming Appointments
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="calendar">
            <Row>
              <Col lg={12}>
                <Card>
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <i className="fas fa-calendar me-2"></i>
                        Calendar Management
                      </h5>
                      <div className="d-flex gap-2">
                        <div className="small text-muted">
                          <i className="fas fa-info-circle me-1"></i>
                          Click ✓/✗ to toggle day off, view appointments, and manage availability
                        </div>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <MonthlyCalendar 
                      businessId={business.id}
                      staffId={staff.length > 0 ? staff[0].id : undefined}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="recurring">
            <RecurringAppointments
              businessId={business.id}
              services={services}
              staff={staff}
            />
          </Tab.Pane>

          <Tab.Pane eventKey="upcoming">
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Upcoming Appointments (Next 30 Days)
                  </h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={generateRecurringAppointments}
                  >
                    <i className="fas fa-sync me-1"></i>
                    Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {upcomingAppointments.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <i className="fas fa-calendar-plus fa-2x mb-3 d-block"></i>
                    <h6>No Upcoming Appointments</h6>
                    <p className="mb-0 text-muted">
                      Your upcoming recurring appointments will appear here once generated.
                    </p>
                  </Alert>
                ) : (
                  <div>
                    {upcomingAppointments.map((appointment, index) => (
                      <Card key={appointment.id || index} className="mb-3 border-start border-4 border-success">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{appointment.service_name}</h6>
                              <p className="text-muted mb-1">
                                <i className="fas fa-user me-1"></i>
                                {appointment.customer_email}
                              </p>
                              <p className="text-muted mb-0">
                                <i className="fas fa-clock me-1"></i>
                                {new Date(appointment.starts_at).toLocaleDateString()} at{' '}
                                {new Date(appointment.starts_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge 
                              bg={appointment.recurring_frequency ? "info" : "success"}
                              className="ms-2"
                            >
                              {appointment.recurring_frequency ? 
                                `${appointment.recurring_frequency}ly` : 
                                'One-time'
                              }
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  )
}