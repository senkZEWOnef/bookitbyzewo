import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Get pending reminders
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId')
    const dueOnly = url.searchParams.get('dueOnly') === 'true'

    console.log('📢 REMINDERS: Fetching reminders', { businessId, dueOnly })

    let queryText = `
      SELECT 
        ar.*,
        a.customer_name,
        a.customer_phone,
        a.starts_at,
        s.name as service_name,
        b.name as business_name
      FROM appointment_reminders ar
      JOIN appointments a ON ar.appointment_id = a.id
      JOIN services s ON a.service_id = s.id
      JOIN businesses b ON a.business_id = b.id
      WHERE ar.status = 'pending'
    `
    const params: any[] = []

    if (businessId) {
      queryText += ' AND a.business_id = $1'
      params.push(businessId)
    }

    if (dueOnly) {
      const paramIndex = params.length + 1
      queryText += ` AND ar.scheduled_for <= NOW()`
    }

    queryText += ' ORDER BY ar.scheduled_for ASC'

    const result = await query(queryText, params)

    return NextResponse.json({ 
      reminders: result.rows 
    })

  } catch (error) {
    console.error('🔴 REMINDERS: Error fetching reminders:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch reminders' 
    }, { status: 500 })
  }
}

// Create reminders for an appointment
export async function POST(request: NextRequest) {
  try {
    const { appointmentId, customReminders } = await request.json()

    if (!appointmentId) {
      return NextResponse.json({ 
        error: 'Appointment ID is required' 
      }, { status: 400 })
    }

    console.log('📢 REMINDERS: Creating reminders for appointment:', appointmentId)

    // Get appointment details
    const appointmentResult = await query(`
      SELECT 
        a.*,
        s.name as service_name,
        b.name as business_name,
        b.messaging_mode
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN businesses b ON a.business_id = b.id
      WHERE a.id = $1
    `, [appointmentId])

    if (appointmentResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Appointment not found' 
      }, { status: 404 })
    }

    const appointment = appointmentResult.rows[0]
    const appointmentTime = new Date(appointment.starts_at)

    // Create standard reminders (24 hour and 1 hour)
    const standardReminders = [
      {
        type: '24_hour',
        scheduledFor: new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000),
        message: `Reminder: You have an appointment tomorrow at ${appointmentTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        })} for ${appointment.service_name} at ${appointment.business_name}.`
      },
      {
        type: '1_hour',
        scheduledFor: new Date(appointmentTime.getTime() - 60 * 60 * 1000),
        message: `Reminder: Your appointment is in 1 hour at ${appointmentTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        })} for ${appointment.service_name}.`
      }
    ]

    // Add custom reminders if provided
    const allReminders = [
      ...standardReminders,
      ...(customReminders || [])
    ]

    // Insert reminders
    for (const reminder of allReminders) {
      // Only create if scheduled time is in the future
      if (reminder.scheduledFor > new Date()) {
        await query(`
          INSERT INTO appointment_reminders (
            appointment_id, reminder_type, scheduled_for, message_content, delivery_method
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (appointment_id, reminder_type) DO NOTHING
        `, [
          appointmentId,
          reminder.type,
          reminder.scheduledFor,
          reminder.message,
          appointment.messaging_mode === 'manual' ? 'whatsapp' : 'sms'
        ])
      }
    }

    console.log('✅ REMINDERS: Reminders created successfully')

    return NextResponse.json({ 
      success: true,
      remindersCreated: allReminders.filter(r => r.scheduledFor > new Date()).length
    })

  } catch (error) {
    console.error('🔴 REMINDERS: Error creating reminders:', error)
    return NextResponse.json({ 
      error: 'Failed to create reminders' 
    }, { status: 500 })
  }
}

// Mark reminder as sent
export async function PUT(request: NextRequest) {
  try {
    const { reminderId, status, errorMessage } = await request.json()

    if (!reminderId) {
      return NextResponse.json({ 
        error: 'Reminder ID is required' 
      }, { status: 400 })
    }

    console.log('📢 REMINDERS: Updating reminder status:', { reminderId, status })

    const result = await query(`
      UPDATE appointment_reminders 
      SET 
        status = $2,
        sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END,
        error_message = $3
      WHERE id = $1
      RETURNING *
    `, [reminderId, status, errorMessage || null])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Reminder not found' 
      }, { status: 404 })
    }

    console.log('✅ REMINDERS: Reminder status updated successfully')

    return NextResponse.json({ 
      success: true,
      reminder: result.rows[0]
    })

  } catch (error) {
    console.error('🔴 REMINDERS: Error updating reminder status:', error)
    return NextResponse.json({ 
      error: 'Failed to update reminder status' 
    }, { status: 500 })
  }
}

// Process due reminders (for background job)
export async function PATCH(request: NextRequest) {
  try {
    console.log('📢 REMINDERS: Processing due reminders')

    // Get all due reminders
    const dueReminders = await query(`
      SELECT 
        ar.*,
        a.customer_name,
        a.customer_phone,
        a.starts_at,
        s.name as service_name,
        b.name as business_name,
        b.messaging_mode
      FROM appointment_reminders ar
      JOIN appointments a ON ar.appointment_id = a.id
      JOIN services s ON a.service_id = s.id
      JOIN businesses b ON a.business_id = b.id
      WHERE ar.status = 'pending'
      AND ar.scheduled_for <= NOW()
      AND a.status IN ('confirmed', 'pending')
      ORDER BY ar.scheduled_for ASC
      LIMIT 50
    `)

    console.log(`📢 REMINDERS: Found ${dueReminders.rows.length} due reminders`)

    const processedReminders = []

    for (const reminder of dueReminders.rows) {
      try {
        // For now, we'll just mark as sent (in a real implementation, you'd send via WhatsApp/SMS)
        console.log(`📢 REMINDERS: Processing reminder ${reminder.id} for ${reminder.customer_name}`)
        
        // Simulate sending reminder
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to simulate API call
        
        // Mark as sent
        await query(`
          UPDATE appointment_reminders 
          SET status = 'sent', sent_at = NOW()
          WHERE id = $1
        `, [reminder.id])

        processedReminders.push({
          id: reminder.id,
          customer_name: reminder.customer_name,
          customer_phone: reminder.customer_phone,
          reminder_type: reminder.reminder_type,
          status: 'sent'
        })

        console.log(`✅ REMINDERS: Reminder ${reminder.id} marked as sent`)

      } catch (reminderError) {
        console.error(`🔴 REMINDERS: Error processing reminder ${reminder.id}:`, reminderError)
        
        // Mark as failed
        await query(`
          UPDATE appointment_reminders 
          SET status = 'failed', error_message = $2
          WHERE id = $1
        `, [reminder.id, reminderError instanceof Error ? reminderError.message : 'Unknown error'])
      }
    }

    console.log(`✅ REMINDERS: Processed ${processedReminders.length} reminders successfully`)

    return NextResponse.json({ 
      success: true,
      processedCount: processedReminders.length,
      totalDue: dueReminders.rows.length,
      processedReminders
    })

  } catch (error) {
    console.error('🔴 REMINDERS: Error processing due reminders:', error)
    return NextResponse.json({ 
      error: 'Failed to process due reminders' 
    }, { status: 500 })
  }
}