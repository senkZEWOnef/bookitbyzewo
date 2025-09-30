'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TestLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')

  const handleTest = async () => {
    setResult('Testing...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else {
        setResult(`✅ Success! User: ${data.user?.email}`)
        // Simple redirect
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setResult(`💥 Failed: ${err}`)
    }
  }

  return (
    <div className="container mt-5">
      <h1>🧪 Test Login</h1>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleTest}>
            Test Login
          </button>
          
          <div className="mt-4">
            <h5>Result:</h5>
            <pre>{result}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}