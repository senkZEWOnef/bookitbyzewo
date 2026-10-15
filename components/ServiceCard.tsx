'use client'

import { Service } from '@/types/database'

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
  isSelected: boolean
  locale: 'en' | 'es'
}

export default function ServiceCard({ service, onSelect, isSelected, locale }: ServiceCardProps) {
  const formatPrice = (cents: number) => {
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })
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
    <button type="button" className={`bk-service ${isSelected ? 'sel' : ''}`} onClick={() => onSelect(service)}>
      <div className="flex-grow-1">
        <div className="nm">{service.name}</div>
        {service.description && <div className="meta">{service.description}</div>}
        <div className="meta">
          {formatDuration(service.duration_min)}
          {service.deposit_cents > 0 && (
            <span className="dep">{locale === 'es' ? 'Depósito' : 'Deposit'} {formatPrice(service.deposit_cents)}</span>
          )}
        </div>
      </div>
      {service.price_cents > 0 && <div className="price">{formatPrice(service.price_cents)}</div>}
    </button>
  )
}
