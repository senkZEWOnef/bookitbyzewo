# Staff Invitation System Documentation

## Overview

The staff invitation system allows business owners to invite team members via email. Staff members can accept invitations and join businesses while maintaining the ability to have their own businesses using the same email address.

## Features

### ✅ Completed Features

1. **Email Invitations**: Automatic email invites sent to staff members
2. **Multi-Business Support**: Users can work for multiple businesses
3. **Business Switching**: Easy switching between businesses in the dashboard
4. **Invitation Management**: Track pending, accepted, and expired invitations
5. **Role-Based Access**: Different roles (owner, admin, staff) with appropriate permissions
6. **Secure Token System**: Time-limited invitation tokens with expiration

### 🔧 Database Schema

#### New Tables Added

1. **staff_invitations**: Manages pending invitations
2. **user_businesses**: Tracks user-business relationships

#### Schema Changes

```sql
-- Run this script to add the invitation system to your existing database
-- File: sql/staff-invitations-schema.sql
```

### 📧 Email System

The invitation emails include:
- Business information and role details
- Professional HTML template with BookIt branding
- Clear call-to-action buttons
- Mobile-responsive design
- Important notes about account linking

### 🚀 How It Works

#### For Business Owners:

1. **Add Staff Member**:
   - Go to Dashboard → Staff
   - Click "Invite Staff"
   - Enter email, name, and role
   - System sends automatic invitation email

2. **Track Invitations**:
   - View pending invitations in the staff page
   - See invitation status and expiration dates
   - Resend invitations if needed

#### For Staff Members:

1. **Receive Invitation**:
   - Get email with invitation link
   - Click to accept invitation

2. **Account Creation/Linking**:
   - If no account exists: Create new account with invited email
   - If account exists: Automatically link to business

3. **Access Dashboard**:
   - Switch between businesses using BusinessSwitcher component
   - Access appropriate features based on role

### 🔐 Security Features

- **Secure Tokens**: Cryptographically secure invitation tokens
- **Expiration**: Invitations expire after 7 days
- **Email Verification**: Only invited email can accept invitation
- **Role Permissions**: Proper role-based access control

### 🛠 API Endpoints

#### Staff Invitations

- `POST /api/staff/invite` - Send staff invitation
- `GET /api/staff/invite?businessId=...` - Get pending invitations
- `POST /api/staff/accept-invitation` - Accept invitation
- `GET /api/staff/accept-invitation?token=...` - Get invitation details

#### User Businesses

- `GET /api/user/businesses?userId=...` - Get user's businesses
- `POST /api/user/businesses/switch` - Switch business context

### 🎨 UI Components

#### Updated Components

1. **Staff Management Page** (`app/(dash)/dashboard/staff/page.tsx`):
   - Invitation system integration
   - Pending invitations display
   - Updated form for sending invitations

2. **Business Switcher** (`components/BusinessSwitcher.tsx`):
   - Dropdown to switch between businesses
   - Shows user role for each business
   - Easy business creation link

3. **Dashboard Layout** (`app/(dash)/layout.tsx`):
   - Integrated business switcher
   - Context-aware navigation

4. **Invitation Acceptance** (`app/staff/accept-invitation/page.tsx`):
   - Professional invitation acceptance flow
   - Account linking/creation
   - Error handling for expired/invalid invitations

### 📋 Usage Examples

#### Sending an Invitation

```javascript
const response = await fetch('/api/staff/invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify({
    businessId: 'business-uuid',
    email: 'staff@example.com',
    role: 'staff',
    displayName: 'John Doe'
  })
})
```

#### Accepting an Invitation

```javascript
const response = await fetch('/api/staff/accept-invitation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'invitation-token',
    userId: 'user-uuid' // Optional, if user is logged in
  })
})
```

### 🔄 Multi-Business Flow

#### Scenario 1: New User

1. Receives invitation email
2. Clicks invitation link
3. Creates new account with invited email
4. Automatically joins business as staff
5. Can later create own business with same email

#### Scenario 2: Existing User

1. Receives invitation email  
2. Clicks invitation link
3. If logged in with matching email: automatically joins business
4. If not logged in: prompted to login with invited email
5. Can switch between own business and staff business

#### Scenario 3: Email Mismatch

1. User logged in with different email
2. System shows warning about email mismatch
3. User must logout and login with invited email
4. Or create new account with invited email

### ⚠️ Important Notes

#### For Development

1. **Email Service**: Currently logs emails to console. Replace with actual email service (SendGrid, Resend) in production.

2. **Authentication**: Update to use your actual auth system instead of placeholder user IDs.

3. **Database**: Run the schema migration script before using the invitation system.

#### For Production

1. **Environment Variables**:
   ```env
   NEON_DATABASE_URL=your_database_url
   SENDGRID_API_KEY=your_sendgrid_key  # or RESEND_API_KEY
   FROM_EMAIL=noreply@yourdomain.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Email Service Setup**:
   - Choose email provider (SendGrid, Resend, etc.)
   - Update `lib/email-service.ts` with actual implementation
   - Configure DNS records for email domain

3. **Security Considerations**:
   - Implement proper CSRF protection
   - Add rate limiting to invitation endpoints
   - Monitor for abuse (bulk invitations)

### 🐛 Troubleshooting

#### Common Issues

1. **Invitations not sending**:
   - Check email service configuration
   - Verify environment variables
   - Check server logs for email errors

2. **Database errors**:
   - Ensure migration script has been run
   - Check database permissions
   - Verify table constraints

3. **Business switching not working**:
   - Clear localStorage and cookies
   - Check user_businesses table data
   - Verify API responses

#### Debug Commands

```sql
-- Check pending invitations
SELECT * FROM staff_invitations WHERE status = 'pending';

-- Check user-business relationships
SELECT ub.*, b.name as business_name, u.email 
FROM user_businesses ub
JOIN businesses b ON ub.business_id = b.id
JOIN users u ON ub.user_id = u.id;

-- Clean up expired invitations
UPDATE staff_invitations 
SET status = 'expired' 
WHERE status = 'pending' AND expires_at < NOW();
```

### 🚀 Future Enhancements

#### Planned Features

1. **Invitation Customization**:
   - Custom invitation messages
   - Business-branded email templates
   - Invitation preview before sending

2. **Advanced Permissions**:
   - Custom role definitions
   - Service-specific permissions
   - Time-based access control

3. **Bulk Operations**:
   - Import staff from CSV
   - Bulk invitation sending
   - Team management tools

4. **Analytics**:
   - Invitation acceptance rates
   - Staff performance metrics
   - Business switching analytics

#### Integration Ideas

1. **WhatsApp Integration**:
   - Send invitations via WhatsApp
   - Staff notifications through WhatsApp

2. **Calendar Integration**:
   - Staff availability sync
   - Cross-business scheduling

3. **Mobile App**:
   - Native mobile staff app
   - Push notifications

### 📞 Support

For questions about the staff invitation system:

1. Check this documentation first
2. Review the code comments in the relevant files
3. Test with the provided API endpoints
4. Check database constraints and relationships

### 🔗 Related Files

- `sql/staff-invitations-schema.sql` - Database schema
- `app/api/staff/invite/route.ts` - Invitation API
- `app/api/staff/accept-invitation/route.ts` - Acceptance API
- `app/api/user/businesses/route.ts` - Business management API
- `components/BusinessSwitcher.tsx` - Business switching UI
- `app/staff/accept-invitation/page.tsx` - Invitation page
- `lib/email-service.ts` - Email templates and service
- `app/(dash)/dashboard/staff/page.tsx` - Staff management UI