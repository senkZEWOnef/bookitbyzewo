import Anthropic from '@anthropic-ai/sdk'
import { signActionToken, verifyActionToken } from '@/lib/auth'

export interface AgentTool {
  def: Anthropic.Tool
  // Present on actions that must be approved by a click before they run; returns the sentence shown to the user
  confirm?: (input: any) => string | Promise<string>
  run: (input: any) => Promise<unknown>
}

export interface PendingAction {
  token: string
  tool: string
  summary: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const MAX_STEPS = 8
let client: Anthropic | null = null

export function isAssistantConfigured() {
  return !!process.env.ANTHROPIC_API_KEY
}

function getClient() {
  if (!client) client = new Anthropic()
  return client
}

export function parseHistory(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) return null
  const turns: ChatTurn[] = []
  for (const item of raw) {
    if (!item || (item.role !== 'user' && item.role !== 'assistant') || typeof item.content !== 'string') return null
    turns.push({ role: item.role, content: item.content.slice(0, 4000) })
  }
  return turns[turns.length - 1].role === 'user' ? turns : null
}

export async function runAgent(opts: {
  model: string
  system: string
  tools: Record<string, AgentTool>
  history: ChatTurn[]
  subject: string
}): Promise<{ reply: string; pending: PendingAction[] }> {
  const messages: Anthropic.MessageParam[] = opts.history.map(t => ({ role: t.role, content: t.content }))
  const toolDefs = Object.values(opts.tools).map(t => t.def)
  const pending: PendingAction[] = []

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await getClient().messages.create({
      model: opts.model,
      max_tokens: 4096,
      system: opts.system,
      tools: toolDefs,
      messages
    })

    if (response.stop_reason === 'refusal') {
      return { reply: "I can't help with that request.", pending }
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()

    if (response.stop_reason !== 'tool_use') {
      return {
        reply: text || (response.stop_reason === 'max_tokens' ? 'That answer got too long - try a narrower question.' : 'Done.'),
        pending
      }
    }

    // Keep the full assistant turn (including any thinking blocks) and answer every tool call in one user message
    messages.push({ role: 'assistant', content: response.content })
    const results: Anthropic.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      const tool = opts.tools[block.name]
      if (!tool) {
        results.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: 'Unknown tool.' })
        continue
      }
      try {
        if (tool.confirm) {
          // Never run these directly: queue them for an explicit click in the UI
          const summary = await tool.confirm(block.input)
          pending.push({
            token: signActionToken({ sub: opts.subject, tool: block.name, input: block.input }),
            tool: block.name,
            summary
          })
          results.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Not executed yet. The user has been shown a confirmation button for: ${summary}. Tell them to press Confirm to proceed.`
          })
        } else {
          const output = await tool.run(block.input)
          results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(output) })
        }
      } catch (error) {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          is_error: true,
          content: error instanceof Error ? error.message : 'Tool failed.'
        })
      }
    }
    messages.push({ role: 'user', content: results })
  }

  return { reply: 'That took too many steps - please try a simpler request.', pending }
}

export async function runConfirmedAction(opts: {
  tools: Record<string, AgentTool>
  token: string
  subject: string
}): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> {
  const payload = verifyActionToken(opts.token)
  if (!payload || payload.sub !== opts.subject) {
    return { ok: false, error: 'This confirmation expired. Ask again to get a new one.' }
  }
  const tool = opts.tools[payload.tool]
  if (!tool || !tool.confirm) return { ok: false, error: 'Unknown action.' }
  try {
    return { ok: true, result: await tool.run(payload.input) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Action failed.' }
  }
}
