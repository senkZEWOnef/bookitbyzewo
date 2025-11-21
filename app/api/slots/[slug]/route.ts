import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { format, parseISO, addMinutes, startOfDay, endOfDay, getDay } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Date and serviceId are required' },
        { status: 400 }
      )
    }

    // Get business details using Neon
    const businessResult = await query(
      'SELECT * FROM businesses WHERE slug = $1',
      [params.slug]
    )

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const business = businessResult.rows[0]

    // Get service details using Neon
    const serviceResult = await query(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2 AND is_active = true',
      [serviceId, business.id]
    )

    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const service = serviceResult.rows[0]
    const requestedDate = parseISO(date)
    const dayOfWeek = getDay(requestedDate) // 0 = Sunday, 1 = Monday, etc.

    // Check for day-specific availability first
    const dayAvailabilityResult = await query(
      'SELECT * FROM day_availability WHERE business_id = $1 AND date = $2',
      [business.id, format(requestedDate, 'yyyy-MM-dd')]
    )

    let timeSlots: string[] = []

    if (dayAvailabilityResult.rows.length > 0) {
      const dayAvailability = dayAvailabilityResult.rows[0]
      
      if (dayAvailability.is_day_off) {
        return NextResponse.json({
          success: true,
          slots: [],
          message: 'Closed on this day'
        })
      }

      // Use custom time slots if available
      if (dayAvailability.custom_time_slots && dayAvailability.custom_time_slots.length > 0) {
        timeSlots = dayAvailability.custom_time_slots
          .map((slot: any) => generateTimeSlots(slot.start_time, slot.end_time, service.duration_minutes, 30))
          .flat()
      }
    }

    // Fall back to default business hours if no custom slots
    if (timeSlots.length === 0) {
      const defaultHoursResult = await query(
        'SELECT * FROM business_default_hours WHERE business_id = $1 AND day_of_week = $2 AND is_closed = false',
        [business.id, dayOfWeek]
      )

      if (defaultHoursResult.rows.length === 0) {
        return NextResponse.json({
          success: true,
          slots: [],
          message: 'No availability for this day'
        })
      }

      const defaultHours = defaultHoursResult.rows[0]
      timeSlots = generateTimeSlots(
        defaultHours.open_time,
        defaultHours.close_time,
        service.duration_minutes,
        defaultHours.slot_duration_minutes || 30
      )
    }

    // Get existing appointments for this date
    const dayStart = startOfDay(requestedDate)
    const dayEnd = endOfDay(requestedDate)

    const appointmentsResult = await query(`
      SELECT starts_at, duration_minutes 
      FROM appointments 
      WHERE business_id = $1 
      AND starts_at >= $2 
      AND starts_at <= $3 
      AND status NOT IN ('cancelled', 'no_show')
    `, [business.id, dayStart.toISOString(), dayEnd.toISOString()])

    const existingAppointments = appointmentsResult.rows

    // Filter available slots
    const availableSlots = timeSlots.filter(slot => {
      const slotStart = parseISO(`${format(requestedDate, 'yyyy-MM-dd')}T${slot}:00`)
      const slotEnd = addMinutes(slotStart, service.duration_minutes)

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = parseISO(apt.starts_at)
        const aptEnd = addMinutes(aptStart, service.duration_minutes) // Use service duration as fallback
        
        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        )
      })

      return !hasConflict
    })

    // Format slots as expected by the frontend
    const formattedSlots = availableSlots.map(slot => ({
      datetime: `${format(requestedDate, 'yyyy-MM-dd')}T${slot}:00`,
      available: true
    }))

    return NextResponse.json({
      success: true,
      slots: formattedSlots,
      business: {
        name: business.name,
        timezone: business.timezone
      },
      service: {
        name: service.name,
        duration: service.duration_minutes,
        price: service.price_cents
      }
    })

  } catch (error) {
    console.error('Slots API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, serviceDuration: number, interval: number = 30): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  for (let time = startMinutes; time + serviceDuration <= endMinutes; time += interval) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    slots.push(timeString)
  }
  
  return slots
}