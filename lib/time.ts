import { format, parseISO, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz'

export function formatTimeInTimezone(date: Date | string, timezone: string, formatStr: string = 'PPp') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(dateObj, timezone, formatStr)
}

export function convertToTimezone(date: Date | string, timezone: string) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return utcToZonedTime(dateObj, timezone)
}

export function convertFromTimezone(date: Date, timezone: string) {
  return zonedTimeToUtc(date, timezone)
}

export function generateTimeSlots(
  startTime: string, // HH:mm format
  endTime: string,   // HH:mm format
  durationMinutes: number,
  granularityMinutes: number = 15
): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += granularityMinutes) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
  }
  
  return slots
}

export function isSlotAvailable(
  slotStart: Date,
  slotDuration: number,
  bufferBefore: number,
  bufferAfter: number,
  existingAppointments: Array<{ starts_at: string; ends_at: string }>
): boolean {
  const effectiveStart = new Date(slotStart.getTime() - bufferBefore * 60000)
  const effectiveEnd = new Date(slotStart.getTime() + (slotDuration + bufferAfter) * 60000)
  
  return !existingAppointments.some(apt => {
    const aptStart = parseISO(apt.starts_at)
    const aptEnd = parseISO(apt.ends_at)
    
    return (
      isWithinInterval(effectiveStart, { start: aptStart, end: aptEnd }) ||
      isWithinInterval(effectiveEnd, { start: aptStart, end: aptEnd }) ||
      isWithinInterval(aptStart, { start: effectiveStart, end: effectiveEnd })
    )
  })
}