import { query } from '@/lib/db'
import type { AgentTool } from './agent'

const APPOINTMENT_COLUMNS = `
  a.id, a.customer_name, a.customer_phone, a.customer_email, a.status, a.notes,
  to_char(a.starts_at, 'YYYY-MM-DD HH24:MI') AS starts_at,
  to_char(a.ends_at, 'YYYY-MM-DD HH24:MI') AS ends_at,
  s.name AS service, b.name AS business`

const FROM_OWNED = `
  FROM appointments a
  JOIN businesses b ON b.id = a.business_id AND b.owner_id = $1
  LEFT JOIN services s ON s.id = a.service_id`

async function getOwnedAppointment(userId: string, id: string) {
  const result = await query(`SELECT ${APPOINTMENT_COLUMNS} ${FROM_OWNED} WHERE a.id = $2`, [userId, id])
  if (result.rows.length === 0) throw new Error('Appointment not found.')
  return result.rows[0]
}

// Every tool is scoped to businesses owned by `userId`, whatever the model asks for
export function buildUserTools(userId: string, origin: string): Record<string, AgentTool> {
  return {
    list_appointments: {
      def: {
        name: 'list_appointments',
        description:
          'List appointments for the owner\'s businesses, soonest first. Filter by date range (YYYY-MM-DD, inclusive), status (pending, confirmed, canceled, completed) or a customer name/phone search.',
        input_schema: {
          type: 'object',
          properties: {
            date_from: { type: 'string', description: 'YYYY-MM-DD' },
            date_to: { type: 'string', description: 'YYYY-MM-DD' },
            status: { type: 'string' },
            search: { type: 'string', description: 'Part of the customer name or phone' },
            limit: { type: 'integer', description: 'Max rows, default 25, max 50' }
          }
        }
      },
      run: async input => {
        const params: unknown[] = [userId]
        const where: string[] = []
        if (input.date_from) { params.push(input.date_from); where.push(`a.starts_at >= $${params.length}::date`) }
        if (input.date_to) { params.push(input.date_to); where.push(`a.starts_at < ($${params.length}::date + INTERVAL '1 day')`) }
        if (input.status) { params.push(input.status); where.push(`a.status = $${params.length}`) }
        if (input.search) {
          params.push(`%${input.search}%`)
          where.push(`(a.customer_name ILIKE $${params.length} OR a.customer_phone ILIKE $${params.length})`)
        }
        params.push(Math.min(Math.max(parseInt(input.limit) || 25, 1), 50))
        const result = await query(
          `SELECT ${APPOINTMENT_COLUMNS} ${FROM_OWNED}
           ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
           ORDER BY a.starts_at ASC LIMIT $${params.length}`,
          params
        )
        return { count: result.rows.length, appointments: result.rows }
      }
    },

    get_appointment: {
      def: {
        name: 'get_appointment',
        description: 'Get the full details of one appointment by its id.',
        input_schema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      },
      run: async input => getOwnedAppointment(userId, String(input.id))
    },

    accept_appointment: {
      def: {
        name: 'accept_appointment',
        description: 'Accept (confirm) a pending appointment.',
        input_schema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      },
      run: async input => {
        const appointment = await getOwnedAppointment(userId, String(input.id))
        if (appointment.status === 'canceled') throw new Error('That appointment is already canceled.')
        if (appointment.status === 'confirmed') return { already: true, appointment }
        await query(`UPDATE appointments SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [appointment.id])
        return { accepted: true, customer: appointment.customer_name, starts_at: appointment.starts_at }
      }
    },

    cancel_appointment: {
      def: {
        name: 'cancel_appointment',
        description:
          'Cancel an appointment. This also refunds the deposit when the cancellation policy allows and notifies the customer, so the user must approve it with a button first.',
        input_schema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      },
      confirm: async input => {
        const a = await getOwnedAppointment(userId, String(input.id))
        return `Cancel ${a.customer_name}'s ${a.service || 'appointment'} on ${a.starts_at} and notify them`
      },
      run: async input => {
        const appointment = await getOwnedAppointment(userId, String(input.id))
        // Reuse the existing cancel flow so refunds and customer notifications behave the same as the dashboard
        const response = await fetch(`${origin}/api/appointments/${appointment.id}/cancel`, { method: 'PATCH' })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Could not cancel the appointment.')
        return { canceled: true, customer: appointment.customer_name, starts_at: appointment.starts_at, refund: data.refund }
      }
    }
  }
}
