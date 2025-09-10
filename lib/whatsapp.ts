interface WhatsAppMessage {
  phone: string
  message: string
}

export function createWhatsAppLink({ phone, message }: WhatsAppMessage): string {
  const cleanPhone = phone.replace(/[^\d]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export const messageTemplates = {
  es: {
    confirmation: (data: {
      name: string
      service: string
      date: string
      time: string
      location?: string
      rescheduleLink: string
      cancelLink: string
      icsLink: string
    }) => `Hola ${data.name}! ✅ Tu ${data.service} está confirmado para ${data.date} a las ${data.time}.

${data.location ? `Dirección: ${data.location}` : ''}
Administrar: ${data.rescheduleLink} | ${data.cancelLink}
Añadir al calendario: ${data.icsLink}

¡Nos vemos pronto!`,

    reminder24h: (data: {
      name: string
      service: string
      date: string
      time: string
      rescheduleLink: string
    }) => `Recordatorio: ${data.service} mañana a las ${data.time}.

Si necesitas reprogramar: ${data.rescheduleLink}`,

    reminder2h: (data: {
      name: string
      service: string
      time: string
    }) => `Recordatorio: Tu ${data.service} es en 2 horas (${data.time}).

¡Nos vemos pronto! 👋`,

    depositRequest: (data: {
      name: string
      service: string
      date: string
      time: string
      deposit: string
      paymentLink: string
    }) => `Hola ${data.name} 👋 Para confirmar tu ${data.service} el ${data.date} a las ${data.time}, envía el depósito de ${data.deposit}:

${data.paymentLink}

¡Gracias!`,

    runningLate: (data: {
      name: string
      minutes: number
      newTime: string
    }) => `Hola ${data.name}! Voy con ${data.minutes} min de retraso 🙏

Llegaré aprox. a las ${data.newTime}. Gracias por tu paciencia.`
  },

  en: {
    confirmation: (data: {
      name: string
      service: string
      date: string
      time: string
      location?: string
      rescheduleLink: string
      cancelLink: string
      icsLink: string
    }) => `Hi ${data.name}! ✅ Your ${data.service} is confirmed for ${data.date} at ${data.time}.

${data.location ? `Location: ${data.location}` : ''}
Manage: ${data.rescheduleLink} | ${data.cancelLink}
Add to calendar: ${data.icsLink}

See you soon!`,

    reminder24h: (data: {
      name: string
      service: string
      date: string
      time: string
      rescheduleLink: string
    }) => `Reminder: ${data.service} tomorrow at ${data.time}.

If you need to reschedule: ${data.rescheduleLink}`,

    reminder2h: (data: {
      name: string
      service: string
      time: string
    }) => `Reminder: Your ${data.service} is in 2 hours (${data.time}).

See you soon! 👋`,

    depositRequest: (data: {
      name: string
      service: string
      date: string
      time: string
      deposit: string
      paymentLink: string
    }) => `Hi ${data.name} 👋 To confirm your ${data.service} on ${data.date} at ${data.time}, please send the deposit of ${data.deposit}:

${data.paymentLink}

Thank you!`,

    runningLate: (data: {
      name: string
      minutes: number
      newTime: string
    }) => `Hi ${data.name}! I'm running ${data.minutes} minutes late 🙏

I'll arrive around ${data.newTime}. Thanks for your patience.`
  }
}

export function getTemplate(locale: string, templateKey: string, data: any): string {
  const lang = locale.startsWith('es') ? 'es' : 'en'
  const template = messageTemplates[lang]?.[templateKey as keyof typeof messageTemplates.es]
  
  if (typeof template === 'function') {
    return template(data)
  }
  
  return ''
}