'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

interface Contractor {
  id: string
  name: string
  type: string
  w9_status: string
  agreement_status: string
  status: string
  email?: string
  phone?: string
  created_at: string
}

interface ContractorPayment {
  id: string
  contractor_id: string
  date: string
  type: string
  revenue_source: string
  amount: number
  notes: string
}

const THRESHOLD_1099 = 2000

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [payments, setPayments] = useState<ContractorPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    w9_status: 'pending',
    agreement_status: 'pending',
    status: 'active',
  })

  const currentYear = new Date().getFullYear()
  const yearStart = `${currentYear}-01-01`

  const loadData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const [cRes, pRes] = await Promise.all([
      (supabase.from('contractors') as any).select('*').order('name'),
      (supabase.from('contractor_payments') as any)
        .select('*')
        .gte('date', yearStart)
        .order('date', { ascending: false }),
    ])
    if (cRes.data) setContractors(cRes.data)
    if (pRes.data) setPayments(pRes.data)
    setLoading(false)
  }, [yearStart])

  useEffect(() => {
    loadData()
  }, [loadData])

  const ytdByContractor = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.contractor_id] = (acc[p.contractor_id] || 0) + Number(p.amount)
    return acc
  }, {})

  const paymentsByContractor = payments.reduce<Record<string, ContractorPayment[]>>((acc, p) => {
    if (!acc[p.contractor_id]) acc[p.contractor_id] = []
    acc[p.contractor_id].push(p)
    return acc
  }, {})

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    await (supabase.from('contractors') as any).insert([form])
    setForm({ name: '', type: 'individual', email: '', phone: '', w9_status: 'pending', agreement_status: 'pending', status: 'active' })
    setShowForm(false)
    setSaving(false)
    loadData()
  }

  const statusBadge = (status: string) => {
    if (status === 'complete' || status === 'received' || status === 'signed' || status === 'active')
      return <span className="badge badge-success text-xs capitalize">{status}</span>
    if (status === 'pending')
      return <span className="badge badge-warning text-xs capitalize">{status}</span>
    return <span className="badge badge-error text-xs capitalize">{status}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Link href="/payroll" className="text-sm text-gray-500 hover:text-[#F4C430] flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Payroll
          </Link>
          <h1 className="page-title">Contractor Management</h1>
          <p className="page-description">Roster, W-9 tracking, and agreement status</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Contractor
        </button>
      </div>

      {/* Add Contractor Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">New Contractor</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contractor name"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="individual">Individual</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="label">W-9 Status</label>
              <select
                className="input"
                value={form.w9_status}
                onChange={(e) => setForm({ ...form, w9_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="received">Received</option>
              </select>
            </div>
            <div>
              <label className="label">Agreement Status</label>
              <select
                className="input"
                value={form.agreement_status}
                onChange={(e) => setForm({ ...form, agreement_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="signed">Signed</option>
              </select>
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Add Contractor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contractor Table */}
      <div className="card">
        <div className="p-4 border-b border-[#262626]">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-[#F4C430]" />
            Contractor Roster
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : contractors.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No contractors yet. Add one above.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>W-9</th>
                  <th>Agreement</th>
                  <th className="text-right">YTD Total</th>
                  <th>1099</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contractors.map((c) => {
                  const ytd = ytdByContractor[c.id] || 0
                  const isExpanded = expandedId === c.id
                  const cPayments = paymentsByContractor[c.id] || []
                  return (
                    <>
                      <tr
                        key={c.id}
                        className="cursor-pointer hover:bg-[#1a1a1a]"
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      >
                        <td>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </td>
                        <td className="font-medium text-white">{c.name}</td>
                        <td className="capitalize text-gray-400">{c.type}</td>
                        <td>{statusBadge(c.w9_status)}</td>
                        <td>{statusBadge(c.agreement_status)}</td>
                        <td className="text-right font-medium text-white">{fmt(ytd)}</td>
                        <td>
                          {ytd >= THRESHOLD_1099 ? (
                            <span className="badge badge-warning text-xs flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              1099 Required
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">--</span>
                          )}
                        </td>
                        <td>
                          {c.status === 'active' ? (
                            <span className="badge badge-success text-xs flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="badge badge-error text-xs flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${c.id}-detail`}>
                          <td colSpan={8} className="!p-0">
                            <div className="bg-[#0d0d0d] border-t border-b border-[#262626] p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-[#F4C430]" />
                                <span className="text-sm font-medium text-white">
                                  Payment History ({currentYear})
                                </span>
                                <span className="text-xs text-gray-500 ml-auto">
                                  {cPayments.length} payment{cPayments.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {cPayments.length === 0 ? (
                                <p className="text-sm text-gray-500">No payments recorded this year.</p>
                              ) : (
                                <table className="table text-sm">
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Type</th>
                                      <th>Revenue Source</th>
                                      <th className="text-right">Amount</th>
                                      <th>Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cPayments.map((p) => (
                                      <tr key={p.id}>
                                        <td>{p.date}</td>
                                        <td className="capitalize">{p.type?.replace(/_/g, ' ')}</td>
                                        <td className="capitalize">{p.revenue_source?.replace(/_/g, ' ')}</td>
                                        <td className="text-right font-medium">{fmt(Number(p.amount))}</td>
                                        <td className="text-gray-400 truncate max-w-[200px]">{p.notes || '--'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
