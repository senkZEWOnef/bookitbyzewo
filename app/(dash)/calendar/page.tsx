'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Badge, Modal, Table, Form, Alert } from 'react-bootstrap'
import { format, startOfWeek, endOfWeek, addDays, parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { Appointment, Service, Staff } from '@/types/database'
import WhatsAppBadge from '@/components/WhatsAppBadge'

interface CalendarAppointment extends Appointment {
  service_name: string
  staff_name?: string
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availability, setAvailability] = useState<any>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [businessId, setBusinessId] = useState<string>('')
  const [businessName, setBusiness] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [currentWeek])

  const fetchAppointments = async (businessId: string) => {
    try {
      const startOfWeekDate = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
      const endOfWeekDate = endOfWeek(currentWeek, { weekStartsOn: 1 })
      
      const response = await fetch(
        `/api/businesses/${businessId}/appointments?start=${startOfWeekDate.toISOString()}&end=${endOfWeekDate.toISOString()}`
      )
      
      if (response.ok) {
        const result = await response.json()
        setAppointments(result.appointments || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const fetchServices = async (businessId: string) => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/services`)
      
      if (response.ok) {
        const result = await response.json()
        setServices(result.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchStaff = async (businessId: string) => {
    try {
      // For now, set empty staff array as staff system might not be fully implemented
      setStaff([])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchAvailability = async (businessId: string) => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/availability`)
      
      if (response.ok) {
        const result = await response.json()
        setAvailability(result.availability || null)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  const fetchData = async () => {
    try {
      // Get user from localStorage
      const userString = localStorage.getItem('user')
      if (!userString) {
        window.location.href = '/login'
        return
      }
      
      const user = JSON.parse(userString)

      // Get business using Neon API
      const response = await fetch('/api/debug/businesses')
      const result = await response.json()
      
      if (!response.ok || !result.businesses || result.businesses.length === 0) {
        return
      }

      const business = result.businesses.find((b: any) => b.owner_id === user.id)

      if (!business) return

      setBusinessId(business.id)
      setBusiness(business.name)

      // Fetch real data from APIs
      await Promise.all([
        fetchAppointments(business.id),
        fetchServices(business.id),
        fetchStaff(business.id),
        fetchAvailability(business.id)
      ])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentUpdate = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      // TODO: Implement appointment update API endpoint
      // For now, skip the update
      setShowAppointmentModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
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
      case 'noshow':
        return <Badge bg="dark">No Show</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.starts_at), date)
    )
  }

  const isDateAvailable = (date: Date) => {
    if (!availability) return true // Default to available if no rules set
    
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dateString = format(date, 'yyyy-MM-dd')
    
    // Check for exceptions first
    const exception = availability.exceptions?.find((ex: any) => ex.date === dateString)
    if (exception) {
      return !exception.is_closed // If exception exists, return opposite of is_closed
    }
    
    // Check weekly availability rules
    const rule = availability.rules?.find((rule: any) => rule.weekday === dayOfWeek)
    return rule && rule.start_time && rule.end_time // Available if rule exists with times
  }

  const getAvailabilityHours = (date: Date) => {
    if (!availability) return null
    
    const dayOfWeek = date.getDay()
    const dateString = format(date, 'yyyy-MM-dd')
    
    // Check for exceptions first
    const exception = availability.exceptions?.find((ex: any) => ex.date === dateString)
    if (exception) {
      if (exception.is_closed) return null
      return { start: exception.start_time, end: exception.end_time }
    }
    
    // Check weekly availability rules
    const rule = availability.rules?.find((rule: any) => rule.weekday === dayOfWeek)
    if (rule && rule.start_time && rule.end_time) {
      return { start: rule.start_time, end: rule.end_time }
    }
    
    return null
  }

  const getTodayAppointments = () => {
    const today = new Date()
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.starts_at), today)
    )
  }

  const getUpcomingAppointments = () => {
    const now = new Date()
    return appointments
      .filter(apt => parseISO(apt.starts_at) > now)
      .slice(0, 5)
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Loading calendar...</p>
        </div>
      </Container>
    )
  }

  const weekDays = getWeekDays()
  const todayAppointments = getTodayAppointments()
  const upcomingAppointments = getUpcomingAppointments()

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Calendar</h1>
          <p className="text-muted">Manage your appointments and schedule</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            ← Previous Week
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            Next Week →
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={8}>
          {/* Week View */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                Week of {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="row g-0">
                {weekDays.map(day => {
                  const dayAppointments = getAppointmentsForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isAvailable = isDateAvailable(day)
                  const availabilityHours = getAvailabilityHours(day)
                  
                  return (
                    <div key={day.toISOString()} className="col border-end" style={{ minHeight: '300px' }}>
                      <div className={`p-2 border-bottom ${isToday ? 'bg-success text-white' : 'bg-light'}`}>
                        <div className="text-center">
                          <div className="fw-bold">{format(day, 'EEE')}</div>
                          <div className="small">{format(day, 'd')}</div>
                          {availabilityHours ? (
                            <div className="text-xs text-muted mt-1">
                              {availabilityHours.start} - {availabilityHours.end}
                            </div>
                          ) : (
                            <div className="text-xs text-muted mt-1">
                              {isAvailable ? 'Available' : 'Closed'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`p-2 ${!isAvailable ? 'bg-light opacity-50' : ''}`}>
                        {dayAppointments.map(appointment => (
                          <div 
                            key={appointment.id}
                            className="small mb-2 p-2 border rounded cursor-pointer"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowAppointmentModal(true)
                            }}
                          >
                            <div className="fw-bold">
                              {format(parseISO(appointment.starts_at), 'h:mm a')}
                            </div>
                            <div className="text-truncate">{appointment.customer_name}</div>
                            <div className="text-muted small">{appointment.service_name}</div>
                            <div className="mt-1">
                              {getStatusBadge(appointment.status)}
                            </div>
                          </div>
                        ))}
                        
                        {!isAvailable && (
                          <div className="text-center text-muted py-3">
                            <i className="fas fa-times-circle mb-2"></i>
                            <div className="small">Closed</div>
                          </div>
                        )}
                        
                        {isAvailable && dayAppointments.length === 0 && (
                          <div className="text-center text-muted py-3">
                            <i className="fas fa-calendar-plus mb-2"></i>
                            <div className="small">No appointments</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Today's Appointments */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Today's Appointments ({todayAppointments.length})</h6>
            </Card.Header>
            <Card.Body>
              {todayAppointments.length === 0 ? (
                <p className="text-muted mb-0">No appointments today</p>
              ) : (
                todayAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="border-bottom pb-2 mb-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedAppointment(appointment)
                      setShowAppointmentModal(true)
                    }}
                  >
                    <div className="d-flex justify-content-between">
                      <strong>{format(parseISO(appointment.starts_at), 'h:mm a')}</strong>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div>{appointment.customer_name}</div>
                    <div className="text-muted small">{appointment.service_name}</div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">Upcoming Appointments</h6>
            </Card.Header>
            <Card.Body>
              {upcomingAppointments.length === 0 ? (
                <p className="text-muted mb-0">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="border-bottom pb-2 mb-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedAppointment(appointment)
                      setShowAppointmentModal(true)
                    }}
                  >
                    <div className="d-flex justify-content-between">
                      <strong>{format(parseISO(appointment.starts_at), 'MMM d, h:mm a')}</strong>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div>{appointment.customer_name}</div>
                    <div className="text-muted small">{appointment.service_name}</div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Appointment Details Modal */}
      <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Appointment Details</Modal.Title>
        </Modal.Header>
        {selectedAppointment && (
          <Modal.Body>
            <Row className="mb-3">
              <Col sm={4} className="text-muted">Customer:</Col>
              <Col sm={8}>
                <strong>{selectedAppointment.customer_name}</strong>
                <br />
                <small>{selectedAppointment.customer_phone}</small>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col sm={4} className="text-muted">Service:</Col>
              <Col sm={8}><strong>{selectedAppointment.service_name}</strong></Col>
            </Row>

            <Row className="mb-3">
              <Col sm={4} className="text-muted">Date & Time:</Col>
              <Col sm={8}>
                <strong>
                  {format(parseISO(selectedAppointment.starts_at), 'EEEE, MMMM d, yyyy')}
                  <br />
                  {format(parseISO(selectedAppointment.starts_at), 'h:mm a')} - {format(parseISO(selectedAppointment.ends_at), 'h:mm a')}
                </strong>
              </Col>
            </Row>

            {selectedAppointment.staff_name && (
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Staff:</Col>
                <Col sm={8}><strong>{selectedAppointment.staff_name}</strong></Col>
              </Row>
            )}

            <Row className="mb-3">
              <Col sm={4} className="text-muted">Status:</Col>
              <Col sm={8}>{getStatusBadge(selectedAppointment.status)}</Col>
            </Row>

            {selectedAppointment.notes && (
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Notes:</Col>
                <Col sm={8}>{selectedAppointment.notes}</Col>
              </Row>
            )}

            <div className="d-flex gap-2 flex-wrap">
              <WhatsAppBadge
                phone={selectedAppointment.customer_phone}
                customerName={selectedAppointment.customer_name}
                businessName={businessName}
                size="lg"
              />

              {selectedAppointment.status === 'confirmed' && (
                <>
                  <Button 
                    variant="info" 
                    onClick={() => handleAppointmentUpdate(selectedAppointment.id, { status: 'completed' })}
                  >
                    Mark Complete
                  </Button>
                  <Button 
                    variant="warning" 
                    onClick={() => handleAppointmentUpdate(selectedAppointment.id, { status: 'noshow' })}
                  >
                    Mark No Show
                  </Button>
                </>
              )}

              {selectedAppointment.status === 'pending' && (
                <Button 
                  variant="success" 
                  onClick={() => handleAppointmentUpdate(selectedAppointment.id, { status: 'confirmed' })}
                >
                  Confirm
                </Button>
              )}

              {selectedAppointment.status !== 'canceled' && selectedAppointment.status !== 'completed' && (
                <Button 
                  variant="outline-danger" 
                  onClick={() => {
                    if (confirm('Cancel this appointment?')) {
                      handleAppointmentUpdate(selectedAppointment.id, { status: 'canceled' })
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Modal.Body>
        )}
      </Modal>
    </Container>
  )
}