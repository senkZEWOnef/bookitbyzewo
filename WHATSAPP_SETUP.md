# WhatsApp Integration Setup Guide

This guide explains how to set up real WhatsApp messaging for staff invitations and customer communications.

## Current Status
- ✅ WhatsApp service implemented (`/lib/whatsapp-service.ts`)
- ✅ Staff invitations send both email and WhatsApp messages
- ✅ Phone number validation and formatting
- 🔄 Currently logging to console (development mode)

## Setup Options

### Option 1: WhatsApp Cloud API (Recommended - Official)

**Prerequisites:**
- Facebook Business Account
- WhatsApp Business Account
- Meta Developer Account

**Setup Steps:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app and add WhatsApp product
3. Get your Phone Number ID and Access Token

**Environment Variables:**
```env
# Add to your .env.local
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

**Code Changes:**
In `/lib/whatsapp-service.ts`, uncomment the WhatsApp Cloud API section:

```typescript
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
```

### Option 2: Twilio WhatsApp API

**Setup Steps:**
1. Create a [Twilio account](https://twilio.com)
2. Set up WhatsApp Sandbox or get approved sender
3. Get your Account SID, Auth Token, and WhatsApp number

**Environment Variables:**
```env
# Add to your .env.local
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886  # or your approved number
```

**Code Changes:**
In `/lib/whatsapp-service.ts`, uncomment the Twilio section:

```typescript
const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json', {
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
```

### Option 3: Other WhatsApp Providers

You can also use other providers like:
- **360Dialog**
- **MessageBird**
- **ChatAPI**
- **WhatsMate**

Each has similar setup processes and API endpoints.

## Features Implemented

### Staff Invitations (✅ Complete)
- Sends invitation via both email and WhatsApp
- Bilingual messages (Spanish/English)
- Professional branding and formatting
- Includes invitation link and expiration info
- Delete pending invitations functionality

### Ready for Implementation
- Appointment reminders
- Appointment confirmations
- Custom messages
- Customer communications

## Phone Number Format

The system automatically:
- Validates phone numbers (international format required)
- Formats numbers consistently (+1234567890)
- Handles various input formats (spaces, dashes, parentheses)

**Supported formats:**
- `+1 (787) 555-1234` → `+17875551234`
- `787-555-1234` → `+17875551234`
- `1-787-555-1234` → `+17875551234`

## Testing

1. **Development Mode**: Messages are logged to console
2. **Test with Sandbox**: Use Twilio or other provider's sandbox
3. **Production**: Configure with real WhatsApp Business API

## Usage in Staff Management

1. Go to Dashboard → Staff
2. Click "Add New Staff Member"
3. Enter display name, email, and **phone number** (required)
4. Select role and submit
5. System sends invitation via:
   - ✅ Professional HTML email
   - ✅ WhatsApp message with branded content
6. Pending invitations show both email and WhatsApp badges
7. Delete invitations with trash button if needed

## Message Templates

### Staff Invitation WhatsApp Template
```
🎉 *¡Invitación a [Business Name]!*

¡Hola! [Inviter] te ha invitado a unirte a su equipo en *[Business Name]* como *[Role]*.

🚀 *Con BookIt by Zewo podrás:*
📅 Gestionar tus citas y horarios
👥 Ver información de clientes
💬 Manejar reservas por WhatsApp
📊 Acceder a tu panel personalizado
🏢 Alternar entre múltiples negocios

*Para aceptar la invitación:*
👆 Haz clic aquí: [URL]

⏰ *Importante:* Esta invitación expira en 7 días.

¡Bienvenido al equipo! 🎊

---
*BookIt by Zewo* - Reservas profesionales hechas fácil
```

## Next Steps

1. Choose your WhatsApp provider
2. Set up environment variables
3. Uncomment the appropriate code section
4. Test with a sandbox/development number
5. Go live with approved business number

## Support

- WhatsApp Cloud API: [Meta Developers Documentation](https://developers.facebook.com/docs/whatsapp)
- Twilio WhatsApp: [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- Other providers: Check their respective documentation