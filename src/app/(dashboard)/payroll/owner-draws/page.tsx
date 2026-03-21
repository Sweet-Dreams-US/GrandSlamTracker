'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PiggyBank,
  Plus,
  ArrowLeft,
  DollarSign,
  User,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

interface OwnerPayment {
  id: string
  partner_name: string
  date: string
  category: string
  hours: number
  rate: number
  amount: number
  notes?: string
  created_at: string
}

const CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'sales_commission', label: 'Sales Commission' },
  { value: 'management', label: 'Management' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'other', label: 'Other' },
]

function getQuarter(date: string): number {
  const month = new Date(date).getMonth()
  return Math.floor(month / 3) + 1
}

export default function OwnerDrawsPage() {
  const [payments, setPayments] = useState<OwnerPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentYear = new Date().getFullYear()
  const yearStart = `${currentYear}-01-01`

  const [form, setForm] = useState({
    partner_name: 'Jay',
    date: new Date().toISOString().slice(0, 10),
    category: 'labor',
    hours: '',
    rate: '',
    amount: '',
    notes: '',
  })

  const loadData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data } = await (supabase.from('owner_payments') as any)
      .select('*')
      .gte('date', yearStart)
      .order('date', { ascending: false })
    if (data) setPayments(data)
    setLoading(false)
  }, [yearStart])

  useEffect(() => {
    loadData()
  }, [loadData])

  const jayPayments = payments.filter((p) => p.partner_name === 'Jay')
  const colePayments = payments.filter((p) => p.partner_name === 'Cole')

  const jayYTD = jayPayments.reduce((s, p) => s + Number(p.amount), 0)
  const coleYTD = colePayments.reduce((s, p) => s + Number(p.amount), 0)

  function quarterlyBreakdown(partnerPayments: OwnerPayment[]): Record<number, number> {
    return partnerPayments.reduce<Record<number, number>>((acc, p) => {
      const q = getQuarter(p.date)
      acc[q] = (acc[q] || 0) + Number(p.amount)
      return acc
    }, {})
  }

  const jayQuarterly = quarterlyBreakdown(jayPayments)
  const coleQuarterly = quarterlyBreakdown(colePayments)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    await (supabase.from('owner_payments') as any).insert([
      {
        partner_name: form.partner_name,
        date: form.date,
        category: form.category,
        hours: form.hours ? parseFloat(form.hours) : 0,
        rate: form.rate ? parseFloat(form.rate) : 0,
        amount: parseFloat(form.amount),
        notes: form.notes || null,
      },
    ])
    setForm({ partner_name: 'Jay', date: new Date().toISOString().slice(0, 10), category: 'labor', hours: '', rate: '', amount: '', notes: '' })
    setShowForm(false)
    setSaving(false)
    loadData()
  }

  function PartnerColumn({
    name,
    ytd,
    quarterly,
    partnerPayments,
  }: {
    name: string
    ytd: number
    quarterly: Record<number, number>
    partnerPayments: OwnerPayment[]
  }) {
    return (
      <div className="card">
        <div className="p-4 border-b border-[#262626] flex items-center gap-3">
          <div className="p-2 bg-[#F4C430]/10 rounded-lg">
            <User className="h-5 w-5 text-[#F4C430]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="text-xs text-gray-500">Guaranteed Payments</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">YTD Total</p>
            <p className="text-2xl font-bold text-white">{fmt(ytd)}</p>
          </div>
        </div>

        {/* Quarterly Breakdown */}
        <div className="p-4 border-b border-[#262626]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quarterly Breakdown</p>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((q) => (
              <div key={q} className="bg-[#0d0d0d] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Q{q}</p>
                <p className="text-sm font-semibold text-white mt-1">{fmt(quarterly[q] || 0)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Payment History</p>
          {partnerPayments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments recorded yet.</p>
          ) : (
            <div className="table-container">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th className="text-right">Hours</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap">{p.date}</td>
                      <td>
                        <span className="badge badge-info text-xs capitalize">
                          {p.category?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right text-gray-400">{Number(p.hours) || '--'}</td>
                      <td className="text-right text-gray-400">{Number(p.rate) ? fmt(Number(p.rate)) : '--'}</td>
                      <td className="text-right font-medium text-white">{fmt(Number(p.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Link href="/payroll" className="text-sm text-gray-500 hover:text-[#F4C430] flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Payroll
          </Link>
          <h1 className="page-title">Owner Guaranteed Payments</h1>
          <p className="page-description">Partner draws and guaranteed payment tracking</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </button>
      </div>

      {/* Combined YTD Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Combined YTD</p>
          <p className="mt-2 text-3xl font-bold text-white">{fmt(jayYTD + coleYTD)}</p>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Jay YTD</p>
            <div className="p-2 bg-[#F4C430]/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-[#F4C430]" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{fmt(jayYTD)}</p>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cole YTD</p>
            <div className="p-2 bg-[#F4C430]/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-[#F4C430]" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{fmt(coleYTD)}</p>
        </div>
      </div>

      {/* Add Payment Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">New Owner Payment</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Partner *</label>
              <select
                className="input"
                required
                value={form.partner_name}
                onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
              >
                <option value="Jay">Jay</option>
                <option value="Cole">Cole</option>
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
              <label className="label">Category *</label>
              <select
                className="input"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Hours</label>
              <input
                className="input"
                type="number"
                step="0.5"
                min="0"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Rate</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="0.00"
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
            <div className="md:col-span-3">
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

      {/* Two-column layout: Jay | Cole */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PartnerColumn
            name="Jay"
            ytd={jayYTD}
            quarterly={jayQuarterly}
            partnerPayments={jayPayments}
          />
          <PartnerColumn
            name="Cole"
            ytd={coleYTD}
            quarterly={coleQuarterly}
            partnerPayments={colePayments}
          />
        </div>
      )}
    </div>
  )
}
