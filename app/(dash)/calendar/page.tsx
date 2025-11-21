'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Nav, Tab, Alert, Spinner, Badge } from 'react-bootstrap'
import MonthlyCalendar from '@/components/MonthlyCalendar'
import RecurringAppointments from '@/components/RecurringAppointments'

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

interface UpcomingAppointment {
  id: string
  customer_name: string
  customer_phone: string
  starts_at: string
  service_name: string
  staff_name?: string
  recurring_frequency?: string
}

export default function CalendarPage() {
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('weekly')

  useEffect(() => {
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    setLoading(true)
    setError('')
    
    try {
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
          
          // Fetch services
          const servicesResponse = await fetch(`/api/businesses/${userBusiness.id}/services`)
          if (servicesResponse.ok) {
            const servicesResult = await servicesResponse.json()
            setServices(servicesResult.services || [])
          }
          
          // Fetch staff
          const staffResponse = await fetch(`/api/businesses/${userBusiness.id}/staff`)
          if (staffResponse.ok) {
            const staffResult = await staffResponse.json()
            setStaff(staffResult.staff || [])
          }
          
          // Fetch upcoming appointments
          const appointmentsResponse = await fetch(`/api/calendar/generate-appointments?businessId=${userBusiness.id}&limit=10`)
          if (appointmentsResponse.ok) {
            const appointmentsResult = await appointmentsResponse.json()
            setUpcomingAppointments(appointmentsResult.appointments || [])
          }
        }
      }
    } catch (err) {
      console.error('Error fetching business data:', err)
      setError('Failed to load calendar data')
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
          <Spinner animation="border" />
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

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'weekly')}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="weekly">
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
          <Tab.Pane eventKey="weekly">
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
                    onClick={() => {
                      const appointmentsResponse = fetch(`/api/calendar/generate-appointments?businessId=${business.id}&limit=10`)
                      appointmentsResponse.then(res => res.json()).then(data => {
                        setUpcomingAppointments(data.appointments || [])
                      })
                    }}
                  >
                    <i className="fas fa-sync me-1"></i>
                    Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5>No Upcoming Appointments</h5>
                    <p className="text-muted">
                      Create recurring appointments or wait for customers to book.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => setActiveTab('recurring')}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Recurring Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="row">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="col-md-6 col-lg-4 mb-3">
                        <Card className="h-100 border-start border-primary border-3">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">{appointment.customer_name}</h6>
                              {appointment.recurring_frequency && (
                                <Badge bg="success" className="small">
                                  {appointment.recurring_frequency}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted small mb-1">
                              <i className="fas fa-phone me-1"></i>
                              {appointment.customer_phone}
                            </p>
                            <p className="text-muted small mb-1">
                              <i className="fas fa-cut me-1"></i>
                              {appointment.service_name}
                            </p>
                            {appointment.staff_name && (
                              <p className="text-muted small mb-1">
                                <i className="fas fa-user me-1"></i>
                                {appointment.staff_name}
                              </p>
                            )}
                            <p className="fw-bold mb-0">
                              <i className="fas fa-clock me-1"></i>
                              {new Date(appointment.starts_at).toLocaleDateString()} at{' '}
                              {new Date(appointment.starts_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </Card.Body>
                        </Card>
                      </div>
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