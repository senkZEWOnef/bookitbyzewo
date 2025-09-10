# BookIt by Zewo - WhatsApp-First Booking System

A Calendly built for WhatsApp. Service providers get a shareable booking link that confirms appointments, collects deposits, and sends updates via WhatsApp first (with SMS fallback). Bilingual (EN/ES), Puerto Rico-friendly (Stripe + ATH Móvil).

## Features

### Core Functionality
- **WhatsApp-Native**: Confirmations, reminders, and reschedule links sent via WhatsApp
- **Deposit Protection**: Collect deposits upfront with Stripe or ATH Móvil
- **Bilingual Support**: All texts and templates available in English and Spanish
- **Mobile-First**: One-tap booking flow optimized for mobile devices
- **No-Show Prevention**: Automated reminders and deposit requirements

### For Business Owners
- **Real-time Calendar**: View appointments by day/week with instant updates
- **Service Management**: Define services with duration, pricing, and deposit requirements
- **Staff Scheduling**: Manage multiple staff members with individual calendars
- **Availability Control**: Set weekly hours and date exceptions
- **Payment Processing**: Stripe integration with ATH Móvil fallback
- **Manual WhatsApp**: Generate pre-filled WhatsApp messages with one click

### For Customers
- **Simple Booking**: Pick service → time → pay deposit → confirmed
- **WhatsApp Updates**: All communications through their preferred channel
- **Self-Service**: Reschedule or cancel appointments independently
- **Calendar Integration**: Download ICS files to add to their calendar

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Bootstrap 5
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe Checkout + ATH Móvil integration
- **Messaging**: WhatsApp manual mode (wa.me links)
- **Styling**: React Bootstrap + custom CSS
- **Language**: TypeScript throughout

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL in `supabase-schema.sql` in the Supabase SQL editor
3. Enable Row Level Security (RLS) on all tables

### 3. Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up a webhook endpoint pointing to `/api/stripe/webhook`
4. Configure webhook events: `checkout.session.completed`, `checkout.session.expired`

### 4. Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Database Schema

The system uses the following main tables:

- **businesses**: Business information and settings
- **services**: Service offerings with pricing and duration
- **staff**: Team members and their roles
- **availability_rules**: Weekly availability schedules
- **availability_exceptions**: Date-specific overrides
- **appointments**: Bookings with customer and payment info
- **payments**: Payment tracking for Stripe/ATH transactions
- **messages**: WhatsApp/SMS message log

## API Endpoints

### Public APIs (No Auth)
- `GET /api/business/[slug]` - Get business and services info
- `GET /api/slots/[slug]` - Get available time slots
- `POST /api/book/[slug]` - Create new appointment
- `GET /api/appointments/[id]` - Get appointment details (public)
- `GET /api/calendar/[id].ics` - Download calendar file

### Protected APIs (Auth Required)
- All dashboard functionality requires authentication
- Row Level Security ensures users only access their own data

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Works on any Node.js hosting platform
- Ensure environment variables are configured
- Set up webhook URLs in Stripe dashboard

## Business Model Integration

### Pricing Tiers
- **Solo ($19/mo)**: 1 staff, manual WhatsApp, basic features
- **Team ($39/mo)**: 5 staff, advanced calendar, reports
- **Pro ($79/mo)**: 10 staff, automated WhatsApp, API access

### Payment Processing
- No additional transaction fees beyond Stripe's standard rates
- ATH Móvil integration for Puerto Rico market
- Automatic deposit collection and no-show fee handling

## WhatsApp Integration

### Manual Mode (MVP)
- Generates wa.me links with pre-filled messages
- Business owner clicks to send via WhatsApp
- No API approvals needed, works immediately

### Future: Automated Mode
- WhatsApp Cloud API integration
- Twilio WhatsApp API as backup
- Automatic message sending and delivery tracking

## Target Market

### Primary Users
- **Barbers/Hair Salons**: Live in WhatsApp, hate no-shows
- **Beauty Services**: Nails, lashes, need deposit protection
- **Home Services**: Cleaners, handymen, need route planning
- **Personal Services**: Tutors, trainers, reschedules matter
- **Small Clinics**: Assistants run everything on WhatsApp

### Geographic Focus
- Puerto Rico (ATH Móvil integration)
- US Hispanic markets
- English/Spanish bilingual communities

## Key Differentiators

1. **WhatsApp-First**: Built specifically for WhatsApp communication
2. **Bilingual by Design**: Not an afterthought, core feature
3. **Local Payment Methods**: ATH Móvil for Puerto Rico
4. **Mobile-Optimized**: Works perfectly on phones
5. **No-Show Protection**: Deposits and automated reminders
6. **Manual First**: No complex API setups, works immediately

## Support

For development questions or feature requests, check the GitHub issues or create a new one.

## License

Proprietary - All rights reserved.