'use client'

import { useState } from 'react'

export default function AuthTest() {
  const [status, setStatus] = useState('Ready to test')
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    setStatus('🔐 Testing auth endpoint directly...')

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Test auth endpoint directly with fetch
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey!}`
        },
        body: JSON.stringify({
          email: 'ralph.ulysse509@gmail.com',
          password: 'Poesie509$'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setStatus(`✅ Auth works! Access token: ${result.access_token?.slice(0, 20)}...`)
      } else {
        setStatus(`❌ Auth failed: ${result.error_description || result.msg}`)
      }

    } catch (err) {
      setStatus(`💥 Error: ${err}`)
      console.error('Auth test error:', err)
    }
    
    setLoading(false)
  }

  return (
    <div className="container mt-5">
      <h1>🔐 Direct Auth Test</h1>
      <div className="card">
        <div className="card-body">
          <h5>Status:</h5>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
          
          <button 
            className="btn btn-primary"
            onClick={testAuth}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Auth'}
          </button>
        </div>
      </div>
    </div>
  )
}