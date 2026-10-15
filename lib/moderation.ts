import { query } from './db'

// banned_at on users, suspended_at on businesses. Created on first use so no manual migration is needed.
let ready: Promise<unknown> | null = null

export function ensureModerationColumns() {
  if (!ready) {
    ready = Promise.all([
      query('ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP'),
      query('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP')
    ]).catch(error => {
      ready = null // try again next time
      throw error
    })
  }
  return ready
}

// Matches businesses that are open for bookings: not suspended and the owner is not banned.
// Use together with `FROM businesses b LEFT JOIN users u ON u.id = b.owner_id`.
export const BUSINESS_IS_OPEN = 'b.suspended_at IS NULL AND u.banned_at IS NULL'
