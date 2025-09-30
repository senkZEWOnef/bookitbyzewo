'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleTest() {
  const [status, setStatus] = useState('Starting test...')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const test = async () => {
      try {
        setStatus('🔍 Step 1: Clearing session...')
        console.log('Step 1: Clearing session...')
        
        await supabase.auth.signOut()
        
        setStatus('⏳ Step 2: Waiting...')
        console.log('Step 2: Waiting...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setStatus('🔐 Step 3: Attempting login...')
        console.log('Step 3: Attempting login...')
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'ralph.ulysse509@gmail.com',
          password: 'Poesie509$',
        })

        console.log('Login result:', { data: !!data, error })

        if (error) {
          setStatus(`❌ Login failed: ${error.message}`)
          return
        }

        setStatus('✅ Step 4: Login successful! Checking session...')
        console.log('Step 4: Login successful')
        setUser(data.user)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session result:', { session: !!session, error: sessionError })
        
        if (sessionError) {
          setStatus(`❌ Session error: ${sessionError.message}`)
        } else if (session) {
          setStatus(`✅ ALL GOOD! User: ${session.user?.email}`)
        } else {
          setStatus('❌ No session found after login')
        }

      } catch (err) {
        console.error('Test error:', err)
        setStatus(`💥 Error: ${err}`)
      }
    }

    test()
  }, [])

  return (
    <div className="container mt-5">
      <h1>🧪 Auth Test</h1>
      <div className="card">
        <div className="card-body">
          <h5>Status:</h5>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
          
          {user && (
            <div>
              <h5>User Data:</h5>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
          
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Run Test Again
          </button>
        </div>
      </div>
    </div>
  )
}