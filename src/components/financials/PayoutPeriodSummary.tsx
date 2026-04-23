'use client'

// PayoutPeriodSummary
//
// Consolidated pay-period reconciliation: shows every worker + sales recipient,
// how much they are OWED across all deals in the period (from
// payout_records.calculation_details.{workerBreakdown,salesBreakdown}),
// how much they have been PAID (from payout_transactions), and the outstanding
// amount per person + per deal. One click per person to mark all outstanding
// as paid (inserts one payment_to_* row per deal, keeping the audit trail).
//
// Default pay period: the most-recently-ended "23rd of month N to 23rd of
// month N+1" window. Cole pays himself + Jay on the 23rd, so this window
// answers "what do we owe each other today?"

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
  Users,
  AlertCircle,
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
  calculation_details: {
    workerBreakdown?: BreakdownEntry[]
    salesBreakdown?: BreakdownEntry[]
  } | null
}

interface PayoutTxnLite {
  id: string
  payout_record_id: string
  transaction_type: string // "payment_to_worker" | "payment_to_sales" | "payment_to_business" | "deposit_received"
  recipient: string | null
  amount: number
  date: string
}

/** A single (recipient, deal, role) owed amount with how much has been paid. */
interface OwedDealLine {
  payout_record_id: string
  deal_date: string
  client_name: string
  recipient_type: 'worker' | 'sales'
  amount_owed: number
  amount_paid: number
  outstanding: number
}

interface RecipientGroup {
  canonical_name: string
  team_member_id: string | null
  matched_role: string | null
  lines: OwedDealLine[]
  total_owed: number
  total_paid: number
  outstanding: number
}

// ─── Pay period defaults ──────────────────────────────────────────

/** Compute the pay period that just ended, paying on the 23rd of the month. */
function defaultPeriod(today = new Date()): { start: string; end: string; label: string } {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayDay = d.getDate()
  // If today is on or after the 23rd, the just-ended period is
  //   "23rd of last month" .. "23rd of this month".
  // Else, the just-ended period is "23rd of 2 months ago" .. "23rd of last month".
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtShort(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Name normalization ────────────────────────────────────────────

/**
 * Map a free-text recipient name from payout_records/payout_transactions to a
 * canonical team_members.name when possible. Returns { canonical, match }.
 * Unknown names fall through as their original form.
 */
function normalizeRecipient(
  raw: string | null | undefined,
  teamMembers: TeamMember[]
): { canonical: string; matched: TeamMember | null } {
  if (!raw) return { canonical: '(unknown)', matched: null }
  const input = raw.trim()
  if (!input) return { canonical: '(unknown)', matched: null }

  const lower = input.toLowerCase()
  // 1. exact case-insensitive full name
  const exact = teamMembers.find((m) => m.name.toLowerCase() === lower)
  if (exact) return { canonical: exact.name, matched: exact }

  // 2. first-token match if unique (e.g. "Cole" -> "Cole Marcuccilli")
  const firstToken = lower.split(/\s+/)[0]
  if (firstToken) {
    const firstMatches = teamMembers.filter(
      (m) => m.name.toLowerCase().split(/\s+/)[0] === firstToken
    )
    if (firstMatches.length === 1) return { canonical: firstMatches[0].name, matched: firstMatches[0] }
  }

  // 3. last-token match if unique
  const parts = lower.split(/\s+/)
  const lastToken = parts[parts.length - 1]
  if (lastToken && lastToken !== firstToken) {
    const lastMatches = teamMembers.filter(
      (m) => m.name.toLowerCase().split(/\s+/).slice(-1)[0] === lastToken
    )
    if (lastMatches.length === 1) return { canonical: lastMatches[0].name, matched: lastMatches[0] }
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const supabase = createSupabaseBrowserClient() as any

    // Fetch:
    //   1. team_members (for name normalization)
    //   2. payout_records in the period
    //   3. payout_transactions for those records (for paid amounts)
    const [tmRes, prRes] = await Promise.all([
      supabase.from('team_members').select('id, name, role, entity').eq('status', 'active'),
      supabase
        .from('payout_records')
        .select('id, date, client_name, deal_type, calculation_details')
        .gte('date', period.start)
        .lt('date', nextDayISO(period.end))
        .order('date', { ascending: false }),
    ])

    if (tmRes.error) { setError(tmRes.error.message); setLoading(false); setRefreshing(false); return }
    if (prRes.error) { setError(prRes.error.message); setLoading(false); setRefreshing(false); return }

    const recs = (prRes.data || []) as PayoutRecordLite[]
    setTeamMembers(tmRes.data || [])
    setRecords(recs)

    const recordIds = recs.map((r) => r.id)
    if (recordIds.length > 0) {
      const txnRes = await supabase
        .from('payout_transactions')
        .select('id, payout_record_id, transaction_type, recipient, amount, date')
        .in('payout_record_id', recordIds)
        .in('transaction_type', ['payment_to_worker', 'payment_to_sales'])
      if (txnRes.error) {
        setError(txnRes.error.message)
      } else {
        setTxns(txnRes.data || [])
      }
    } else {
      setTxns([])
    }

    setLoading(false)
    setRefreshing(false)
  }, [period.start, period.end])

  useEffect(() => { load() }, [load])

  // ─── Aggregation ───────────────────────────────────────────────

  const groups = useMemo<RecipientGroup[]>(() => {
    // Build a map of canonical name -> lines
    const map = new Map<string, RecipientGroup>()

    // Index paid amounts by (canonical_name, payout_record_id, type)
    const paidIndex = new Map<string, number>()
    for (const t of txns) {
      const { canonical } = normalizeRecipient(t.recipient, teamMembers)
      const roleKey = t.transaction_type === 'payment_to_worker' ? 'worker' : 'sales'
      const key = `${canonical}::${t.payout_record_id}::${roleKey}`
      paidIndex.set(key, (paidIndex.get(key) || 0) + Number(t.amount))
    }

    const addLine = (
      recipientRaw: string,
      recordId: string,
      dealDate: string,
      clientName: string,
      type: 'worker' | 'sales',
      owed: number
    ) => {
      if (!owed || owed <= 0) return
      const { canonical, matched } = normalizeRecipient(recipientRaw, teamMembers)
      const paid = paidIndex.get(`${canonical}::${recordId}::${type}`) || 0
      const outstanding = Math.max(0, Math.round((owed - paid) * 100) / 100)

      const line: OwedDealLine = {
        payout_record_id: recordId,
        deal_date: dealDate,
        client_name: clientName,
        recipient_type: type,
        amount_owed: Math.round(owed * 100) / 100,
        amount_paid: Math.round(paid * 100) / 100,
        outstanding,
      }

      if (!map.has(canonical)) {
        map.set(canonical, {
          canonical_name: canonical,
          team_member_id: matched?.id || null,
          matched_role: matched?.role || null,
          lines: [],
          total_owed: 0,
          total_paid: 0,
          outstanding: 0,
        })
      }
      const g = map.get(canonical)!
      g.lines.push(line)
      g.total_owed += line.amount_owed
      g.total_paid += line.amount_paid
      g.outstanding += line.outstanding
    }

    for (const r of records) {
      const cd = r.calculation_details
      if (!cd) continue
      for (const w of cd.workerBreakdown || []) {
        if (w.name && typeof w.amount === 'number' && w.amount > 0) {
          addLine(w.name, r.id, r.date, r.client_name, 'worker', w.amount)
        }
      }
      for (const s of cd.salesBreakdown || []) {
        if (s.name && typeof s.amount === 'number' && s.amount > 0) {
          addLine(s.name, r.id, r.date, r.client_name, 'sales', s.amount)
        }
      }
    }

    const result = Array.from(map.values())
    // Sort recipients by outstanding desc, then total_owed desc
    result.sort((a, b) => (b.outstanding - a.outstanding) || (b.total_owed - a.total_owed))
    // Sort each group's lines by deal_date desc, then client_name
    for (const g of result) {
      g.lines.sort((a, b) => b.deal_date.localeCompare(a.deal_date) || a.client_name.localeCompare(b.client_name))
      g.total_owed = Math.round(g.total_owed * 100) / 100
      g.total_paid = Math.round(g.total_paid * 100) / 100
      g.outstanding = Math.round(g.outstanding * 100) / 100
    }
    return result
  }, [records, txns, teamMembers])

  const totals = useMemo(() => {
    const owed = groups.reduce((s, g) => s + g.total_owed, 0)
    const paid = groups.reduce((s, g) => s + g.total_paid, 0)
    const outstanding = groups.reduce((s, g) => s + g.outstanding, 0)
    return {
      deals: records.length,
      recipients: groups.length,
      owed: Math.round(owed * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      outstanding: Math.round(outstanding * 100) / 100,
    }
  }, [groups, records])

  // ─── Actions ───────────────────────────────────────────────

  async function markAllOutstandingPaid(group: RecipientGroup) {
    const outstandingLines = group.lines.filter((l) => l.outstanding > 0)
    if (outstandingLines.length === 0) return
    const ok = window.confirm(
      `Mark ${group.canonical_name} paid in full for ${outstandingLines.length} deals? ` +
      `This inserts ${outstandingLines.length} transactions totaling ${fmt(group.outstanding)} dated today (${toISO(new Date())}).`
    )
    if (!ok) return

    setMarkingPaid(group.canonical_name)
    const supabase = createSupabaseBrowserClient() as any
    const today = toISO(new Date())
    const rows = outstandingLines.map((l) => ({
      payout_record_id: l.payout_record_id,
      transaction_type: l.recipient_type === 'worker' ? 'payment_to_worker' : 'payment_to_sales',
      recipient: group.canonical_name,
      amount: l.outstanding,
      date: today,
      description: `Bulk payout for period ${period.label}`,
    }))
    const { error } = await supabase.from('payout_transactions').insert(rows)
    setMarkingPaid(null)
    if (error) {
      alert(`Insert failed: ${error.message}`)
      return
    }
    await load()
  }

  async function markOneLinePaid(group: RecipientGroup, line: OwedDealLine) {
    if (line.outstanding <= 0) return
    setMarkingPaid(`${group.canonical_name}::${line.payout_record_id}`)
    const supabase = createSupabaseBrowserClient() as any
    const { error } = await supabase.from('payout_transactions').insert([{
      payout_record_id: line.payout_record_id,
      transaction_type: line.recipient_type === 'worker' ? 'payment_to_worker' : 'payment_to_sales',
      recipient: group.canonical_name,
      amount: line.outstanding,
      date: toISO(new Date()),
      description: `Manual mark-paid from period view (${period.label})`,
    }])
    setMarkingPaid(null)
    if (error) {
      alert(`Insert failed: ${error.message}`)
      return
    }
    await load()
  }

  function handleRefresh() {
    setRefreshing(true); load()
  }

  function togglePeriodPreset(kind: 'prev' | 'next' | 'today') {
    const currentEnd = new Date(period.end + 'T00:00:00')
    if (kind === 'today') { setPeriod(defaultPeriod()); return }
    if (kind === 'prev') {
      const newEnd = new Date(currentEnd)
      newEnd.setMonth(newEnd.getMonth() - 1)
      const newStart = new Date(newEnd)
      newStart.setMonth(newStart.getMonth() - 1)
      setPeriod({
        start: toISO(newStart),
        end: toISO(newEnd),
        label: `${newStart.toLocaleString('en-US', { month: 'short' })} ${newStart.getDate()} → ${newEnd.toLocaleString('en-US', { month: 'short' })} ${newEnd.getDate()}`,
      })
      return
    }
    if (kind === 'next') {
      const newEnd = new Date(currentEnd)
      newEnd.setMonth(newEnd.getMonth() + 1)
      const newStart = new Date(newEnd)
      newStart.setMonth(newStart.getMonth() - 1)
      setPeriod({
        start: toISO(newStart),
        end: toISO(newEnd),
        label: `${newStart.toLocaleString('en-US', { month: 'short' })} ${newStart.getDate()} → ${newEnd.toLocaleString('en-US', { month: 'short' })} ${newEnd.getDate()}`,
      })
    }
  }

  function onDateChange(which: 'start' | 'end', value: string) {
    setPeriod((p) => ({ ...p, [which]: value, label: `${fmtShort(which === 'start' ? value : p.start)} → ${fmtShort(which === 'end' ? value : p.end)}` }))
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="section-title mb-1 flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Payouts by Person (Pay Period)
          </h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Everyone owed across all deals this period. Click <strong>Mark paid</strong> to record payment in one shot.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => togglePeriodPreset('prev')} className="btn-secondary btn-sm">← Previous</button>
          <button onClick={() => togglePeriodPreset('today')} className="btn-secondary btn-sm">This month</button>
          <button onClick={() => togglePeriodPreset('next')} className="btn-secondary btn-sm">Next →</button>
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--muted)]" />
          <span className="text-[var(--muted)] text-xs">Period:</span>
          <input
            type="date"
            value={period.start}
            onChange={(e) => onDateChange('start', e.target.value)}
            className="input text-xs py-1 px-2 w-36"
          />
          <span className="text-[var(--muted)]">→</span>
          <input
            type="date"
            value={period.end}
            onChange={(e) => onDateChange('end', e.target.value)}
            className="input text-xs py-1 px-2 w-36"
          />
        </div>
        <div className="text-xs text-[var(--muted)] md:ml-4">
          {totals.deals} deals · {totals.recipients} recipients · <span className="text-[var(--foreground)] font-semibold">{fmt(totals.outstanding)}</span> outstanding
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total owed" value={fmt(totals.owed)} tone="neutral" />
        <Stat label="Total paid" value={fmt(totals.paid)} tone="good" />
        <Stat label="Outstanding" value={fmt(totals.outstanding)} tone={totals.outstanding > 0 ? 'warn' : 'good'} />
      </div>

      {/* Recipient list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)] text-sm">
          No worker or sales payouts found in this period. {totals.deals === 0 ? 'No deals logged yet.' : 'Deals exist but have empty worker/sales breakdowns.'}
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isExpanded = !!expanded[g.canonical_name]
            const unmatched = !g.team_member_id
            const fullyPaid = g.outstanding === 0 && g.total_owed > 0
            return (
              <div key={g.canonical_name} className="rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  onClick={() => setExpanded((e) => ({ ...e, [g.canonical_name]: !e[g.canonical_name] }))}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted)]" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--foreground)]">{g.canonical_name}</span>
                      {g.matched_role && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--muted)] capitalize">{g.matched_role}</span>
                      )}
                      {unmatched && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          unmatched — add to team_members
                        </span>
                      )}
                      {fullyPaid && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> paid in full
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {g.lines.length} deal{g.lines.length === 1 ? '' : 's'} · owed {fmt(g.total_owed)} · paid {fmt(g.total_paid)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted)]">Outstanding</p>
                    <p className={`text-base font-bold ${g.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {fmt(g.outstanding)}
                    </p>
                  </div>
                  {g.outstanding > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllOutstandingPaid(g) }}
                      disabled={markingPaid === g.canonical_name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {markingPaid === g.canonical_name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <DollarSign className="h-3.5 w-3.5" />
                      )}
                      {markingPaid === g.canonical_name ? 'Saving…' : 'Mark paid in full'}
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
                          <th className="text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.lines.map((l) => {
                          const key = `${g.canonical_name}::${l.payout_record_id}`
                          const busy = markingPaid === key
                          return (
                            <tr key={l.payout_record_id + l.recipient_type}>
                              <td className="font-medium text-[var(--foreground)]">{l.client_name}</td>
                              <td className="text-[var(--muted)]">{fmtShort(l.deal_date)}</td>
                              <td>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${l.recipient_type === 'worker' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                  {l.recipient_type}
                                </span>
                              </td>
                              <td className="text-right">{fmt(l.amount_owed)}</td>
                              <td className="text-right text-emerald-400">{fmt(l.amount_paid)}</td>
                              <td className={`text-right font-semibold ${l.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {fmt(l.outstanding)}
                              </td>
                              <td className="text-right">
                                {l.outstanding > 0 && (
                                  <button
                                    onClick={() => markOneLinePaid(g, l)}
                                    disabled={busy}
                                    className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                                  >
                                    {busy ? '...' : 'Mark paid'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────

function Stat({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'good' | 'warn' }) {
  const color =
    tone === 'good'
      ? 'text-emerald-400'
      : tone === 'warn'
      ? 'text-amber-400'
      : 'text-[var(--foreground)]'
  return (
    <div className="p-3 rounded-lg bg-[var(--surface-hover)]">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

/** End date is INCLUSIVE, so we filter records with date < (end + 1 day). */
function nextDayISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return toISO(d)
}
