import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { format, parseISO } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id.replace('.ics', '')
    
    const result = await query(`
      SELECT 
        a.*,
        s.name as service_name,
        s.description as service_description,
        b.name as business_name,
        b.location as business_location
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN businesses b ON a.business_id = b.id
      WHERE a.id = $1
    `, [appointmentId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const appointment = result.rows[0]

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