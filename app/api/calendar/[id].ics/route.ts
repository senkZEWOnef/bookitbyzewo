import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { format, parseISO } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const appointmentId = params.id.replace('.ics', '')
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services (name, description),
        businesses (name, location)
      `)
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Format dates for ICS (YYYYMMDDTHHMMSSZ format)
    const formatICSDate = (date: string) => {
      return format(parseISO(date), "yyyyMMdd'T'HHmmss'Z'")
    }

    const startDate = formatICSDate(appointment.starts_at)
    const endDate = formatICSDate(appointment.ends_at)
    const createdDate = formatICSDate(appointment.created_at)

    // Generate ICS content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BookIt by Zewo//Appointment//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:appointment-${appointment.id}@bookitbyzewo.com
DTSTART:${startDate}
DTEND:${endDate}
DTSTAMP:${createdDate}
SUMMARY:${appointment.service_name} - ${appointment.business_name}
DESCRIPTION:Appointment for ${appointment.service_name}${appointment.service_description ? '\\n\\n' + appointment.service_description : ''}\\n\\nCustomer: ${appointment.customer_name}\\n\\nPowered by BookIt by Zewo
LOCATION:${appointment.business_location || appointment.business_name}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Reminder: ${appointment.service_name} appointment tomorrow
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
DESCRIPTION:Reminder: ${appointment.service_name} appointment in 2 hours
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="appointment-${appointment.id}.ics"`
      }
    })
  } catch (error) {
    console.error('ICS generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    )
  }
}