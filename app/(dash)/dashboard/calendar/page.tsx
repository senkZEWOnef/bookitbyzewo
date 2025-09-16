'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Badge, Alert } from 'react-bootstrap'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  starts_at: string
  status: string
  service_name: string
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

        const formattedAppointments = appointmentData?.map(apt => ({
          id: apt.id,
          customer_name: apt.customer_name,
          customer_phone: apt.customer_phone,
          starts_at: apt.starts_at,
          status: apt.status,
          service_name: apt.services?.name || 'Unknown Service'
        })) || []

        setAppointments(formattedAppointments)
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

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Days of Week */}
              <div className="row mb-2">
                {(locale === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(day => (
                  <div key={day} className="col text-center fw-semibold text-muted small">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="row g-1">
                {monthDays.map(day => {
                  const dayAppointments = getAppointmentsForDay(day)
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentDay = isToday(day)
                  
                  return (
                    <div key={day.toString()} className="col p-1">
                      <div
                        className={`p-2 rounded-3 text-center position-relative cursor-pointer transition-all ${
                          isSelected ? 'bg-primary text-white' : 
                          isCurrentDay ? 'bg-success text-white' : 
                          'hover-bg-gray-50'
                        }`}
                        style={{
                          minHeight: '80px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setSelectedDate(day)}
                        onMouseEnter={(e) => {
                          if (!isSelected && !isCurrentDay) {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !isCurrentDay) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <div className="fw-semibold mb-1">
                          {format(day, 'd')}
                        </div>
                        {dayAppointments.length > 0 && (
                          <div>
                            <div 
                              className="rounded-pill mx-auto"
                              style={{
                                width: '20px',
                                height: '6px',
                                background: isSelected || isCurrentDay ? 'rgba(255,255,255,0.7)' : '#10b981'
                              }}
                            ></div>
                            <small className={`${isSelected || isCurrentDay ? 'text-white-75' : 'text-muted'}`}>
                              {dayAppointments.length}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
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
    </div>
  )
}