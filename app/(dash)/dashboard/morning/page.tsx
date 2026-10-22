'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Container, Card, Button, Alert, Spinner, Badge, ProgressBar, ButtonGroup } from 'react-bootstrap'
import { createWhatsAppLink, getTemplate, buildBarberBriefing, formatClock } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

interface RunAppointment {
  id: string
  customer_name: string
  customer_phone: string
  customer_locale: string | null
  status: string
  morning_reminded_at: string | null
  local_time: string
  service_name: string | null
  service_duration: number | null
  has_next: boolean
}

interface RunBusiness {
  id: string
  name: string
  phone: string | null
  timezone: string
}

const REBOOK_WEEKS = [2, 3, 4, 6]

export default function MorningRunPage() {
  const [business, setBusiness] = useState<RunBusiness | null>(null)
  const [date, setDate] = useState('')
  const [appointments, setAppointments] = useState<RunAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [running, setRunning] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError('')
      const userString = localStorage.getItem('user')
      if (!userString) {
        window.location.href = '/login'
        return
      }
      const user = JSON.parse(userString)

      const bizResponse = await fetch(`/api/businesses?userId=${user.id}`)
      const bizData = await bizResponse.json()
      const biz = bizData.businesses?.[0]
      if (!biz) throw new Error('No business found for this account')

      const response = await fetch(`/api/businesses/${biz.id}/morning`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load today')

      setBusiness(data.business)
      setDate(data.date)
      setAppointments(data.appointments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const active = useMemo(() => appointments.filter(a => a.status !== 'completed'), [appointments])
  const pending = useMemo(() => active.filter(a => !a.morning_reminded_at), [active])
  const sentCount = active.length - pending.length

  const markSent = async (ids: string[]) => {
    if (!business) return
    const stamp = new Date().toISOString()
    setAppointments(prev => prev.map(a => (ids.includes(a.id) ? { ...a, morning_reminded_at: stamp } : a)))
    await fetch(`/api/businesses/${business.id}/morning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sent', appointmentIds: ids })
    })
  }

  const clientLink = (a: RunAppointment) =>
    createWhatsAppLink({
      phone: a.customer_phone,
      message: getTemplate(lang, 'morning', {
        name: a.customer_name.split(' ')[0],
        service: a.service_name || (lang === 'es' ? 'cita' : 'appointment'),
        time: formatClock(a.local_time),
        business: business?.name || ''
      })
    })

  const sendOne = (a: RunAppointment) => {
    window.open(clientLink(a), '_blank', 'noopener')
    markSent([a.id])
  }

  const sendBriefing = () => {
    if (!business?.phone) {
      setNotice(lang === 'es' ? 'Agrega tu número de teléfono en Ajustes para recibir tu resumen.' : 'Add your phone number in Settings to message yourself.')
      return
    }
    const message = buildBarberBriefing(lang, {
      business: business.name,
      date,
      items: active.map(a => ({ time: formatClock(a.local_time), name: a.customer_name, service: a.service_name || '' }))
    })
    window.open(createWhatsAppLink({ phone: business.phone, message }), '_blank', 'noopener')
  }

  const rebook = async (a: RunAppointment, weeks: number) => {
    if (!business) return
    setBusyId(a.id)
    setNotice('')
    try {
      const response = await fetch(`/api/businesses/${business.id}/morning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rebook', appointmentId: a.id, weeks })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not rebook')
      setAppointments(prev => prev.map(x => (x.id === a.id ? { ...x, has_next: true } : x)))
      setNotice(
        lang === 'es'
          ? `${a.customer_name} quedó para ${data.appointment.starts_at} (en ${weeks} semanas).`
          : `${a.customer_name} booked for ${data.appointment.starts_at} (in ${weeks} weeks).`
      )
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not rebook')
    } finally {
      setBusyId(null)
    }
  }

  const next = pending[0]
  const t = lang === 'es'
    ? {
        title: 'Ronda de la mañana', sub: 'Un toque por cliente. Listo antes del primer corte.',
        start: 'Empezar la ronda', stop: 'Salir de la ronda', send: 'Enviar por WhatsApp', skip: 'Saltar',
        briefing: 'Enviarme mi día', sent: 'enviados', done: '¡Todos recordados! Buen día de cortes ✂️',
        empty: 'No hay citas hoy. Disfruta el día libre 🙌', next: 'Siguiente corte', rebook: 'Próxima cita en', weeks: 'sem',
        booked: 'Próxima cita lista', now: 'Ahora'
      }
    : {
        title: 'Morning Run', sub: 'One tap per client. Done before the first cut.',
        start: 'Start the run', stop: 'Exit run', send: 'Send on WhatsApp', skip: 'Skip',
        briefing: 'Message me my day', sent: 'sent', done: 'Everyone reminded! Have a great day of cuts ✂️',
        empty: 'No appointments today. Enjoy the day off 🙌', next: 'Next cut', rebook: 'Next visit in', weeks: 'wk',
        booked: 'Next visit booked', now: 'Now'
      }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    )
  }

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="mb-0">☀️ {t.title}</h2>
          <div className="text-muted small">{t.sub}</div>
          <div className="text-muted small">{business?.name} · {date}</div>
        </div>
        <ButtonGroup size="sm">
          <Button variant={lang === 'es' ? 'dark' : 'outline-dark'} onClick={() => setLang('es')}>ES</Button>
          <Button variant={lang === 'en' ? 'dark' : 'outline-dark'} onClick={() => setLang('en')}>EN</Button>
        </ButtonGroup>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {notice && <Alert variant="info" dismissible onClose={() => setNotice('')}>{notice}</Alert>}

      {!error && active.length === 0 && (
        <Card body className="text-center text-muted">{t.empty}</Card>
      )}

      {active.length > 0 && (
        <>
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <strong>{sentCount} / {active.length} {t.sent}</strong>
                <Button size="sm" variant="outline-secondary" onClick={sendBriefing}>
                  <i className="fab fa-whatsapp me-1"></i>{t.briefing}
                </Button>
              </div>
              <ProgressBar now={(sentCount / active.length) * 100} variant="success" style={{ height: 10 }} />
            </Card.Body>
          </Card>

          {!running && pending.length > 0 && (
            <Button size="lg" variant="success" className="w-100 mb-3 py-3 fw-bold" onClick={() => setRunning(true)}>
              ⚡ {t.start} ({pending.length})
            </Button>
          )}

          {running && next && (
            <Card className="mb-3 border-success shadow">
              <Card.Body className="text-center py-4">
                <div className="text-muted small text-uppercase">{t.next}</div>
                <div className="display-6 fw-bold">{formatClock(next.local_time)}</div>
                <h3 className="mb-0">{next.customer_name}</h3>
                <div className="text-muted mb-3">{next.service_name}</div>
                <Button size="lg" variant="success" className="w-100 py-3 fw-bold mb-2" onClick={() => sendOne(next)}>
                  <i className="fab fa-whatsapp me-2"></i>{t.send}
                </Button>
                <div className="d-flex justify-content-between">
                  <Button variant="link" className="text-muted" onClick={() => markSent([next.id])}>{t.skip}</Button>
                  <Button variant="link" className="text-muted" onClick={() => setRunning(false)}>{t.stop}</Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {pending.length === 0 && (
            <Alert variant="success" className="text-center fw-bold">{t.done}</Alert>
          )}

          {active.map(a => {
            const reminded = !!a.morning_reminded_at
            return (
              <Card key={a.id} className="mb-2 border-0 shadow-sm" style={{ opacity: reminded ? 0.85 : 1 }}>
                <Card.Body className="py-3">
                  <div className="d-flex align-items-center">
                    <div className="fw-bold me-3" style={{ minWidth: 76 }}>{formatClock(a.local_time)}</div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{a.customer_name}</div>
                      <div className="text-muted small">{a.service_name}</div>
                    </div>
                    {reminded ? (
                      <Badge bg="success">✓</Badge>
                    ) : (
                      <Button size="sm" variant="outline-success" onClick={() => sendOne(a)}>
                        <i className="fab fa-whatsapp"></i>
                      </Button>
                    )}
                  </div>
                  <div className="d-flex align-items-center flex-wrap gap-2 mt-2 ps-1">
                    {a.has_next ? (
                      <Badge bg="light" text="dark">📅 {t.booked}</Badge>
                    ) : (
                      <>
                        <span className="text-muted small">{t.rebook}</span>
                        {REBOOK_WEEKS.map(w => (
                          <Button key={w} size="sm" variant="outline-dark" disabled={busyId === a.id} onClick={() => rebook(a, w)}>
                            {w} {t.weeks}
                          </Button>
                        ))}
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )
          })}
        </>
      )}
    </Container>
  )
}
