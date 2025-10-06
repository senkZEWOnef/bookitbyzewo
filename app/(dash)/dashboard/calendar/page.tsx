'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Badge, Alert } from 'react-bootstrap'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'
import AvailabilityManager from '@/components/AvailabilityManager'

export const dynamic = 'force-dynamic'

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  starts_at: string
  status: string
  service_name: string
}

interface AvailabilityRule {
  id: string
  weekday: number
  start_time: string
  end_time: string
}

interface AvailabilityException {
  id: string
  date: string
  is_closed: boolean
  start_time?: string
  end_time?: string
  reason?: string
}

export default function CalendarPage() {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  const dateLocale = language === 'es' ? es : undefined
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [business, setBusiness] = useState<any>(null)
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([])
  const [availabilityExceptions, setAvailabilityExceptions] = useState<AvailabilityException[]>([])
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false)

  useEffect(() => {
    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      setBusiness(businessData)

      if (businessData) {
        // Get appointments for current month
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)

        const { data: appointmentData } = await supabase
          .from('appointments')
          .select(`
            id,
            customer_name,
            customer_phone,
            starts_at,
            status,
            services (name)
          `)
          .eq('business_id', businessData.id)
          .gte('starts_at', monthStart.toISOString())
          .lte('starts_at', monthEnd.toISOString())
          .order('starts_at', { ascending: true })

        const formattedAppointments = appointmentData?.map((apt: any) => ({
          id: apt.id,
          customer_name: apt.customer_name,
          customer_phone: apt.customer_phone,
          starts_at: apt.starts_at,
          status: apt.status,
          service_name: apt.services?.name || 'Unknown Service'
        })) || []

        setAppointments(formattedAppointments)

        // Get availability rules
        const { data: rulesData } = await supabase
          .from('availability_rules')
          .select('*')
          .eq('business_id', businessData.id)
          .is('staff_id', null)
          .order('weekday')

        setAvailabilityRules(rulesData || [])

        // Get availability exceptions for current month
        const { data: exceptionsData } = await supabase
          .from('availability_exceptions')
          .select('*')
          .eq('business_id', businessData.id)
          .is('staff_id', null)
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0])

        setAvailabilityExceptions(exceptionsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(parseISO(apt.starts_at), day))
  }

  const getDayAvailability = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd')
    
    // Check for exceptions first
    const exception = availabilityExceptions.find(ex => ex.date === dayString)
    if (exception) {
      return {
        isOpen: !exception.is_closed,
        hours: exception.is_closed ? null : {
          start: exception.start_time,
          end: exception.end_time
        },
        reason: exception.reason
      }
    }

    // Check regular weekly hours
    const dayOfWeek = getDay(day)
    const rule = availabilityRules.find(rule => rule.weekday === dayOfWeek)
    
    return {
      isOpen: !!rule,
      hours: rule ? {
        start: rule.start_time,
        end: rule.end_time
      } : null,
      reason: null
    }
  }

  const getAvailabilityIndicator = (day: Date) => {
    const availability = getDayAvailability(day)
    const dayAppointments = getAppointmentsForDay(day)
    
    if (!availability.isOpen) {
      return {
        color: '#dc3545', // red
        icon: 'fas fa-times-circle',
        text: locale === 'es' ? 'Cerrado' : 'Closed'
      }
    }

    if (availability.reason === 'vacation') {
      return {
        color: '#fd7e14', // orange
        icon: 'fas fa-umbrella-beach',
        text: locale === 'es' ? 'Vacaciones' : 'Vacation'
      }
    }

    if (availability.reason === 'sick') {
      return {
        color: '#dc3545', // red
        icon: 'fas fa-user-md',
        text: locale === 'es' ? 'Enfermedad' : 'Sick'
      }
    }

    if (availability.reason === 'holiday') {
      return {
        color: '#6f42c1', // purple
        icon: 'fas fa-star',
        text: locale === 'es' ? 'Feriado' : 'Holiday'
      }
    }

    // Open with appointments
    if (dayAppointments.length > 0) {
      return {
        color: '#198754', // green
        icon: 'fas fa-calendar-check',
        text: `${dayAppointments.length} ${locale === 'es' ? 'citas' : 'appointments'}`
      }
    }

    // Open, no appointments
    return {
      color: '#20c997', // teal
      icon: 'fas fa-calendar-plus',
      text: locale === 'es' ? 'Disponible' : 'Available'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLabels = {
      confirmed: locale === 'es' ? 'Confirmada' : 'Confirmed',
      pending: locale === 'es' ? 'Pendiente' : 'Pending',
      canceled: locale === 'es' ? 'Cancelada' : 'Canceled',
      completed: locale === 'es' ? 'Completada' : 'Completed',
      no_show: locale === 'es' ? 'No se presentó' : 'No Show'
    }
    
    switch (status) {
      case 'confirmed':
        return <Badge bg="success" className="me-1">{statusLabels.confirmed}</Badge>
      case 'pending':
        return <Badge bg="warning" className="me-1">{statusLabels.pending}</Badge>
      case 'canceled':
        return <Badge bg="danger" className="me-1">{statusLabels.canceled}</Badge>
      case 'completed':
        return <Badge bg="info" className="me-1">{statusLabels.completed}</Badge>
      case 'no_show':
        return <Badge bg="secondary" className="me-1">{statusLabels.no_show}</Badge>
      default:
        return <Badge bg="secondary" className="me-1">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-5">
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {locale === 'es' ? 'Por favor crea un negocio primero para ver tu calendario.' : 'Please create a business first to view your calendar.'}
        </Alert>
        <Link href="/dashboard/onboarding">
          <Button variant="success">
            {locale === 'es' ? 'Crear Negocio' : 'Create Business'}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-3 bg-gradient p-3 text-white d-flex align-items-center"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            <i className="fas fa-calendar-alt fs-4"></i>
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-gray-900">
              {locale === 'es' ? 'Calendario' : 'Calendar'}
            </h2>
            <p className="text-muted mb-0">
              {locale === 'es' ? 'Gestiona tus citas' : 'Manage your appointments'}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary"
            onClick={() => setShowAvailabilityManager(true)}
          >
            <i className="fas fa-clock me-1"></i>
            {locale === 'es' ? 'Horarios' : 'Hours'}
          </Button>
          <Button variant="outline-primary">
            <i className="fas fa-plus me-1"></i>
            {locale === 'es' ? 'Nueva Cita' : 'New Appointment'}
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* Calendar */}
        <Col lg={8}>
          <div className="glass-card p-4 rounded-4">
            {/* Calendar Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0">
                {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
              </h4>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  {locale === 'es' ? 'Hoy' : 'Today'}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="calendar-header mb-2">
              {(locale === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(day => (
                <div key={day} className="calendar-header-day">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {monthDays.map(day => {
                const dayAppointments = getAppointmentsForDay(day)
                const availability = getDayAvailability(day)
                const indicator = getAvailabilityIndicator(day)
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentDay = isToday(day)
                
                return (
                  <div
                    key={day.toString()}
                    className={`calendar-day ${
                      isSelected ? 'selected' : 
                      isCurrentDay ? 'today' : 
                      !availability.isOpen ? 'unavailable' : ''
                    }`}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      opacity: !availability.isOpen ? 0.6 : 1
                    }}
                  >
                    <div className="calendar-day-number">
                      {format(day, 'd')}
                    </div>
                    
                    {/* Availability/Appointment Indicator */}
                    <div className="calendar-appointments-indicator">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{ 
                          color: isSelected || isCurrentDay ? 'rgba(255,255,255,0.9)' : indicator.color,
                          fontSize: '0.7rem'
                        }}
                      >
                        <i className={`${indicator.icon} me-1`}></i>
                        {dayAppointments.length > 0 ? dayAppointments.length : ''}
                      </div>
                      {availability.hours && (
                        <small 
                          className="text-muted"
                          style={{ 
                            fontSize: '0.6rem',
                            color: isSelected || isCurrentDay ? 'rgba(255,255,255,0.7)' : undefined
                          }}
                        >
                          {availability.hours.start}-{availability.hours.end}
                        </small>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Col>

        {/* Selected Day Details */}
        <Col lg={4}>
          <div className="glass-card p-4 rounded-4">
            <h5 className="fw-bold mb-3">
              {format(selectedDate, 'EEEE, MMMM d', { locale: dateLocale })}
              {isToday(selectedDate) && (
                <Badge bg="success" className="ms-2">
                  {locale === 'es' ? 'Hoy' : 'Today'}
                </Badge>
              )}
            </h5>

            {/* Day Availability Info */}
            {(() => {
              const dayAvailability = getDayAvailability(selectedDate)
              const indicator = getAvailabilityIndicator(selectedDate)
              
              return (
                <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: `${indicator.color}15`, border: `1px solid ${indicator.color}30` }}>
                  <div className="d-flex align-items-center mb-2">
                    <i className={`${indicator.icon} me-2`} style={{ color: indicator.color }}></i>
                    <span className="fw-semibold" style={{ color: indicator.color }}>
                      {indicator.text}
                    </span>
                  </div>
                  {dayAvailability.hours && (
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {locale === 'es' ? 'Horario: ' : 'Hours: '}
                      {dayAvailability.hours.start} - {dayAvailability.hours.end}
                    </small>
                  )}
                </div>
              )
            })()}

            {getAppointmentsForDay(selectedDate).length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-calendar-plus fs-2 text-muted mb-3"></i>
                <p className="text-muted">
                  {locale === 'es' ? 'No hay citas programadas' : 'No appointments scheduled'}
                </p>
                <Button variant="outline-success" size="sm">
                  <i className="fas fa-plus me-1"></i>
                  {locale === 'es' ? 'Agregar Cita' : 'Add Appointment'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getAppointmentsForDay(selectedDate).map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="p-3 rounded-3 border"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.1)'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">{appointment.customer_name}</div>
                        <small className="text-muted">{appointment.customer_phone}</small>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="small text-muted mb-1">
                      <i className="fas fa-clock me-1"></i>
                      {format(parseISO(appointment.starts_at), 'h:mm a')}
                    </div>
                    <div className="small text-muted">
                      <i className="fas fa-cogs me-1"></i>
                      {appointment.service_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Availability Manager Modal */}
      {business && (
        <AvailabilityManager
          show={showAvailabilityManager}
          onHide={() => setShowAvailabilityManager(false)}
          businessId={business.id}
          onUpdate={fetchData}
        />
      )}
    </div>
  )
}