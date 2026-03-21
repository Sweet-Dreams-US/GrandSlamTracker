'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  Plus,
  Filter,
  ArrowLeft,
  DollarSign,
} from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

interface ContractorPayment {
  id: string
  contractor_id: string
  date: string
  type: string
  revenue_source: string
  amount: number
  notes: string
  contractors?: { name: string }
}

interface Contractor {
  id: string
  name: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<ContractorPayment[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filters
  const [filterContractor, setFilterContractor] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const [form, setForm] = useState({
    contractor_id: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'flat_fee',
    revenue_source: '',
    amount: '',
    notes: '',
  })

  const currentYear = new Date().getFullYear()
  const yearStart = `${currentYear}-01-01`

  const loadData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const [pRes, cRes] = await Promise.all([
      (supabase.from('contractor_payments') as any)
        .select('*, contractors(name)')
        .gte('date', yearStart)
        .order('date', { ascending: false }),
      (supabase.from('contractors') as any)
        .select('id, name')
        .eq('status', 'active')
        .order('name'),
    ])
    if (pRes.data) setPayments(pRes.data)
    if (cRes.data) setContractors(cRes.data)
    setLoading(false)
  }, [yearStart])

  useEffect(() => {
    loadData()
  }, [loadData])

  // YTD per contractor
  const ytdByContractor = payments.reduce<Record<string, { name: string; total: number }>>((acc, p) => {
    const name = p.contractors?.name || 'Unknown'
    if (!acc[p.contractor_id]) acc[p.contractor_id] = { name, total: 0 }
    acc[p.contractor_id].total += Number(p.amount)
    return acc
  }, {})

  const ytdEntries = Object.values(ytdByContractor).sort((a, b) => b.total - a.total)

  // Filter payments
  const filtered = payments.filter((p) => {
    if (filterContractor && p.contractor_id !== filterContractor) return false
    if (filterType && p.type !== filterType) return false
    if (filterDateFrom && p.date < filterDateFrom) return false
    if (filterDateTo && p.date > filterDateTo) return false
    return true
  })

  const sourceTypes = Array.from(new Set(payments.map((p) => p.type).filter(Boolean)))

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    await (supabase.from('contractor_payments') as any).insert([
      {
        ...form,
        amount: parseFloat(form.amount),
      },
    ])
    setForm({ contractor_id: '', date: new Date().toISOString().slice(0, 10), type: 'flat_fee', revenue_source: '', amount: '', notes: '' })
    setShowForm(false)
    setSaving(false)
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Link href="/payroll" className="text-sm text-gray-500 hover:text-[#F4C430] flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Payroll
          </Link>
          <h1 className="page-title">Contractor Payment Log</h1>
          <p className="page-description">Track and manage all contractor payments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </button>
      </div>

      {/* YTD Summary */}
      {ytdEntries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ytdEntries.map((entry) => (
            <SummaryCard
              key={entry.name}
              title={`${entry.name} (YTD)`}
              value={entry.total}
              format="currency"
              icon={DollarSign}
            />
          ))}
        </div>
      )}

      {/* Add Payment Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">New Payment</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Contractor *</label>
              <select
                className="input"
                required
                value={form.contractor_id}
                onChange={(e) => setForm({ ...form, contractor_id: e.target.value })}
              >
                <option value="">Select contractor...</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                className="input"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="flat_fee">Flat Fee</option>
                <option value="hourly">Hourly</option>
                <option value="percentage">Percentage</option>
                <option value="project">Project</option>
                <option value="retainer">Retainer</option>
              </select>
            </div>
            <div>
              <label className="label">Revenue Source</label>
              <input
                className="input"
                value={form.revenue_source}
                onChange={(e) => setForm({ ...form, revenue_source: e.target.value })}
                placeholder="e.g., studio_session, mixing"
              />
            </div>
            <div>
              <label className="label">Amount *</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Add Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-[#F4C430]" />
          <span className="text-sm font-medium text-white">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Contractor</label>
            <select
              className="input"
              value={filterContractor}
              onChange={(e) => setFilterContractor(e.target.value)}
            >
              <option value="">All Contractors</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Source Type</label>
            <select
              className="input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {sourceTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              className="input"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              className="input"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="p-4 border-b border-[#262626] flex justify-between items-center">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#F4C430]" />
            Payment Log
          </h3>
          <span className="text-xs text-gray-500">{filtered.length} payments</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payments found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Contractor</th>
                  <th>Type</th>
                  <th>Revenue Source</th>
                  <th className="text-right">Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{p.date}</td>
                    <td className="font-medium text-white">{p.contractors?.name || '--'}</td>
                    <td>
                      <span className="badge badge-info text-xs capitalize">
                        {p.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-gray-400 capitalize">{p.revenue_source?.replace(/_/g, ' ') || '--'}</td>
                    <td className="text-right font-medium text-white">{fmt(Number(p.amount))}</td>
                    <td className="text-gray-400 truncate max-w-[200px]">{p.notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="font-medium">Total</td>
                  <td className="text-right font-bold text-white">
                    {fmt(filtered.reduce((s, p) => s + Number(p.amount), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
