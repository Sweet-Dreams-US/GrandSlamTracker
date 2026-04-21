'use client'

// /outreach/import — upload a Sweet Dreams Outreach Pack (.docx).
//
// Parses the pack, seeds prospects into the clients table with outreach Notes
// blocks, and optionally creates Gmail drafts from each pack's pre-written
// email draft. Re-running the import is idempotent — prospects with an
// existing outreach block are skipped.

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

const OUTREACH_KEY = process.env.NEXT_PUBLIC_OUTREACH_API_KEY || ''

interface ImportResult {
  ok?: boolean
  parsed_projects: number
  created_prospects: number
  created_drafts: number
  errors: { project_number?: number; project_name?: string; stage: string; error: string }[]
}

export default function ImportPackPage() {
  const [file, setFile] = useState<File | null>(null)
  const [createDrafts, setCreateDrafts] = useState(true)
  const [service, setService] = useState('aerial_cinema')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('create_drafts', createDrafts ? 'true' : 'false')
      fd.append('service', service)
      const res = await fetch('/api/outreach/import', {
        method: 'POST',
        headers: OUTREACH_KEY ? { Authorization: `Bearer ${OUTREACH_KEY}` } : undefined,
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/outreach" className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Import Outreach Pack</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Upload a <code className="px-1 rounded bg-[var(--surface-hover)]">.docx</code> from
            {' '}<code className="px-1 rounded bg-[var(--surface-hover)] text-[10px]">SweetDreamsBusiness/clients/PotentialClients/Outreach/</code>.
            Each project becomes a prospect with an outreach block. If the pack has pre-written drafts, Gmail drafts are created under <code>Outreach/Pending</code>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="form-group">
          <label className="label">Outreach pack file</label>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input"
            required
          />
          {file && (
            <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {file.name} · {(file.size / 1024).toFixed(0)}KB
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Service line</label>
            <select value={service} onChange={(e) => setService(e.target.value)} className="input">
              <option value="aerial_cinema">aerial_cinema (DJI Inspire 2)</option>
              <option value="music">music (studio)</option>
              <option value="video">video (ground cinema)</option>
              <option value="photo">photo</option>
            </select>
          </div>
          <div className="form-group flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              id="create_drafts"
              checked={createDrafts}
              onChange={(e) => setCreateDrafts(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <label htmlFor="create_drafts" className="text-sm text-[var(--foreground)]">
              Also create Gmail drafts (recommended)
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!file || submitting}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {submitting ? 'Importing…' : 'Import pack'}
          </button>
          <Link href="/outreach" className="btn-ghost">Cancel</Link>
        </div>
      </form>

      {error && (
        <div className="card p-4 border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        </div>
      )}

      {result && (
        <div className="card p-5 border-emerald-500/20 bg-emerald-500/5">
          <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Import complete
          </h2>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-[var(--muted)] text-xs">Parsed projects</dt>
              <dd className="text-2xl font-bold text-[var(--foreground)]">{result.parsed_projects}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)] text-xs">Prospects created</dt>
              <dd className="text-2xl font-bold text-[var(--foreground)]">{result.created_prospects}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)] text-xs">Gmail drafts created</dt>
              <dd className="text-2xl font-bold text-[var(--foreground)]">{result.created_drafts}</dd>
            </div>
          </dl>
          {result.errors.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)]">
                {result.errors.length} errors / skips (click to expand)
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                {result.errors.map((e, i) => (
                  <li key={i} className="border-l-2 border-rose-500/40 pl-2">
                    <span className="font-medium">#{e.project_number} {e.project_name}</span>{' '}
                    <span className="text-rose-400">({e.stage})</span>: {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="mt-4 flex gap-2">
            <Link href="/outreach" className="btn-primary btn-sm">
              Go to approval queue →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
