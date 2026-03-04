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

      {/* Section 3: Saved Records Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Saved Payout Records</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
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
          <p className="text-sm text-gray-400">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-sm text-gray-400">No payout records yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Date</th>
                  <th>Deal Type</th>
                  <th>Client</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Business</th>
                  <th className="text-right">Sales</th>
                  <th className="text-right">Worker</th>
                  <th>People</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const isExpanded = expandedRecordId === r.id

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

                  // Parse per-person details from calculation_details
                  const details = r.calculation_details as Record<string, unknown> | null
                  const savedSalesBreakdown = (details?.salesBreakdown as { name: string; percent: number; amount: number }[]) ?? []
                  const savedWorkerBreakdown = (details?.workerBreakdown as { name: string; percent: number; amount: number }[]) ?? []

                  // Per-person paid amounts
                  const paidByRecipient: Record<string, number> = {}
                  if (isExpanded) {
                    for (const t of transactions) {
                      if (t.transaction_type !== 'deposit_received' && t.recipient) {
                        paidByRecipient[t.recipient] = (paidByRecipient[t.recipient] || 0) + Number(t.amount)
                      }
                    }
                  }

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleExpandRecord(r.id)}
                      >
                        <td className="w-8">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-gray-400" />
                            : <ChevronRight className="h-4 w-4 text-gray-400" />
                          }
                        </td>
                        <td className="whitespace-nowrap">{r.date}</td>
                        <td>
                          <span className="badge badge-info text-xs">
                            {DEAL_TYPES[r.deal_type as DealType]?.label ?? r.deal_type}
                          </span>
                        </td>
                        <td>{r.client_name}</td>
                        <td className="text-right font-medium">{fmt(r.total_revenue)}</td>
                        <td className="text-right">{fmt(r.business_amount)}</td>
                        <td className="text-right text-green-700">{fmt(r.sales_amount)}</td>
                        <td className="text-right text-blue-700">{fmt(r.worker_amount)}</td>
                        <td className="text-xs text-gray-500 max-w-[200px] truncate">
                          {r.sales_person && <div className="text-green-600">S: {r.sales_person}</div>}
                          {r.worker_person && <div className="text-blue-600">W: {r.worker_person}</div>}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-gray-200 p-5 space-y-5">

                              {/* Balance Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <div className="text-[10px] uppercase text-gray-400 font-semibold">Total Job Value</div>
                                  <div className="text-lg font-bold text-gray-900">{fmt(r.total_revenue)}</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <div className="text-[10px] uppercase text-gray-400 font-semibold">Deposits Received</div>
                                  <div className={`text-lg font-bold ${totalDeposits >= r.total_revenue ? 'text-green-600' : 'text-amber-600'}`}>
                                    {fmt(totalDeposits)}
                                  </div>
                                  {stillOwed > 0.01 && (
                                    <div className="text-[10px] text-red-500 mt-0.5">Still owed: {fmt(stillOwed)}</div>
                                  )}
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <div className="text-[10px] uppercase text-gray-400 font-semibold">Total Paid Out</div>
                                  <div className="text-lg font-bold text-gray-700">{fmt(totalPaidOut)}</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                  <div className="text-[10px] uppercase text-gray-400 font-semibold">Cash on Hand</div>
                                  <div className={`text-lg font-bold ${cashOnHand < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {fmt(cashOnHand)}
                                  </div>
                                </div>
                              </div>

                              {/* Payout Breakdown — everyone in one table */}
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">Payout Breakdown</h4>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-gray-500 border-b">
                                      <th className="py-1.5">Who</th>
                                      <th className="py-1.5">Role</th>
                                      <th className="py-1.5 text-right">Owed</th>
                                      <th className="py-1.5 text-right">Paid</th>
                                      <th className="py-1.5 text-right">Remaining</th>
                                      <th className="py-1.5 text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Business row */}
                                    {(() => {
                                      const remaining = round2(r.business_amount - totalPaidBusiness)
                                      const done = remaining <= 0.01
                                      return (
                                        <tr className="border-b border-gray-100">
                                          <td className="py-1.5 font-medium">Business</td>
                                          <td className="py-1.5"><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Business</span></td>
                                          <td className="py-1.5 text-right">{fmt(r.business_amount)}</td>
                                          <td className="py-1.5 text-right">{fmt(totalPaidBusiness)}</td>
                                          <td className={`py-1.5 text-right font-semibold ${done ? 'text-green-600' : 'text-red-600'}`}>
                                            {done ? '$0.00' : fmt(remaining)}
                                          </td>
                                          <td className="py-1.5 text-right">
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                              {done ? 'Paid' : 'Due'}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })()}
                                    {/* Sales people rows */}
                                    {savedSalesBreakdown.map((s, i) => {
                                      const paid = paidByRecipient[s.name] || 0
                                      const remaining = round2(s.amount - paid)
                                      const done = remaining <= 0.01
                                      return (
                                        <tr key={`s-${i}`} className="border-b border-gray-100">
                                          <td className="py-1.5 font-medium">{s.name}</td>
                                          <td className="py-1.5"><span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700">Sales ({s.percent}%)</span></td>
                                          <td className="py-1.5 text-right">{fmt(s.amount)}</td>
                                          <td className="py-1.5 text-right">{fmt(paid)}</td>
                                          <td className={`py-1.5 text-right font-semibold ${done ? 'text-green-600' : 'text-red-600'}`}>
                                            {done ? '$0.00' : fmt(remaining)}
                                          </td>
                                          <td className="py-1.5 text-right">
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                              {done ? 'Paid' : 'Due'}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                    {/* Worker rows */}
                                    {savedWorkerBreakdown.map((w, i) => {
                                      const paid = paidByRecipient[w.name] || 0
                                      const remaining = round2(w.amount - paid)
                                      const done = remaining <= 0.01
                                      return (
                                        <tr key={`w-${i}`} className="border-b border-gray-100">
                                          <td className="py-1.5 font-medium">{w.name}</td>
                                          <td className="py-1.5"><span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Worker ({w.percent}%)</span></td>
                                          <td className="py-1.5 text-right">{fmt(w.amount)}</td>
                                          <td className="py-1.5 text-right">{fmt(paid)}</td>
                                          <td className={`py-1.5 text-right font-semibold ${done ? 'text-green-600' : 'text-red-600'}`}>
                                            {done ? '$0.00' : fmt(remaining)}
                                          </td>
                                          <td className="py-1.5 text-right">
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                              {done ? 'Paid' : 'Due'}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-gray-300 font-semibold">
                                      <td className="pt-2" colSpan={2}>Totals</td>
                                      <td className="pt-2 text-right">{fmt(r.total_revenue)}</td>
                                      <td className="pt-2 text-right">{fmt(totalPaidOut)}</td>
                                      <td className={`pt-2 text-right ${r.total_revenue - totalPaidOut <= 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                        {fmt(round2(r.total_revenue - totalPaidOut))}
                                      </td>
                                      <td className="pt-2 text-right">
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.total_revenue - totalPaidOut <= 0.01 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {r.total_revenue - totalPaidOut <= 0.01 ? 'All Paid' : 'In Progress'}
                                        </span>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>

                              {/* Add Transaction Form */}
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">Record a Transaction</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Type</label>
                                    <select
                                      className="input py-1 text-sm"
                                      value={txnForm.transaction_type}
                                      onChange={(e) => setTxnForm(prev => ({ ...prev, transaction_type: e.target.value as PayoutTransaction['transaction_type'], recipient: '' }))}
                                    >
                                      <option value="deposit_received">Deposit Received</option>
                                      <option value="payment_to_sales">Payment to Sales</option>
                                      <option value="payment_to_worker">Payment to Worker</option>
                                      <option value="payment_to_business">Payment to Business</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Amount ($)</label>
                                    <input
                                      className="input py-1 text-sm"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={txnForm.amount}
                                      onChange={(e) => setTxnForm(prev => ({ ...prev, amount: e.target.value }))}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Recipient</label>
                                    {txnForm.transaction_type === 'deposit_received' ? (
                                      <input
                                        className="input py-1 text-sm"
                                        type="text"
                                        value={txnForm.recipient}
                                        onChange={(e) => setTxnForm(prev => ({ ...prev, recipient: e.target.value }))}
                                        placeholder="From client"
                                      />
                                    ) : (
                                      <select
                                        className="input py-1 text-sm"
                                        value={txnForm.recipient}
                                        onChange={(e) => setTxnForm(prev => ({ ...prev, recipient: e.target.value }))}
                                      >
                                        <option value="">Select person...</option>
                                        {txnForm.transaction_type === 'payment_to_business' && (
                                          <option value="Business">Business</option>
                                        )}
                                        {txnForm.transaction_type === 'payment_to_sales' && savedSalesBreakdown.map((s, i) => (
                                          <option key={i} value={s.name}>{s.name} — owed {fmt(s.amount)}</option>
                                        ))}
                                        {txnForm.transaction_type === 'payment_to_worker' && savedWorkerBreakdown.map((w, i) => (
                                          <option key={i} value={w.name}>{w.name} — owed {fmt(w.amount)}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Date</label>
                                    <input
                                      className="input py-1 text-sm"
                                      type="date"
                                      value={txnForm.date}
                                      onChange={(e) => setTxnForm(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <button
                                      onClick={handleSaveTxn}
                                      disabled={savingTxn || !txnForm.amount}
                                      className="btn-primary py-1 px-3 text-sm w-full flex items-center justify-center gap-1"
                                    >
                                      <Plus className="h-3 w-3" />
                                      {savingTxn ? 'Saving...' : 'Add'}
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <input
                                    className="input py-1 text-sm"
                                    type="text"
                                    value={txnForm.description}
                                    onChange={(e) => setTxnForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description (optional)"
                                  />
                                </div>
                              </div>

                              {/* Transaction History */}
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">Transaction History</h4>
                                {loadingTxns ? (
                                  <p className="text-xs text-gray-400">Loading...</p>
                                ) : transactions.length === 0 ? (
                                  <p className="text-xs text-gray-400">No transactions recorded yet.</p>
                                ) : (
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-xs text-gray-500 border-b">
                                        <th className="py-1">Date</th>
                                        <th className="py-1">Type</th>
                                        <th className="py-1">Recipient</th>
                                        <th className="py-1 text-right">Amount</th>
                                        <th className="py-1">Description</th>
                                        <th className="py-1 w-8"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {transactions.map((t) => {
                                        const typeLabels: Record<string, { label: string; color: string }> = {
                                          deposit_received: { label: 'Deposit', color: 'text-green-700 bg-green-50' },
                                          payment_to_sales: { label: 'Paid Sales', color: 'text-orange-700 bg-orange-50' },
                                          payment_to_worker: { label: 'Paid Worker', color: 'text-blue-700 bg-blue-50' },
                                          payment_to_business: { label: 'Paid Business', color: 'text-gray-700 bg-gray-100' },
                                        }
                                        const info = typeLabels[t.transaction_type] ?? { label: t.transaction_type, color: 'text-gray-600' }
                                        return (
                                          <tr key={t.id} className="border-b border-gray-100">
                                            <td className="py-1 whitespace-nowrap">{t.date}</td>
                                            <td className="py-1">
                                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${info.color}`}>{info.label}</span>
                                            </td>
                                            <td className="py-1 text-gray-600">{t.recipient || '—'}</td>
                                            <td className={`py-1 text-right font-medium ${t.transaction_type === 'deposit_received' ? 'text-green-700' : 'text-red-600'}`}>
                                              {t.transaction_type === 'deposit_received' ? '+' : '-'}{fmt(Number(t.amount))}
                                            </td>
                                            <td className="py-1 text-xs text-gray-400 truncate max-w-[200px]">{t.description || ''}</td>
                                            <td className="py-1">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTxn(t.id) }}
                                                className="text-gray-300 hover:text-red-500"
                                                title="Delete transaction"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
