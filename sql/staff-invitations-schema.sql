-- Staff Invitations and Multi-Business Support Schema
-- Add this to your existing database

-- Staff invitations table for managing pending invites
CREATE TABLE IF NOT EXISTS staff_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff', -- 'staff' or 'admin'
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(business_id, email) -- Prevent duplicate invites to same email for same business
);

-- User-Business relationships table for multi-business support
CREATE TABLE IF NOT EXISTS user_businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff', -- 'owner', 'admin', 'staff'
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, business_id) -- Prevent duplicate relationships
);

-- Update staff table to include display_name and other fields from current UI
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_invitations_business_id ON staff_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON staff_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON staff_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_businesses_user_id ON user_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_business_id ON user_businesses(business_id);

-- Add a function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE staff_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$;

-- Add a trigger to create user_business relationship when staff is created
CREATE OR REPLACE FUNCTION create_user_business_relationship()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If staff has a user_id, create the user_business relationship
    IF NEW.user_id IS NOT NULL THEN
        INSERT INTO user_businesses (user_id, business_id, role, is_active)
        VALUES (NEW.user_id, NEW.business_id, NEW.role, NEW.is_active)
        ON CONFLICT (user_id, business_id) DO UPDATE SET
            role = NEW.role,
            is_active = NEW.is_active;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for staff table
DROP TRIGGER IF EXISTS trigger_create_user_business_relationship ON staff;
CREATE TRIGGER trigger_create_user_business_relationship
    AFTER INSERT OR UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION create_user_business_relationship();

-- Migrate existing data: create user_business relationships for existing staff
INSERT INTO user_businesses (user_id, business_id, role, is_active, joined_at)
SELECT 
    s.user_id, 
    s.business_id, 
    CASE 
        WHEN s.user_id = b.owner_id THEN 'owner'
        ELSE s.role
    END as role,
    s.is_active,
    s.created_at as joined_at
FROM staff s
JOIN businesses b ON s.business_id = b.id
WHERE s.user_id IS NOT NULL
ON CONFLICT (user_id, business_id) DO NOTHING;

-- Add business owners to user_businesses if not already there
INSERT INTO user_businesses (user_id, business_id, role, is_active, joined_at)
SELECT 
    b.owner_id,
    b.id,
    'owner',
    true,
    b.created_at as joined_at
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM user_businesses ub 
    WHERE ub.user_id = b.owner_id AND ub.business_id = b.id
);