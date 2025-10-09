'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { signIn } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const authError = searchParams.get('error')

  useEffect(() => {
    if (authError) {
      switch (authError) {
        case 'auth_callback_error':
          setError('Authentication failed. Please try again.')
          break
        case 'auth_exchange_error':
          setError('Session setup failed. Please try logging in again.')
          break
        case 'no_auth_code':
          setError('Authentication code missing. Please try again.')
          break
        default:
          setError('An authentication error occurred.')
      }
    }
  }, [authError])

  const handleLogin = async (e: React.FormEvent) => {
    console.log('🔐 LOGIN: handleLogin called')
    console.log('🔐 LOGIN: Event type:', e.type)
    console.log('🔐 LOGIN: Current target:', e.currentTarget)
    
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🔐 LOGIN: Form submitted!')
    console.log('🔐 LOGIN: Email:', email)
    console.log('🔐 LOGIN: Password length:', password.length)
    
    setLoading(true)
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    const { data, error } = await signIn(email.trim(), password)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      window.location.href = '/dashboard'
      return
    }
    
    setLoading(false)
  }

  // Test function to bypass form
  const testMockAuth = async () => {
    console.log('🧪 TEST: Direct mock auth test - button clicked!')
    alert('Test button clicked - check console!')
    try {
      console.log('🧪 TEST: About to call mockAuth.signInWithPassword')
      const result = await mockAuth.signInWithPassword({
        email: 'ralph.ulysse509@gmail.com',
        password: 'Poesie509$$$'
      })
      console.log('🧪 TEST: Mock auth result:', result)
      alert(`Mock auth result: ${JSON.stringify(result)}`)
      if (result.data?.user) {
        console.log('🧪 TEST: Success! Redirecting...')
        alert('Success! About to redirect...')
        window.location.href = '/dashboard'
      } else {
        alert('No user in result')
      }
    } catch (err) {
      console.error('🧪 TEST: Error:', err)
      alert(`Error: ${err.message}`)
    }
  }

  // Test real Supabase connectivity
  const testRealSupabase = async () => {
    console.log('🔧 SUPABASE TEST: Testing direct fetch to Supabase')
    alert('Testing direct fetch - check console!')
    
    try {
      console.log('🔧 SUPABASE TEST: Making direct fetch call...')
      const response = await fetch('https://itbgpdzvggnvhjrysadh.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YmdwZHp2Z2dudmhqcnlzYWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODkzNTksImV4cCI6MjA3NTI2NTM1OX0.LxWBsCZF4dbErBcWnI6mWS4Ud5CW1f20NpAGNfPVMTQ'
        },
        body: JSON.stringify({
          email: 'ralph.ulysse509@gmail.com',
          password: 'Poesie509$$$'
        })
      })
      
      console.log('🔧 SUPABASE TEST: Fetch response status:', response.status)
      const result = await response.json()
      console.log('🔧 SUPABASE TEST: Fetch result:', result)
      
      if (result.access_token) {
        alert('Direct fetch SUCCESS! Supabase is working.')
        
        // Now test with Supabase client
        console.log('🔧 SUPABASE TEST: Now testing with Supabase client...')
        const testClient = createSupabaseClient()
        const { data, error } = await testClient.auth.signInWithPassword({
          email: 'ralph.ulysse509@gmail.com',
          password: 'Poesie509$$$'
        })
        
        console.log('🔧 SUPABASE TEST: Client result:', { data, error })
        alert(`Client result: ${error ? error.message : 'Success!'}`)
      } else {
        alert(`Direct fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('🔧 SUPABASE TEST: Direct fetch error:', err)
      alert(`Direct fetch error: ${err.message}`)
    }
  }

  return (
    <Card>
      <Card.Body className="p-4">
        <h4 className="text-center mb-4">{t('auth.login.title')}</h4>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.login.email')}</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>{t('auth.login.password')}</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tu contraseña"
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="success" 
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login.submit')}
          </Button>
        </Form>
        
        <div className="text-center">
          <p className="mb-2">
            {t('auth.login.signup')}{' '}
            <Link href="/signup" className="text-success text-decoration-none">
              {t('nav.signup')}
            </Link>
          </p>
          <Link href="/forgot-password" className="text-muted text-decoration-none small">
            {t('auth.login.forgot')}
          </Link>
        </div>
      </Card.Body>
    </Card>
  )
}