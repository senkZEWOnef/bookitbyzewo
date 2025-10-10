-- Add webpage settings table for business customization
CREATE TABLE IF NOT EXISTS webpage_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_webpage_settings_business_id ON webpage_settings(business_id);