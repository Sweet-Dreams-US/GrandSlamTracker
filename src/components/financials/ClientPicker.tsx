'use client'

// ClientPicker
//
// Searchable combobox for the clients table. Supports:
//  - Typing any free-text client name (legacy flow; clientId stays null)
//  - Selecting an existing client from Supabase (sets both name + clientId)
//  - Showing a link badge for the selected client
//
// Query is server-side (ILIKE) with a debounce, so having 1,500+ clients in the
// DB doesn't bloat the bundle.

import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Check, Link2, Loader2, X } from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ClientOption {
  id: string
  business_name: string
  display_name: string | null
  status: string | null
  industry: string | null
}

interface Props {
  value: string                    // current free-text client name
  clientId: string | null          // null if just free text
  onChange: (name: string, clientId: string | null) => void
  placeholder?: string
  label?: string
}

export default function ClientPicker({ value, clientId, onChange, placeholder, label }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ClientOption | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep local query in sync when parent resets the form
  useEffect(() => {
    if (value !== query) setQuery(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Fetch the canonical client record if we have a clientId but no "selected" cache
  useEffect(() => {
    if (!clientId) { setSelected(null); return }
    if (selected && selected.id === clientId) return
    ;(async () => {
      const supabase = createSupabaseBrowserClient() as any
      const { data } = await supabase
        .from('clients')
        .select('id, business_name, display_name, status, industry')
        .eq('id', clientId)
        .maybeSingle()
      if (data) setSelected(data as ClientOption)
    })()
  }, [clientId, selected])

  // Debounced search
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }

    setLoading(true)
    const handle = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient() as any
      const { data } = await supabase
        .from('clients')
        .select('id, business_name, display_name, status, industry')
        .or(`business_name.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(15)
      setResults((data as ClientOption[]) || [])
      setLoading(false)
    }, 200)
    return () => clearTimeout(handle)
  }, [query, open])

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  function handleInput(v: string) {
    setQuery(v)
    onChange(v, null) // typing clears link
    setOpen(true)
  }

  function pickClient(c: ClientOption) {
    const displayName = c.display_name || c.business_name
    setQuery(displayName)
    setSelected(c)
    onChange(displayName, c.id)
    setOpen(false)
  }

  function clearLink() {
    setSelected(null)
    onChange(query, null)
  }

  return (
    <div className="form-group" ref={containerRef}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          type="text"
          className="input pr-20"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Search clients or type a new name…'}
          autoComplete="off"
        />
        {/* Linked badge / clear link */}
        {clientId && selected && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Link2 className="h-2.5 w-2.5" /> linked
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); clearLink() }}
              className="p-0.5 rounded hover:bg-[var(--surface-hover)]"
              title="Unlink client (keep name as free text)"
            >
              <X className="h-3 w-3 text-[var(--muted)]" />
            </button>
          </div>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="relative">
          <div className="absolute top-1 left-0 right-0 z-20 rounded-lg border bg-[var(--surface)] shadow-lg max-h-80 overflow-y-auto"
               style={{ borderColor: 'var(--border)' }}>
            {loading ? (
              <div className="p-3 text-xs text-[var(--muted)] flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="p-3 text-xs text-[var(--muted)]">
                No match for &ldquo;{query.trim()}&rdquo;. Keep typing &mdash; this will be saved as free text.
              </div>
            ) : (
              <ul className="py-1">
                {results.map((c) => {
                  const isPicked = clientId === c.id
                  const shown = c.display_name || c.business_name
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pickClient(c)}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--surface-hover)] flex items-center gap-2"
                      >
                        {isPicked && <Check className="h-3 w-3 text-emerald-400" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--foreground)] truncate">{shown}</p>
                          {c.display_name && c.display_name !== c.business_name && (
                            <p className="text-[10px] text-[var(--muted)] truncate">{c.business_name}</p>
                          )}
                        </div>
                        {c.status && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--muted)] capitalize">
                            {c.status}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
