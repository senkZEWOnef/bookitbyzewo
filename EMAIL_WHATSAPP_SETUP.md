# 📧📱 Email & WhatsApp Setup Guide

## Current Status
- ✅ Code is ready for real email and WhatsApp sending
- ⚠️ Currently logging to console (APIs not configured)
- 🔧 Need to add environment variables to enable real sending

## 🚀 Quick Setup (5 minutes for email)

### Step 1: Set Up Email with Resend (Easiest)

1. **Sign up for Resend** (free tier available):
   - Go to [resend.com](https://resend.com)
   - Create account and verify email

2. **Get API Key**:
   - Go to API Keys section
   - Create new API key
   - Copy the key (starts with `re_`)

3. **Add to Environment Variables**:
   Add these lines to your `.env.local` file:
   ```env
   # Email Configuration (Resend)
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=BookIt by Zewo <noreply@yourdomain.com>
   ```

4. **Test Email**: 
   - Restart your development server: `npm run dev`
   - Try sending a staff invitation
   - Check console for "✅ Staff invitation email sent successfully"

### Step 2: Set Up WhatsApp (Choose One Option)

#### Option A: WhatsApp Cloud API (Official - Free)

1. **Requirements**:
   - Facebook Business account
   - Phone number for verification

2. **Setup**:
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create new app → Add WhatsApp product
   - Follow setup wizard

3. **Environment Variables**:
   ```env
   # WhatsApp Cloud API
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

#### Option B: Twilio WhatsApp (Easier Setup)

1. **Setup**:
   - Go to [twilio.com](https://twilio.com)
   - Create account (free trial available)
   - Go to WhatsApp → Get started

2. **Environment Variables**:
   ```env
   # Twilio WhatsApp API
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=+14155238886
   ```

## 🔧 Complete .env.local Example

```env
# Database
DATABASE_URL=your_neon_database_url

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=BookIt by Zewo <noreply@yourdomain.com>

# WhatsApp Option A: Cloud API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# WhatsApp Option B: Twilio (alternative)
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# TWILIO_WHATSAPP_NUMBER=+14155238886

# Other existing variables...
```

## 🧪 Testing

### Test Email Only (Recommended first step)
1. Set up only `RESEND_API_KEY` and `FROM_EMAIL`
2. Leave WhatsApp variables empty
3. Send staff invitation
4. Should receive email, WhatsApp will be logged to console

### Test Both Email + WhatsApp
1. Set up both email and WhatsApp variables
2. Send staff invitation
3. Should receive both email and WhatsApp message

## 🔍 Troubleshooting

### Email Issues
- **"RESEND_API_KEY not configured"**: Add the API key to `.env.local`
- **"Authentication failed"**: Check API key is correct
- **"Domain not verified"**: Use a verified domain in FROM_EMAIL

### WhatsApp Issues
- **"WhatsApp credentials not configured"**: Add WhatsApp variables to `.env.local`
- **"Phone number not registered"**: Register test numbers in WhatsApp Business API
- **"Template not approved"**: For production, you'll need approved message templates

## 📊 What You'll See

### Console Output (Email Success)
```
📧 Sending staff invitation email to: user@example.com
✅ Staff invitation email sent successfully: re_email_id_123
```

### Console Output (WhatsApp Success)
```
📱 Sending WhatsApp staff invitation to: +1234567890
✅ WhatsApp invitation sent successfully: whatsapp_msg_id_456
```

### Console Output (Not Configured)
```
⚠️  RESEND_API_KEY not configured, email will be logged only
⚠️  WhatsApp credentials not configured, message will be logged only
```

## 🎯 Recommended Implementation Order

1. **Start with Email** (easier setup, immediate results)
2. **Add WhatsApp later** (requires more setup but worth it)
3. **Test thoroughly** before production use

## 🚀 Production Considerations

### Email (Resend)
- ✅ Ready for production immediately
- ✅ Good deliverability
- ✅ Professional templates included

### WhatsApp
- ⚠️ Requires business verification for production
- ⚠️ Need approved message templates
- ⚠️ Rate limits apply
- ✅ Great for customer engagement

## 💡 Quick Start (Just Email)

If you want to get email working right now:

1. Sign up for Resend (2 minutes)
2. Get API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_key_here
   FROM_EMAIL=BookIt <noreply@yourdomain.com>
   ```
4. Restart dev server: `npm run dev`
5. Test staff invitation

That's it! You'll start receiving real emails immediately.