'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Badge, Spinner, Alert, Modal, Form, ListGroup } from 'react-bootstrap'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO 
} from 'date-fns'

interface TimeSlot {
  start_time: string
  end_time: string
  max_bookings: number
}

interface DayAvailability {
  id?: string
  date: string
  is_day_off: boolean
  custom_time_slots: TimeSlot[]
  notes?: string
}

interface Appointment {
  id: string
  starts_at: string
  customer_name: string
  service_name: string
  recurring_frequency?: string
}

interface MonthlyCalendarProps {
  businessId: string
  staffId?: string
  onDateSelect?: (date: string) => void
  readOnly?: boolean
  publicView?: boolean
}

export default function MonthlyCalendar({ 
  businessId, 
  staffId, 
  onDateSelect,
  readOnly = false,
  publicView = false 
}: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [viewType, setViewType] = useState<'week' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  useEffect(() => {
    fetchMonthData()
  }, [currentDate, businessId, staffId])

  const fetchMonthData = async () => {
    setLoading(true)
    try {
      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      // Fetch availability data  
      const availabilityResponse = await fetch(`/api/calendar/day-availability?businessId=${businessId}&startDate=${monthStart}&endDate=${monthEnd}${staffId ? `&staffId=${staffId}` : ''}`)
      
      // Fetch appointments data (only if not public view)
      const appointmentsResponse = !publicView ? 
        await fetch(`/api/businesses/${businessId}/appointments?startDate=${monthStart}&endDate=${monthEnd}`) :
        { ok: false }

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailability(Array.isArray(availabilityData.availability) ? availabilityData.availability : [])
      }

      if (appointmentsResponse.ok && !publicView) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(Array.isArray(appointmentsData.appointments) ? appointmentsData.appointments : [])
      }
    } catch (error) {
      console.error('Error fetching month data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDayAvailability = (date: Date): DayAvailability | null => {
    const dateString = format(date, 'yyyy-MM-dd')
    return Array.isArray(availability) ? availability.find(a => a.date === dateString) || null : null
  }

  const getDayAppointments = (date: Date): Appointment[] => {
    if (publicView) return []
    const dateString = format(date, 'yyyy-MM-dd')
    return Array.isArray(appointments) ? appointments.filter(apt => 
      format(parseISO(apt.starts_at), 'yyyy-MM-dd') === dateString
    ) : []
  }

  const toggleDayOff = async (date: Date) => {
    if (readOnly || publicView) return

    const dateString = format(date, 'yyyy-MM-dd')
    const currentAvailability = getDayAvailability(date)
    const newDayOffStatus = !currentAvailability?.is_day_off

    try {
      const response = await fetch('/api/calendar/day-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          staffId,
          date: dateString,
          isDayOff: newDayOffStatus,
          customTimeSlots: currentAvailability?.custom_time_slots || []
        })
      })

      if (response.ok) {
        // Refresh the data
        fetchMonthData()
      }
    } catch (error) {
      console.error('Error toggling day off:', error)
    }
  }

  const goToPrevious = () => {
    if (viewType === 'week') {
      setCurrentDate(addDays(currentDate, -7))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const goToNext = () => {
    if (viewType === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calculate date ranges based on view type
  let calendarStart: Date, calendarEnd: Date, calendarDays: Date[] = []
  
  if (viewType === 'week') {
    calendarStart = startOfWeek(currentDate)
    calendarEnd = endOfWeek(currentDate)
    
    // Generate week days
    let day = calendarStart
    while (day <= calendarEnd) {
      calendarDays.push(day)
      day = addDays(day, 1)
    }
  } else {
    // Monthly view
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    calendarStart = startOfWeek(monthStart)
    calendarEnd = endOfWeek(monthEnd)

    let day = calendarStart
    while (day <= calendarEnd) {
      calendarDays.push(day)
      day = addDays(day, 1)
    }
  }

  const renderDay = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isToday = isSameDay(date, new Date())
    const isPast = date < new Date() && !isToday
    const dayAvailability = getDayAvailability(date)
    const dayAppointments = getDayAppointments(date)

    // Background colors based on status
    let cellBg = '#ffffff'
    let cellBorder = '1px solid #e9ecef'
    let dayNumberColor = '#495057'

    if (!isCurrentMonth) {
      cellBg = '#f8f9fa'
      dayNumberColor = '#adb5bd'
    } else if (isToday) {
      cellBg = 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)'
      dayNumberColor = '#ffffff'
      cellBorder = '2px solid #0d6efd'
    } else if (dayAvailability?.is_day_off) {
      cellBg = 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)'
      dayNumberColor = '#ffffff'
      cellBorder = '2px solid #dc3545'
    } else if (dayAppointments.length > 0) {
      cellBg = 'linear-gradient(135deg, #198754 0%, #20c997 100%)'
      dayNumberColor = '#ffffff'
      cellBorder = '2px solid #198754'
    }

    return (
      <div
        key={date.toISOString()}
        style={{ 
          minHeight: viewType === 'week' ? '180px' : '120px',
          maxHeight: viewType === 'week' ? '200px' : '140px',
          cursor: (!readOnly && !publicView) ? 'pointer' : 'default',
          fontSize: '0.75rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: cellBg,
          border: cellBorder,
          transition: 'all 0.2s ease-in-out',
          opacity: isPast && !isToday ? 0.7 : 1,
          position: 'relative'
        }}
        className="calendar-day-cell"
        onMouseEnter={(e) => {
          if (!isPast && isCurrentMonth && !publicView) {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        onClick={() => {
          if (!readOnly && !publicView) {
            setSelectedDate(date)
            setShowDayModal(true)
          } else if (onDateSelect) {
            onDateSelect(format(date, 'yyyy-MM-dd'))
          }
        }}
      >
        <div className="p-2" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div 
            className="d-flex justify-content-between align-items-center mb-2"
            style={{ minHeight: '24px' }}
          >
            <span 
              className="fw-bold"
              style={{ 
                color: dayNumberColor,
                fontSize: '1rem',
                textShadow: isToday ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {format(date, 'd')}
            </span>
            
            {isCurrentMonth && (
              <div>
                {dayAvailability?.is_day_off ? (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      border: '2px solid #dc3545',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#dc3545'
                    }}
                    title="Day Off"
                  >
                    ✗
                  </div>
                ) : dayAppointments.length > 0 ? (
                  <Badge bg="success" style={{ fontSize: '9px' }}>
                    {dayAppointments.length}
                  </Badge>
                ) : (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#198754',
                      boxShadow: '0 0 0 2px rgba(25,135,84,0.2)'
                    }}
                    title="Available"
                  />
                )}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }} className="mb-2">
            {dayAvailability?.is_day_off ? (
              <div 
                className="text-center p-2 rounded"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px dashed #ffffff',
                  color: '#dc3545',
                  fontSize: '0.7rem',
                  fontWeight: '700'
                }}
              >
                🚫 {publicView ? 'CLOSED' : 'DAY OFF'}
              </div>
            ) : publicView ? (
              <div 
                className="text-center p-2 rounded"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid #ffffff',
                  color: '#198754',
                  fontSize: '0.7rem',
                  fontWeight: '700'
                }}
              >
                ✓ AVAILABLE
              </div>
            ) : (
              <>
                {dayAppointments.slice(0, 2).map((apt, index) => (
                  <div
                    key={apt.id}
                    className="text-truncate mb-1 rounded-pill"
                    style={{ 
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      background: apt.recurring_frequency 
                        ? 'rgba(255,255,255,0.9)' 
                        : 'rgba(255,255,255,0.8)',
                      color: '#495057',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    {apt.customer_name}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div 
                    style={{ 
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.8)',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '2px'
                    }}
                  >
                    +{dayAppointments.length - 2} more
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Calendar Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={goToPrevious} className="me-2">
            <i className="fas fa-chevron-left"></i>
          </Button>
          <Button variant="outline-primary" onClick={goToToday} className="me-2">
            Today
          </Button>
          <Button variant="outline-secondary" onClick={goToNext} className="me-3">
            <i className="fas fa-chevron-right"></i>
          </Button>
          
          {/* View Toggle */}
          <div className="btn-group" role="group">
            <Button
              variant={viewType === 'week' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              <i className="fas fa-calendar-week me-1"></i>
              Week
            </Button>
            <Button
              variant={viewType === 'month' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setViewType('month')}
            >
              <i className="fas fa-calendar me-1"></i>
              Month
            </Button>
          </div>
        </div>
        <h4 className="mb-0">
          {viewType === 'week' ? 
            `Week of ${format(calendarStart, 'MMM d')} - ${format(calendarEnd, 'MMM d, yyyy')}` :
            format(currentDate, 'MMMM yyyy')
          }
        </h4>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading calendar...</p>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-2">
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '2px', 
              backgroundColor: '#f8f9fa',
              borderRadius: '0.5rem',
              overflow: 'hidden'
            }}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div 
                  key={day} 
                  className="text-center fw-bold p-3 text-white"
                  style={{ 
                    fontSize: '0.85rem',
                    backgroundColor: index === 0 || index === 6 ? '#6f42c1' : '#0d6efd',
                    letterSpacing: '0.5px'
                  }}
                >
                  <div className="d-none d-md-block">{day}</div>
                  <div className="d-md-none">{day.substring(0, 3)}</div>
                </div>
              ))}
              
              {calendarDays.map(date => renderDay(date))}
            </div>
          </Card.Body>
        </Card>
      )}

      {!publicView && (
        <Card className="mt-4 border-0 shadow-sm">
          <Card.Body style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <h6 className="mb-3 text-center" style={{ color: '#495057', fontWeight: '600' }}>
              <i className="fas fa-info-circle me-2"></i>
              Calendar Legend
            </h6>
            <div className="row g-3">
              <div className="col-lg-4 col-md-6">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  />
                  <small className="text-muted">
                    <strong>Day Off</strong><br/>
                    No appointments available
                  </small>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  />
                  <small className="text-muted">
                    <strong>Has Appointments</strong><br/>
                    Scheduled bookings
                  </small>
                </div>
              </div>
              <div className="col-lg-4 col-md-6">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)',
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  />
                  <small className="text-muted">
                    <strong>Today</strong><br/>
                    Current date
                  </small>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Day Detail Modal */}
      <Modal show={showDayModal} onHide={() => setShowDayModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-calendar-day me-2"></i>
            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDate && (
            <div>
              {/* Day Off Toggle */}
              <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                <div>
                  <h6 className="mb-1">Day Status</h6>
                  <small className="text-muted">
                    {getDayAvailability(selectedDate)?.is_day_off ? 
                      'This day is marked as off - no appointments will be available' :
                      'This day is available for appointments'
                    }
                  </small>
                </div>
                <Button
                  variant={getDayAvailability(selectedDate)?.is_day_off ? "success" : "danger"}
                  onClick={() => {
                    toggleDayOff(selectedDate)
                    setShowDayModal(false)
                  }}
                >
                  {getDayAvailability(selectedDate)?.is_day_off ? 
                    <><i className="fas fa-check me-1"></i> Mark Available</> :
                    <><i className="fas fa-times me-1"></i> Mark Day Off</>
                  }
                </Button>
              </div>

              {/* Appointments for this day */}
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="fas fa-clock me-2"></i>
                  Appointments ({getDayAppointments(selectedDate).length})
                </h6>
                
                {getDayAppointments(selectedDate).length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <i className="fas fa-calendar-plus fa-2x mb-2 d-block"></i>
                    <p className="mb-2">No appointments scheduled for this day</p>
                    <Button variant="primary" size="sm">
                      <i className="fas fa-plus me-1"></i>
                      Add Appointment
                    </Button>
                  </Alert>
                ) : (
                  <ListGroup>
                    {getDayAppointments(selectedDate).map((appointment) => (
                      <ListGroup.Item key={appointment.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{appointment.customer_name}</strong>
                          <div className="text-muted small">
                            <i className="fas fa-clock me-1"></i>
                            {format(parseISO(appointment.starts_at), 'h:mm a')}
                            {appointment.service_name && (
                              <>
                                <span className="mx-2">•</span>
                                <i className="fas fa-cut me-1"></i>
                                {appointment.service_name}
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          {appointment.recurring_frequency && (
                            <Badge bg="info" className="me-2">
                              {appointment.recurring_frequency}
                            </Badge>
                          )}
                          <Button variant="outline-primary" size="sm">
                            <i className="fas fa-edit"></i>
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>

              {/* Quick Actions */}
              <div className="d-flex gap-2">
                <Button variant="primary">
                  <i className="fas fa-plus me-1"></i>
                  Add Appointment
                </Button>
                <Button variant="outline-secondary">
                  <i className="fas fa-cog me-1"></i>
                  Custom Hours
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-copy me-1"></i>
                  Copy from Another Day
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}