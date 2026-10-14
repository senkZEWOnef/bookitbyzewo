import { query } from '@/lib/db'
import { createTrialCode, TrialCodeError } from '@/lib/trial-codes'
import type { AgentTool } from './agent'

const PLANS = ['solo', 'team', 'pro']
const PLAN_STATUSES = ['trial', 'active', 'past_due', 'cancelled', 'incomplete']

function clampLimit(value: unknown, fallback = 25) {
  return Math.min(Math.max(parseInt(String(value)) || fallback, 1), 50)
}

async function findUser(email: unknown) {
  const result = await query(
    'SELECT id, email, full_name, plan, plan_status, trial_ends_at FROM users WHERE LOWER(email) = LOWER($1)',
    [String(email || '').trim()]
  )
  if (result.rows.length === 0) throw new Error(`No user with email ${email}.`)
  return result.rows[0]
}

async function findBusiness(id: unknown) {
  const result = await query('SELECT id, name, slug FROM businesses WHERE id = $1', [String(id || '')])
  if (result.rows.length === 0) throw new Error('Business not found.')
  return result.rows[0]
}

const emailSchema = { type: 'string', description: 'The user\'s email address' } as const

// Platform-wide tools for the admin panel. Destructive or billing-affecting actions carry `confirm`,
// which makes the agent loop queue them for a button click instead of running them.
export function buildAdminTools(): Record<string, AgentTool> {
  return {
    platform_stats: {
      def: {
        name: 'platform_stats',
        description: 'Platform-wide numbers: users by plan status, businesses, appointments, trial codes.',
        input_schema: { type: 'object', properties: {} }
      },
      run: async () => {
        const [users, businesses, appointments, codes] = await Promise.all([
          query(`SELECT plan, plan_status, COUNT(*)::int AS count FROM users GROUP BY plan, plan_status ORDER BY count DESC`),
          query(`SELECT COUNT(*)::int AS count FROM businesses`),
          query(`SELECT COUNT(*)::int AS total,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7_days
                 FROM appointments`),
          query(`SELECT COUNT(*) FILTER (WHERE is_active AND expires_at > NOW() AND used_count < max_uses)::int AS usable,
                        COALESCE(SUM(used_count), 0)::int AS redeemed
                 FROM coupon_codes`).catch(() => ({ rows: [{}] }))
        ])
        return {
          users_by_plan_status: users.rows,
          businesses: businesses.rows[0].count,
          appointments: appointments.rows[0],
          trial_codes: codes.rows[0]
        }
      }
    },

    list_users: {
      def: {
        name: 'list_users',
        description: 'List users, newest first. Optionally search by name/email or filter by plan_status.',
        input_schema: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            plan_status: { type: 'string', description: PLAN_STATUSES.join(' | ') },
            limit: { type: 'integer' }
          }
        }
      },
      run: async input => {
        const params: unknown[] = []
        const where: string[] = []
        if (input.search) {
          params.push(`%${input.search}%`)
          where.push(`(email ILIKE $${params.length} OR full_name ILIKE $${params.length})`)
        }
        if (input.plan_status) { params.push(input.plan_status); where.push(`plan_status = $${params.length}`) }
        params.push(clampLimit(input.limit))
        const result = await query(
          `SELECT id, email, full_name, phone, plan, plan_status, trial_ends_at, created_at
           FROM users ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
           ORDER BY created_at DESC LIMIT $${params.length}`,
          params
        )
        return { count: result.rows.length, users: result.rows }
      }
    },

    list_businesses: {
      def: {
        name: 'list_businesses',
        description: 'List businesses with owner and activity counts, newest first.',
        input_schema: {
          type: 'object',
          properties: { search: { type: 'string' }, limit: { type: 'integer' } }
        }
      },
      run: async input => {
        const params: unknown[] = []
        let where = ''
        if (input.search) {
          params.push(`%${input.search}%`)
          where = `WHERE b.name ILIKE $1 OR b.slug ILIKE $1`
        }
        params.push(clampLimit(input.limit))
        const result = await query(
          `SELECT b.id, b.name, b.slug, b.created_at,
                  u.email AS owner_email, u.full_name AS owner_name,
                  (SELECT COUNT(*)::int FROM appointments WHERE business_id = b.id) AS appointments,
                  (SELECT COUNT(*)::int FROM services WHERE business_id = b.id) AS services
           FROM businesses b LEFT JOIN users u ON u.id = b.owner_id
           ${where} ORDER BY b.created_at DESC LIMIT $${params.length}`,
          params
        )
        return { count: result.rows.length, businesses: result.rows }
      }
    },

    list_appointments: {
      def: {
        name: 'list_appointments',
        description: 'Most recent appointments across the platform, optionally for one business id.',
        input_schema: {
          type: 'object',
          properties: { business_id: { type: 'string' }, limit: { type: 'integer' } }
        }
      },
      run: async input => {
        const params: unknown[] = []
        let where = ''
        if (input.business_id) { params.push(input.business_id); where = 'WHERE a.business_id = $1' }
        params.push(clampLimit(input.limit))
        const result = await query(
          `SELECT a.id, a.customer_name, a.status, b.name AS business, s.name AS service,
                  to_char(a.starts_at, 'YYYY-MM-DD HH24:MI') AS starts_at
           FROM appointments a
           JOIN businesses b ON b.id = a.business_id
           LEFT JOIN services s ON s.id = a.service_id
           ${where} ORDER BY a.created_at DESC LIMIT $${params.length}`,
          params
        )
        return { count: result.rows.length, appointments: result.rows }
      }
    },

    list_trial_codes: {
      def: {
        name: 'list_trial_codes',
        description: 'List trial codes with package, length, usage and expiry.',
        input_schema: { type: 'object', properties: {} }
      },
      run: async () => {
        const result = await query(
          `SELECT code, label, applicable_plan, free_trial_months, used_count, max_uses, is_active,
                  to_char(expires_at, 'YYYY-MM-DD') AS expires_on
           FROM coupon_codes ORDER BY created_at DESC LIMIT 50`
        )
        return { codes: result.rows }
      }
    },

    create_trial_code: {
      def: {
        name: 'create_trial_code',
        description:
          'Create a shareable trial code. tier "full" = Pro features, "basic" = Solo. Returns the code and a signup link path.',
        input_schema: {
          type: 'object',
          properties: {
            tier: { type: 'string', enum: ['full', 'basic'] },
            free_trial_months: { type: 'integer', description: '1-12' },
            max_uses: { type: 'integer', description: '1-100, default 1' },
            expires_days: { type: 'integer', description: 'How long the code stays redeemable, 1-365, default 30' },
            label: { type: 'string', description: 'Who it is for' }
          },
          required: ['tier', 'free_trial_months']
        }
      },
      run: async input => {
        try {
          const created = await createTrialCode({
            tier: input.tier,
            free_trial_months: input.free_trial_months,
            max_uses: input.max_uses ?? 1,
            expires_days: input.expires_days ?? 30,
            label: input.label
          })
          return { ...created, signup_path: `/signup?code=${created.code}` }
        } catch (error) {
          if (error instanceof TrialCodeError) throw new Error(error.message)
          throw error
        }
      }
    },

    set_trial_code_active: {
      def: {
        name: 'set_trial_code_active',
        description: 'Enable or disable a trial code so it can (not) be redeemed.',
        input_schema: {
          type: 'object',
          properties: { code: { type: 'string' }, active: { type: 'boolean' } },
          required: ['code', 'active']
        }
      },
      run: async input => {
        const result = await query(
          'UPDATE coupon_codes SET is_active = $1, updated_at = NOW() WHERE code = $2 RETURNING code, is_active',
          [!!input.active, String(input.code).trim().toUpperCase()]
        )
        if (result.rows.length === 0) throw new Error('No such trial code.')
        return result.rows[0]
      }
    },

    extend_user_trial: {
      def: {
        name: 'extend_user_trial',
        description: 'Give a user more free trial days (puts them in trial status if they are not paying).',
        input_schema: {
          type: 'object',
          properties: { email: emailSchema, days: { type: 'integer', description: '1-365' } },
          required: ['email', 'days']
        }
      },
      run: async input => {
        const days = Math.min(Math.max(parseInt(input.days) || 0, 1), 365)
        const user = await findUser(input.email)
        if (user.plan_status === 'active') throw new Error('That user already has an active paid subscription.')
        const result = await query(
          `UPDATE users
           SET plan_status = 'trial',
               trial_ends_at = GREATEST(COALESCE(trial_ends_at, NOW()), NOW()) + ($2 || ' days')::interval,
               updated_at = NOW()
           WHERE id = $1 RETURNING email, plan, plan_status, trial_ends_at`,
          [user.id, String(days)]
        )
        return result.rows[0]
      }
    },

    set_user_plan: {
      def: {
        name: 'set_user_plan',
        description: 'Change a user\'s plan and/or plan status. This affects their access and billing state, so it needs approval.',
        input_schema: {
          type: 'object',
          properties: {
            email: emailSchema,
            plan: { type: 'string', enum: PLANS },
            plan_status: { type: 'string', enum: PLAN_STATUSES }
          },
          required: ['email']
        }
      },
      confirm: input =>
        `Set ${input.email}: ${[input.plan && `plan → ${input.plan}`, input.plan_status && `status → ${input.plan_status}`]
          .filter(Boolean).join(', ') || 'no change'}`,
      run: async input => {
        if (input.plan && !PLANS.includes(input.plan)) throw new Error('Invalid plan.')
        if (input.plan_status && !PLAN_STATUSES.includes(input.plan_status)) throw new Error('Invalid plan status.')
        const user = await findUser(input.email)
        const result = await query(
          `UPDATE users SET plan = COALESCE($2, plan), plan_status = COALESCE($3, plan_status), updated_at = NOW()
           WHERE id = $1 RETURNING email, plan, plan_status, trial_ends_at`,
          [user.id, input.plan || null, input.plan_status || null]
        )
        return result.rows[0]
      }
    },

    delete_business: {
      def: {
        name: 'delete_business',
        description: 'Permanently delete a business and all its services, staff and appointments. Irreversible; needs approval.',
        input_schema: {
          type: 'object',
          properties: { business_id: { type: 'string' } },
          required: ['business_id']
        }
      },
      confirm: async input => {
        const b = await findBusiness(input.business_id)
        return `PERMANENTLY delete business "${b.name}" with all its services, staff and appointments`
      },
      run: async input => {
        const b = await findBusiness(input.business_id)
        await query('DELETE FROM businesses WHERE id = $1', [b.id])
        return { deleted: b.name }
      }
    },

    delete_user: {
      def: {
        name: 'delete_user',
        description: 'Permanently delete a user account and everything it owns (businesses, appointments). Irreversible; needs approval.',
        input_schema: {
          type: 'object',
          properties: { email: emailSchema },
          required: ['email']
        }
      },
      confirm: async input => {
        const u = await findUser(input.email)
        return `PERMANENTLY delete user ${u.email} and every business, service and appointment they own`
      },
      run: async input => {
        const u = await findUser(input.email)
        await query('DELETE FROM users WHERE id = $1', [u.id])
        return { deleted: u.email }
      }
    }
  }
}
