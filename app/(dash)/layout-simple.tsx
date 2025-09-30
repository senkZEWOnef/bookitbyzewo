'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're SURE there's no user (after loading is done)
    if (!loading && !user) {
      console.log('No user detected after loading, redirecting to login')
      // Add small delay to prevent race conditions
      setTimeout(() => {
        router.push('/login')
      }, 100)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div>
      {/* Simple header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container">
          <a className="navbar-brand" href="/dashboard">
            <i className="fab fa-whatsapp me-2"></i>
            BookIt Dashboard
          </a>
          
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              {user.email}
            </span>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={async () => {
                const { signOut } = await import('@/lib/auth')
                await signOut()
                router.push('/')
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      
      <div className="container mt-4">
        {children}
      </div>
    </div>
  )
}