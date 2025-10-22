-- Simplified Calendar System for BookIt by Zewo
-- This replaces the complex availability rules with a simpler day-based system

-- Drop existing complex tables (if they exist)
DROP TABLE IF EXISTS availability_exceptions CASCADE;
DROP TABLE IF EXISTS availability_rules CASCADE;

-- Simple day availability table
CREATE TABLE IF NOT EXISTS day_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL, -- NULL means applies to all staff
    date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT FALSE,
    custom_time_slots JSONB DEFAULT '[]', -- Array of {start_time: "09:00", end_time: "10:00", max_bookings: 1}
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(business_id, staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_day_availability_business_date ON day_availability(business_id, date);
CREATE INDEX IF NOT EXISTS idx_day_availability_staff_date ON day_availability(staff_id, date);

-- Enhanced appointments table with recurring support
ALTER TABLE appointments DROP COLUMN IF EXISTS recurring_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS recurring_frequency;
ALTER TABLE appointments DROP COLUMN IF EXISTS recurring_end_date;
ALTER TABLE appointments DROP COLUMN IF EXISTS is_recurring_parent;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurring_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20); -- 'weekly', 'bi-weekly', 'monthly'
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_recurring_parent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

-- Recurring appointment templates
CREATE TABLE IF NOT EXISTS recurring_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    frequency VARCHAR(20) NOT NULL, -- 'weekly', 'bi-weekly', 'monthly'
    start_date DATE NOT NULL,
    end_date DATE, -- NULL means indefinite
    time_of_day TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_generated_date DATE, -- Track last appointment generated
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_appointments_business ON recurring_appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_active ON recurring_appointments(is_active);

-- Default business hours template
CREATE TABLE IF NOT EXISTS business_default_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    is_closed BOOLEAN DEFAULT FALSE,
    open_time TIME,
    close_time TIME,
    slot_duration_minutes INTEGER DEFAULT 30, -- Default slot length
    break_times JSONB DEFAULT '[]', -- Array of {start_time: "12:00", end_time: "13:00"}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(business_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_business_default_hours_business ON business_default_hours(business_id);

-- Reminder tracking table
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- '24_hour', '1_hour', 'custom'
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    message_content TEXT,
    delivery_method VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_scheduled ON appointment_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_status ON appointment_reminders(status);

-- Quick actions log for business insights
CREATE TABLE IF NOT EXISTS calendar_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'day_off_toggle', 'custom_slots_added', 'recurring_created', etc.
    action_date DATE NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_actions_business ON calendar_actions(business_id);
CREATE INDEX IF NOT EXISTS idx_calendar_actions_date ON calendar_actions(action_date);

-- Function to automatically generate recurring appointments
CREATE OR REPLACE FUNCTION generate_recurring_appointments()
RETURNS VOID AS $$
DECLARE
    recurring_record RECORD;
    next_date DATE;
    appointment_time TIMESTAMP;
BEGIN
    -- Process all active recurring appointments
    FOR recurring_record IN 
        SELECT * FROM recurring_appointments 
        WHERE is_active = TRUE 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND (last_generated_date IS NULL OR last_generated_date < CURRENT_DATE + INTERVAL '30 days')
    LOOP
        -- Calculate next appointment date
        IF recurring_record.last_generated_date IS NULL THEN
            next_date := recurring_record.start_date;
        ELSE
            CASE recurring_record.frequency
                WHEN 'weekly' THEN
                    next_date := recurring_record.last_generated_date + INTERVAL '7 days';
                WHEN 'bi-weekly' THEN
                    next_date := recurring_record.last_generated_date + INTERVAL '14 days';
                WHEN 'monthly' THEN
                    next_date := recurring_record.last_generated_date + INTERVAL '1 month';
                ELSE
                    CONTINUE; -- Skip unknown frequency
            END CASE;
        END IF;
        
        -- Generate appointments up to 30 days in advance
        WHILE next_date <= CURRENT_DATE + INTERVAL '30 days' 
              AND (recurring_record.end_date IS NULL OR next_date <= recurring_record.end_date)
        LOOP
            appointment_time := next_date + recurring_record.time_of_day;
            
            -- Check if appointment doesn't already exist
            IF NOT EXISTS (
                SELECT 1 FROM appointments 
                WHERE recurring_id = recurring_record.id 
                AND starts_at = appointment_time
            ) THEN
                -- Create the appointment
                INSERT INTO appointments (
                    id, business_id, service_id, staff_id,
                    starts_at, ends_at,
                    customer_name, customer_phone, customer_locale,
                    status, source, notes,
                    recurring_id, recurring_frequency, 
                    is_recurring_parent, created_at
                ) VALUES (
                    uuid_generate_v4(), recurring_record.business_id, 
                    recurring_record.service_id, recurring_record.staff_id,
                    appointment_time, 
                    appointment_time + (recurring_record.duration_minutes || ' minutes')::INTERVAL,
                    recurring_record.customer_name, recurring_record.customer_phone, 'en',
                    'confirmed', 'recurring', 
                    recurring_record.notes || ' (Recurring appointment)',
                    recurring_record.id, recurring_record.frequency,
                    FALSE, NOW()
                );
                
                -- Create automatic reminders
                INSERT INTO appointment_reminders (
                    appointment_id, reminder_type, scheduled_for, message_content
                ) VALUES 
                (
                    (SELECT id FROM appointments WHERE recurring_id = recurring_record.id AND starts_at = appointment_time),
                    '24_hour',
                    appointment_time - INTERVAL '24 hours',
                    'Reminder: You have an appointment tomorrow at ' || recurring_record.time_of_day
                ),
                (
                    (SELECT id FROM appointments WHERE recurring_id = recurring_record.id AND starts_at = appointment_time),
                    '1_hour', 
                    appointment_time - INTERVAL '1 hour',
                    'Reminder: Your appointment is in 1 hour at ' || recurring_record.time_of_day
                );
            END IF;
            
            -- Update last generated date
            UPDATE recurring_appointments 
            SET last_generated_date = next_date, updated_at = NOW()
            WHERE id = recurring_record.id;
            
            -- Calculate next occurrence
            CASE recurring_record.frequency
                WHEN 'weekly' THEN
                    next_date := next_date + INTERVAL '7 days';
                WHEN 'bi-weekly' THEN
                    next_date := next_date + INTERVAL '14 days';
                WHEN 'monthly' THEN
                    next_date := next_date + INTERVAL '1 month';
                ELSE
                    EXIT; -- Stop if unknown frequency
            END CASE;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON appointments(recurring_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, DATE(starts_at));