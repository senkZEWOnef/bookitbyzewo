'use client'

import { useState } from 'react'
import { workingAuth } from '@/lib/auth-working'

export default function WorkingTest() {
  const [status, setStatus] = useState('Ready to test')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const testLogin = async () => {
    setLoading(true)
    setStatus('🔐 Logging in with working auth...')

    try {
      const { data, error } = await workingAuth.signIn('ralph.ulysse509@gmail.com', 'Poesie509$')
      
      if (error) {
        setStatus(`❌ Login failed: ${error.message}`)
      } else {
        setStatus('✅ Login successful! Checking user...')
        setUser(data?.user)
        
        // Test getting user
        const { data: userData } = await workingAuth.getUser()
        if (userData?.user) {
          setStatus(`🎉 COMPLETE SUCCESS! User: ${userData.user.email}`)
        }
      }
    } catch (err) {
      setStatus(`💥 Error: ${err}`)
    }
    
    setLoading(false)
  }

  const testDashboard = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="container mt-5">
      <h1>🚀 Working Auth Test</h1>
      <div className="card">
        <div className="card-body">
          <h5>Status:</h5>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
          
          {user && (
            <div className="mb-3">
              <h6>User Data:</h6>
              <pre style={{ fontSize: '12px' }}>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
          
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={testLogin}
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Working Login'}
            </button>
            
            {user && (
              <button 
                className="btn btn-success"
                onClick={testDashboard}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}