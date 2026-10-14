'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface PendingAction {
  token: string
  tool: string
  summary: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  pending?: PendingAction[]
}

interface AssistantChatProps {
  endpoint: string
  confirmEndpoint: string
  getToken: () => string | null
  title: string
  subtitle: string
  suggestions: string[]
  theme?: 'light' | 'dark'
  upgradeHref?: string
}

const ACCENT = '#10b981'

export default function AssistantChat({
  endpoint, confirmEndpoint, getToken, title, subtitle, suggestions, theme = 'light', upgradeHref
}: AssistantChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const dark = theme === 'dark'
  const colors = {
    panel: dark ? '#121821' : '#ffffff',
    border: dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    text: dark ? '#e6edf3' : '#111827',
    muted: dark ? '#8b98a9' : '#6b7280',
    bubble: dark ? '#1a2230' : '#f3f4f6',
    input: dark ? '#0b0f14' : '#ffffff'
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy, open])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken() || ''}`
  })

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        // Only the plain text of each turn is sent back; the server rebuilds everything else
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) })
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 403 && data.error === 'upgrade_required') {
        setNeedsUpgrade(true)
        setMessages(next.slice(0, -1))
        return
      }
      if (!response.ok) {
        setMessages([...next, { role: 'assistant', content: data.error || 'Something went wrong. Please try again.' }])
        return
      }
      setMessages([...next, { role: 'assistant', content: data.reply, pending: data.pending?.length ? data.pending : undefined }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Network error. Please try again.' }])
    } finally {
      setBusy(false)
    }
  }

  const resolvePending = (messageIndex: number, token: string, note: string) => {
    setMessages(prev =>
      prev.map((m, i) =>
        i === messageIndex
          ? { ...m, pending: m.pending?.filter(p => p.token !== token) }
          : m
      ).concat(note ? [{ role: 'assistant' as const, content: note }] : [])
    )
  }

  const confirm = async (messageIndex: number, action: PendingAction) => {
    setBusy(true)
    try {
      const response = await fetch(confirmEndpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ token: action.token })
      })
      const data = await response.json().catch(() => ({}))
      resolvePending(messageIndex, action.token, response.ok ? `Done: ${action.summary}.` : data.error || 'That action failed.')
    } catch {
      resolvePending(messageIndex, action.token, 'Network error. The action was not run.')
    } finally {
      setBusy(false)
    }
  }

  const dismiss = (messageIndex: number, action: PendingAction) =>
    resolvePending(messageIndex, action.token, `Okay, I did not do this: ${action.summary}.`)

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open ${title}`}
          style={{
            position: 'fixed', right: 20, bottom: 20, zIndex: 1050, border: 0, color: '#04130d',
            background: `linear-gradient(135deg, ${ACCENT}, #059669)`, borderRadius: 999,
            padding: '12px 18px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}
        >
          <i className="fas fa-wand-magic-sparkles me-2"></i>
          {title}
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 1050, width: 'min(400px, calc(100vw - 32px))',
            height: 'min(600px, calc(100vh - 32px))', display: 'flex', flexDirection: 'column',
            background: colors.panel, color: colors.text, border: `1px solid ${colors.border}`,
            borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}
        >
          <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div>
              <div className="fw-bold">{title}</div>
              <div className="small" style={{ color: colors.muted }}>{subtitle}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ border: 0, background: 'transparent', color: colors.muted, fontSize: 18 }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
            {needsUpgrade ? (
              <div className="text-center py-4">
                <i className="fas fa-lock mb-3" style={{ fontSize: 28, color: ACCENT }}></i>
                <div className="fw-bold mb-1">Available on the Pro plan</div>
                <div className="small mb-3" style={{ color: colors.muted }}>
                  Upgrade to Pro to manage your appointments just by chatting.
                </div>
                {upgradeHref && (
                  <Link href={upgradeHref} className="btn btn-success btn-sm">See plans</Link>
                )}
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div>
                    <div className="small mb-2" style={{ color: colors.muted }}>Try asking:</div>
                    <div className="d-flex flex-column gap-2">
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="text-start"
                          style={{
                            border: `1px solid ${colors.border}`, background: colors.bubble, color: colors.text,
                            borderRadius: 12, padding: '8px 12px', fontSize: 14
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`mb-3 d-flex flex-column ${m.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                    <div
                      style={{
                        maxWidth: '88%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14,
                        padding: '8px 12px', borderRadius: 14,
                        background: m.role === 'user' ? ACCENT : colors.bubble,
                        color: m.role === 'user' ? '#04130d' : colors.text
                      }}
                    >
                      {m.content}
                    </div>
                    {m.pending?.map(action => (
                      <div
                        key={action.token}
                        className="mt-2 p-2"
                        style={{ maxWidth: '88%', border: `1px solid ${ACCENT}`, borderRadius: 12, fontSize: 14 }}
                      >
                        <div className="mb-2">{action.summary}?</div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-success btn-sm" disabled={busy} onClick={() => confirm(i, action)}>Confirm</button>
                          <button className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => dismiss(i, action)}>Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {busy && <div className="small" style={{ color: colors.muted }}>Working on it…</div>}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {!needsUpgrade && (
            <form
              onSubmit={e => { e.preventDefault(); send(input) }}
              className="d-flex gap-2 p-3"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message…"
                maxLength={1000}
                style={{
                  flex: 1, borderRadius: 10, padding: '8px 12px', fontSize: 14, outline: 'none',
                  border: `1px solid ${colors.border}`, background: colors.input, color: colors.text
                }}
              />
              <button type="submit" className="btn btn-success" disabled={busy || !input.trim()} aria-label="Send">
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
