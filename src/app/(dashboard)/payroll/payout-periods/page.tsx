'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  DollarSign,
  Building,
  TrendingUp,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

interface PayoutPeriod {
  id: string
  start_date: string
  end_date: string
  status: string
  total_revenue: number
  total_business_retention: number
  total_distributed: number
  revenue_by_stream: Record<string, number> | null
  created_at: string
}

interface PeriodPayout {
  id: string
  payout_period_id: string
  recipient_name: string
  recipient_type: string
  amount: number
  category: string
  notes: string
}

export default function PayoutPeriodsPage() {
  const [periods, setPeriods] = useState<PayoutPeriod[]>([])
  const [periodPayouts, setPeriodPayouts] = useState<Record<string, PeriodPayout[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingPayouts, setLoadingPayouts] = useState<string | null>(null)

  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
  })

  const loadData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data } = await (supabase.from('payout_periods') as any)
      .select('*')
      .order('start_date', { ascending: false })
    if (data) setPeriods(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function loadPeriodPayouts(periodId: string) {
    if (periodPayouts[periodId]) return
    setLoadingPayouts(periodId)
    const supabase = createSupabaseBrowserClient()

    // Load contractor_payments and owner_payments within the period date range
    const period = periods.find((p) => p.id === periodId)
    if (!period) return

    const [cpRes, opRes] = await Promise.all([
      (supabase.from('contractor_payments') as any)
        .select('*, contractors(name)')
        .gte('date', period.start_date)
        .lte('date', period.end_date)
        .order('date', { ascending: false }),
      (supabase.from('owner_payments') as any)
        .select('*')
        .gte('date', period.start_date)
        .lte('date', period.end_date)
        .order('date', { ascending: false }),
    ])

    const combined: PeriodPayout[] = [
      ...(cpRes.data || []).map((p: any) => ({
        id: p.id,
        payout_period_id: periodId,
        recipient_name: p.contractors?.name || 'Contractor',
        recipient_type: 'contractor',
        amount: Number(p.amount),
        category: p.type,
        notes: p.notes || '',
      })),
      ...(opRes.data || []).map((p: any) => ({
        id: p.id,
        payout_period_id: periodId,
        recipient_name: p.partner_name,
        recipient_type: 'owner',
        amount: Number(p.amount),
        category: p.category,
        notes: p.notes || '',
      })),
    ].sort((a, b) => b.amount - a.amount)

    setPeriodPayouts((prev) => ({ ...prev, [periodId]: combined }))
    setLoadingPayouts(null)
  }

  function toggleExpand(periodId: string) {
    if (expandedId === periodId) {
      setExpandedId(null)
    } else {
      setExpandedId(periodId)
      loadPeriodPayouts(periodId)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    await (supabase.from('payout_periods') as any).insert([
      {
        start_date: form.start_date,
        end_date: form.end_date,
        status: 'draft',
        total_revenue: 0,
        total_business_retention: 0,
        total_distributed: 0,
      },
    ])
    setForm({ start_date: '', end_date: '' })
    setShowForm(false)
    setSaving(false)
    loadData()
  }

  const statusColors: Record<string, string> = {
    draft: 'badge-warning',
    pending: 'badge-info',
    finalized: 'badge-success',
    paid: 'badge-success',
    closed: 'badge-error',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Link href="/payroll" className="text-sm text-gray-500 hover:text-[#F4C430] flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Payroll
          </Link>
          <h1 className="page-title">Biweekly Payout Periods</h1>
          <p className="page-description">Manage payout periods and review distribution summaries</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Period
        </button>
      </div>

      {/* Create Period Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Create New Payout Period</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label">Start Date *</label>
              <input
                className="input"
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                className="input"
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Period'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Periods List */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : periods.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No payout periods yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {periods.map((period) => {
            const isExpanded = expandedId === period.id
            const payouts = periodPayouts[period.id] || []
            const revenueStreams = period.revenue_by_stream || {}

            return (
              <div key={period.id} className="card overflow-hidden">
                {/* Period Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                  onClick={() => toggleExpand(period.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">
                            {period.start_date} - {period.end_date}
                          </h3>
                          <span className={`badge text-xs capitalize ${statusColors[period.status] || 'badge-info'}`}>
                            {period.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(period.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Revenue</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-1 justify-end">
                          <DollarSign className="h-3 w-3 text-green-400" />
                          {fmt(Number(period.total_revenue))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Business Retained</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-1 justify-end">
                          <Building className="h-3 w-3 text-blue-400" />
                          {fmt(Number(period.total_business_retention))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Distributed</p>
                        <p className="text-sm font-semibold text-white flex items-center gap-1 justify-end">
                          <TrendingUp className="h-3 w-3 text-[#F4C430]" />
                          {fmt(Number(period.total_distributed))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[#262626]">
                    {/* Revenue by Stream */}
                    {Object.keys(revenueStreams).length > 0 && (
                      <div className="p-4 border-b border-[#262626]">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Revenue by Stream</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(revenueStreams).map(([stream, amount]) => (
                            <div key={stream} className="bg-[#0d0d0d] rounded-lg p-3">
                              <p className="text-xs text-gray-500 capitalize">{stream.replace(/_/g, ' ')}</p>
                              <p className="text-sm font-semibold text-white mt-1">{fmt(Number(amount))}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payouts in this period */}
                    <div className="p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        Payouts in This Period
                      </p>
                      {loadingPayouts === period.id ? (
                        <p className="text-sm text-gray-400">Loading payouts...</p>
                      ) : payouts.length === 0 ? (
                        <p className="text-sm text-gray-500">No payouts recorded for this period.</p>
                      ) : (
                        <div className="table-container">
                          <table className="table text-sm">
                            <thead>
                              <tr>
                                <th>Recipient</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th className="text-right">Amount</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payouts.map((p) => (
                                <tr key={p.id}>
                                  <td className="font-medium text-white">{p.recipient_name}</td>
                                  <td>
                                    <span
                                      className={`badge text-xs capitalize ${
                                        p.recipient_type === 'owner' ? 'badge-warning' : 'badge-info'
                                      }`}
                                    >
                                      {p.recipient_type}
                                    </span>
                                  </td>
                                  <td className="text-gray-400 capitalize">{p.category?.replace(/_/g, ' ')}</td>
                                  <td className="text-right font-medium text-white">{fmt(p.amount)}</td>
                                  <td className="text-gray-400 truncate max-w-[200px]">{p.notes || '--'}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={3} className="font-medium">Total</td>
                                <td className="text-right font-bold text-white">
                                  {fmt(payouts.reduce((s, p) => s + p.amount, 0))}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
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
