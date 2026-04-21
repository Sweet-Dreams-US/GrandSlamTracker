'use client'

// /outreach/settings — one-time init + status.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Tag } from 'lucide-react'

const OUTREACH_KEY = process.env.NEXT_PUBLIC_OUTREACH_API_KEY || ''

export default function SettingsPage() {
  const [labels, setLabels] = useState<Record<string, string> | null>(null)
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [labelsError, setLabelsError] = useState<string | null>(null)

  const initLabels = useCallback(async () => {
    setLabelsLoading(true)
    setLabelsError(null)
    try {
      const res = await fetch('/api/outreach/gmail/labels/init', {
        method: 'POST',
        headers: OUTREACH_KEY ? { Authorization: `Bearer ${OUTREACH_KEY}` } : undefined,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setLabels(data.labels)
    } catch (e) {
      setLabelsError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLabelsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Nothing to auto-load; labels/init is explicit.
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/outreach" className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Outreach Settings</h1>
          <p className="text-sm text-[var(--muted)] mt-1">One-time setup + system checks.</p>
        </div>
      </div>

      <section className="card p-6 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Tag className="h-4 w-4" /> Gmail labels
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Initialize the 10 required <code className="px-1 rounded bg-[var(--surface-hover)]">Outreach/*</code> labels
          on <code className="px-1 rounded bg-[var(--surface-hover)]">cole@sweetdreams.us</code>.
          Idempotent — safe to run repeatedly.
        </p>
        <button
          onClick={initLabels}
          disabled={labelsLoading}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {labelsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
          {labelsLoading ? 'Creating…' : 'Initialize labels'}
        </button>
        {labelsError && (
          <p className="text-sm text-red-400 flex items-center gap-2 mt-2">
            <AlertCircle className="h-4 w-4" /> {labelsError}
          </p>
        )}
        {labels && (
          <div className="mt-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> {Object.keys(labels).length} labels ready
            </p>
            <ul className="grid grid-cols-2 gap-1 text-xs text-[var(--muted)]">
              {Object.entries(labels).map(([name, id]) => (
                <li key={id} className="truncate"><span className="text-[var(--foreground)]">{name}</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
