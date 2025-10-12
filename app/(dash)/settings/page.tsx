'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the dashboard settings page
    router.replace('/dashboard/settings')
  }, [router])

  return (
    <div className="text-center py-5">
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Redirecting...</span>
      </div>
    </div>
  )
}