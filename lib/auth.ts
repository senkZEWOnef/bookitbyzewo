import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './db'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

const JWT_SECRET = getJwtSecret()

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(email: string, password: string, fullName?: string) {
  const hashedPassword = await hashPassword(password)
  
  const result = await query(
    'INSERT INTO users (id, email, password, full_name, created_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING id, email, full_name',
    [email, hashedPassword, fullName]
  )
  
  return result.rows[0]
}

export function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.replace('Bearer ', '')
  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function loginUser(email: string, password: string) {
  const result = await query(
    'SELECT id, email, password, full_name, plan, plan_status, trial_ends_at FROM users WHERE email = $1',
    [email]
  )
  
  const user = result.rows[0]
  if (!user) {
    throw new Error('Invalid credentials')
  }
  
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    throw new Error('Invalid credentials')
  }
  
  const token = generateToken(user.id)
  
  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      plan: user.plan,
      plan_status: user.plan_status,
      trial_ends_at: user.trial_ends_at
    },
    token
  }
}