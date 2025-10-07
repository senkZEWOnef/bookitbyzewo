-- Add webpage_settings column to businesses table
ALTER TABLE businesses 
ADD COLUMN webpage_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN description TEXT;