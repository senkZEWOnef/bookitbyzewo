'use client'

import { useEffect } from 'react'
import { Button, Alert } from 'react-bootstrap'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="p-4">
      <Alert variant="danger" className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <i className="fas fa-exclamation-circle fs-4 me-3"></i>
          <div>
            <Alert.Heading className="mb-1">Dashboard Error</Alert.Heading>
            <p className="mb-0 small">
              Something went wrong while loading this page.
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 p-2 bg-white rounded">
            <code className="text-danger small">{error.message}</code>
          </div>
        )}

        <hr />

        <div className="d-flex gap-2">
          <Button variant="danger" size="sm" onClick={() => reset()}>
            <i className="fas fa-redo me-1"></i>
            Try again
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => window.location.href = '/dashboard'}
          >
            <i className="fas fa-tachometer-alt me-1"></i>
            Go to Dashboard
          </Button>
        </div>
      </Alert>
    </div>
  )
}
