export type AppointmentStatus = 'pending' | 'confirmed' | 'canceled' | 'noshow' | 'completed'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type PaymentType = 'deposit' | 'service' | 'no_show_fee'
export type MessagingMode = 'manual' | 'wa_cloud' | 'twilio'

export interface Profile {
  id: string
  full_name?: string
  phone?: string
  created_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  location?: string
  timezone: string
  messaging_mode: MessagingMode
  ath_movil_enabled?: boolean
  ath_movil_public_token?: string
  stripe_enabled?: boolean
  stripe_publishable_key?: string
}

export interface Staff {
  id: string
  business_id: string
  user_id?: string
  display_name: string
  phone?: string
  role: 'member' | 'admin'
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration_min: number
  price_cents: number
  deposit_cents: number
  buffer_before_min: number
  buffer_after_min: number
  max_per_slot: number
}

export interface ServiceStaff {
  service_id: string
  staff_id: string
}

export interface AvailabilityRule {
  id: string
  business_id: string
  staff_id?: string
  weekday: number // 0=Sunday
  start_time: string
  end_time: string
}

export interface AvailabilityException {
  id: string
  business_id: string
  staff_id?: string
  date: string
  is_closed: boolean
  start_time?: string
  end_time?: string
}

export interface Appointment {
  id: string
  business_id: string
  service_id: string
  staff_id?: string
  starts_at: string
  ends_at: string
  customer_name: string
  customer_phone: string
  customer_locale: string
  status: AppointmentStatus
  source: string
  notes?: string
  deposit_payment_id?: string
  created_at: string
}

export interface Payment {
  id: string
  business_id: string
  provider: 'stripe' | 'ath'
  external_id?: string
  amount_cents: number
  currency: string
  status: PaymentStatus
  kind: PaymentType
  created_at: string
  meta: any
}

export interface Message {
  id: string
  business_id: string
  appointment_id?: string
  to_phone: string
  channel: 'whatsapp' | 'sms'
  direction: 'out' | 'in'
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  template_key?: string
  body: string
  sent_at?: string
}