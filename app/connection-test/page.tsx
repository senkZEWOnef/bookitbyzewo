'use client'

import { useState, useEffect } from 'react'

export default function ConnectionTest() {
  const [status, setStatus] = useState('Testing connection...')

  useEffect(() => {
    const test = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        setStatus(`URL: ${supabaseUrl}`)
        
        if (!supabaseUrl || !supabaseKey) {
          setStatus('❌ Missing environment variables')
          return
        }

        setStatus('🌐 Testing network connection...')
        
        // Test basic connectivity
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })

        if (response.ok) {
          setStatus('✅ Network connection works!')
        } else {
          setStatus(`❌ Connection failed: ${response.status} ${response.statusText}`)
        }

      } catch (err) {
        setStatus(`💥 Network error: ${err}`)
        console.error('Connection test error:', err)
      }
    }

    test()
  }, [])

  return (
    <div className="container mt-5">
      <h1>🌐 Connection Test</h1>
      <div className="card">
        <div className="card-body">
          <h5>Status:</h5>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
          
          <div className="mt-3">
            <h6>Environment Check:</h6>
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing'}</p>
            <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}