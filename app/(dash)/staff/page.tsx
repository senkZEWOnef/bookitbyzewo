'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the dashboard staff page
    router.replace('/dashboard/staff')
  }, [router])

  return (
    <div className="text-center py-5">
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Redirecting...</span>
      </div>
    </div>
  )
}