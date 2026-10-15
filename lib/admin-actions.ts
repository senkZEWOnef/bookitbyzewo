import { query } from './db'
import { getStripe } from './billing'
import { ensureModerationColumns } from './moderation'

export class AdminActionError extends Error {}

export async function deleteUserAccount(userId: string): Promise<{ email: string }> {
  const result = await query('SELECT email, subscription_id FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user) throw new AdminActionError('User not found.')

  // Stop billing first so a deleted account is never charged again; if this fails, nothing is deleted
  if (user.subscription_id) {
    try {
      await getStripe().subscriptions.cancel(user.subscription_id)
    } catch (error: any) {
      if (error?.code !== 'resource_missing') {
        throw new AdminActionError('Could not cancel their Stripe subscription, so nothing was deleted.')
      }
    }
  }

  await query('DELETE FROM users WHERE id = $1', [userId])
  return { email: user.email }
}

export async function setUserBanned(userId: string, banned: boolean): Promise<{ email: string }> {
  await ensureModerationColumns()
  const result = await query(
    'UPDATE users SET banned_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END, updated_at = NOW() WHERE id = $1 RETURNING email',
    [userId, banned]
  )
  if (result.rows.length === 0) throw new AdminActionError('User not found.')
  return result.rows[0]
}

export async function setBusinessSuspended(businessId: string, suspended: boolean): Promise<{ name: string }> {
  await ensureModerationColumns()
  const result = await query(
    'UPDATE businesses SET suspended_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END, updated_at = NOW() WHERE id = $1 RETURNING name',
    [businessId, suspended]
  )
  if (result.rows.length === 0) throw new AdminActionError('Business not found.')
  return result.rows[0]
}
