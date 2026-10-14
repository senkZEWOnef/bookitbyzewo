import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { runConfirmedAction } from '@/lib/assistant/agent'
import { buildAdminTools } from '@/lib/assistant/admin-tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await request.json().catch(() => ({}))
  if (typeof token !== 'string') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const outcome = await runConfirmedAction({ tools: buildAdminTools(), token, subject: session })
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: 400 })
  return NextResponse.json({ success: true, result: outcome.result })
}
