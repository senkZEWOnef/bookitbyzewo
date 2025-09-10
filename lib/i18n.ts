export type Locale = 'en' | 'es'

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    services: 'Services',
    staff: 'Staff',
    settings: 'Settings',
    signOut: 'Sign Out',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    close: 'Close',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    today: 'Today',
    tomorrow: 'Tomorrow',
    
    // Authentication
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Booking
    bookAppointment: 'Book your appointment',
    selectService: 'Choose a service',
    selectTime: 'Choose a time',
    customerDetails: 'Your information',
    paymentRequired: 'Payment required',
    bookingConfirmed: 'Booking Confirmed!',
    appointmentBooked: 'Your appointment has been successfully booked',
    
    // Services
    serviceName: 'Service Name',
    duration: 'Duration',
    price: 'Price',
    deposit: 'Deposit',
    description: 'Description',
    
    // Appointments
    confirmed: 'Confirmed',
    pending: 'Pending',
    canceled: 'Canceled',
    completed: 'Completed',
    noShow: 'No Show',
    
    // WhatsApp
    openWhatsApp: 'Open WhatsApp',
    sendMessage: 'Send message',
    messageTemplate: 'Message template',
    customMessage: 'Custom message',
    
    // Time
    minutes: 'minutes',
    hours: 'hours',
    
    // Days
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday'
  },
  
  es: {
    // Navigation
    dashboard: 'Panel',
    calendar: 'Calendario',
    services: 'Servicios',
    staff: 'Personal',
    settings: 'Configuración',
    signOut: 'Cerrar Sesión',

    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    close: 'Cerrar',
    continue: 'Continuar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    today: 'Hoy',
    tomorrow: 'Mañana',
    
    // Authentication
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    fullName: 'Nombre Completo',
    phone: 'Teléfono',
    createAccount: 'Crear Cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
    
    // Booking
    bookAppointment: 'Reserva tu cita',
    selectService: 'Selecciona un servicio',
    selectTime: 'Selecciona horario',
    customerDetails: 'Tus datos',
    paymentRequired: 'Pago requerido',
    bookingConfirmed: '¡Reserva Confirmada!',
    appointmentBooked: 'Tu cita ha sido reservada exitosamente',
    
    // Services
    serviceName: 'Nombre del Servicio',
    duration: 'Duración',
    price: 'Precio',
    deposit: 'Depósito',
    description: 'Descripción',
    
    // Appointments
    confirmed: 'Confirmada',
    pending: 'Pendiente',
    canceled: 'Cancelada',
    completed: 'Completada',
    noShow: 'No Asistió',
    
    // WhatsApp
    openWhatsApp: 'Abrir WhatsApp',
    sendMessage: 'Enviar mensaje',
    messageTemplate: 'Plantilla de mensaje',
    customMessage: 'Mensaje personalizado',
    
    // Time
    minutes: 'minutos',
    hours: 'horas',
    
    // Days
    sunday: 'Domingo',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado'
  }
}

export function getTranslation(locale: Locale, key: keyof typeof translations.en): string {
  return translations[locale][key] || translations.en[key] || key
}

export function detectLocale(userLocale?: string): Locale {
  if (!userLocale) return 'es' // Default to Spanish for PR market
  
  if (userLocale.startsWith('es')) return 'es'
  if (userLocale.startsWith('en')) return 'en'
  
  return 'es' // Default fallback
}

export function formatCurrency(amount: number, locale: Locale = 'en'): string {
  return (amount / 100).toLocaleString(locale === 'es' ? 'es-US' : 'en-US', {
    style: 'currency',
    currency: 'USD'
  })
}

export function formatDuration(minutes: number, locale: Locale = 'en'): string {
  if (minutes < 60) {
    return `${minutes} ${getTranslation(locale, 'minutes')}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  
  if (remainingMins === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMins}min`
}