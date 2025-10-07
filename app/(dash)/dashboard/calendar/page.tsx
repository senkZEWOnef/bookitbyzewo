'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Badge, Alert, Dropdown, Form, Modal, Card } from 'react-bootstrap'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, getDay, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from 'date-fns'
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
  deposit_amount?: number
  total_amount?: number
  payment_status?: 'pending' | 'completed' | 'failed' | null
  payment_provider?: string | null
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

interface CalendarSettings {
  viewType: 'month' | 'week' | 'day'
  showWeekends: boolean
  startWeek: 'sunday' | 'monday'
  timeFormat: '12h' | '24h'
  showAppointmentDetails: boolean
  colorTheme: 'default' | 'colorful' | 'minimal'
  statusColors: {
    confirmed: string
    pending: string
    canceled: string
    completed: string
    no_show: string
  }
  displayOptions: {
    showCustomerNames: boolean
    showServiceNames: boolean
    showPhoneNumbers: boolean
    showDuration: boolean
    showPricing: boolean
  }
  filterOptions: {
    statusFilter: string[]
    serviceFilter: string[]
    dateRange: {
      start: string
      end: string
    }
  }
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
  const [showCalendarSettings, setShowCalendarSettings] = useState(false)
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    viewType: 'month',
    showWeekends: true,
    startWeek: 'sunday',
    timeFormat: '12h',
    showAppointmentDetails: true,
    colorTheme: 'default',
    statusColors: {
      confirmed: '#198754',
      pending: '#ffc107',
      canceled: '#dc3545',
      completed: '#0dcaf0',
      no_show: '#6c757d'
    },
    displayOptions: {
      showCustomerNames: true,
      showServiceNames: true,
      showPhoneNumbers: false,
      showDuration: true,
      showPricing: false
    },
    filterOptions: {
      statusFilter: ['confirmed', 'pending'],
      serviceFilter: [],
      dateRange: {
        start: '',
        end: ''
      }
    }
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // TEMP: Use mock data for development
    setBusiness({
      id: 'dev-business-id',
      name: 'Dev Hair Salon',
      slug: 'dev-salon',
      timezone: 'America/Puerto_Rico'
    })
    setAppointments([
      {
        id: '1',
        customer_name: 'Maria Rodriguez',
        customer_phone: '+1 (787) 555-0123',
        starts_at: new Date().toISOString(),
        status: 'confirmed',
        service_name: 'Haircut'
      }
    ])
    setAvailabilityRules([
      { id: '1', weekday: 1, start_time: '09:00', end_time: '17:00' }, // Monday
      { id: '2', weekday: 2, start_time: '09:00', end_time: '17:00' }, // Tuesday
      { id: '3', weekday: 3, start_time: '09:00', end_time: '17:00' }, // Wednesday
      { id: '4', weekday: 4, start_time: '09:00', end_time: '17:00' }, // Thursday
      { id: '5', weekday: 5, start_time: '09:00', end_time: '17:00' }, // Friday
      { id: '6', weekday: 6, start_time: '10:00', end_time: '15:00' }  // Saturday
    ])
    setAvailabilityExceptions([])
    setLoading(false)
  }, [])

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
            deposit_amount,
            total_amount,
            services (name),
            payments (
              id,
              status,
              provider,
              amount_cents
            )
          `)
          .eq('business_id', businessData.id)
          .gte('starts_at', monthStart.toISOString())
          .lte('starts_at', monthEnd.toISOString())
          .order('starts_at', { ascending: true })

        const formattedAppointments = appointmentData?.map((apt: any) => {
          // Determine payment status from payments array
          let paymentStatus: 'pending' | 'completed' | 'failed' | null = null
          let paymentProvider: string | null = null
          if (apt.payments && apt.payments.length > 0) {
            const latestPayment = apt.payments[apt.payments.length - 1]
            paymentStatus = latestPayment.status
            paymentProvider = latestPayment.provider
          } else if (apt.deposit_amount && apt.deposit_amount > 0) {
            paymentStatus = 'pending'
          }

          return {
            id: apt.id,
            customer_name: apt.customer_name,
            customer_phone: apt.customer_phone,
            starts_at: apt.starts_at,
            status: apt.status,
            service_name: apt.services?.name || 'Unknown Service',
            deposit_amount: apt.deposit_amount,
            total_amount: apt.total_amount,
            payment_status: paymentStatus,
            payment_provider: paymentProvider
          }
        }) || []

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

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    
    // Get the start of the first week and end of the last week to fill the calendar grid properly
    const weekStartsOn = calendarSettings.startWeek === 'monday' ? 1 : 0
    const calendarStart = startOfWeek(monthStart, { weekStartsOn })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn })
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    })
  }

  const getViewDays = () => {
    let days: Date[]
    
    if (calendarSettings.viewType === 'month') {
      days = getCalendarDays()
    } else if (calendarSettings.viewType === 'week') {
      const weekStartsOn = calendarSettings.startWeek === 'monday' ? 1 : 0
      const weekStart = startOfWeek(selectedDate, { weekStartsOn })
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn })
      days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    } else { // day view
      days = [selectedDate]
    }
    
    // Filter out weekends if showWeekends is false
    if (!calendarSettings.showWeekends && calendarSettings.viewType === 'month') {
      days = days.filter(day => {
        const dayOfWeek = getDay(day)
        return dayOfWeek !== 0 && dayOfWeek !== 6 // Remove Sunday (0) and Saturday (6)
      })
    }
    
    return days
  }

  const viewDays = getViewDays()

  const getAppointmentsForDay = (day: Date) => {
    return getFilteredAppointments().filter(apt => isSameDay(parseISO(apt.starts_at), day))
  }

  const getFilteredAppointments = () => {
    let filtered = appointments

    // Status filter
    if (calendarSettings.filterOptions.statusFilter.length > 0) {
      filtered = filtered.filter(apt => calendarSettings.filterOptions.statusFilter.includes(apt.status))
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(apt => 
        apt.customer_name.toLowerCase().includes(query) ||
        apt.customer_phone.includes(query) ||
        apt.service_name.toLowerCase().includes(query)
      )
    }

    // Date range filter
    if (calendarSettings.filterOptions.dateRange.start && calendarSettings.filterOptions.dateRange.end) {
      const startDate = new Date(calendarSettings.filterOptions.dateRange.start)
      const endDate = new Date(calendarSettings.filterOptions.dateRange.end)
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.starts_at)
        return aptDate >= startDate && aptDate <= endDate
      })
    }

    return filtered
  }

  const updateCalendarSettings = (updates: Partial<CalendarSettings>) => {
    setCalendarSettings(prev => ({ ...prev, ...updates }))
  }

  const exportCalendar = (format: 'pdf' | 'csv' | 'ical') => {
    // Mock export functionality
    const appointments = getFilteredAppointments()
    console.log(`Exporting ${appointments.length} appointments as ${format.toUpperCase()}`)
    // In a real app, this would generate and download the file
    alert(`Export functionality would generate ${format.toUpperCase()} file with ${appointments.length} appointments`)
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
    
    const getStatusColor = (status: string) => {
      return calendarSettings.statusColors[status as keyof typeof calendarSettings.statusColors] || '#6c757d'
    }
    
    const color = getStatusColor(status)
    const label = statusLabels[status as keyof typeof statusLabels] || status
    
    return (
      <Badge 
        className="me-1" 
        style={{ 
          backgroundColor: color,
          color: '#fff',
          border: 'none'
        }}
      >
        {label}
      </Badge>
    )
  }

  const getPaymentBadge = (appointment: Appointment) => {
    if (!appointment.deposit_amount || appointment.deposit_amount === 0) {
      return null
    }

    const amount = (appointment.deposit_amount / 100).toFixed(2)
    
    let variant: string
    let icon: string
    let label: string
    let provider = ''

    // Add provider indicator
    if (appointment.payment_provider === 'ath_movil') {
      provider = ' (ATH)'
    } else if (appointment.payment_provider === 'stripe') {
      provider = ' (Card)'
    }

    switch (appointment.payment_status) {
      case 'completed':
        variant = 'success'
        icon = 'fas fa-check-circle'
        label = locale === 'es' ? `Pagado $${amount}${provider}` : `Paid $${amount}${provider}`
        break
      case 'pending':
        variant = 'warning'
        icon = 'fas fa-clock'
        label = locale === 'es' ? `Pendiente $${amount}${provider}` : `Pending $${amount}${provider}`
        break
      case 'failed':
        variant = 'danger'
        icon = 'fas fa-times-circle'
        label = locale === 'es' ? `Falló $${amount}${provider}` : `Failed $${amount}${provider}`
        break
      default:
        variant = 'secondary'
        icon = 'fas fa-dollar-sign'
        label = locale === 'es' ? `Depósito $${amount}` : `Deposit $${amount}`
    }

    return (
      <Badge 
        bg={variant} 
        className="me-1" 
        style={{ fontSize: '0.65rem' }}
      >
        <i className={`${icon} me-1`}></i>
        {label}
      </Badge>
    )
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
        <div className="d-flex gap-1 gap-md-2 flex-wrap justify-content-end justify-content-md-start">
          {/* Search */}
          <Form.Control
            type="text"
            placeholder={locale === 'es' ? 'Buscar citas...' : 'Search appointments...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="d-none d-lg-block"
            style={{ width: '200px' }}
          />

          {/* Mobile Search Button */}
          <Button 
            variant="outline-secondary"
            size="sm"
            className="d-lg-none"
            onClick={() => {
              // Toggle mobile search - in a real app this would open a search modal
              const query = prompt(locale === 'es' ? 'Buscar citas:' : 'Search appointments:')
              if (query !== null) setSearchQuery(query)
            }}
          >
            <i className="fas fa-search"></i>
          </Button>

          {/* View Type Selector */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <i className={`fas ${
                calendarSettings.viewType === 'month' ? 'fa-calendar' : 
                calendarSettings.viewType === 'week' ? 'fa-calendar-week' : 
                'fa-calendar-day'
              } me-1`}></i>
              {calendarSettings.viewType === 'month' ? (locale === 'es' ? 'Mes' : 'Month') :
               calendarSettings.viewType === 'week' ? (locale === 'es' ? 'Semana' : 'Week') :
               (locale === 'es' ? 'Día' : 'Day')}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => updateCalendarSettings({ viewType: 'month' })}>
                <i className="fas fa-calendar me-2"></i>
                {locale === 'es' ? 'Vista Mensual' : 'Month View'}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => updateCalendarSettings({ viewType: 'week' })}>
                <i className="fas fa-calendar-week me-2"></i>
                {locale === 'es' ? 'Vista Semanal' : 'Week View'}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => updateCalendarSettings({ viewType: 'day' })}>
                <i className="fas fa-calendar-day me-2"></i>
                {locale === 'es' ? 'Vista Diaria' : 'Day View'}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Filter Dropdown */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-info" size="sm">
              <i className="fas fa-filter me-1"></i>
              {locale === 'es' ? 'Filtros' : 'Filters'}
              {(calendarSettings.filterOptions.statusFilter.length > 0 || searchQuery.trim()) && (
                <Badge bg="info" className="ms-1">{calendarSettings.filterOptions.statusFilter.length + (searchQuery.trim() ? 1 : 0)}</Badge>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-3" style={{ minWidth: '300px' }}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">{locale === 'es' ? 'Estado de Citas' : 'Appointment Status'}</Form.Label>
                {['confirmed', 'pending', 'canceled', 'completed', 'no_show'].map(status => (
                  <Form.Check
                    key={status}
                    type="checkbox"
                    id={`status-${status}`}
                    label={status === 'confirmed' ? (locale === 'es' ? 'Confirmada' : 'Confirmed') :
                           status === 'pending' ? (locale === 'es' ? 'Pendiente' : 'Pending') :
                           status === 'canceled' ? (locale === 'es' ? 'Cancelada' : 'Canceled') :
                           status === 'completed' ? (locale === 'es' ? 'Completada' : 'Completed') :
                           (locale === 'es' ? 'No se presentó' : 'No Show')}
                    checked={calendarSettings.filterOptions.statusFilter.includes(status)}
                    onChange={(e) => {
                      const statusFilter = e.target.checked 
                        ? [...calendarSettings.filterOptions.statusFilter, status]
                        : calendarSettings.filterOptions.statusFilter.filter(s => s !== status)
                      updateCalendarSettings({ 
                        filterOptions: { ...calendarSettings.filterOptions, statusFilter }
                      })
                    }}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">{locale === 'es' ? 'Rango de Fechas' : 'Date Range'}</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    size="sm"
                    value={calendarSettings.filterOptions.dateRange.start}
                    onChange={(e) => updateCalendarSettings({
                      filterOptions: {
                        ...calendarSettings.filterOptions,
                        dateRange: { ...calendarSettings.filterOptions.dateRange, start: e.target.value }
                      }
                    })}
                  />
                  <Form.Control
                    type="date"
                    size="sm"
                    value={calendarSettings.filterOptions.dateRange.end}
                    onChange={(e) => updateCalendarSettings({
                      filterOptions: {
                        ...calendarSettings.filterOptions,
                        dateRange: { ...calendarSettings.filterOptions.dateRange, end: e.target.value }
                      }
                    })}
                  />
                </div>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => updateCalendarSettings({
                    filterOptions: {
                      statusFilter: [],
                      serviceFilter: [],
                      dateRange: { start: '', end: '' }
                    }
                  })}
                >
                  {locale === 'es' ? 'Limpiar' : 'Clear'}
                </Button>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          {/* Export Options */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-success" size="sm">
              <i className="fas fa-download me-1"></i>
              {locale === 'es' ? 'Exportar' : 'Export'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => exportCalendar('pdf')}>
                <i className="fas fa-file-pdf me-2 text-danger"></i>
                {locale === 'es' ? 'Exportar PDF' : 'Export PDF'}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => exportCalendar('csv')}>
                <i className="fas fa-file-csv me-2 text-success"></i>
                {locale === 'es' ? 'Exportar CSV' : 'Export CSV'}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => exportCalendar('ical')}>
                <i className="fas fa-calendar me-2 text-primary"></i>
                {locale === 'es' ? 'Exportar iCal' : 'Export iCal'}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Settings */}
          <Button 
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowCalendarSettings(true)}
          >
            <i className="fas fa-cog me-1"></i>
            {locale === 'es' ? 'Configurar' : 'Settings'}
          </Button>

          <Button 
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowAvailabilityManager(true)}
          >
            <i className="fas fa-clock me-1"></i>
            {locale === 'es' ? 'Horarios' : 'Hours'}
          </Button>

          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i>
            {locale === 'es' ? 'Nueva Cita' : 'New Appointment'}
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* Calendar */}
        <Col xl={8} lg={12} className="order-2 order-xl-1">
          <div className="glass-card p-2 p-md-4 rounded-4">
            {/* Calendar Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0">
                {calendarSettings.viewType === 'month' ? 
                  format(currentDate, 'MMMM yyyy', { locale: dateLocale }) :
                 calendarSettings.viewType === 'week' ?
                  `${format(startOfWeek(selectedDate, { weekStartsOn: calendarSettings.startWeek === 'monday' ? 1 : 0 }), 'MMM d', { locale: dateLocale })} - ${format(endOfWeek(selectedDate, { weekStartsOn: calendarSettings.startWeek === 'monday' ? 1 : 0 }), 'MMM d, yyyy', { locale: dateLocale })}` :
                  format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })
                }
              </h4>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    if (calendarSettings.viewType === 'month') {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
                    } else if (calendarSettings.viewType === 'week') {
                      setSelectedDate(addDays(selectedDate, -7))
                      setCurrentDate(addDays(selectedDate, -7))
                    } else { // day
                      setSelectedDate(addDays(selectedDate, -1))
                      setCurrentDate(addDays(selectedDate, -1))
                    }
                  }}
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    const today = new Date()
                    setCurrentDate(today)
                    setSelectedDate(today)
                  }}
                >
                  {locale === 'es' ? 'Hoy' : 'Today'}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    if (calendarSettings.viewType === 'month') {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
                    } else if (calendarSettings.viewType === 'week') {
                      setSelectedDate(addDays(selectedDate, 7))
                      setCurrentDate(addDays(selectedDate, 7))
                    } else { // day
                      setSelectedDate(addDays(selectedDate, 1))
                      setCurrentDate(addDays(selectedDate, 1))
                    }
                  }}
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>

            {/* Calendar Header */}
            {calendarSettings.viewType === 'month' && (
              <div 
                className="calendar-header mb-2" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: calendarSettings.showWeekends ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)',
                  gap: '1px', 
                  textAlign: 'center' 
                }}
              >
                {(() => {
                  const days = locale === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                  const startIdx = calendarSettings.startWeek === 'monday' ? 1 : 0
                  let reorderedDays = [...days.slice(startIdx), ...days.slice(0, startIdx)]
                  
                  // Filter out weekends if showWeekends is false
                  if (!calendarSettings.showWeekends) {
                    reorderedDays = reorderedDays.filter((_, index) => {
                      // In reordered array, weekends are at positions 5 (Saturday) and 6 (Sunday) when starting from Monday
                      // or positions 0 (Sunday) and 6 (Saturday) when starting from Sunday
                      if (calendarSettings.startWeek === 'monday') {
                        return index !== 5 && index !== 6 // Remove Saturday and Sunday
                      } else {
                        return index !== 0 && index !== 6 // Remove Sunday and Saturday
                      }
                    })
                  }
                  
                  return reorderedDays.map(day => (
                    <div key={day} className="calendar-header-day fw-bold text-muted py-2" style={{ fontSize: '0.85rem' }}>
                      {day}
                    </div>
                  ))
                })()}
              </div>
            )}
            
            {calendarSettings.viewType === 'week' && (
              <div className="calendar-header mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', textAlign: 'center' }}>
                {viewDays.map(day => (
                  <div key={day.toString()} className="calendar-header-day fw-bold text-muted py-2" style={{ fontSize: '0.85rem' }}>
                    <div>{format(day, 'EEE', { locale: dateLocale })}</div>
                    <div className="fw-normal">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Calendar Grid */}
            <div 
              className="calendar-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: calendarSettings.viewType === 'month' ? 
                  (calendarSettings.showWeekends ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)') :
                  calendarSettings.viewType === 'week' ? 'repeat(7, 1fr)' : '1fr',
                gap: '1px',
                backgroundColor: '#e5e7eb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {viewDays.map(day => {
                const dayAppointments = getAppointmentsForDay(day)
                const availability = getDayAvailability(day)
                const indicator = getAvailabilityIndicator(day)
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentDay = isToday(day)
                const isCurrentMonth = format(day, 'M') === format(currentDate, 'M')
                
                return (
                  <div
                    key={day.toString()}
                    className="calendar-day"
                    onClick={() => setSelectedDate(day)}
                    style={{
                      backgroundColor: isSelected ? '#3b82f6' : 
                                     isCurrentDay ? '#10b981' : '#ffffff',
                      color: isSelected || isCurrentDay ? '#ffffff' : 
                             isCurrentMonth ? '#000000' : '#9ca3af',
                      minHeight: calendarSettings.viewType === 'month' ? '70px' :
                        calendarSettings.viewType === 'week' ? '150px' : '300px',
                      padding: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: !availability.isOpen ? 0.6 : 1,
                      position: 'relative',
                      border: isSelected ? '2px solid #1d4ed8' : 
                              isCurrentDay ? '2px solid #059669' : 'none',
                      fontSize: '0.8rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isCurrentDay) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isCurrentDay) {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }
                    }}
                  >
                    <div className="calendar-day-number fw-bold mb-1">
                      {format(day, 'd')}
                      {calendarSettings.viewType === 'day' && (
                        <div className="small fw-normal">
                          {format(day, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                        </div>
                      )}
                    </div>
                    
                    {/* Availability/Appointment Indicator */}
                    <div className="calendar-appointments-indicator">
                      <div 
                        className="d-flex align-items-center justify-content-start mb-1"
                        style={{ 
                          fontSize: '0.7rem'
                        }}
                      >
                        <i className={`${indicator.icon} me-1`} style={{ color: isSelected || isCurrentDay ? 'rgba(255,255,255,0.9)' : indicator.color }}></i>
                        {dayAppointments.length > 0 && (
                          <span style={{ color: isSelected || isCurrentDay ? 'rgba(255,255,255,0.9)' : indicator.color }}>
                            {dayAppointments.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Show appointment details in week/day view */}
                      {(calendarSettings.viewType === 'week' || calendarSettings.viewType === 'day') && dayAppointments.length > 0 && (
                        <div className="appointments-list">
                          {dayAppointments.slice(0, calendarSettings.viewType === 'day' ? 10 : 3).map(apt => (
                            <div 
                              key={apt.id} 
                              className="appointment-item small mb-1 p-1 rounded"
                              style={{
                                backgroundColor: calendarSettings.statusColors[apt.status as keyof typeof calendarSettings.statusColors] || '#6c757d',
                                color: '#fff',
                                fontSize: '0.65rem'
                              }}
                            >
                              <div className="fw-bold">{format(parseISO(apt.starts_at), calendarSettings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm')}</div>
                              {calendarSettings.displayOptions.showCustomerNames && (
                                <div className="text-truncate">{apt.customer_name}</div>
                              )}
                              {calendarSettings.displayOptions.showServiceNames && (
                                <div className="text-truncate">{apt.service_name}</div>
                              )}
                            </div>
                          ))}
                          {dayAppointments.length > (calendarSettings.viewType === 'day' ? 10 : 3) && (
                            <div className="small text-muted">
                              +{dayAppointments.length - (calendarSettings.viewType === 'day' ? 10 : 3)} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      {availability.hours && calendarSettings.viewType === 'month' && (
                        <small 
                          className="text-muted"
                          style={{ 
                            fontSize: '0.6rem',
                            color: isSelected || isCurrentDay ? 'rgba(255,255,255,0.7)' : '#6b7280'
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
        <Col xl={4} lg={12} className="order-1 order-xl-2">
          <div className="glass-card p-3 p-md-4 rounded-4">
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
                      <div className="d-flex flex-wrap">
                        {getStatusBadge(appointment.status)}
                        {getPaymentBadge(appointment)}
                      </div>
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

      {/* Calendar Settings Modal */}
      <Modal show={showCalendarSettings} onHide={() => setShowCalendarSettings(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-cog me-2"></i>
            {locale === 'es' ? 'Configuración del Calendario' : 'Calendar Settings'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {/* Display Settings */}
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="fas fa-eye me-2"></i>
                    {locale === 'es' ? 'Opciones de Vista' : 'Display Options'}
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="showWeekends"
                      label={locale === 'es' ? 'Mostrar fines de semana' : 'Show weekends'}
                      checked={calendarSettings.showWeekends}
                      onChange={(e) => updateCalendarSettings({ showWeekends: e.target.checked })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{locale === 'es' ? 'Iniciar semana en' : 'Start week on'}</Form.Label>
                    <Form.Select
                      value={calendarSettings.startWeek}
                      onChange={(e) => updateCalendarSettings({ startWeek: e.target.value as 'sunday' | 'monday' })}
                    >
                      <option value="sunday">{locale === 'es' ? 'Domingo' : 'Sunday'}</option>
                      <option value="monday">{locale === 'es' ? 'Lunes' : 'Monday'}</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{locale === 'es' ? 'Formato de hora' : 'Time format'}</Form.Label>
                    <Form.Select
                      value={calendarSettings.timeFormat}
                      onChange={(e) => updateCalendarSettings({ timeFormat: e.target.value as '12h' | '24h' })}
                    >
                      <option value="12h">12 {locale === 'es' ? 'horas (AM/PM)' : 'hour (AM/PM)'}</option>
                      <option value="24h">24 {locale === 'es' ? 'horas' : 'hour'}</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{locale === 'es' ? 'Tema de colores' : 'Color theme'}</Form.Label>
                    <Form.Select
                      value={calendarSettings.colorTheme}
                      onChange={(e) => updateCalendarSettings({ colorTheme: e.target.value as 'default' | 'colorful' | 'minimal' })}
                    >
                      <option value="default">{locale === 'es' ? 'Predeterminado' : 'Default'}</option>
                      <option value="colorful">{locale === 'es' ? 'Colorido' : 'Colorful'}</option>
                      <option value="minimal">{locale === 'es' ? 'Minimalista' : 'Minimal'}</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            {/* Status Colors */}
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="fas fa-palette me-2"></i>
                    {locale === 'es' ? 'Colores de Estado' : 'Status Colors'}
                  </h6>
                </Card.Header>
                <Card.Body>
                  {Object.entries(calendarSettings.statusColors).map(([status, color]) => (
                    <Form.Group key={status} className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <div
                          className="rounded me-2"
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: color
                          }}
                        ></div>
                        {status === 'confirmed' ? (locale === 'es' ? 'Confirmada' : 'Confirmed') :
                         status === 'pending' ? (locale === 'es' ? 'Pendiente' : 'Pending') :
                         status === 'canceled' ? (locale === 'es' ? 'Cancelada' : 'Canceled') :
                         status === 'completed' ? (locale === 'es' ? 'Completada' : 'Completed') :
                         (locale === 'es' ? 'No se presentó' : 'No Show')}
                      </Form.Label>
                      <Form.Control
                        type="color"
                        value={color}
                        onChange={(e) => updateCalendarSettings({
                          statusColors: {
                            ...calendarSettings.statusColors,
                            [status]: e.target.value
                          }
                        })}
                      />
                    </Form.Group>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Appointment Display Options */}
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="fas fa-list me-2"></i>
                    {locale === 'es' ? 'Información a Mostrar' : 'Appointment Information'}
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="showCustomerNames"
                          label={locale === 'es' ? 'Nombres de clientes' : 'Customer names'}
                          checked={calendarSettings.displayOptions.showCustomerNames}
                          onChange={(e) => updateCalendarSettings({
                            displayOptions: { ...calendarSettings.displayOptions, showCustomerNames: e.target.checked }
                          })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="showServiceNames"
                          label={locale === 'es' ? 'Nombres de servicios' : 'Service names'}
                          checked={calendarSettings.displayOptions.showServiceNames}
                          onChange={(e) => updateCalendarSettings({
                            displayOptions: { ...calendarSettings.displayOptions, showServiceNames: e.target.checked }
                          })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="showPhoneNumbers"
                          label={locale === 'es' ? 'Números de teléfono' : 'Phone numbers'}
                          checked={calendarSettings.displayOptions.showPhoneNumbers}
                          onChange={(e) => updateCalendarSettings({
                            displayOptions: { ...calendarSettings.displayOptions, showPhoneNumbers: e.target.checked }
                          })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="showDuration"
                          label={locale === 'es' ? 'Duración del servicio' : 'Service duration'}
                          checked={calendarSettings.displayOptions.showDuration}
                          onChange={(e) => updateCalendarSettings({
                            displayOptions: { ...calendarSettings.displayOptions, showDuration: e.target.checked }
                          })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="showPricing"
                          label={locale === 'es' ? 'Precios' : 'Pricing'}
                          checked={calendarSettings.displayOptions.showPricing}
                          onChange={(e) => updateCalendarSettings({
                            displayOptions: { ...calendarSettings.displayOptions, showPricing: e.target.checked }
                          })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="showAppointmentDetails"
                          label={locale === 'es' ? 'Detalles completos' : 'Full details'}
                          checked={calendarSettings.showAppointmentDetails}
                          onChange={(e) => updateCalendarSettings({ showAppointmentDetails: e.target.checked })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCalendarSettings(false)}>
            {locale === 'es' ? 'Cerrar' : 'Close'}
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => {
              // Reset to defaults
              setCalendarSettings({
                viewType: 'month',
                showWeekends: true,
                startWeek: 'sunday',
                timeFormat: '12h',
                showAppointmentDetails: true,
                colorTheme: 'default',
                statusColors: {
                  confirmed: '#198754',
                  pending: '#ffc107',
                  canceled: '#dc3545',
                  completed: '#0dcaf0',
                  no_show: '#6c757d'
                },
                displayOptions: {
                  showCustomerNames: true,
                  showServiceNames: true,
                  showPhoneNumbers: false,
                  showDuration: true,
                  showPricing: false
                },
                filterOptions: {
                  statusFilter: ['confirmed', 'pending'],
                  serviceFilter: [],
                  dateRange: { start: '', end: '' }
                }
              })
            }}
          >
            {locale === 'es' ? 'Restablecer' : 'Reset Defaults'}
          </Button>
          <Button variant="success" onClick={() => setShowCalendarSettings(false)}>
            <i className="fas fa-save me-1"></i>
            {locale === 'es' ? 'Guardar' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

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