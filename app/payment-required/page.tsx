'use client'

import { useSearchParams } from 'next/navigation'
import PaymentRequired from '@/components/PaymentRequired'

export default function PaymentRequiredPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') as 'trial_expired' | 'payment_failed' | 'no_payment_method' || 'no_payment_method'
  const businessName = searchParams.get('business') || undefined

  return <PaymentRequired reason={reason} businessName={businessName} />
}