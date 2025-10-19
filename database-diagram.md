# BookIt Database Schema Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Authentication & Users
    AUTH_USERS {
        uuid id PK "Supabase auth user ID"
        varchar email "User email"
        varchar password "Encrypted password"
        timestamptz created_at "Account creation time"
    }

    PROFILES {
        uuid id PK "References auth.users(id)"
        text full_name "User's full name"
        text phone "Phone number"
        timestamptz created_at "Profile creation time"
    }

    %% Business Management
    BUSINESSES {
        uuid id PK "Business unique identifier"
        uuid owner_id FK "References profiles(id)"
        text name "Business name"
        text slug "Unique URL slug"
        text timezone "Business timezone"
        text messaging_mode "manual | wa_cloud | twilio"
        text location "Business location"
        jsonb webpage_settings "Webpage configuration"
        text description "Business description"
        timestamptz created_at "Creation timestamp"
    }

    STAFF {
        uuid id PK "Staff member ID"
        uuid business_id FK "References businesses(id)"
        uuid user_id FK "References profiles(id)"
        text display_name "Display name for staff"
        text phone "Staff phone number"
        text role "member | admin"
        timestamptz created_at "Creation timestamp"
    }

    STAFF_INVITATIONS {
        uuid id PK "Invitation ID"
        uuid business_id FK "References businesses(id)"
        varchar email "Invited email address"
        varchar role "staff | admin"
        uuid invited_by FK "References profiles(id)"
        varchar invitation_token "Unique token"
        varchar status "pending | accepted | declined | expired"
        timestamp expires_at "Invitation expiry"
        timestamp created_at "Creation timestamp"
    }

    %% Services & Scheduling
    SERVICES {
        uuid id PK "Service ID"
        uuid business_id FK "References businesses(id)"
        text name "Service name"
        text description "Service description"
        integer duration_min "Duration in minutes (5-600)"
        integer price_cents "Price in cents"
        integer deposit_cents "Required deposit"
        integer buffer_before_min "Buffer time before"
        integer buffer_after_min "Buffer time after"
        smallint max_per_slot "Max appointments per slot"
        timestamptz created_at "Creation timestamp"
    }

    SERVICE_STAFF {
        uuid service_id PK,FK "References services(id)"
        uuid staff_id PK,FK "References staff(id)"
    }

    AVAILABILITY_RULES {
        uuid id PK "Availability rule ID"
        uuid business_id FK "References businesses(id)"
        uuid staff_id FK "References staff(id) - NULL for business-wide"
        smallint weekday "Day of week (0=Sunday)"
        time start_time "Start time"
        time end_time "End time"
        timestamptz created_at "Creation timestamp"
    }

    AVAILABILITY_EXCEPTIONS {
        uuid id PK "Exception ID"
        uuid business_id FK "References businesses(id)"
        uuid staff_id FK "References staff(id) - NULL for business-wide"
        date date "Exception date"
        boolean is_closed "True if closed, false if special hours"
        time start_time "Override start time"
        time end_time "Override end time"
        timestamptz created_at "Creation timestamp"
    }

    %% Appointments & Bookings
    APPOINTMENTS {
        uuid id PK "Appointment ID"
        uuid business_id FK "References businesses(id)"
        uuid service_id FK "References services(id)"
        uuid staff_id FK "References staff(id)"
        timestamptz starts_at "Appointment start time"
        timestamptz ends_at "Appointment end time"
        text customer_name "Customer name"
        text customer_phone "Customer phone"
        text customer_locale "Customer language preference"
        appointment_status status "pending | confirmed | canceled | noshow | completed"
        text source "public | admin"
        text notes "Additional notes"
        uuid deposit_payment_id FK "References payments(id)"
        timestamptz created_at "Creation timestamp"
    }

    %% Payments
    PAYMENTS {
        uuid id PK "Payment ID"
        uuid business_id FK "References businesses(id)"
        text provider "stripe | ath"
        text external_id "Provider payment ID"
        integer amount_cents "Amount in cents"
        char currency "Currency code (USD)"
        payment_status status "pending | succeeded | failed | refunded"
        payment_type kind "deposit | service | no_show_fee"
        jsonb meta "Additional payment metadata"
        timestamptz created_at "Creation timestamp"
    }

    %% Messaging & Communication
    MESSAGES {
        uuid id PK "Message ID"
        uuid business_id FK "References businesses(id)"
        uuid appointment_id FK "References appointments(id)"
        text to_phone "Recipient phone number"
        text channel "whatsapp | sms"
        text direction "out | in"
        text status "queued | sent | delivered | failed"
        text template_key "Message template identifier"
        text body "Message content"
        timestamptz sent_at "Send timestamp"
        timestamptz created_at "Creation timestamp"
    }

    %% Relationships
    AUTH_USERS ||--|| PROFILES : "1:1 auth integration"
    PROFILES ||--o{ BUSINESSES : "owns"
    PROFILES ||--o{ STAFF : "is staff member"
    PROFILES ||--o{ STAFF_INVITATIONS : "invites staff"
    
    BUSINESSES ||--o{ STAFF : "employs"
    BUSINESSES ||--o{ SERVICES : "offers"
    BUSINESSES ||--o{ AVAILABILITY_RULES : "has availability"
    BUSINESSES ||--o{ AVAILABILITY_EXCEPTIONS : "has exceptions"
    BUSINESSES ||--o{ APPOINTMENTS : "receives bookings"
    BUSINESSES ||--o{ PAYMENTS : "processes payments"
    BUSINESSES ||--o{ MESSAGES : "sends/receives"
    BUSINESSES ||--o{ STAFF_INVITATIONS : "invites staff"

    STAFF ||--o{ SERVICE_STAFF : "can perform"
    STAFF ||--o{ AVAILABILITY_RULES : "has availability"
    STAFF ||--o{ AVAILABILITY_EXCEPTIONS : "has exceptions"
    STAFF ||--o{ APPOINTMENTS : "assigned to"

    SERVICES ||--o{ SERVICE_STAFF : "performed by"
    SERVICES ||--o{ APPOINTMENTS : "booked for"

    PAYMENTS ||--o{ APPOINTMENTS : "deposit for"
    APPOINTMENTS ||--o{ MESSAGES : "triggers"
```

## Custom Types & Enums

```sql
-- Enum Types
CREATE TYPE appointment_status AS ENUM (
    'pending', 'confirmed', 'canceled', 'noshow', 'completed'
);

CREATE TYPE payment_status AS ENUM (
    'pending', 'succeeded', 'failed', 'refunded'
);

CREATE TYPE payment_type AS ENUM (
    'deposit', 'service', 'no_show_fee'
);
```

## Key Constraints & Features

### Primary Keys
- All tables use UUID primary keys with `gen_random_uuid()`
- `profiles.id` references Supabase `auth.users(id)`

### Foreign Key Relationships
- **CASCADE DELETE**: When business is deleted, all related data is removed
- **SET NULL**: When staff is deleted, appointments remain but staff_id becomes null
- **RESTRICT**: Services cannot be deleted if they have appointments

### Unique Constraints
- `businesses.slug` - Unique URL slugs for each business
- `service_staff` - Composite primary key prevents duplicate staff-service assignments
- `staff_invitations` - Unique business_id + email combination

### Special Features
- **Row Level Security (RLS)**: All tables have policies based on business membership
- **GIST Exclusion Constraint**: Prevents overlapping appointments for same staff
- **Time Range Validation**: Service duration must be 5-600 minutes
- **Timezone Support**: All timestamps use `timestamptz`

### Indexes for Performance
- Business ownership and membership lookups
- Appointment time-based queries
- Staff and service associations
- Payment and message tracking

## Data Flow Summary

1. **User Registration**: Creates profile linked to Supabase auth
2. **Business Setup**: Owner creates business, defines services and availability
3. **Staff Management**: Invite staff via email, assign to services
4. **Public Booking**: Customers book appointments through public interface
5. **Payment Processing**: Handle deposits via Stripe or ATH Móvil
6. **Communication**: Send WhatsApp/SMS notifications for appointments
7. **Schedule Management**: Track availability, exceptions, and appointment status