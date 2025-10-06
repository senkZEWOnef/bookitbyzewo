import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format, parseISO, addMinutes, startOfDay, endOfDay } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
import { generateTimeSlots, isSlotAvailable } from '@/lib/time'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const staffId = searchParams.get('staffId')

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Date and serviceId are required' },
        { status: 400 }
      )
    }

    // Get business and service details
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('business_id', business.id)
      .single()

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Get availability rules for the specific weekday
    const targetDate = parseISO(date)
    const weekday = targetDate.getDay() // 0 = Sunday
    
    let availabilityQuery = supabase
      .from('availability_rules')
      .select('*')
      .eq('business_id', business.id)
      .eq('weekday', weekday)
    
    if (staffId) {
      availabilityQuery = availabilityQuery.eq('staff_id', staffId)
    } else {
      availabilityQuery = availabilityQuery.is('staff_id', null)
    }
    
    const { data: availabilityRules } = await availabilityQuery

    if (!availabilityRules || availabilityRules.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Get availability exceptions for this date
    let exceptionsQuery = supabase
      .from('availability_exceptions')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', date)
    
    if (staffId) {
      exceptionsQuery = exceptionsQuery.eq('staff_id', staffId)
    } else {
      exceptionsQuery = exceptionsQuery.is('staff_id', null)
    }
    
    const { data: exceptions } = await exceptionsQuery

    // Check if the day is marked as closed
    const isClosed = exceptions?.some(exc => exc.is_closed)
    if (isClosed) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing appointments for this date and staff
    const dayStart = zonedTimeToUtc(startOfDay(targetDate), business.timezone)
    const dayEnd = zonedTimeToUtc(endOfDay(targetDate), business.timezone)

    let appointmentsQuery = supabase
      .from('appointments')
      .select('starts_at, ends_at')
      .eq('business_id', business.id)
      .gte('starts_at', dayStart.toISOString())
      .lte('starts_at', dayEnd.toISOString())
      .in('status', ['confirmed', 'pending'])
    
    if (staffId) {
      appointmentsQuery = appointmentsQuery.eq('staff_id', staffId)
    } else {
      appointmentsQuery = appointmentsQuery.is('staff_id', null)
    }
    
    const { data: existingAppointments } = await appointmentsQuery

    // Generate time slots
    const slots: { datetime: string; available: boolean }[] = []
    
    for (const rule of availabilityRules) {
      const timeSlots = generateTimeSlots(
        rule.start_time,
        rule.end_time,
        service.duration_min,
        15 // 15-minute granularity
      )

      for (const timeSlot of timeSlots) {
        // Create the full datetime in business timezone
        const slotDateTime = new Date(`${date}T${timeSlot}:00`)
        const slotDateTimeUTC = zonedTimeToUtc(slotDateTime, business.timezone)

        // Skip past slots
        if (slotDateTimeUTC <= new Date()) {
          continue
        }

        // Check availability against existing appointments
        const available = isSlotAvailable(
          slotDateTimeUTC,
          service.duration_min,
          service.buffer_before_min,
          service.buffer_after_min,
          existingAppointments || []
        )

        slots.push({
          datetime: slotDateTimeUTC.toISOString(),
          available
        })
      }
    }

    // Sort slots by time
    slots.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Slots API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    )
  }
}