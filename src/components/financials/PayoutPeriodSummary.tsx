'use client'

// PayoutPeriodSummary
//
// Jobs-primary pay-period reconciliation. Default view: every job in the
// selected period as a row with checkboxes. Filter by worker or sales name.
// Select one or more jobs, pick a recipient, confirm — the component inserts
// one payment_to_worker / payment_to_sales per selected job for that person's
// outstanding share.
//
// Secondary view: "By Person" summary (recipient grouped) for when you just
// want the totals.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertCircle,
  Filter,
  List,
  Users,
} from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ─────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  name: string
  role: string
  entity: string
}

interface BreakdownEntry {
  name?: string
  amount?: number
  percent?: number
}

interface PayoutRecordLite {
  id: string
  date: string
  client_name: string
  deal_type: string
  total_revenue: number
  calculation_details: {
    workerBreakdown?: BreakdownEntry[]
    salesBreakdown?: BreakdownEntry[]
  } | null
}

interface PayoutTxnLite {
  id: string
  payout_record_id: string
  transaction_type: string
  recipient: string | null
  amount: number
  date: string
}

type RecipientType = 'worker' | 'sales'

interface PersonLine {
  canonical_name: string
  team_member_id: string | null
  matched_role: string | null
  amount_owed: number
  amount_paid: number
  outstanding: number
}

/** A single job with expanded per-person lines on each side. */
interface JobRow {
  id: string
  date: string
  client_name: string
  deal_type: string
  total_revenue: number
  workers: PersonLine[]
  sales: PersonLine[]
  total_owed: number
  total_paid: number
  outstanding: number
  all_paid: boolean
}

/** Who will be paid how much from the user's selection. */
interface PaymentPreviewRow {
  payout_record_id: string
  client_name: string
  recipient_type: RecipientType
  amount: number
}

// ─── Utility ──────────────────────────────────────────────────────

function defaultPeriod(today = new Date()): { start: string; end: string; label: string } {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayDay = d.getDate()
  const endMonthOffset = todayDay >= 23 ? 0 : -1
  const endDate = new Date(d.getFullYear(), d.getMonth() + endMonthOffset, 23)
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 23)
  return {
    start: toISO(startDate),
    end: toISO(endDate),
    label: `${startDate.toLocaleString('en-US', { month: 'short' })} 23 → ${endDate.toLocaleString('en-US', { month: 'short' })} 23`,
  }
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

function fmtShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function nextDayISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return toISO(d)
}

function normalizeRecipient(
  raw: string | null | undefined,
  teamMembers: TeamMember[]
): { canonical: string; matched: TeamMember | null } {
  if (!raw) return { canonical: '(unknown)', matched: null }
  const input = raw.trim()
  if (!input) return { canonical: '(unknown)', matched: null }
  const lower = input.toLowerCase()
  const exact = teamMembers.find((m) => m.name.toLowerCase() === lower)
  if (exact) return { canonical: exact.name, matched: exact }
  const firstToken = lower.split(/\s+/)[0]
  if (firstToken) {
    const matches = teamMembers.filter((m) => m.name.toLowerCase().split(/\s+/)[0] === firstToken)
    if (matches.length === 1) return { canonical: matches[0].name, matched: matches[0] }
  }
  const parts = lower.split(/\s+/)
  const lastToken = parts[parts.length - 1]
  if (lastToken && lastToken !== firstToken) {
    const matches = teamMembers.filter((m) => m.name.toLowerCase().split(/\s+/).slice(-1)[0] === lastToken)
    if (matches.length === 1) return { canonical: matches[0].name, matched: matches[0] }
  }
  return { canonical: input, matched: null }
}

// ─── Main component ───────────────────────────────────────────────

export default function PayoutPeriodSummary() {
  const [period, setPeriod] = useState(() => defaultPeriod())
  const [records, setRecords] = useState<PayoutRecordLite[]>([])
  const [txns, setTxns] = useState<PayoutTxnLite[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // View toggle
  const [view, setView] = useState<'jobs' | 'person'>('jobs')

  // Jobs view state
  const [workerFilter, setWorkerFilter] = useState<string>('all')
  const [salesFilter, setSalesFilter] = useState<string>('all')
  const [paidFilter, setPaidFilter] = useState<'all' | 'outstanding' | 'paid'>('outstanding')
  const [selected, setSelected] = useState<Set<string>>(new Set()) // payout_record_ids
  const [payeeName, setPayeeName] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(toISO(new Date()))
  const [submitting, setSubmitting] = useState(false)
  // Per-line amount overrides for partial payments.
  // Key = `${payout_record_id}::${recipient_type}`; value = string input (blank means "use outstanding").
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})

  // Person-view expand state
  const [personExpanded, setPersonExpanded] = useState<Record<string, boolean>>({})
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const supabase = createSupabaseBrowserClient() as any
    const [tmRes, prRes] = await Promise.all([
      supabase.from('team_members').select('id, name, role, entity').eq('status', 'active'),
      supabase
        .from('payout_records')
        .select('id, date, client_name, deal_type, total_revenue, calculation_details')
        .gte('date', period.start)
        .lt('date', nextDayISO(period.end))
        .order('date', { ascending: false }),
    ])
    if (tmRes.error) { setError(tmRes.error.message); setLoading(false); setRefreshing(false); return }
    if (prRes.error) { setError(prRes.error.message); setLoading(false); setRefreshing(false); return }
    const recs = (prRes.data || []) as PayoutRecordLite[]
    setTeamMembers(tmRes.data || [])
    setRecords(recs)

    const ids = recs.map((r) => r.id)
    if (ids.length > 0) {
      const txnRes = await supabase
        .from('payout_transactions')
        .select('id, payout_record_id, transaction_type, recipient, amount, date')
        .in('payout_record_id', ids)
        .in('transaction_type', ['payment_to_worker', 'payment_to_sales'])
      if (txnRes.error) { setError(txnRes.error.message) } else { setTxns(txnRes.data || []) }
    } else {
      setTxns([])
    }
    setLoading(false)
    setRefreshing(false)
  }, [period.start, period.end])

  useEffect(() => { load() }, [load])

  // ─── Build JobRow list ────────────────────────────────────────

  const jobRows: JobRow[] = useMemo(() => {
    // Index paid per (record, canonical_name, kind)
    const paidIndex = new Map<string, number>()
    for (const t of txns) {
      const { canonical } = normalizeRecipient(t.recipient, teamMembers)
      const kind = t.transaction_type === 'payment_to_worker' ? 'worker' : 'sales'
      const key = `${t.payout_record_id}::${canonical}::${kind}`
      paidIndex.set(key, (paidIndex.get(key) || 0) + Number(t.amount))
    }

    const rows: JobRow[] = records.map((r) => {
      const cd = r.calculation_details
      const workers: PersonLine[] = []
      const sales: PersonLine[] = []

      for (const w of cd?.workerBreakdown || []) {
        if (!w.name || !w.amount || w.amount <= 0) continue
        const { canonical, matched } = normalizeRecipient(w.name, teamMembers)
        const paid = paidIndex.get(`${r.id}::${canonical}::worker`) || 0
        const outstanding = Math.max(0, Math.round((Number(w.amount) - paid) * 100) / 100)
        workers.push({
          canonical_name: canonical,
          team_member_id: matched?.id || null,
          matched_role: matched?.role || null,
          amount_owed: Math.round(Number(w.amount) * 100) / 100,
          amount_paid: Math.round(paid * 100) / 100,
          outstanding,
        })
      }
      for (const s of cd?.salesBreakdown || []) {
        if (!s.name || !s.amount || s.amount <= 0) continue
        const { canonical, matched } = normalizeRecipient(s.name, teamMembers)
        const paid = paidIndex.get(`${r.id}::${canonical}::sales`) || 0
        const outstanding = Math.max(0, Math.round((Number(s.amount) - paid) * 100) / 100)
        sales.push({
          canonical_name: canonical,
          team_member_id: matched?.id || null,
          matched_role: matched?.role || null,
          amount_owed: Math.round(Number(s.amount) * 100) / 100,
          amount_paid: Math.round(paid * 100) / 100,
          outstanding,
        })
      }

      const total_owed =
        workers.reduce((s, l) => s + l.amount_owed, 0) +
        sales.reduce((s, l) => s + l.amount_owed, 0)
      const total_paid =
        workers.reduce((s, l) => s + l.amount_paid, 0) +
        sales.reduce((s, l) => s + l.amount_paid, 0)
      const outstanding =
        workers.reduce((s, l) => s + l.outstanding, 0) +
        sales.reduce((s, l) => s + l.outstanding, 0)
      return {
        id: r.id,
        date: r.date,
        client_name: r.client_name,
        deal_type: r.deal_type,
        total_revenue: Number(r.total_revenue),
        workers,
        sales,
        total_owed: Math.round(total_owed * 100) / 100,
        total_paid: Math.round(total_paid * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        all_paid: outstanding <= 0 && total_owed > 0,
      }
    })

    return rows
  }, [records, txns, teamMembers])

  // ─── Available people (from current job set) ─────────────────

  const availableWorkers = useMemo(() => {
    const s = new Set<string>()
    for (const j of jobRows) for (const w of j.workers) s.add(w.canonical_name)
    return Array.from(s).sort()
  }, [jobRows])

  const availableSales = useMemo(() => {
    const s = new Set<string>()
    for (const j of jobRows) for (const sl of j.sales) s.add(sl.canonical_name)
    return Array.from(s).sort()
  }, [jobRows])

  const allPayees = useMemo(() => {
    return Array.from(new Set([...availableWorkers, ...availableSales])).sort()
  }, [availableWorkers, availableSales])

  // ─── Filtered jobs ────────────────────────────────────────────

  const filteredJobs = useMemo(() => {
    return jobRows.filter((j) => {
      if (workerFilter !== 'all' && !j.workers.some((w) => w.canonical_name === workerFilter)) return false
      if (salesFilter !== 'all' && !j.sales.some((s) => s.canonical_name === salesFilter)) return false
      if (paidFilter === 'outstanding' && j.outstanding <= 0) return false
      if (paidFilter === 'paid' && j.outstanding > 0) return false
      return true
    })
  }, [jobRows, workerFilter, salesFilter, paidFilter])

  // ─── Selection + preview ──────────────────────────────────────

  const selectedJobs = useMemo(
    () => jobRows.filter((j) => selected.has(j.id)),
    [jobRows, selected]
  )

  /** Compute the actual amount to pay for a line, applying any override from customAmounts. */
  function resolveAmount(jobId: string, type: RecipientType, outstanding: number): number {
    const key = `${jobId}::${type}`
    const raw = customAmounts[key]
    if (raw === undefined || raw === '') return Math.round(outstanding * 100) / 100
    const n = parseFloat(raw)
    if (isNaN(n) || n < 0) return 0
    // Cap at outstanding so a typo can't overpay
    return Math.min(Math.round(n * 100) / 100, Math.round(outstanding * 100) / 100)
  }

  const paymentPreview: (PaymentPreviewRow & { outstanding: number })[] = useMemo(() => {
    if (!payeeName || selectedJobs.length === 0) return []
    const out: (PaymentPreviewRow & { outstanding: number })[] = []
    for (const j of selectedJobs) {
      const w = j.workers.find((l) => l.canonical_name === payeeName)
      if (w && w.outstanding > 0) {
        out.push({
          payout_record_id: j.id,
          client_name: j.client_name,
          recipient_type: 'worker',
          amount: resolveAmount(j.id, 'worker', w.outstanding),
          outstanding: w.outstanding,
        })
      }
      const s = j.sales.find((l) => l.canonical_name === payeeName)
      if (s && s.outstanding > 0) {
        out.push({
          payout_record_id: j.id,
          client_name: j.client_name,
          recipient_type: 'sales',
          amount: resolveAmount(j.id, 'sales', s.outstanding),
          outstanding: s.outstanding,
        })
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobs, payeeName, customAmounts])

  const previewTotal = useMemo(
    () => paymentPreview.reduce((s, l) => s + l.amount, 0),
    [paymentPreview]
  )
  const previewOutstandingTotal = useMemo(
    () => paymentPreview.reduce((s, l) => s + l.outstanding, 0),
    [paymentPreview]
  )

  // Auto-default payee from worker filter (best guess)
  useEffect(() => {
    if (workerFilter !== 'all' && !payeeName) setPayeeName(workerFilter)
    if (salesFilter !== 'all' && !payeeName) setPayeeName(salesFilter)
  }, [workerFilter, salesFilter, payeeName])

  // ─── Actions ──────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllFiltered() {
    setSelected(new Set(filteredJobs.filter((j) => j.outstanding > 0).map((j) => j.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function confirmPayment() {
    if (!payeeName) { alert('Pick a recipient first.'); return }
    const payable = paymentPreview.filter((p) => p.amount > 0)
    if (payable.length === 0) {
      alert(`Nothing to pay — every line is set to $0 or ${payeeName} has no outstanding on the selected jobs.`)
      return
    }
    const skipped = selectedJobs.length - new Set(paymentPreview.map((p) => p.payout_record_id)).size
    const zeroLines = paymentPreview.length - payable.length
    const partialCount = payable.filter((p) => p.amount < p.outstanding).length
    const msg =
      `Record payment of ${fmt(payable.reduce((s, p) => s + p.amount, 0))} to ${payeeName}?\n\n` +
      `Inserts ${payable.length} transaction${payable.length === 1 ? '' : 's'} dated ${paymentDate}.` +
      (partialCount > 0 ? `\n(${partialCount} partial payment${partialCount === 1 ? '' : 's'} — remaining balance will stay outstanding.)` : '') +
      (zeroLines > 0 ? `\n${zeroLines} line${zeroLines === 1 ? '' : 's'} set to $0 will be skipped.` : '') +
      (skipped > 0 ? `\n${skipped} selected job${skipped === 1 ? '' : 's'} had no outstanding for ${payeeName}.` : '')
    if (!window.confirm(msg)) return

    setSubmitting(true)
    const supabase = createSupabaseBrowserClient() as any
    const rows = payable.map((p) => ({
      payout_record_id: p.payout_record_id,
      transaction_type: p.recipient_type === 'worker' ? 'payment_to_worker' : 'payment_to_sales',
      recipient: payeeName,
      amount: p.amount,
      date: paymentDate,
      description:
        p.amount < p.outstanding
          ? `Partial payout (${fmt(p.amount)} of ${fmt(p.outstanding)}) from period view ${period.label}`
          : `Bulk payout from period view ${period.label}`,
    }))
    const { error } = await supabase.from('payout_transactions').insert(rows)
    setSubmitting(false)
    if (error) {
      alert(`Insert failed: ${error.message}`)
      return
    }
    setSelected(new Set())
    setCustomAmounts({})
    await load()
  }

  // ─── Period controls ─────────────────────────────────────────

  function togglePeriodPreset(kind: 'prev' | 'next' | 'today') {
    if (kind === 'today') { setPeriod(defaultPeriod()); return }
    const currentEnd = new Date(period.end + 'T00:00:00')
    const newEnd = new Date(currentEnd)
    newEnd.setMonth(newEnd.getMonth() + (kind === 'next' ? 1 : -1))
    const newStart = new Date(newEnd)
    newStart.setMonth(newStart.getMonth() - 1)
    setPeriod({
      start: toISO(newStart),
      end: toISO(newEnd),
      label: `${newStart.toLocaleString('en-US', { month: 'short' })} ${newStart.getDate()} → ${newEnd.toLocaleString('en-US', { month: 'short' })} ${newEnd.getDate()}`,
    })
  }

  function onDateChange(which: 'start' | 'end', value: string) {
    setPeriod((p) => ({
      ...p,
      [which]: value,
      label: `${fmtShort(which === 'start' ? value : p.start)} → ${fmtShort(which === 'end' ? value : p.end)}`,
    }))
  }

  // ─── By-Person view data ─────────────────────────────────────

  const personGroups = useMemo(() => {
    interface G { name: string; role: string | null; lines: { job: JobRow; line: PersonLine; type: RecipientType }[]; owed: number; paid: number; outstanding: number }
    const map = new Map<string, G>()
    const push = (name: string, role: string | null, job: JobRow, line: PersonLine, type: RecipientType) => {
      if (!map.has(name)) map.set(name, { name, role, lines: [], owed: 0, paid: 0, outstanding: 0 })
      const g = map.get(name)!
      g.lines.push({ job, line, type })
      g.owed += line.amount_owed
      g.paid += line.amount_paid
      g.outstanding += line.outstanding
    }
    for (const j of jobRows) {
      for (const w of j.workers) push(w.canonical_name, w.matched_role, j, w, 'worker')
      for (const s of j.sales) push(s.canonical_name, s.matched_role, j, s, 'sales')
    }
    const arr = Array.from(map.values())
    arr.sort((a, b) => (b.outstanding - a.outstanding) || (b.owed - a.owed))
    for (const g of arr) {
      g.owed = Math.round(g.owed * 100) / 100
      g.paid = Math.round(g.paid * 100) / 100
      g.outstanding = Math.round(g.outstanding * 100) / 100
      g.lines.sort((a, b) => b.job.date.localeCompare(a.job.date))
    }
    return arr
  }, [jobRows])

  async function markPersonFullyPaid(name: string) {
    const group = personGroups.find((g) => g.name === name)
    if (!group || group.outstanding === 0) return
    const outstandingLines = group.lines.filter((l) => l.line.outstanding > 0)
    const ok = window.confirm(
      `Mark ${name} paid in full for ${outstandingLines.length} deals? Inserts ${outstandingLines.length} transactions totaling ${fmt(group.outstanding)} dated ${paymentDate}.`
    )
    if (!ok) return
    setMarkingPaid(name)
    const supabase = createSupabaseBrowserClient() as any
    const rows = outstandingLines.map((l) => ({
      payout_record_id: l.job.id,
      transaction_type: l.type === 'worker' ? 'payment_to_worker' : 'payment_to_sales',
      recipient: name,
      amount: l.line.outstanding,
      date: paymentDate,
      description: `Bulk payout for period ${period.label}`,
    }))
    const { error } = await supabase.from('payout_transactions').insert(rows)
    setMarkingPaid(null)
    if (error) { alert(`Insert failed: ${error.message}`); return }
    await load()
  }

  // ─── Totals ──────────────────────────────────────────────────

  const totals = useMemo(() => {
    const owed = jobRows.reduce((s, j) => s + j.total_owed, 0)
    const paid = jobRows.reduce((s, j) => s + j.total_paid, 0)
    const outstanding = jobRows.reduce((s, j) => s + j.outstanding, 0)
    return { owed: Math.round(owed * 100) / 100, paid: Math.round(paid * 100) / 100, outstanding: Math.round(outstanding * 100) / 100 }
  }, [jobRows])

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="section-title mb-1">Pay Period Reconciliation</h2>
          <p className="text-xs text-[var(--muted)]">
            Every job this period. Filter, select the ones you&apos;re paying out, pick the recipient, confirm.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
            <button
              onClick={() => setView('jobs')}
              className={`px-3 py-1.5 inline-flex items-center gap-1.5 ${view === 'jobs' ? 'bg-[var(--accent)] text-black' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'}`}
            >
              <List className="h-3.5 w-3.5" /> By Job
            </button>
            <button
              onClick={() => setView('person')}
              className={`px-3 py-1.5 inline-flex items-center gap-1.5 border-l border-[var(--border)] ${view === 'person' ? 'bg-[var(--accent)] text-black' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'}`}
            >
              <Users className="h-3.5 w-3.5" /> By Person
            </button>
          </div>
          <button onClick={() => togglePeriodPreset('prev')} className="btn-secondary btn-sm">← Previous</button>
          <button onClick={() => togglePeriodPreset('today')} className="btn-secondary btn-sm">This month</button>
          <button onClick={() => togglePeriodPreset('next')} className="btn-secondary btn-sm">Next →</button>
          <button onClick={() => { setRefreshing(true); load() }} disabled={refreshing} className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date range + totals */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--muted)]" />
          <input type="date" value={period.start} onChange={(e) => onDateChange('start', e.target.value)} className="input text-xs py-1 px-2 w-36" />
          <span className="text-[var(--muted)]">→</span>
          <input type="date" value={period.end} onChange={(e) => onDateChange('end', e.target.value)} className="input text-xs py-1 px-2 w-36" />
        </div>
        <div className="text-xs text-[var(--muted)] md:ml-4">
          {jobRows.length} jobs · owed <span className="text-[var(--foreground)] font-semibold">{fmt(totals.owed)}</span> · paid <span className="text-emerald-400 font-semibold">{fmt(totals.paid)}</span> · outstanding <span className="text-amber-400 font-semibold">{fmt(totals.outstanding)}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" /></div>
      ) : view === 'jobs' ? (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 text-[var(--muted)]">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </div>
            <label className="text-[var(--muted)]">Worker:
              <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} className="input text-xs py-1 px-2 ml-1 w-auto">
                <option value="all">All</option>
                {availableWorkers.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
            <label className="text-[var(--muted)]">Sales:
              <select value={salesFilter} onChange={(e) => setSalesFilter(e.target.value)} className="input text-xs py-1 px-2 ml-1 w-auto">
                <option value="all">All</option>
                {availableSales.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-[var(--muted)]">Status:
              <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value as 'all' | 'outstanding' | 'paid')} className="input text-xs py-1 px-2 ml-1 w-auto">
                <option value="outstanding">Outstanding only</option>
                <option value="all">All</option>
                <option value="paid">Paid in full only</option>
              </select>
            </label>
            <button onClick={() => { setWorkerFilter('all'); setSalesFilter('all'); setPaidFilter('outstanding') }} className="text-[var(--accent)] hover:underline">Reset</button>
          </div>

          {/* Select-all / clear */}
          <div className="flex items-center gap-3 text-xs">
            <button onClick={selectAllFiltered} className="text-[var(--accent)] hover:underline">
              Select all {filteredJobs.filter((j) => j.outstanding > 0).length} filtered jobs with outstanding
            </button>
            {selected.size > 0 && (
              <>
                <span className="text-[var(--muted)]">·</span>
                <button onClick={clearSelection} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                  Clear selection ({selected.size})
                </button>
              </>
            )}
          </div>

          {/* Jobs table */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)] text-sm">
              No jobs match the current filters.
            </div>
          ) : (
            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th className="w-8"></th>
                    <th>Client / Deal</th>
                    <th>Date</th>
                    <th className="text-right">Revenue</th>
                    <th>Workers</th>
                    <th>Sales</th>
                    <th className="text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((j) => {
                    const isChecked = selected.has(j.id)
                    const disabled = j.outstanding <= 0
                    return (
                      <tr
                        key={j.id}
                        onClick={() => !disabled && toggleSelect(j.id)}
                        className={`cursor-pointer ${isChecked ? '!bg-[var(--accent)]/10' : ''} ${disabled ? 'opacity-60' : ''}`}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => !disabled && toggleSelect(j.id)}
                            disabled={disabled}
                            className="accent-[var(--accent)]"
                          />
                        </td>
                        <td>
                          <div className="font-medium text-[var(--foreground)]">{j.client_name}</div>
                          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{j.deal_type.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="text-[var(--muted)]">{fmtShort(j.date)}</td>
                        <td className="text-right">{fmt(j.total_revenue)}</td>
                        <td>
                          {j.workers.length === 0 ? (
                            <span className="text-[var(--muted)]">—</span>
                          ) : (
                            <div className="space-y-0.5">
                              {j.workers.map((w) => (
                                <div key={w.canonical_name} className="flex items-center gap-1.5 text-[11px]">
                                  <span className={workerFilter === w.canonical_name ? 'font-bold text-[var(--accent)]' : 'text-[var(--foreground)]'}>{w.canonical_name}</span>
                                  <span className={w.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}>{fmt(w.outstanding)}</span>
                                  {w.outstanding === 0 && w.amount_owed > 0 && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {j.sales.length === 0 ? (
                            <span className="text-[var(--muted)]">—</span>
                          ) : (
                            <div className="space-y-0.5">
                              {j.sales.map((s) => (
                                <div key={s.canonical_name} className="flex items-center gap-1.5 text-[11px]">
                                  <span className={salesFilter === s.canonical_name ? 'font-bold text-[var(--accent)]' : 'text-[var(--foreground)]'}>{s.canonical_name}</span>
                                  <span className={s.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}>{fmt(s.outstanding)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className={`text-right font-semibold ${j.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {fmt(j.outstanding)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action bar */}
          {selected.size > 0 && (
            <div className="sticky bottom-4 mt-4 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {selected.size} job{selected.size === 1 ? '' : 's'} selected
                  </p>
                  <p className="text-xs text-[var(--muted)]">Choose who you&apos;re paying + confirm to record transactions.</p>
                </div>
                <button onClick={clearSelection} className="btn-ghost btn-sm">Clear</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">Pay to</label>
                  <select value={payeeName} onChange={(e) => setPayeeName(e.target.value)} className="input text-sm">
                    <option value="">— pick a person —</option>
                    {allPayees.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Payment date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="input text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Total to pay</label>
                  <div className="input text-sm font-bold text-emerald-400 inline-flex items-center h-10">
                    {fmt(previewTotal)}
                    {previewTotal < previewOutstandingTotal && (
                      <span className="ml-2 text-[10px] text-amber-400 font-normal">
                        (partial — {fmt(previewOutstandingTotal - previewTotal)} still outstanding after)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {payeeName && (
                <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Preview — edit amounts for partial payments</p>
                    {Object.keys(customAmounts).length > 0 && (
                      <button onClick={() => setCustomAmounts({})} className="text-[10px] text-[var(--accent)] hover:underline">
                        Reset all to full
                      </button>
                    )}
                  </div>
                  {paymentPreview.length === 0 ? (
                    <p className="text-xs text-amber-400">
                      {payeeName} has nothing outstanding on the selected jobs. Pick different jobs or a different recipient.
                    </p>
                  ) : (
                    <ul className="text-xs space-y-1.5">
                      {paymentPreview.map((p) => {
                        const key = `${p.payout_record_id}::${p.recipient_type}`
                        const rawInput = customAmounts[key] ?? ''
                        const displayValue = rawInput === '' ? p.outstanding.toFixed(2) : rawInput
                        const isPartial = p.amount > 0 && p.amount < p.outstanding
                        const isZero = p.amount === 0
                        return (
                          <li key={key} className="flex items-center gap-2">
                            <span className="flex-1 min-w-0 truncate text-[var(--foreground)]">
                              {p.client_name} <span className="text-[var(--muted)]">({p.recipient_type})</span>
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">$</span>
                            <input
                              type="number"
                              min="0"
                              max={p.outstanding}
                              step="0.01"
                              value={displayValue}
                              onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [key]: e.target.value }))}
                              onFocus={(e) => e.target.select()}
                              className="input text-xs py-0.5 px-1.5 w-24 text-right font-mono"
                            />
                            <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">
                              of {fmt(p.outstanding)}
                            </span>
                            {isPartial && (
                              <span className="text-[10px] px-1 rounded bg-amber-500/10 text-amber-400">partial</span>
                            )}
                            {isZero && (
                              <span className="text-[10px] px-1 rounded bg-rose-500/10 text-rose-400">skip</span>
                            )}
                          </li>
                        )
                      })}
                      {selectedJobs.length - new Set(paymentPreview.map((p) => p.payout_record_id)).size > 0 && (
                        <li className="text-amber-400 pt-1 border-t border-[var(--border)]">
                          {selectedJobs.length - new Set(paymentPreview.map((p) => p.payout_record_id)).size} selected job(s) hidden — {payeeName} has nothing outstanding on them.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={confirmPayment}
                  disabled={!payeeName || paymentPreview.length === 0 || submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  {submitting ? 'Recording…' : `Record payment to ${payeeName || '…'}`}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ─── By-Person view (secondary) ─── */
        <>
          {personGroups.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)] text-sm">No payouts in this period.</div>
          ) : (
            <div className="space-y-2">
              {personGroups.map((g) => {
                const isExpanded = !!personExpanded[g.name]
                const fullyPaid = g.outstanding === 0 && g.owed > 0
                return (
                  <div key={g.name} className="rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                      onClick={() => setPersonExpanded((e) => ({ ...e, [g.name]: !e[g.name] }))}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted)]" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[var(--foreground)]">{g.name}</span>
                          {g.role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--muted)] capitalize">{g.role}</span>}
                          {fullyPaid && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> paid in full
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {g.lines.length} line{g.lines.length === 1 ? '' : 's'} · owed {fmt(g.owed)} · paid {fmt(g.paid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--muted)]">Outstanding</p>
                        <p className={`text-base font-bold ${g.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{fmt(g.outstanding)}</p>
                      </div>
                      {g.outstanding > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markPersonFullyPaid(g.name) }}
                          disabled={markingPaid === g.name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {markingPaid === g.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                          {markingPaid === g.name ? 'Saving…' : 'Mark paid in full'}
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="border-t border-[var(--border)]">
                        <table className="table text-xs">
                          <thead>
                            <tr>
                              <th>Deal</th>
                              <th>Date</th>
                              <th>Type</th>
                              <th className="text-right">Owed</th>
                              <th className="text-right">Paid</th>
                              <th className="text-right">Outstanding</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.lines.map((l) => (
                              <tr key={`${l.job.id}-${l.type}`}>
                                <td className="font-medium text-[var(--foreground)]">{l.job.client_name}</td>
                                <td className="text-[var(--muted)]">{fmtShort(l.job.date)}</td>
                                <td>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${l.type === 'worker' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {l.type}
                                  </span>
                                </td>
                                <td className="text-right">{fmt(l.line.amount_owed)}</td>
                                <td className="text-right text-emerald-400">{fmt(l.line.amount_paid)}</td>
                                <td className={`text-right font-semibold ${l.line.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {fmt(l.line.outstanding)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
