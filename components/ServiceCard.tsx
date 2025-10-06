'use client'

import { Card, Badge, Button } from 'react-bootstrap'
import { Service } from '@/types/database'

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
  isSelected: boolean
  locale: 'en' | 'es'
}

export default function ServiceCard({ service, onSelect, isSelected, locale }: ServiceCardProps) {
  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return locale === 'es' ? `${minutes} min` : `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) {
      return locale === 'es' ? `${hours}h` : `${hours}h`
    }
    return locale === 'es' ? `${hours}h ${remainingMins}min` : `${hours}h ${remainingMins}min`
  }

  return (
    <Card 
      className={`mb-3 cursor-pointer transition-all ${isSelected ? 'border-success shadow' : 'border-light'}`}
      onClick={() => onSelect(service)}
      style={{ cursor: 'pointer' }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h5 className="mb-2">{service.name}</h5>
            {service.description && (
              <p className="text-muted small mb-2">{service.description}</p>
            )}
            <div className="d-flex gap-2 flex-wrap">
              <Badge bg="light" text="dark">
                <i className="fas fa-clock me-1"></i>
                {formatDuration(service.duration_min)}
              </Badge>
              {service.price_cents > 0 && (
                <Badge bg="light" text="dark">
                  <i className="fas fa-dollar-sign me-1"></i>
                  {formatPrice(service.price_cents)}
                </Badge>
              )}
              {service.deposit_cents > 0 && (
                <Badge bg="warning" text="dark">
                  <i className="fas fa-shield-alt me-1"></i>
                  {locale === 'es' ? 'Depósito' : 'Deposit'} {formatPrice(service.deposit_cents)}
                </Badge>
              )}
            </div>
          </div>
          <div className="ms-3">
            <Button 
              variant={isSelected ? 'success' : 'outline-success'}
              size="sm"
            >
              {isSelected ? (
                <i className="fas fa-check"></i>
              ) : (
                locale === 'es' ? 'Seleccionar' : 'Select'
              )}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}