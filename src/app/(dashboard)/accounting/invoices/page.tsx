'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Plus,
  X,
  Loader2,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

type InvoiceStatus = 'all' | 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'written_off'

const statusFilters: { key: InvoiceStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'written_off', label: 'Written Off' },
]

const emptyInvoice = {
  invoice_number: '',
  date: new Date().toISOString().split('T')[0],
  client: '',
  amount: '',
  terms: 'net_30',
  due_date: '',
  status: 'draft',
  notes: '',
}

function getDaysOutstanding(dateStr: string): number {
  const now = new Date()
  const date = new Date(dateStr)
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function isOverdue(inv: any): boolean {
  if (inv.status === 'paid' || inv.status === 'written_off') return false
  if (!inv.due_date) return false
  return new Date(inv.due_date) < new Date()
}

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [filter, setFilter] = useState<InvoiceStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ...emptyInvoice })

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data } = await (supabase.from('invoices') as any)
        .select('*')
        .order('date', { ascending: false })
      if (data) setInvoices(data)
      setLoading(false)
    }
    load()
  }, [])

  // Auto-calculate due date from terms
  function handleTermsChange(terms: string) {
    const newForm = { ...form, terms }
    if (form.date && terms.startsWith('net_')) {
      const days = parseInt(terms.replace('net_', ''))
      const due = new Date(form.date)
      due.setDate(due.getDate() + days)
      newForm.due_date = due.toISOString().split('T')[0]
    }
    setForm(newForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()
    const row = {
      invoice_number: form.invoice_number,
      date: new Date(form.date).toISOString(),
      client: form.client,
      amount: Number(form.amount),
      balance_due: Number(form.amount),
      terms: form.terms,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      status: form.status,
      notes: form.notes || null,
    }
    const { data } = await (supabase.from('invoices') as any).insert(row).select().single()
    if (data) setInvoices((prev) => [data, ...prev])
    setForm({ ...emptyInvoice })
    setShowForm(false)
    setSubmitting(false)
  }

  // Filtered invoices
  const filtered = invoices.filter((inv) => {
    if (filter === 'all') return true
    if (filter === 'overdue') return isOverdue(inv)
    return inv.status === filter
  })

  // Summary stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const outstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'partial')
    .reduce((s, i) => s + Number(i.balance_due || i.amount || 0), 0)

  const overdueAmount = invoices
    .filter((i) => isOverdue(i))
    .reduce((s, i) => s + Number(i.balance_due || i.amount || 0), 0)

  const paidThisMonth = invoices
    .filter((i) => i.status === 'paid' && new Date(i.date) >= monthStart)
    .reduce((s, i) => s + Number(i.amount || 0), 0)

  const paidInvoices = invoices.filter((i) => i.status === 'paid' && i.date && i.due_date)
  const avgDaysToPay =
    paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((s, i) => {
            const issued = new Date(i.date).getTime()
            const paid = new Date(i.due_date).getTime()
            return s + Math.abs(paid - issued) / (1000 * 60 * 60 * 24)
          }, 0) / paidInvoices.length
        )
      : 0

  const statusBadge = (status: string, inv: any) => {
    if (isOverdue(inv)) return 'badge-danger'
    switch (status) {
      case 'paid': return 'badge-success'
      case 'sent': return 'badge-info'
      case 'partial': return 'badge-warning'
      case 'draft': return 'badge-gray'
      case 'written_off': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

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
          <h1 className="page-title">Invoices</h1>
          <p className="page-description">Track and manage client invoices</p>
        </div>
        <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'New Invoice'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Total Outstanding</p>
            <DollarSign className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="stat-card-value">{fmt(outstanding)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Overdue Amount</p>
            <AlertTriangle className="h-4 w-4" style={{ color: 'var(--danger)' }} />
          </div>
          <p className="stat-card-value" style={{ color: overdueAmount > 0 ? 'var(--danger)' : undefined }}>{fmt(overdueAmount)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Paid This Month</p>
            <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </div>
          <p className="stat-card-value">{fmt(paidThisMonth)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Avg Days to Pay</p>
            <Clock className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </div>
          <p className="stat-card-value">{avgDaysToPay} <span className="text-base font-normal" style={{ color: 'var(--muted)' }}>days</span></p>
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="section-title">New Invoice</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="label">Invoice #</label>
              <input type="text" className="input" placeholder="INV-001" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Client</label>
              <input type="text" className="input" placeholder="Client name" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Amount</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Terms</label>
              <select className="input" value={form.terms} onChange={(e) => handleTermsChange(e.target.value)}>
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="net_60">Net 60</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <input type="text" className="input" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.key}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === sf.key
                ? 'text-black'
                : ''
            }`}
            style={{
              backgroundColor: filter === sf.key ? 'var(--accent)' : 'var(--surface)',
              color: filter === sf.key ? 'black' : 'var(--muted)',
              border: `1px solid ${filter === sf.key ? 'var(--accent)' : 'var(--border)'}`,
            }}
            onClick={() => setFilter(sf.key)}
          >
            {sf.label}
            {sf.key !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {sf.key === 'overdue'
                  ? invoices.filter((i) => isOverdue(i)).length
                  : invoices.filter((i) => i.status === sf.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Balance Due</th>
              <th>Terms</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Days Out</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--muted)' }}>No invoices found</td></tr>
            ) : (
              filtered.map((inv: any) => {
                const overdue = isOverdue(inv)
                return (
                  <tr
                    key={inv.id}
                    style={overdue ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : undefined}
                  >
                    <td className="font-medium" style={{ color: 'var(--accent)' }}>{inv.invoice_number || '-'}</td>
                    <td>{inv.date ? fmtDate(inv.date) : '-'}</td>
                    <td className="font-medium">{inv.client || '-'}</td>
                    <td>{fmt(Number(inv.amount || 0))}</td>
                    <td className="font-medium">{fmt(Number(inv.balance_due || inv.amount || 0))}</td>
                    <td className="capitalize">{(inv.terms || '-').replace('_', ' ')}</td>
                    <td style={overdue ? { color: 'var(--danger)' } : undefined}>
                      {inv.due_date ? fmtDate(inv.due_date) : '-'}
                    </td>
                    <td>
                      <span className={statusBadge(inv.status, inv)}>
                        {overdue ? 'overdue' : inv.status || 'draft'}
                      </span>
                    </td>
                    <td>
                      {inv.date ? (
                        <span style={{ color: overdue ? 'var(--danger)' : 'var(--muted)' }}>
                          {getDaysOutstanding(inv.date)}d
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
