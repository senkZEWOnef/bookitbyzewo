'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Alert, Button } from 'react-bootstrap'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

interface AnalyticsData {
  totalAppointments: number
  completedAppointments: number
  canceledAppointments: number
  totalRevenue: number
  averageSessionValue: number
  noShowRate: number
  bookingsByMonth: { month: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  topServices: { name: string; count: number; revenue: number }[]
  appointmentsByStatus: { status: string; count: number; percentage: number }[]
}

export default function AnalyticsPage() {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  const dateLocale = language === 'es' ? es : undefined
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)

  useEffect(() => {
    fetchData()
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
        // Calculate analytics
        const currentDate = new Date()
        const sixMonthsAgo = subMonths(currentDate, 6)

        // Get appointments data
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`
            id,
            status,
            starts_at,
            created_at,
            services (name, price_cents)
          `)
          .eq('business_id', businessData.id)
          .gte('created_at', sixMonthsAgo.toISOString())

        if (appointmentsData) {
          const analytics = calculateAnalytics(appointmentsData)
          setAnalytics(analytics)
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (appointments: any[]): AnalyticsData => {
    const total = appointments.length
    const completed = appointments.filter(apt => apt.status === 'completed').length
    const canceled = appointments.filter(apt => apt.status === 'canceled').length
    const noShows = appointments.filter(apt => apt.status === 'no_show').length

    // Revenue calculation
    const completedAppointments = appointments.filter(apt => apt.status === 'completed')
    const totalRevenue = completedAppointments.reduce((sum, apt) => 
      sum + (apt.services?.price_cents || 0), 0) / 100

    // Bookings by month
    const bookingsByMonth = []
    const revenueByMonth = []
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = parseISO(apt.created_at)
        return aptDate >= monthStart && aptDate <= monthEnd
      })
      
      const monthRevenue = monthAppointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.services?.price_cents || 0), 0) / 100

      bookingsByMonth.push({
        month: format(monthDate, 'MMM'),
        count: monthAppointments.length
      })

      revenueByMonth.push({
        month: format(monthDate, 'MMM'),
        revenue: monthRevenue
      })
    }

    // Top services
    const serviceStats: { [key: string]: { count: number; revenue: number } } = {}
    completedAppointments.forEach(apt => {
      const serviceName = apt.services?.name || 'Unknown Service'
      const price = apt.services?.price_cents || 0
      
      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = { count: 0, revenue: 0 }
      }
      serviceStats[serviceName].count++
      serviceStats[serviceName].revenue += price / 100
    })

    const topServices = Object.entries(serviceStats)
      .map(([name, stats]: [string, any]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Appointments by status
    const statusCounts = {
      completed: completed,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      canceled: canceled,
      no_show: noShows
    }

    const appointmentsByStatus = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / total) * 100)
      }))

    return {
      totalAppointments: total,
      completedAppointments: completed,
      canceledAppointments: canceled,
      totalRevenue,
      averageSessionValue: completed > 0 ? totalRevenue / completed : 0,
      noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
      bookingsByMonth,
      revenueByMonth,
      topServices,
      appointmentsByStatus
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
          {locale === 'es' ? 'Por favor crea un negocio primero para ver analíticas.' : 'Please create a business first to view analytics.'}
        </Alert>
        <Link href="/dashboard/onboarding">
          <Button variant="success">
            {locale === 'es' ? 'Crear Negocio' : 'Create Business'}
          </Button>
        </Link>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-5">
        <Alert variant="info">
          <i className="fas fa-chart-line me-2"></i>
          {locale === 'es' ? 'No hay datos disponibles aún. Comienza a aceptar citas para ver tus analíticas.' : 'No data available yet. Start accepting appointments to see your analytics.'}
        </Alert>
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
            <i className="fas fa-chart-bar fs-4"></i>
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-gray-900">
              {locale === 'es' ? 'Analíticas' : 'Analytics'}
            </h2>
            <p className="text-muted mb-0">
              {locale === 'es' ? 'Perspectivas del negocio y métricas de rendimiento' : 'Business insights and performance metrics'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <Row className="mb-5 g-4">
        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}
          >
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-calendar-check fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#059669' }}>
                {analytics.totalAppointments}
              </h3>
              <p className="text-muted mb-0 fw-medium">
                {locale === 'es' ? 'Total de Citas' : 'Total Appointments'}
              </p>
              <small className="text-success fw-semibold">
                {locale === 'es' ? 'Últimos 6 meses' : 'Last 6 months'}
              </small>
            </div>
          </div>
        </Col>

        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.1)'
            }}
          >
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-dollar-sign fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#4f46e5' }}>
                {formatCurrency(analytics.totalRevenue)}
              </h3>
              <p className="text-muted mb-0 fw-medium">
                {locale === 'es' ? 'Ingresos Totales' : 'Total Revenue'}
              </p>
              <small className="text-primary fw-semibold">
                {locale === 'es' ? 'De reservas completadas' : 'From completed bookings'}
              </small>
            </div>
          </div>
        </Col>

        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}
          >
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-chart-line fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#d97706' }}>
                {formatCurrency(analytics.averageSessionValue)}
              </h3>
              <p className="text-muted mb-0 fw-medium">
                {locale === 'es' ? 'Valor Promedio por Sesión' : 'Avg. Session Value'}
              </p>
              <small className="text-warning fw-semibold">
                {locale === 'es' ? 'Por reserva completada' : 'Per completed booking'}
              </small>
            </div>
          </div>
        </Col>

        <Col lg={3} md={6}>
          <div 
            className="glass-card p-4 rounded-4 h-100 text-center position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(190, 24, 93, 0.05) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.1)'
            }}
          >
            <div className="position-relative">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '60px', 
                  height: '60px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-percentage fs-4"></i>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#be185d' }}>
                {analytics.noShowRate}%
              </h3>
              <p className="text-muted mb-0 fw-medium">
                {locale === 'es' ? 'Tasa de No Presentación' : 'No-Show Rate'}
              </p>
              <small style={{ color: '#be185d' }} className="fw-semibold">
                {analytics.noShowRate < 5 
                  ? (locale === 'es' ? '¡Excelente!' : 'Excellent!') 
                  : analytics.noShowRate < 15 
                  ? (locale === 'es' ? 'Bueno' : 'Good') 
                  : (locale === 'es' ? 'Necesita atención' : 'Needs attention')
                }
              </small>
            </div>
          </div>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="g-4 mb-5">
        {/* Bookings Trend */}
        <Col lg={8}>
          <div className="glass-card p-4 rounded-4">
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-chart-line fs-5"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">
                  {locale === 'es' ? 'Tendencias de Reservas' : 'Booking Trends'}
                </h5>
                <small className="text-muted">
                  {locale === 'es' ? 'Reservas de citas mensuales' : 'Monthly appointment bookings'}
                </small>
              </div>
            </div>
            
            <div className="d-flex align-items-end gap-3" style={{ height: '200px' }}>
              {analytics.bookingsByMonth.map((data, index) => {
                const maxCount = Math.max(...analytics.bookingsByMonth.map(d => d.count))
                const height = maxCount > 0 ? (data.count / maxCount) * 160 : 0
                
                return (
                  <div key={index} className="d-flex flex-column align-items-center">
                    <small className="text-muted mb-2">{data.count}</small>
                    <div 
                      className="rounded-top"
                      style={{
                        width: '40px',
                        height: `${height}px`,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        minHeight: '4px'
                      }}
                    ></div>
                    <small className="text-muted mt-2">{data.month}</small>
                  </div>
                )
              })}
            </div>
          </div>
        </Col>

        {/* Appointment Status */}
        <Col lg={4}>
          <div className="glass-card p-4 rounded-4 h-100">
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-chart-pie fs-5"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">
                  {locale === 'es' ? 'Estado de las Citas' : 'Appointment Status'}
                </h5>
                <small className="text-muted">
                  {locale === 'es' ? 'Desglose de distribución' : 'Distribution breakdown'}
                </small>
              </div>
            </div>

            <div className="space-y-3">
              {analytics.appointmentsByStatus.map((status, index) => (
                <div key={index} className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded me-3"
                      style={{
                        width: '12px',
                        height: '12px',
                        background: index === 0 ? '#10b981' : 
                                   index === 1 ? '#f59e0b' : 
                                   index === 2 ? '#6366f1' : 
                                   index === 3 ? '#ef4444' : '#9ca3af'
                      }}
                    ></div>
                    <div>
                      <div className="fw-medium text-capitalize">
                        {locale === 'es' 
                          ? status.status === 'completed' ? 'Completada'
                            : status.status === 'pending' ? 'Pendiente'
                            : status.status === 'confirmed' ? 'Confirmada'
                            : status.status === 'canceled' ? 'Cancelada'
                            : status.status === 'no_show' ? 'No se presentó'
                            : status.status.replace('_', ' ')
                          : status.status.replace('_', ' ')
                        }
                      </div>
                      <small className="text-muted">
                        {status.count} {locale === 'es' ? 'citas' : 'appointments'}
                      </small>
                    </div>
                  </div>
                  <div className="fw-bold text-end">
                    {status.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Top Services */}
      {analytics.topServices.length > 0 && (
        <Row>
          <Col>
            <div className="glass-card p-4 rounded-4">
              <div className="d-flex align-items-center mb-4">
                <div 
                  className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-trophy fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">
                    {locale === 'es' ? 'Mejores Servicios' : 'Top Services'}
                  </h5>
                  <small className="text-muted">
                    {locale === 'es' ? 'Servicios con mejor rendimiento por ingresos' : 'Best performing services by revenue'}
                  </small>
                </div>
              </div>

              <Row className="g-3">
                {analytics.topServices.map((service, index) => (
                  <Col key={index} lg={4} md={6}>
                    <div 
                      className="p-3 rounded-3"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.1)'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="fw-semibold">{service.name}</div>
                        <div 
                          className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center"
                          style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
                        >
                          #{index + 1}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>{service.count} {locale === 'es' ? 'reservas' : 'bookings'}</span>
                        <span className="fw-semibold text-warning">{formatCurrency(service.revenue)}</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Col>
        </Row>
      )}
    </div>
  )
}