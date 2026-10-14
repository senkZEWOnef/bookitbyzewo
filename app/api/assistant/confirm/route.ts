import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { runConfirmedAction } from '@/lib/assistant/agent'
import { buildUserTools } from '@/lib/assistant/user-tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await request.json().catch(() => ({}))
  if (typeof token !== 'string') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const outcome = await runConfirmedAction({
    tools: buildUserTools(userId, new URL(request.url).origin),
    token,
    subject: userId
  })
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: 400 })
  return NextResponse.json({ success: true, result: outcome.result })
}
