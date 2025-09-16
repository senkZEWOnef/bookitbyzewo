'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Badge, Modal, Table, Form, Alert } from 'react-bootstrap'
import { format, startOfWeek, endOfWeek, addDays, parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { createSupabaseClient } from '@/lib/supabase'
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
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [businessId, setBusinessId] = useState<string>('')
  const [businessName, setBusiness] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [currentWeek])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get business
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

      if (!business) return

      setBusinessId(business.id)
      setBusiness(business.name)

      // Get week range
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

      // Get appointments for the week
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name),
          staff (display_name)
        `)
        .eq('business_id', business.id)
        .gte('starts_at', weekStart.toISOString())
        .lte('starts_at', weekEnd.toISOString())
        .order('starts_at')

      if (appointmentsError) throw appointmentsError

      const formattedAppointments = appointmentsData?.map((apt: any) => ({
        ...apt,
        service_name: apt.services.name,
        staff_name: apt.staff?.display_name
      })) || []

      setAppointments(formattedAppointments)

      // Get services and staff
      const [servicesResult, staffResult] = await Promise.all([
        supabase.from('services').select('*').eq('business_id', business.id),
        supabase.from('staff').select('*').eq('business_id', business.id)
      ])

      setServices(servicesResult.data || [])
      setStaff(staffResult.data || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentUpdate = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)

      if (error) throw error
      
      fetchData() // Refresh data
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
                  
                  return (
                    <div key={day.toISOString()} className="col border-end" style={{ minHeight: '300px' }}>
                      <div className={`p-2 border-bottom ${isToday ? 'bg-success text-white' : 'bg-light'}`}>
                        <div className="text-center">
                          <div className="fw-bold">{format(day, 'EEE')}</div>
                          <div className="small">{format(day, 'd')}</div>
                        </div>
                      </div>
                      <div className="p-2">
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