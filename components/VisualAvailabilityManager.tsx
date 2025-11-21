'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Form, Alert } from 'react-bootstrap'

interface TimeSlot {
  hour: number
  minute: number
  available: boolean
}

interface DaySchedule {
  dayOfWeek: number
  timeSlots: TimeSlot[]
}

interface VisualAvailabilityManagerProps {
  businessId: string
  onSave?: () => void
}

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' }
]

const QUICK_SHIFTS = {
  day: { start: 9, end: 17, label: 'Day Shift (9AM-5PM)' },
  night: { start: 17, end: 23, label: 'Night Shift (5PM-11PM)' },
  morning: { start: 6, end: 12, label: 'Morning Shift (6AM-12PM)' },
  full: { start: 0, end: 24, label: '24/7 Open' }
}

export default function VisualAvailabilityManager({ businessId, onSave }: VisualAvailabilityManagerProps) {
  const [selectedDay, setSelectedDay] = useState(1) // Monday
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Generate 48 30-minute slots for 24 hours
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({ hour, minute, available: false })
      }
    }
    return slots
  }

  // Initialize schedule for all days
  useEffect(() => {
    const initSchedule = DAYS.map(day => ({
      dayOfWeek: day.value,
      timeSlots: generateTimeSlots()
    }))
    setSchedule(initSchedule)
    loadExistingSchedule()
  }, [businessId])

  const loadExistingSchedule = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/availability`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.availability.rules) {
          // Convert existing rules to time slots
          updateScheduleFromRules(data.availability.rules)
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateScheduleFromRules = (rules: any[]) => {
    setSchedule(prev => prev.map(daySchedule => {
      const dayRules = rules.filter(rule => rule.weekday === daySchedule.dayOfWeek)
      const updatedTimeSlots = daySchedule.timeSlots.map(slot => {
        const slotTime = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}:00`
        const isAvailable = dayRules.some(rule => 
          slotTime >= rule.start_time && slotTime < rule.end_time
        )
        return { ...slot, available: isAvailable }
      })
      return { ...daySchedule, timeSlots: updatedTimeSlots }
    }))
  }

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  const toggleTimeSlot = (hour: number, minute: number) => {
    setSchedule(prev => prev.map(daySchedule => {
      if (daySchedule.dayOfWeek === selectedDay) {
        const updatedTimeSlots = daySchedule.timeSlots.map(slot => {
          if (slot.hour === hour && slot.minute === minute) {
            return { ...slot, available: !slot.available }
          }
          return slot
        })
        return { ...daySchedule, timeSlots: updatedTimeSlots }
      }
      return daySchedule
    }))
  }

  const applyQuickShift = (shiftType: keyof typeof QUICK_SHIFTS) => {
    const shift = QUICK_SHIFTS[shiftType]
    setSchedule(prev => prev.map(daySchedule => {
      if (daySchedule.dayOfWeek === selectedDay) {
        const updatedTimeSlots = daySchedule.timeSlots.map(slot => {
          const available = slot.hour >= shift.start && slot.hour < shift.end
          return { ...slot, available }
        })
        return { ...daySchedule, timeSlots: updatedTimeSlots }
      }
      return daySchedule
    }))
  }

  const clearDay = () => {
    setSchedule(prev => prev.map(daySchedule => {
      if (daySchedule.dayOfWeek === selectedDay) {
        const updatedTimeSlots = daySchedule.timeSlots.map(slot => ({ ...slot, available: false }))
        return { ...daySchedule, timeSlots: updatedTimeSlots }
      }
      return daySchedule
    }))
  }

  const copyDayToAll = () => {
    const currentDay = schedule.find(day => day.dayOfWeek === selectedDay)
    if (!currentDay) return

    setSchedule(prev => prev.map(daySchedule => ({
      ...daySchedule,
      timeSlots: [...currentDay.timeSlots]
    })))
    setMessage('Schedule copied to all days!')
    setTimeout(() => setMessage(''), 3000)
  }

  const saveSchedule = async () => {
    setSaving(true)
    setMessage('')

    try {
      // First, clear existing rules
      await fetch(`/api/businesses/${businessId}/availability`, {
        method: 'DELETE'
      })

      // Convert schedule to continuous time blocks and save
      for (const daySchedule of schedule) {
        const availableSlots = daySchedule.timeSlots.filter(slot => slot.available)
        if (availableSlots.length === 0) continue

        // Group consecutive slots into time ranges
        let currentStart: TimeSlot | null = null
        
        for (let i = 0; i < availableSlots.length; i++) {
          const slot = availableSlots[i]
          const nextSlot = availableSlots[i + 1]
          
          if (!currentStart) {
            currentStart = slot
          }
          
          // Check if this is the end of a consecutive block
          const isEndOfBlock = !nextSlot || 
            (nextSlot.hour !== slot.hour || nextSlot.minute !== slot.minute + 30) &&
            (nextSlot.hour !== slot.hour + 1 || slot.minute !== 30 || nextSlot.minute !== 0)
          
          if (isEndOfBlock && currentStart) {
            const startTime = `${currentStart.hour.toString().padStart(2, '0')}:${currentStart.minute.toString().padStart(2, '0')}`
            const endHour = slot.minute === 30 ? slot.hour + 1 : slot.hour
            const endMinute = slot.minute === 30 ? 0 : slot.minute + 30
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
            
            await fetch(`/api/businesses/${businessId}/availability`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'rule',
                data: {
                  weekday: daySchedule.dayOfWeek,
                  start_time: startTime,
                  end_time: endTime
                }
              })
            })
            
            currentStart = null
          }
        }
      }

      setMessage('Schedule saved successfully!')
      if (onSave) onSave()
    } catch (error) {
      setMessage('Error saving schedule. Please try again.')
      console.error('Save error:', error)
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const currentDaySchedule = schedule.find(day => day.dayOfWeek === selectedDay)

  if (loading) {
    return <div className="text-center py-4">Loading availability...</div>
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <i className="fas fa-calendar-alt me-2"></i>
          Availability Manager
        </h5>
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.includes('Error') ? 'danger' : 'success'} className="mb-3">
            {message}
          </Alert>
        )}

        {/* Day Selection */}
        <div className="mb-4">
          <h6>Select Day:</h6>
          <div className="btn-group flex-wrap" role="group">
            {DAYS.map(day => (
              <Button
                key={day.value}
                variant={selectedDay === day.value ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setSelectedDay(day.value)}
              >
                {day.short}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h6>Quick Setup:</h6>
          <div className="btn-group flex-wrap me-2" role="group">
            {Object.entries(QUICK_SHIFTS).map(([key, shift]) => (
              <Button
                key={key}
                variant="outline-success"
                size="sm"
                onClick={() => applyQuickShift(key as keyof typeof QUICK_SHIFTS)}
              >
                {shift.label}
              </Button>
            ))}
          </div>
          <Button variant="outline-warning" size="sm" onClick={clearDay} className="me-2">
            Clear Day
          </Button>
          <Button variant="outline-info" size="sm" onClick={copyDayToAll}>
            Copy to All Days
          </Button>
        </div>

        {/* Time Grid */}
        {currentDaySchedule && (
          <div className="mb-4">
            <h6>
              {DAYS.find(d => d.value === selectedDay)?.label} Schedule 
              <small className="text-muted ms-2">(Click blocks to toggle availability)</small>
            </h6>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Row className="g-1">
                {currentDaySchedule.timeSlots.map(slot => (
                  <Col xs={6} sm={4} md={3} lg={2} key={`${slot.hour}-${slot.minute}`}>
                    <Button
                      variant={slot.available ? 'success' : 'outline-secondary'}
                      size="sm"
                      className="w-100"
                      onClick={() => toggleTimeSlot(slot.hour, slot.minute)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem',
                        height: '32px'
                      }}
                    >
                      {formatTime(slot.hour, slot.minute)}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="d-flex justify-content-end">
          <Button 
            variant="primary" 
            onClick={saveSchedule} 
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Schedule
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}