'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Attempting login with:', email)
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        console.error('Login error:', signInError)
        setError(signInError.message)
        setLoading(false)
      } else {
        console.log('Login successful, redirecting...')
        // Wait a moment for session to establish
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Login failed:', err)
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="fab fa-whatsapp text-success" style={{ fontSize: '3rem' }}></i>
            <h3 className="mt-3">Welcome Back</h3>
            <p className="text-muted">Sign in to your BookIt dashboard</p>
          </div>
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-success w-100 py-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <small className="text-muted">
              Don't have an account? <a href="/signup">Sign up</a>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}