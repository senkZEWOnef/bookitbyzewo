'use client'

import { useEffect } from 'react'
import { Button, Container } from 'react-bootstrap'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <Container className="py-5 text-center">
      <div
        className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
        style={{
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.2)'
        }}
      >
        <i className="fas fa-exclamation-triangle fs-1 text-danger"></i>
      </div>

      <h2 className="fw-bold mb-3">Something went wrong</h2>

      <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '500px' }}>
        We encountered an unexpected error. Please try again or contact support if the problem persists.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-light rounded text-start mx-auto" style={{ maxWidth: '600px' }}>
          <code className="text-danger small">
            {error.message}
          </code>
        </div>
      )}

      <div className="d-flex justify-content-center gap-3">
        <Button
          variant="success"
          onClick={() => reset()}
        >
          <i className="fas fa-redo me-2"></i>
          Try again
        </Button>

        <Button
          variant="outline-secondary"
          onClick={() => window.location.href = '/'}
        >
          <i className="fas fa-home me-2"></i>
          Go home
        </Button>
      </div>
    </Container>
  )
}
