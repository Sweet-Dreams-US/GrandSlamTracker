'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  TrendingDown,
  Package,
  Building2,
  Plus,
  X,
  Loader2,
  Filter,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const CATEGORIES = [
  'Rent & Utilities',
  'Equipment',
  'Software & Subscriptions',
  'Marketing',
  'Travel',
  'Contractors',
  'Insurance',
  'Supplies',
  'Professional Services',
  'Meals & Entertainment',
  'Vehicle',
  'Education & Training',
  'Other',
]

const emptyExpense = {
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  category: CATEGORIES[0],
  description: '',
  amount: '',
  tax: '0',
  type: 'expense',
  s179_eligible: false,
}

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ...emptyExpense })
  const [filterCategory, setFilterCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data } = await (supabase.from('expenses') as any)
        .select('*')
        .order('date', { ascending: false })
      if (data) setExpenses(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()
    const amount = Number(form.amount)
    const tax = Number(form.tax)
    const row = {
      date: new Date(form.date).toISOString(),
      vendor: form.vendor,
      category: form.category,
      description: form.description,
      amount,
      tax,
      total: amount + tax,
      type: form.type,
      s179_eligible: form.s179_eligible,
    }
    const { data } = await (supabase.from('expenses') as any).insert(row).select().single()
    if (data) setExpenses((prev) => [data, ...prev])
    setForm({ ...emptyExpense })
    setShowForm(false)
    setSubmitting(false)
  }

  // Filtering
  const filtered = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false
    if (dateTo && new Date(e.date) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  // MTD stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const mtdExpenses = expenses.filter((e) => new Date(e.date) >= monthStart)
  const totalMTD = mtdExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  // Category breakdown for all filtered
  const categoryTotals: Record<string, number> = {}
  filtered.forEach((e) => {
    const cat = e.category || 'Other'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0)
  })
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  const maxCatValue = sortedCategories.length > 0 ? sortedCategories[0][1] : 1
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount || 0), 0)

  // Asset vs Expense split
  const assetTotal = filtered.filter((e) => e.type === 'asset').reduce((s, e) => s + Number(e.amount || 0), 0)
  const expenseTotal = filtered.filter((e) => e.type !== 'asset').reduce((s, e) => s + Number(e.amount || 0), 0)

  // Top category
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : ['None', 0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <Link href="/accounting" className="text-xs flex items-center gap-1 mb-2" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="h-3 w-3" /> Accounting
          </Link>
          <h1 className="page-title">Expenses</h1>
          <p className="page-description">Log and track business spending</p>
        </div>
        <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Total Expenses (MTD)</p>
            <TrendingDown className="h-4 w-4" style={{ color: 'var(--danger)' }} />
          </div>
          <p className="stat-card-value">{fmt(totalMTD)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Top Category</p>
            <Receipt className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="stat-card-value text-xl">{topCategory[0] as string}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{fmt(topCategory[1] as number)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Assets</p>
            <Package className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </div>
          <p className="stat-card-value">{fmt(assetTotal)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Operating Expenses</p>
            <Building2 className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </div>
          <p className="stat-card-value">{fmt(expenseTotal)}</p>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="section-title">New Expense</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Vendor</label>
              <input type="text" className="input" placeholder="Vendor name" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <input type="text" className="input" placeholder="What was it for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Amount</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Tax</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="asset">Asset</option>
              </select>
            </div>
            <div className="form-group flex flex-col">
              <label className="label">S179 Eligible</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.s179_eligible}
                  onChange={(e) => setForm({ ...form, s179_eligible: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>Yes, eligible for Section 179</span>
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Total: <strong style={{ color: 'var(--foreground)' }}>{fmt(Number(form.amount || 0) + Number(form.tax || 0))}</strong>
              </p>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="section-title flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="label">Category</label>
              <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">From</label>
              <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">To</label>
              <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            {(filterCategory !== 'all' || dateFrom || dateTo) && (
              <button
                className="btn-ghost btn-sm w-full"
                onClick={() => { setFilterCategory('all'); setDateFrom(''); setDateTo('') }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title">Category Breakdown</h3>
          {sortedCategories.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--muted)' }}>No expenses to show</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, total]) => {
                const pct = totalFiltered > 0 ? (total / totalFiltered) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{cat}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{pct.toFixed(1)}%</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{fmt(total)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(total / maxCatValue) * 100}%`,
                          backgroundColor: 'var(--accent)',
                          minWidth: '4px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 mt-3 flex justify-between text-sm" style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Total</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{fmt(totalFiltered)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Type</th>
              <th>S179</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--muted)' }}>No expenses found</td></tr>
            ) : (
              filtered.map((e: any) => (
                <tr key={e.id}>
                  <td>{e.date ? fmtDate(e.date) : '-'}</td>
                  <td className="font-medium">{e.vendor || '-'}</td>
                  <td><span className="badge-info">{e.category || '-'}</span></td>
                  <td className="max-w-[200px] truncate">{e.description || '-'}</td>
                  <td>{fmt(Number(e.amount || 0))}</td>
                  <td>{fmt(Number(e.tax || 0))}</td>
                  <td className="font-medium">{fmt(Number(e.total || Number(e.amount || 0) + Number(e.tax || 0)))}</td>
                  <td>
                    <span className={e.type === 'asset' ? 'badge-info' : 'badge-gray'}>
                      {e.type === 'asset' ? 'Asset' : 'Expense'}
                    </span>
                  </td>
                  <td>
                    {e.s179_eligible ? (
                      <span className="badge-success">Yes</span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
