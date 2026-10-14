import { NextRequest } from 'next/server'
import { query } from './db'

// Returns the admin session token if the request carries a valid, unexpired one
export async function getAdminSession(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const result = await query('SELECT expires_at FROM admin_sessions WHERE session_token = $1', [token])
    if (result.rows.length === 0 || new Date(result.rows[0].expires_at) < new Date()) return null
    return token
  } catch {
    return null
  }
}
