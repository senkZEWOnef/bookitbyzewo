import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

export async function loginUser(email: string, password: string) {
  const result = await query(
    'SELECT id, email, password, full_name FROM users WHERE email = $1',
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
      full_name: user.full_name
    },
    token
  }
}