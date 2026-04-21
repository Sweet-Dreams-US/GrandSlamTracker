'use client'

// /outreach — the daily approval queue.
//
// Reads Gmail drafts under the Outreach/Pending label via the platform's
// service account. Cole reviews, optionally edits, clicks Approve & Send
// (goes via Gmail API) or Reject (deletes draft + flips prospect state).

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Send,
  Inbox,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ThumbsDown,
  X,
  Loader2,
  Mail,
  Upload,
  Settings,
  ExternalLink,
} from 'lucide-react'

interface DraftRow {
  id: string
  message_id?: string | null
  thread_id?: string | null
  subject?: string | null
  to?: string | null
  snippet?: string | null
  body?: string | null
  label_ids?: string[]
  internal_date?: string | null
}

interface DashboardResponse {
  totals: {
    total_clients: number
    total_outreach: number
    new_prospects_this_week: number
    drafts_pending_over_48h: number
    prospects_stale_over_30d: number
    trials_stale_over_60d: number
  }
  counts: { by_status: Record<string, number>; by_draft_state: Record<string, number>; by_service: Record<string, number> }
}

// We read drafts through internal API so the page can call fetch() directly
// — but it still needs the bearer key for the outreach routes. For same-origin
// authenticated browser usage we expose the key via NEXT_PUBLIC_ env so the
// client can call /api/outreach/* routes. This matches the platform pattern
// where the UI is gated by AdminPasswordGate (not public).
//
// Note: the key is effectively shared with every admin-login user of the
// platform. That's fine — it's the same threat model as the existing anon
// Supabase key.
const OUTREACH_KEY = process.env.NEXT_PUBLIC_OUTREACH_API_KEY || ''

function authHeaders(): HeadersInit {
  return OUTREACH_KEY
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${OUTREACH_KEY}` }
    : { 'Content-Type': 'application/json' }
}

export default function OutreachPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyMissing, setKeyMissing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    if (!OUTREACH_KEY) {
      setKeyMissing(true)
      setLoading(false)
      setRefreshing(false)
      return
    }
    try {
      const [draftsRes, dashRes] = await Promise.all([
        fetch('/api/outreach/gmail/drafts?label=Outreach%2FPending&limit=50', { headers: authHeaders() }),
        fetch('/api/outreach/dashboard', { headers: authHeaders() }),
      ])
      if (draftsRes.ok) {
        const d = await draftsRes.json()
        setDrafts(d.drafts || [])
      } else {
        const err = await draftsRes.text()
        setError(`Drafts load failed (${draftsRes.status}): ${err.slice(0, 200)}`)
      }
      if (dashRes.ok) {
        setDashboard(await dashRes.json())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleRefresh() {
    setRefreshing(true); load()
  }

  async function handleApproveSend(draftId: string) {
    if (!confirm('Send this email from cole@sweetdreams.us?')) return
    const res = await fetch(`/api/outreach/gmail/drafts/${draftId}/send`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'cold_open' }),
    })
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))
    } else {
      const e = await res.text()
      alert(`Send failed: ${e.slice(0, 200)}`)
    }
  }

  async function handleReject(draftId: string) {
    const reason = window.prompt('Reason for reject (optional)') || ''
    const res = await fetch(`/api/outreach/gmail/drafts/${draftId}/reject`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ reason }),
    })
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))
    } else {
      const e = await res.text()
      alert(`Reject failed: ${e.slice(0, 200)}`)
    }
  }

  async function handleSaveEdit(draftId: string, to: string, subject: string, body: string) {
    const res = await fetch(`/api/outreach/gmail/drafts/${draftId}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ to, subject, body }),
    })
    if (res.ok) {
      const { draft } = await res.json()
      setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, ...draft, body } : d)))
      return true
    }
    const e = await res.text()
    alert(`Save failed: ${e.slice(0, 200)}`)
    return false
  }

  const stats = useMemo(() => ({
    pending: drafts.length,
    total_outreach: dashboard?.totals.total_outreach ?? 0,
    sent: dashboard?.counts.by_draft_state?.sent ?? 0,
    replied: dashboard?.counts.by_draft_state?.replied ?? 0,
  }), [drafts.length, dashboard])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>
  }

  if (keyMissing) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Outreach</h1>
        <div className="card p-6 border-yellow-500/30 bg-yellow-500/5 rounded-xl">
          <p className="text-sm font-semibold text-yellow-400 mb-2">Setup incomplete</p>
          <p className="text-sm text-[var(--muted)] mb-2">
            The platform needs <code className="px-1 rounded bg-[var(--surface-hover)]">NEXT_PUBLIC_OUTREACH_API_KEY</code> set in Vercel env
            so the browser can authenticate to the outreach API. This is the same value as{' '}
            <code className="px-1 rounded bg-[var(--surface-hover)]">OUTREACH_API_KEY</code> with the{' '}
            <code className="px-1 rounded bg-[var(--surface-hover)]">NEXT_PUBLIC_</code> prefix.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Outreach</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Drafts in Gmail under <code className="px-1 rounded bg-[var(--surface-hover)]">Outreach/Pending</code> — review, optionally edit, approve to send
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50">
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/outreach/import" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)]">
            <Upload className="h-4 w-4" /> Import pack
          </Link>
          <Link href="/outreach/settings" className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending approval" value={stats.pending} icon={Mail} accent="text-yellow-400" />
        <StatCard label="Outreach prospects" value={stats.total_outreach} icon={Inbox} accent="text-blue-400" />
        <StatCard label="Sent" value={stats.sent} icon={CheckCircle2} accent="text-cyan-400" />
        <StatCard label="Replied" value={stats.replied} icon={AlertCircle} accent="text-emerald-400" />
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400">{error}</div>
      )}

      {/* Approval queue */}
      {drafts.length === 0 ? (
        <div className="card p-10 text-center">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">No drafts in Outreach/Pending. Either Cowork hasn&apos;t run yet or you&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <DraftCard
              key={d.id}
              draft={d}
              onApproveSend={() => handleApproveSend(d.id)}
              onReject={() => handleReject(d.id)}
              onSaveEdit={(to, subject, body) => handleSaveEdit(d.id, to, subject, body)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Inbox; accent: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${accent}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="text-xl font-bold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  )
}

function DraftCard({
  draft,
  onApproveSend,
  onReject,
  onSaveEdit,
}: {
  draft: DraftRow
  onApproveSend: () => void
  onReject: () => void
  onSaveEdit: (to: string, subject: string, body: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [to, setTo] = useState(draft.to || '')
  const [subject, setSubject] = useState(draft.subject || '')
  const [body, setBody] = useState(draft.body || '')

  async function save() {
    const ok = await onSaveEdit(to, subject, body)
    if (ok) setEditing(false)
  }

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--muted)] mb-1">
            <span className="font-medium text-[var(--foreground)]">To:</span>{' '}
            {editing ? (
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input inline-block text-xs py-1 px-2 w-64 align-middle"
              />
            ) : (
              <span>{draft.to || '(no recipient)'}</span>
            )}
          </p>
          {editing ? (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input text-sm font-semibold w-full"
            />
          ) : (
            <h3 className="text-base font-semibold text-[var(--foreground)]">{draft.subject || '(no subject)'}</h3>
          )}
        </div>
        {draft.thread_id && (
          <a
            href={`https://mail.google.com/mail/u/0/#drafts/${draft.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] inline-flex items-center gap-1"
          >
            Gmail <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {editing ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="input text-sm font-mono resize-y w-full"
        />
      ) : (
        <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap bg-[var(--bg)] rounded-md p-3 border border-[var(--border)] max-h-80 overflow-y-auto">
          {draft.body || draft.snippet || '(empty body)'}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {editing ? (
          <>
            <button onClick={save} className="btn-primary btn-sm">Save</button>
            <button onClick={() => {
              setTo(draft.to || ''); setSubject(draft.subject || ''); setBody(draft.body || ''); setEditing(false)
            }} className="btn-ghost btn-sm"><X className="h-3.5 w-3.5" /> Cancel</button>
          </>
        ) : (
          <>
            <button
              onClick={onApproveSend}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400"
            >
              <Send className="h-3.5 w-3.5" /> Approve &amp; Send
            </button>
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary btn-sm inline-flex items-center gap-1"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
            >
              <ThumbsDown className="h-3.5 w-3.5" /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}
