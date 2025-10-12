// WhatsApp service for sending staff invitations and other messages
// This integrates with WhatsApp Business API or WhatsApp Cloud API

interface WhatsAppInvitationParams {
  to: string // Phone number in international format
  businessName: string
  role: string
  invitationUrl: string
  inviterName: string
}

export async function sendStaffInvitationWhatsApp({
  to,
  businessName,
  role,
  invitationUrl,
  inviterName
}: WhatsAppInvitationParams) {
  try {
    // Format phone number (remove any spaces, dashes, etc.)
    const phoneNumber = to.replace(/[^\d+]/g, '')
    
    // Create invitation message
    const message = `🎉 *¡Invitación a ${businessName}!*

¡Hola! ${inviterName} te ha invitado a unirte a su equipo en *${businessName}* como *${role}*.

🚀 *Con BookIt by Zewo podrás:*
📅 Gestionar tus citas y horarios
👥 Ver información de clientes
💬 Manejar reservas por WhatsApp
📊 Acceder a tu panel personalizado
🏢 Alternar entre múltiples negocios

*Para aceptar la invitación:*
👆 Haz clic aquí: ${invitationUrl}

⏰ *Importante:* Esta invitación expira en 7 días.

Si ya tienes una cuenta de BookIt con este email, serás automáticamente añadido al equipo de ${businessName}.

¡Bienvenido al equipo! 🎊

---
*BookIt by Zewo* - Reservas profesionales hechas fácil`

    console.log('📱 Sending WhatsApp staff invitation to:', phoneNumber)

    // Check if WhatsApp is configured
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('⚠️  WhatsApp credentials not configured, message will be logged only')
      console.log('📱 WhatsApp Message Preview:')
      console.log('To:', phoneNumber)
      console.log('Message:', message.substring(0, 200) + '...')
      return { success: true, message: 'WhatsApp message logged (not configured)' }
    }

    // Send via WhatsApp Cloud API (Official)
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ WhatsApp API error:', result)
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`)
      }

      console.log('✅ WhatsApp invitation sent successfully:', result.messages?.[0]?.id)
      return { success: true, message: 'WhatsApp invitation sent successfully', messageId: result.messages?.[0]?.id }

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error)
      
      // Fallback: Try Twilio if WhatsApp Cloud API fails and Twilio is configured
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
        console.log('🔄 Trying Twilio WhatsApp API as fallback...')
        return await sendViaTrilio(phoneNumber, message)
      }
      
      throw error
    }

  } catch (error) {
    console.error('Error sending WhatsApp invitation:', error)
    throw error
  }
}

// Fallback function for Twilio WhatsApp API
async function sendViaTrilio(phoneNumber: string, message: string) {
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        To: `whatsapp:${phoneNumber}`,
        Body: message
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Twilio WhatsApp API error:', result)
      throw new Error(`Twilio error: ${result.message || 'Unknown error'}`)
    }

    console.log('✅ WhatsApp invitation sent via Twilio:', result.sid)
    return { success: true, message: 'WhatsApp invitation sent via Twilio', messageId: result.sid }

  } catch (error) {
    console.error('❌ Twilio WhatsApp fallback failed:', error)
    throw error
  }
}

export async function sendAppointmentReminderWhatsApp(
  phoneNumber: string,
  appointmentDetails: any
) {
  // TODO: Implement appointment reminder WhatsApp message
  console.log(`📱 WhatsApp appointment reminder would be sent to ${phoneNumber}`)
}

export async function sendAppointmentConfirmationWhatsApp(
  phoneNumber: string,
  appointmentDetails: any
) {
  // TODO: Implement appointment confirmation WhatsApp message
  console.log(`📱 WhatsApp appointment confirmation would be sent to ${phoneNumber}`)
}

export async function sendCustomWhatsAppMessage(
  phoneNumber: string,
  message: string
) {
  // TODO: Implement custom WhatsApp message sending
  console.log(`📱 Custom WhatsApp message would be sent to ${phoneNumber}: ${message}`)
}

// Helper function to validate phone numbers
export function validatePhoneNumber(phone: string): boolean {
  // Basic phone number validation - should start with + and have 10-15 digits
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[^\d+]/g, ''))
}

// Helper function to format phone numbers
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '')
  
  // Add + if not present
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted
  }
  
  return formatted
}