-- Add missing social media and premium branding columns to businesses table

-- Social media columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social_tiktok TEXT;

-- Additional premium branding columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slogan TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS show_business_hours BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS call_to_action_text TEXT DEFAULT 'Book Now';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS hero_overlay_opacity DECIMAL DEFAULT 0.4;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN (
  'social_facebook', 'social_instagram', 'social_twitter', 'social_tiktok',
  'slogan', 'phone', 'email', 'whatsapp_number', 'about_text',
  'business_hours', 'show_business_hours', 'call_to_action_text', 'hero_overlay_opacity'
)
ORDER BY column_name;