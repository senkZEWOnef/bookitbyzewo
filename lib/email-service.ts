// Email service for sending staff invitations using Resend
import { Resend } from 'resend'

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

interface StaffInvitationEmailParams {
  to: string
  businessName: string
  role: string
  invitationUrl: string
  inviterName: string
  businessDescription?: string
}

export async function sendStaffInvitationEmail({
  to,
  businessName,
  role,
  invitationUrl,
  inviterName,
  businessDescription
}: StaffInvitationEmailParams) {
  try {
    const emailTemplate = generateStaffInvitationTemplate({
      to,
      businessName,
      role,
      invitationUrl,
      inviterName,
      businessDescription
    })

    console.log('📧 Sending staff invitation email to:', to)

    // Send actual email using Resend
    const resend = getResendClient()
    if (!resend) {
      console.warn('⚠️  RESEND_API_KEY not configured, email will be logged only')
      console.log('📧 Email Template:')
      console.log('To:', to)
      console.log('Subject:', emailTemplate.subject)
      console.log('Body Preview:', emailTemplate.html.substring(0, 200) + '...')
      return { success: true, message: 'Email logged (Resend not configured)' }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'BookIt by Zewo <noreply@bookitbyzewo.com>',
      to: [to],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    })

    if (error) {
      console.error('❌ Email sending failed:', error)
      throw new Error(`Failed to send email: ${error.message || error}`)
    }

    console.log('✅ Staff invitation email sent successfully:', data?.id)
    return { success: true, message: 'Staff invitation email sent successfully', emailId: data?.id }

  } catch (error) {
    console.error('❌ Error sending staff invitation email:', error)
    throw error
  }
}

function generateStaffInvitationTemplate({
  to,
  businessName,
  role,
  invitationUrl,
  inviterName,
  businessDescription
}: StaffInvitationEmailParams) {
  const subject = `You've been invited to join ${businessName} team on BookIt by Zewo`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Invitation - BookIt by Zewo</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .business-info {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%);
            border: 1px solid rgba(16, 185, 129, 0.1);
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .business-name {
            font-size: 22px;
            font-weight: 600;
            color: #059669;
            margin-bottom: 8px;
        }
        .role-badge {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            text-transform: capitalize;
            display: inline-block;
            margin: 12px 0;
        }
        .benefits {
            margin: 24px 0;
        }
        .benefit-item {
            display: flex;
            align-items: center;
            margin: 12px 0;
        }
        .benefit-icon {
            width: 20px;
            height: 20px;
            background: #10b981;
            border-radius: 50%;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 24px 0;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }
        .secondary-action {
            text-align: center;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
        }
        .footer {
            background: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #10b981;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .content {
                padding: 24px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .business-info {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 You're Invited!</h1>
            <p>Join ${businessName} on BookIt by Zewo</p>
        </div>
        
        <div class="content">
            <p>Hello!</p>
            
            <p><strong>${inviterName}</strong> has invited you to join their team at <strong>${businessName}</strong> as a <span class="role-badge">${role}</span>.</p>
            
            <div class="business-info">
                <div class="business-name">${businessName}</div>
                ${businessDescription ? `<p style="margin: 0; color: #6b7280;">${businessDescription}</p>` : ''}
            </div>
            
            <div class="benefits">
                <p><strong>With BookIt by Zewo, you'll be able to:</strong></p>
                <div class="benefit-item">
                    <div class="benefit-icon">📅</div>
                    <span>Manage your appointments and schedule</span>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">👥</div>
                    <span>View customer information and booking history</span>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">💬</div>
                    <span>Handle bookings through WhatsApp integration</span>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">📊</div>
                    <span>Access your personalized staff dashboard</span>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">🏢</div>
                    <span>Switch between multiple businesses if you have your own</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                <strong>Important:</strong> If you already have a BookIt account with this email address (<strong>${to}</strong>), you'll be automatically added to the ${businessName} team when you accept the invitation. You'll be able to switch between your own business and ${businessName} from your dashboard.
            </p>
            
            <div class="secondary-action">
                <p style="color: #6b7280; font-size: 14px;">
                    Don't have a BookIt account yet? No problem! You can create one using this email address when you accept the invitation.
                </p>
                <p style="color: #dc2626; font-size: 14px;">
                    ⏰ This invitation will expire in 7 days.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>
                If you have any questions, please contact ${inviterName} or visit our 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Help Center</a>.
            </p>
            <p style="margin-top: 16px;">
                <strong>BookIt by Zewo</strong><br>
                Professional booking made easy
            </p>
        </div>
    </div>
</body>
</html>
  `

  return { subject, html }
}

// Email templates for other types of notifications
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  // TODO: Implement welcome email template
  console.log(`📧 Welcome email would be sent to ${userEmail}`)
}

export async function sendAppointmentConfirmation(
  customerEmail: string,
  appointmentDetails: any
) {
  // TODO: Implement appointment confirmation email
  console.log(`📧 Appointment confirmation would be sent to ${customerEmail}`)
}

export async function sendAppointmentReminder(
  customerEmail: string,
  appointmentDetails: any
) {
  // TODO: Implement appointment reminder email
  console.log(`📧 Appointment reminder would be sent to ${customerEmail}`)
}