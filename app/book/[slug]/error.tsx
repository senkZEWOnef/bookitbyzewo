'use client'

import { useEffect } from 'react'
import { Button, Container, Alert } from 'react-bootstrap'

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Booking error:', error)
  }, [error])

  return (
    <Container className="py-5">
      <div className="text-center">
        <div
          className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
          style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
            border: '2px solid rgba(245, 158, 11, 0.2)'
          }}
        >
          <i className="fas fa-calendar-times fs-1 text-warning"></i>
        </div>

        <h3 className="fw-bold mb-3">Booking Unavailable</h3>

        <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
          We're having trouble loading the booking page. This could be a temporary issue.
        </p>

        <Alert variant="light" className="mx-auto mb-4" style={{ maxWidth: '500px' }}>
          <i className="fas fa-info-circle me-2 text-primary"></i>
          <span className="small">
            If this problem continues, please contact the business directly.
          </span>
        </Alert>

        <div className="d-flex justify-content-center gap-3">
          <Button variant="success" onClick={() => reset()}>
            <i className="fas fa-redo me-2"></i>
            Try again
          </Button>

          <Button
            variant="outline-secondary"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Go back
          </Button>
        </div>
      </div>
    </Container>
  )
}
