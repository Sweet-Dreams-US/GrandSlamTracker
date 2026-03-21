'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  DealType,
  DEAL_TYPES,
  GRAND_SLAM_MONTHLY_TIERS,
  GRAND_SLAM_UPFRONT_TIERS,
  TRANSACTIONAL_TIERS,
  BUYOUT_MULTIPLIERS,
} from '@/lib/constants/dealTypes'
import {
  calculateDealPayout,
  DealInput,
  DealPayoutResult,
} from '@/lib/calculations/dealPayoutCalculator'
import type { PayoutRecord, PayoutTransaction, InsertTables } from '@/lib/supabase/types'
import { ArrowLeft, Save, Filter, CheckCircle2, AlertTriangle, Plus, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'

// --- Person entry type ---

interface PersonEntry {
  id: string
  name: string
  percent: string // stored as string for input, parsed to number
}

function newPerson(): PersonEntry {
  return { id: crypto.randomUUID(), name: '', percent: '100' }
}

// --- Form State ---

type FormState = {
  dealType: DealType
  clientName: string
  baselineRevenue: string
  currentRevenue: string
  contractAmount: string
  projectFee: string
  month1Revenue: string
  month2Revenue: string
  month3Revenue: string
  partnershipMonths: string
  date: string
  notes: string
}

const initialForm: FormState = {
  dealType: 'grand_slam_monthly',
  clientName: '',
  baselineRevenue: '',
  currentRevenue: '',
  contractAmount: '',
  projectFee: '',
  month1Revenue: '',
  month2Revenue: '',
  month3Revenue: '',
  partnershipMonths: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function TierChart({ title, tiers, highlight }: {
  title: string
  tiers: { label: string; salesPercent: number; workerPercent: number; businessPercent: number }[]
  highlight?: boolean
}) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'}`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-[10px] text-gray-400 mb-2 italic">Progressive: each tier applies only to dollars within that bracket</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-1">Revenue Bracket</th>
            <th className="py-1 text-right">Business</th>
            <th className="py-1 text-right">Sales</th>
            <th className="py-1 text-right">Worker</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1">{tier.label}</td>
              <td className="py-1 text-right">{pct(tier.businessPercent)}</td>
              <td className="py-1 text-right font-medium text-green-700">{pct(tier.salesPercent)}</td>
              <td className="py-1 text-right font-medium text-blue-700">{pct(tier.workerPercent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- Person List Editor ---

function PersonListEditor({ label, people, onChange, poolTotal, color }: {
  label: string
  people: PersonEntry[]
  onChange: (people: PersonEntry[]) => void
  poolTotal: number | null
  color: 'green' | 'blue'
}) {
  const totalPercent = people.reduce((s, p) => s + (parseFloat(p.percent) || 0), 0)
  const isOver = totalPercent > 100
  const isUnder = totalPercent < 100 && people.some(p => p.name.trim())

  function updatePerson(id: string, updates: Partial<PersonEntry>) {
    onChange(people.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  function addPerson() {
    const remaining = 100 - totalPercent
    onChange([...people, { ...newPerson(), percent: String(Math.max(0, remaining)) }])
  }

  function removePerson(id: string) {
    const updated = people.filter(p => p.id !== id)
    if (updated.length === 0) {
      onChange([newPerson()])
    } else {
      onChange(updated)
    }
  }

  const colorClasses = color === 'green'
    ? { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' }
    : { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }

  return (
    <div className={`rounded-lg p-4 ${colorClasses.bg} border ${colorClasses.border}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${colorClasses.text}`}>
          {label}
          {poolTotal !== null && (
            <span className="ml-2 font-normal text-xs">Pool: {fmt(poolTotal)}</span>
          )}
        </h3>
        <button
          type="button"
          onClick={addPerson}
          className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${colorClasses.badge} hover:opacity-80`}
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      <div className="space-y-2">
        {people.map((person) => {
          const personPercent = parseFloat(person.percent) || 0
          const personAmount = poolTotal !== null ? round2(poolTotal * personPercent / 100) : null
          return (
            <div key={person.id} className="flex items-center gap-2">
              <input
                className="input py-1 text-sm flex-1"
                type="text"
                value={person.name}
                onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                placeholder="Name"
              />
              <div className="flex items-center gap-1">
                <input
                  className="input py-1 text-sm w-20 text-right"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={person.percent}
                  onChange={(e) => updatePerson(person.id, { percent: e.target.value })}
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
              {personAmount !== null && person.name.trim() && (
                <span className={`text-sm font-semibold ${colorClasses.text} w-24 text-right`}>
                  {fmt(personAmount)}
                </span>
              )}
              {people.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePerson(person.id)}
                  className="text-gray-400 hover:text-red-500 p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Percent total indicator */}
      <div className={`mt-2 text-xs ${isOver ? 'text-red-600 font-semibold' : isUnder ? 'text-amber-600' : 'text-gray-400'}`}>
        Total: {totalPercent.toFixed(0)}%{' '}
        {isOver && '— over 100%!'}
        {isUnder && '— under 100%'}
        {!isOver && !isUnder && people.some(p => p.name.trim()) && ''}
      </div>
    </div>
  )
}

// === MAIN PAGE ===

export default function PayoutsPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [excludeSales, setExcludeSales] = useState(false)
  const [salesPeople, setSalesPeople] = useState<PersonEntry[]>([newPerson()])
  const [workers, setWorkers] = useState<PersonEntry[]>([newPerson()])
  const [records, setRecords] = useState<PayoutRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [filterDealType, setFilterDealType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([])
  const [loadingTxns, setLoadingTxns] = useState(false)
  const [txnForm, setTxnForm] = useState({
    transaction_type: 'deposit_received' as PayoutTransaction['transaction_type'],
    amount: '',
    recipient: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [savingTxn, setSavingTxn] = useState(false)
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<string | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null)

  async function handleDeleteRecord(id: string) {
    setDeletingRecord(id)
    const supabase = createSupabaseBrowserClient()
    const { error } = await (supabase.from('payout_records') as any).delete().eq('id', id)
    if (!error) {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    }
    setDeletingRecord(null)
    setConfirmDeleteRecord(null)
  }

  useEffect(() => {
    loadRecords()
  }, [])

  async function loadRecords() {
    const supabase = createSupabaseBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('payout_records') as any)
      .select('*')
      .order('date', { ascending: false })
      .limit(100)

    if (!error && data) {
      setRecords(data as PayoutRecord[])
    }
    setLoading(false)
  }

  async function loadTransactions(recordId: string) {
    setLoadingTxns(true)
    const supabase = createSupabaseBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('payout_transactions') as any)
      .select('*')
      .eq('payout_record_id', recordId)
      .order('date', { ascending: true })
    if (!error && data) {
      setTransactions(data as PayoutTransaction[])
    }
    setLoadingTxns(false)
  }

  async function toggleExpandRecord(recordId: string) {
    if (expandedRecordId === recordId) {
      setExpandedRecordId(null)
      setTransactions([])
    } else {
      setExpandedRecordId(recordId)
      await loadTransactions(recordId)
    }
  }

  async function handleSaveTxn() {
    if (!expandedRecordId || !txnForm.amount || parseFloat(txnForm.amount) <= 0) return
    setSavingTxn(true)
    const supabase = createSupabaseBrowserClient()
    const insert: InsertTables<'payout_transactions'> = {
      payout_record_id: expandedRecordId,
      transaction_type: txnForm.transaction_type,
      amount: parseFloat(txnForm.amount),
      recipient: txnForm.recipient || null,
      description: txnForm.description || null,
      date: txnForm.date,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('payout_transactions') as any).insert(insert)
    if (!error) {
      setTxnForm({
        transaction_type: 'deposit_received',
        amount: '',
        recipient: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
      await loadTransactions(expandedRecordId)
    }
    setSavingTxn(false)
  }

  async function handleDeleteTxn(txnId: string) {
    if (!expandedRecordId) return
    const supabase = createSupabaseBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('payout_transactions') as any).delete().eq('id', txnId)
    await loadTransactions(expandedRecordId)
  }

  function updateForm(updates: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...updates }))
    setSaveMessage(null)
  }

  const dealInput: DealInput | null = useMemo(() => {
    const { dealType, clientName } = form
    if (!clientName.trim()) return null

    switch (dealType) {
      case 'grand_slam_monthly': {
        const baseline = parseFloat(form.baselineRevenue)
        const current = parseFloat(form.currentRevenue)
        if (isNaN(baseline) || isNaN(current)) return null
        return { dealType, clientName, baselineRevenue: baseline, currentRevenue: current }
      }
      case 'grand_slam_upfront': {
        const amount = parseFloat(form.contractAmount)
        if (isNaN(amount) || amount <= 0) return null
        return { dealType, clientName, contractAmount: amount }
      }
      case 'transactional': {
        const fee = parseFloat(form.projectFee)
        if (isNaN(fee) || fee <= 0) return null
        return { dealType, clientName, projectFee: fee }
      }
      case 'buyout': {
        const m1 = parseFloat(form.month1Revenue)
        const m2 = parseFloat(form.month2Revenue)
        const m3 = parseFloat(form.month3Revenue)
        const months = parseInt(form.partnershipMonths)
        if (isNaN(m1) || isNaN(m2) || isNaN(m3) || isNaN(months) || months < 3) return null
        return { dealType, clientName, last3MonthsRevenue: [m1, m2, m3], partnershipMonths: months }
      }
    }
  }, [form])

  const result: DealPayoutResult | null = useMemo(() => {
    if (!dealInput) return null
    return calculateDealPayout(dealInput, { excludeSales })
  }, [dealInput, excludeSales])

  // Compute per-person amounts
  const salesBreakdown = useMemo(() => {
    if (!result) return []
    const pool = result.internalSplit.salesAmount
    return salesPeople
      .filter(p => p.name.trim())
      .map(p => ({
        name: p.name,
        percent: parseFloat(p.percent) || 0,
        amount: round2(pool * (parseFloat(p.percent) || 0) / 100),
      }))
  }, [result, salesPeople])

  const workerBreakdown = useMemo(() => {
    if (!result) return []
    const pool = result.internalSplit.workerAmount
    return workers
      .filter(p => p.name.trim())
      .map(p => ({
        name: p.name,
        percent: parseFloat(p.percent) || 0,
        amount: round2(pool * (parseFloat(p.percent) || 0) / 100),
      }))
  }, [result, workers])

  async function handleSave() {
    if (!result || !form.clientName.trim()) return
    setSaving(true)
    setSaveMessage(null)

    const supabase = createSupabaseBrowserClient()

    const salesNames = salesBreakdown.map(s => `${s.name} (${s.percent}%)`).join(', ')
    const workerNames = workerBreakdown.map(w => `${w.name} (${w.percent}%)`).join(', ')

    const record: InsertTables<'payout_records'> = {
      deal_type: form.dealType,
      client_name: form.clientName,
      date: form.date,
      total_revenue: result.totalRevenue,
      business_amount: result.internalSplit.businessAmount,
      sales_amount: result.internalSplit.salesAmount,
      worker_amount: result.internalSplit.workerAmount,
      sales_person: salesNames || null,
      worker_person: workerNames || null,
      tier_used: result.internalSplit.tierBreakdown.map((t) => t.tierLabel).join(' + '),
      calculation_details: {
        dealType: form.dealType,
        clientFeeBreakdown: result.clientFeeBreakdown,
        buyoutDetails: result.buyoutDetails,
        tierBreakdown: result.internalSplit.tierBreakdown,
        effectiveRates: {
          business: result.internalSplit.effectiveBusinessPercent,
          sales: result.internalSplit.effectiveSalesPercent,
          worker: result.internalSplit.effectiveWorkerPercent,
        },
        salesBreakdown,
        workerBreakdown,
      } as unknown as import('@/lib/supabase/types').Json,
      notes: form.notes || null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('payout_records') as any).insert(record)

    if (error) {
      setSaveMessage(`Error: ${error.message}`)
    } else {
      setSaveMessage('Payout record saved!')
      setForm(initialForm)
      setSalesPeople([newPerson()])
      setWorkers([newPerson()])
      loadRecords()
    }
    setSaving(false)
  }

  const filteredRecords = useMemo(() => {
    if (filterDealType === 'all') return records
    return records.filter((r) => r.deal_type === filterDealType)
  }, [records, filterDealType])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/financials" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to Financials
        </Link>
        <h1 className="page-title">Payout Operations</h1>
        <p className="page-description">Calculate revenue splits by deal type and save payout records. All splits are progressive (like tax brackets).</p>
      </div>

      {/* ALL PAYOUT CHARTS */}
      <div>
        <h2 className="section-title mb-4">All Payout Charts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <TierChart
            title="Grand Slam Monthly"
            tiers={GRAND_SLAM_MONTHLY_TIERS}
            highlight={form.dealType === 'grand_slam_monthly'}
          />
          <TierChart
            title="Grand Slam Upfront"
            tiers={GRAND_SLAM_UPFRONT_TIERS}
            highlight={form.dealType === 'grand_slam_upfront'}
          />
          <TierChart
            title="Transactional"
            tiers={TRANSACTIONAL_TIERS}
            highlight={form.dealType === 'transactional'}
          />
          <div className={`rounded-lg p-4 ${form.dealType === 'buyout' ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'}`}>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Buyout Multipliers</h3>
            <p className="text-[10px] text-gray-400 mb-2 italic">Uses Grand Slam Monthly chart for split after calculating buyout amount</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-1">Partnership</th>
                  <th className="py-1 text-right">Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {BUYOUT_MULTIPLIERS.map((m, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{m.label}</td>
                    <td className="py-1 text-right font-medium">{m.multiplier}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Invoice Input Form */}
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Invoice Input</h2>

          <div className="form-group">
            <label className="label">Deal Type</label>
            <select
              className="input"
              value={form.dealType}
              onChange={(e) => updateForm({ dealType: e.target.value as DealType })}
            >
              {Object.entries(DEAL_TYPES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Client Name</label>
            <input
              className="input"
              type="text"
              value={form.clientName}
              onChange={(e) => updateForm({ clientName: e.target.value })}
              placeholder="Enter client or project name"
            />
          </div>

          {form.dealType === 'grand_slam_monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Baseline Revenue ($)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="100"
                  value={form.baselineRevenue}
                  onChange={(e) => updateForm({ baselineRevenue: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="form-group">
                <label className="label">Current Revenue ($)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="100"
                  value={form.currentRevenue}
                  onChange={(e) => updateForm({ currentRevenue: e.target.value })}
                  placeholder="18000"
                />
              </div>
            </div>
          )}

          {form.dealType === 'grand_slam_upfront' && (
            <div className="form-group">
              <label className="label">Contract Amount ($)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="100"
                value={form.contractAmount}
                onChange={(e) => updateForm({ contractAmount: e.target.value })}
                placeholder="25000"
              />
            </div>
          )}

          {form.dealType === 'transactional' && (
            <div className="form-group">
              <label className="label">Project Fee ($)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="100"
                value={form.projectFee}
                onChange={(e) => updateForm({ projectFee: e.target.value })}
                placeholder="5000"
              />
            </div>
          )}

          {form.dealType === 'buyout' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="label">Month 1 Rev ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="100"
                    value={form.month1Revenue}
                    onChange={(e) => updateForm({ month1Revenue: e.target.value })}
                    placeholder="1200"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Month 2 Rev ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="100"
                    value={form.month2Revenue}
                    onChange={(e) => updateForm({ month2Revenue: e.target.value })}
                    placeholder="1400"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Month 3 Rev ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="100"
                    value={form.month3Revenue}
                    onChange={(e) => updateForm({ month3Revenue: e.target.value })}
                    placeholder="1300"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Partnership Duration (months)</label>
                <input
                  className="input"
                  type="number"
                  min="3"
                  step="1"
                  value={form.partnershipMonths}
                  onChange={(e) => updateForm({ partnershipMonths: e.target.value })}
                  placeholder="12"
                />
              </div>
            </>
          )}

          {/* Sales Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={!excludeSales} onChange={() => setExcludeSales(!excludeSales)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">
              {excludeSales ? 'No Sales — worker gets full remainder' : 'Include Sales'}
            </span>
          </div>

          {/* Sales People */}
          {!excludeSales && (
            <PersonListEditor
              label="Sales People"
              people={salesPeople}
              onChange={setSalesPeople}
              poolTotal={result?.internalSplit.salesAmount ?? null}
              color="green"
            />
          )}

          {/* Workers */}
          <PersonListEditor
            label="Workers / Production"
            people={workers}
            onChange={setWorkers}
            poolTotal={result?.internalSplit.workerAmount ?? null}
            color="blue"
          />

          <div className="form-group">
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => updateForm({ date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => updateForm({ notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>
        </div>

        {/* Section 2: Auto-Calculated Results */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">Calculated Results</h2>

            {!result ? (
              <p className="text-sm text-gray-400 mt-4">Fill in the form to see calculations.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {/* Client Fee Breakdown */}
                {result.clientFeeBreakdown && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Client Fee Breakdown</h3>
                    <div className="text-xs text-gray-500">
                      Growth: {fmt(result.clientFeeBreakdown.totalGrowth)} ({pct(result.clientFeeBreakdown.growthPercent)} above baseline)
                      <span className="ml-2">| Size: {result.clientFeeBreakdown.businessSizeCategory} (adj: {result.clientFeeBreakdown.sizeAdjustmentFactor}x)</span>
                    </div>
                    <table className="w-full text-sm mt-2">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 border-b">
                          <th className="py-1">Tier</th>
                          <th className="py-1 text-right">Amount</th>
                          <th className="py-1 text-right">Rate</th>
                          <th className="py-1 text-right">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-1">First $5,000 (flat)</td>
                          <td className="py-1 text-right">{fmt(result.clientFeeBreakdown.firstTierAmount)}</td>
                          <td className="py-1 text-right">7.0%</td>
                          <td className="py-1 text-right font-medium">{fmt(result.clientFeeBreakdown.firstTierFee)}</td>
                        </tr>
                        {result.clientFeeBreakdown.progressiveTiers.map((t, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-1">{t.label} growth tier</td>
                            <td className="py-1 text-right">{fmt(t.amountInTier)}</td>
                            <td className="py-1 text-right">{pct(t.adjustedRate)}</td>
                            <td className="py-1 text-right font-medium">{fmt(t.fee)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold">
                          <td className="pt-2" colSpan={3}>Total Client Fee</td>
                          <td className="pt-2 text-right">{fmt(result.clientFeeBreakdown.totalFee)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Buyout Details */}
                {result.buyoutDetails && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Buyout Calculation</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Avg Monthly Revenue:</div>
                      <div className="text-right font-medium">{fmt(result.buyoutDetails.avgMonthlyRevenue)}</div>
                      <div>Partnership Duration:</div>
                      <div className="text-right font-medium">{result.buyoutDetails.partnershipMonths} months</div>
                      <div>Multiplier:</div>
                      <div className="text-right font-medium">{result.buyoutDetails.multiplier}x</div>
                      <div className="font-semibold">Buyout Amount:</div>
                      <div className="text-right font-semibold">{fmt(result.buyoutDetails.buyoutAmount)}</div>
                    </div>
                  </div>
                )}

                {/* Progressive Tier Breakdown */}
                <div className="bg-amber-50 rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-amber-900">Progressive Split Breakdown</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-amber-700 border-b border-amber-200">
                        <th className="py-1">Bracket</th>
                        <th className="py-1 text-right">Amount</th>
                        <th className="py-1 text-right">Business</th>
                        <th className="py-1 text-right">Sales</th>
                        <th className="py-1 text-right">Worker</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.internalSplit.tierBreakdown.map((t, i) => (
                        <tr key={i} className="border-b border-amber-100">
                          <td className="py-1 text-xs">{t.tierLabel}</td>
                          <td className="py-1 text-right">{fmt(t.amountInTier)}</td>
                          <td className="py-1 text-right text-gray-600">
                            {fmt(t.businessAmount)}
                            <span className="text-[10px] text-gray-400 ml-1">({pct(t.businessPercent)})</span>
                          </td>
                          <td className="py-1 text-right text-green-700">
                            {fmt(t.salesAmount)}
                            <span className="text-[10px] text-gray-400 ml-1">({pct(t.salesPercent)})</span>
                          </td>
                          <td className="py-1 text-right text-blue-700">
                            {fmt(t.workerAmount)}
                            <span className="text-[10px] text-gray-400 ml-1">({pct(t.workerPercent)})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold text-sm border-t-2 border-amber-300">
                        <td className="pt-2">Totals</td>
                        <td className="pt-2 text-right">{fmt(result.totalRevenue)}</td>
                        <td className="pt-2 text-right">{fmt(result.internalSplit.businessAmount)}</td>
                        <td className="pt-2 text-right text-green-700">{fmt(result.internalSplit.salesAmount)}</td>
                        <td className="pt-2 text-right text-blue-700">{fmt(result.internalSplit.workerAmount)}</td>
                      </tr>
                      <tr className="text-xs text-gray-500">
                        <td>Effective %</td>
                        <td></td>
                        <td className="text-right">{pct(result.internalSplit.effectiveBusinessPercent)}</td>
                        <td className="text-right">{pct(result.internalSplit.effectiveSalesPercent)}</td>
                        <td className="text-right">{pct(result.internalSplit.effectiveWorkerPercent)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Final Payout with Per-Person Breakdown */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-blue-900">Final Payout</h3>
                  <div className="text-sm font-medium text-blue-900">
                    Total Revenue: {fmt(result.totalRevenue)}
                  </div>

                  {/* Business */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Business ({pct(result.internalSplit.effectiveBusinessPercent)})</div>
                    <div className="text-lg font-bold text-gray-900">{fmt(result.internalSplit.businessAmount)}</div>
                  </div>

                  {/* Sales People */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Sales Pool ({pct(result.internalSplit.effectiveSalesPercent)})</div>
                    <div className="text-lg font-bold text-green-700 mb-2">{fmt(result.internalSplit.salesAmount)}</div>
                    {salesBreakdown.length > 0 ? (
                      <div className="space-y-1 border-t pt-2">
                        {salesBreakdown.map((s, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{s.name} <span className="text-xs text-gray-400">({s.percent}% of pool)</span></span>
                            <span className="font-semibold text-green-700">{fmt(s.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 border-t pt-2">No sales people assigned</p>
                    )}
                  </div>

                  {/* Workers */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Worker Pool ({pct(result.internalSplit.effectiveWorkerPercent)})</div>
                    <div className="text-lg font-bold text-blue-700 mb-2">{fmt(result.internalSplit.workerAmount)}</div>
                    {workerBreakdown.length > 0 ? (
                      <div className="space-y-1 border-t pt-2">
                        {workerBreakdown.map((w, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{w.name} <span className="text-xs text-gray-400">({w.percent}% of pool)</span></span>
                            <span className="font-semibold text-blue-700">{fmt(w.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 border-t pt-2">No workers assigned</p>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 text-xs ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {result.isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {result.isValid ? 'Totals verified' : 'Warning: split totals do not match revenue'}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !result}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Payout Record'}
                </button>
                {saveMessage && (
                  <p className={`text-sm text-center ${saveMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Saved Records */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Saved Payout Records</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" style={{ color: 'var(--muted)' }} />
            <select
              className="input py-1 text-sm w-auto"
              value={filterDealType}
              onChange={(e) => setFilterDealType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.entries(DEAL_TYPES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No payout records yet.</p>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((r) => {
              const isExpanded = expandedRecordId === r.id
              const details = r.calculation_details as Record<string, unknown> | null
              const savedSalesBreakdown = (details?.salesBreakdown as { name: string; percent: number; amount: number }[]) ?? []
              const savedWorkerBreakdown = (details?.workerBreakdown as { name: string; percent: number; amount: number }[]) ?? []

              // Compute ledger balances when expanded
              const totalDeposits = isExpanded
                ? transactions.filter(t => t.transaction_type === 'deposit_received').reduce((s, t) => s + Number(t.amount), 0)
                : 0
              const totalPaidBusiness = isExpanded
                ? transactions.filter(t => t.transaction_type === 'payment_to_business').reduce((s, t) => s + Number(t.amount), 0)
                : 0
              const totalPaidSales = isExpanded
                ? transactions.filter(t => t.transaction_type === 'payment_to_sales').reduce((s, t) => s + Number(t.amount), 0)
                : 0
              const totalPaidWorker = isExpanded
                ? transactions.filter(t => t.transaction_type === 'payment_to_worker').reduce((s, t) => s + Number(t.amount), 0)
                : 0
              const totalPaidOut = totalPaidBusiness + totalPaidSales + totalPaidWorker
              const stillOwed = r.total_revenue - totalDeposits
              const cashOnHand = totalDeposits - totalPaidOut
              const paidByRecipient: Record<string, number> = {}
              if (isExpanded) {
                for (const t of transactions) {
                  if (t.transaction_type !== 'deposit_received' && t.recipient) {
                    paidByRecipient[t.recipient] = (paidByRecipient[t.recipient] || 0) + Number(t.amount)
                  }
                }
              }

              return (
                <div key={r.id} className="card overflow-hidden">
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer transition-colors"
                    style={{ backgroundColor: isExpanded ? 'var(--surface-hover)' : undefined }}
                    onClick={() => toggleExpandRecord(r.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="pt-0.5">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                            : <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                              {r.client_name}
                            </h4>
                            <span className="badge-info text-xs">
                              {DEAL_TYPES[r.deal_type as DealType]?.label ?? r.deal_type}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                            <span>{r.date}</span>
                            {r.worker_person && <span>Workers: {r.worker_person}</span>}
                            {r.sales_person && <span>Sales: {r.sales_person}</span>}
                            {r.notes && <span>{r.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{fmt(r.total_revenue)}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs justify-end">
                            <span style={{ color: 'var(--success)' }}>B {fmt(r.business_amount)}</span>
                            {r.sales_amount > 0 && <span style={{ color: 'var(--accent)' }}>S {fmt(r.sales_amount)}</span>}
                            <span style={{ color: 'var(--warning)' }}>W {fmt(r.worker_amount)}</span>
                          </div>
                        </div>
                        {/* Delete Button */}
                        <div onClick={(e) => e.stopPropagation()}>
                          {confirmDeleteRecord === r.id ? (
                            <div className="flex flex-col gap-1">
                              <button
                                className="text-xs px-3 py-1.5 rounded font-medium"
                                style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                                onClick={() => handleDeleteRecord(r.id)}
                                disabled={deletingRecord === r.id}
                              >
                                {deletingRecord === r.id ? '...' : 'Delete'}
                              </button>
                              <button
                                className="text-xs px-3 py-1 rounded"
                                style={{ color: 'var(--muted)' }}
                                onClick={() => setConfirmDeleteRecord(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: 'var(--danger)', backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              onClick={() => setConfirmDeleteRecord(r.id)}
                              title="Delete this record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
                      {/* Balance Summary */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)' }}>
                          <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--muted)' }}>Job Value</div>
                          <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{fmt(r.total_revenue)}</div>
                        </div>
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)' }}>
                          <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--muted)' }}>Deposits</div>
                          <div className="text-lg font-bold" style={{ color: totalDeposits >= r.total_revenue ? 'var(--success)' : 'var(--warning)' }}>
                            {fmt(totalDeposits)}
                          </div>
                          {stillOwed > 0.01 && <div className="text-[10px] mt-0.5" style={{ color: 'var(--danger)' }}>Owed: {fmt(stillOwed)}</div>}
                        </div>
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)' }}>
                          <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--muted)' }}>Paid Out</div>
                          <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{fmt(totalPaidOut)}</div>
                        </div>
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background)' }}>
                          <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--muted)' }}>Cash on Hand</div>
                          <div className="text-lg font-bold" style={{ color: cashOnHand < 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {fmt(cashOnHand)}
                          </div>
                        </div>
                      </div>

                      {/* Payout Breakdown */}
                      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--background)' }}>
                        <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)' }}>Payout Breakdown</h4>
                        <div className="space-y-2">
                          {/* Business */}
                          {(() => {
                            const remaining = round2(r.business_amount - totalPaidBusiness)
                            const done = remaining <= 0.01
                            return (
                              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>Business</span>
                                  <span className="badge-gray text-xs">Business</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span style={{ color: 'var(--muted)' }}>Owed {fmt(r.business_amount)}</span>
                                  <span className={done ? 'badge-success' : 'badge-danger'}>{done ? 'Paid' : fmt(remaining) + ' due'}</span>
                                </div>
                              </div>
                            )
                          })()}
                          {/* Sales */}
                          {savedSalesBreakdown.map((s, i) => {
                            const paid = paidByRecipient[s.name] || 0
                            const remaining = round2(s.amount - paid)
                            const done = remaining <= 0.01
                            return (
                              <div key={`s-${i}`} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                                  <span className="badge-success text-xs">Sales {s.percent}%</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span style={{ color: 'var(--muted)' }}>Owed {fmt(s.amount)}</span>
                                  <span className={done ? 'badge-success' : 'badge-danger'}>{done ? 'Paid' : fmt(remaining) + ' due'}</span>
                                </div>
                              </div>
                            )
                          })}
                          {/* Workers */}
                          {savedWorkerBreakdown.map((w, i) => {
                            const paid = paidByRecipient[w.name] || 0
                            const remaining = round2(w.amount - paid)
                            const done = remaining <= 0.01
                            return (
                              <div key={`w-${i}`} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{w.name}</span>
                                  <span className="badge-info text-xs">Worker {w.percent}%</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span style={{ color: 'var(--muted)' }}>Owed {fmt(w.amount)}</span>
                                  <span className={done ? 'badge-success' : 'badge-danger'}>{done ? 'Paid' : fmt(remaining) + ' due'}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Add Transaction */}
                      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--background)' }}>
                        <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)' }}>Record a Transaction</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="label text-xs">Type</label>
                            <select className="input text-sm" value={txnForm.transaction_type}
                              onChange={(e) => setTxnForm(prev => ({ ...prev, transaction_type: e.target.value as PayoutTransaction['transaction_type'], recipient: '' }))}>
                              <option value="deposit_received">Deposit Received</option>
                              <option value="payment_to_sales">Payment to Sales</option>
                              <option value="payment_to_worker">Payment to Worker</option>
                              <option value="payment_to_business">Payment to Business</option>
                            </select>
                          </div>
                          <div>
                            <label className="label text-xs">Amount</label>
                            <input className="input text-sm" type="number" min="0" step="0.01" value={txnForm.amount}
                              onChange={(e) => setTxnForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="0.00" />
                          </div>
                          <div>
                            <label className="label text-xs">Recipient</label>
                            {txnForm.transaction_type === 'deposit_received' ? (
                              <input className="input text-sm" type="text" value={txnForm.recipient}
                                onChange={(e) => setTxnForm(prev => ({ ...prev, recipient: e.target.value }))} placeholder="From client" />
                            ) : (
                              <select className="input text-sm" value={txnForm.recipient}
                                onChange={(e) => setTxnForm(prev => ({ ...prev, recipient: e.target.value }))}>
                                <option value="">Select...</option>
                                {txnForm.transaction_type === 'payment_to_business' && <option value="Business">Business</option>}
                                {txnForm.transaction_type === 'payment_to_sales' && savedSalesBreakdown.map((s, i) => (
                                  <option key={i} value={s.name}>{s.name} — {fmt(s.amount)}</option>
                                ))}
                                {txnForm.transaction_type === 'payment_to_worker' && savedWorkerBreakdown.map((w, i) => (
                                  <option key={i} value={w.name}>{w.name} — {fmt(w.amount)}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="label text-xs">Date</label>
                            <input className="input text-sm" type="date" value={txnForm.date}
                              onChange={(e) => setTxnForm(prev => ({ ...prev, date: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <input className="input text-sm flex-1" type="text" value={txnForm.description}
                            onChange={(e) => setTxnForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description (optional)" />
                          <button onClick={handleSaveTxn} disabled={savingTxn || !txnForm.amount}
                            className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
                            <Plus className="h-3 w-3" />{savingTxn ? '...' : 'Add'}
                          </button>
                        </div>
                      </div>

                      {/* Transaction History */}
                      {!loadingTxns && transactions.length > 0 && (
                        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--background)' }}>
                          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)' }}>Transaction History</h4>
                          <div className="space-y-1">
                            {transactions.map((t) => {
                              const typeLabels: Record<string, { label: string; color: string }> = {
                                deposit_received: { label: 'Deposit', color: 'badge-success' },
                                payment_to_sales: { label: 'Paid Sales', color: 'badge-warning' },
                                payment_to_worker: { label: 'Paid Worker', color: 'badge-info' },
                                payment_to_business: { label: 'Paid Biz', color: 'badge-gray' },
                              }
                              const info = typeLabels[t.transaction_type] ?? { label: t.transaction_type, color: 'badge-gray' }
                              return (
                                <div key={t.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.date}</span>
                                    <span className={`${info.color} text-xs`}>{info.label}</span>
                                    <span className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{t.recipient || ''}</span>
                                    {t.description && <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>{t.description}</span>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-sm font-medium"
                                      style={{ color: t.transaction_type === 'deposit_received' ? 'var(--success)' : 'var(--danger)' }}>
                                      {t.transaction_type === 'deposit_received' ? '+' : '-'}{fmt(Number(t.amount))}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTxn(t.id) }}
                                      className="p-1 rounded transition-colors"
                                      style={{ color: 'var(--danger)', opacity: 0.4 }}
                                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
