'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { FileText, DollarSign, AlertTriangle, CheckCircle, Calendar, Shield, Users } from 'lucide-react'

const supabase = createSupabaseBrowserClient() as any
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

type Tab = 'sales_tax' | 'estimated' | 'annual' | '1099_tracker'

interface TeamMember {
  id: string
  name: string
  role: string
  entity: string
  status: string
  pay_type: string
  tax_status: string
  documents_needed: string[]
  documents_received: string[]
}

interface PayoutRecord {
  id: string
  date: string
  client_name: string
  total_revenue: number
  worker_amount: number
  sales_amount: number
  calculation_details: any
}

export default function TaxPage() {
  const [tab, setTab] = useState<Tab>('1099_tracker')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Data
  const [salesTax, setSalesTax] = useState<any[]>([])
  const [estimatedTax, setEstimatedTax] = useState<any[]>([])
  const [annualTax, setAnnualTax] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [payoutRecords, setPayoutRecords] = useState<PayoutRecord[]>([])
  const [studioData, setStudioData] = useState<any>(null)

  // Forms
  const [salesTaxForm, setSalesTaxForm] = useState({ period_label: '', period_start: '', period_end: '', total_beat_sales: 0, in_taxable_sales: 0, out_of_state_sales: 0, gross_retail_sales_in: '', taxable_sales: '', tax_rate: '7.00', sales_tax_due: '' })
  const [estTaxForm, setEstTaxForm] = useState({ quarter: 'Q1', tax_type: 'federal', partner_name: 'Jay Mick', guaranteed_payments_ytd: '', ordinary_income_ytd: '', quarterly_payment_amount: '', payment_date: '', confirmation_number: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const yearStart = `${selectedYear}-01-01`
    const yearEnd = `${selectedYear}-12-31`

    const [stRes, etRes, atRes, tmRes, prRes] = await Promise.all([
      supabase.from('sales_tax_filings').select('*').order('period_start', { ascending: false }),
      supabase.from('estimated_tax_payments').select('*').eq('tax_year', selectedYear).order('quarter'),
      supabase.from('annual_tax_filings').select('*').eq('tax_year', selectedYear).order('form_type'),
      supabase.from('team_members').select('*').order('name'),
      supabase.from('payout_records').select('*').gte('date', yearStart).lte('date', yearEnd).order('date', { ascending: false }),
    ])

    // Fetch studio data for the year
    const studioStart = new Date(selectedYear, 0, 1).toISOString()
    const studioEnd = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString()
    const studioRes = await fetch(`/api/studio-revenue?start=${encodeURIComponent(studioStart)}&end=${encodeURIComponent(studioEnd)}`).then(r => r.json()).catch(() => null)

    setSalesTax(stRes.data || [])
    setEstimatedTax(etRes.data || [])
    setAnnualTax(atRes.data || [])
    setTeamMembers(tmRes.data || [])
    setPayoutRecords(prRes.data || [])
    setStudioData(studioRes)
    setLoading(false)
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  // Calculate YTD payouts per person from payout_records
  function getPersonPayouts() {
    const totals: Record<string, { media_worker: number; media_sales: number; studio: number; total: number }> = {}

    const ensure = (name: string) => {
      if (!totals[name]) totals[name] = { media_worker: 0, media_sales: 0, studio: 0, total: 0 }
    }

    // From payout_records workerBreakdown and salesBreakdown
    payoutRecords.forEach(pr => {
      const details = pr.calculation_details
      if (details?.workerBreakdown) {
        details.workerBreakdown.forEach((w: any) => {
          ensure(w.name)
          totals[w.name].media_worker += Number(w.amount || 0)
          totals[w.name].total += Number(w.amount || 0)
        })
      }
      if (details?.salesBreakdown) {
        details.salesBreakdown.forEach((s: any) => {
          ensure(s.name)
          totals[s.name].media_sales += Number(s.amount || 0)
          totals[s.name].total += Number(s.amount || 0)
        })
      }
    })

    // From studio data (engineer payouts)
    if (studioData?.byEngineer) {
      Object.entries(studioData.byEngineer).forEach(([name, data]: [string, any]) => {
        ensure(name)
        totals[name].studio += data.payout || 0
        totals[name].total += data.payout || 0
      })
    }

    return totals
  }

  const personPayouts = getPersonPayouts()

  // Merge team members with their payout data
  const teamWithPayouts = teamMembers.map(tm => {
    const payouts = personPayouts[tm.name] || { media_worker: 0, media_sales: 0, studio: 0, total: 0 }
    const needs1099 = tm.pay_type === '1099_contractor' && payouts.total >= 2000
    const needsK1 = tm.pay_type === 'owner_draw'
    return { ...tm, payouts, needs1099, needsK1 }
  }).sort((a, b) => b.payouts.total - a.payouts.total)

  // Owners for estimated tax
  const owners = teamMembers.filter(tm => tm.role === 'owner')

  const handleSalesTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const taxable = parseFloat(salesTaxForm.taxable_sales) || 0
    const rate = parseFloat(salesTaxForm.tax_rate) || 7
    await supabase.from('sales_tax_filings').insert({
      ...salesTaxForm,
      gross_retail_sales_in: parseFloat(salesTaxForm.gross_retail_sales_in) || 0,
      taxable_sales: taxable,
      tax_rate: rate,
      sales_tax_due: taxable * rate / 100,
      net_tax_due: taxable * rate / 100,
    })
    setShowForm(false)
    fetchData()
  }

  const handleEstTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('estimated_tax_payments').upsert({
      tax_year: selectedYear,
      quarter: estTaxForm.quarter,
      tax_type: estTaxForm.tax_type,
      partner_name: estTaxForm.partner_name,
      guaranteed_payments_ytd: parseFloat(estTaxForm.guaranteed_payments_ytd) || 0,
      ordinary_income_ytd: parseFloat(estTaxForm.ordinary_income_ytd) || 0,
      quarterly_payment_amount: parseFloat(estTaxForm.quarterly_payment_amount) || 0,
      payment_date: estTaxForm.payment_date || null,
      confirmation_number: estTaxForm.confirmation_number || null,
      status: estTaxForm.payment_date ? 'paid' : 'estimated',
    }, { onConflict: 'tax_year,quarter,tax_type,partner_name' })
    setShowForm(false)
    fetchData()
  }

  const initAnnualDoc = async (formType: string) => {
    const dueDate = formType.includes('form_103') ? `${selectedYear + 1}-05-15` : `${selectedYear + 1}-03-15`
    await supabase.from('annual_tax_filings').upsert({
      tax_year: selectedYear,
      form_type: formType,
      due_date: dueDate,
      form_data: {},
      status: 'not_started',
    }, { onConflict: 'tax_year,form_type' })
    fetchData()
  }

  const totalSalesTaxDue = salesTax.reduce((s, t) => s + (t.net_tax_due || 0), 0)
  const totalSalesTaxPaid = salesTax.filter(t => t.filing_status === 'paid').reduce((s, t) => s + (t.net_tax_due || 0), 0)
  const totalEstPaid = estimatedTax.filter(t => t.status === 'paid').reduce((s, t) => s + (t.quarterly_payment_amount || 0), 0)
  const contractors1099 = teamWithPayouts.filter(c => c.needs1099).length
  const pendingW9s = teamMembers.filter(tm => tm.tax_status === 'w9_pending').length

  return (
    <div className="p-6 space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tax Compliance</h1>
          <p className="page-description">Sales tax, estimated payments, annual filings, and 1099 tracking</p>
        </div>
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="input w-32">
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><DollarSign className="h-4 w-4 text-[var(--warning)]" /> Sales Tax Due</div>
          <div className="stat-card-value">{fmt(totalSalesTaxDue - totalSalesTaxPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><Calendar className="h-4 w-4 text-[var(--info)]" /> Est. Tax Paid YTD</div>
          <div className="stat-card-value">{fmt(totalEstPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><FileText className="h-4 w-4 text-[var(--accent)]" /> Annual Forms</div>
          <div className="stat-card-value">{annualTax.filter(a => a.status === 'filed').length}/{annualTax.length || 6}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><Shield className="h-4 w-4 text-[var(--danger)]" /> 1099s Required</div>
          <div className="stat-card-value">{contractors1099}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><Users className="h-4 w-4" style={{ color: pendingW9s > 0 ? 'var(--warning)' : 'var(--success)' }} /> Pending W-9s</div>
          <div className="stat-card-value" style={{ color: pendingW9s > 0 ? 'var(--warning)' : 'var(--success)' }}>{pendingW9s}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-1">
        {([['1099_tracker', '1099 / Payouts'], ['estimated', 'Estimated Tax'], ['sales_tax', 'Sales Tax (ST-103)'], ['annual', 'Annual Filings']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setShowForm(false) }} className={`tab ${tab === key ? 'tab-active' : ''}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-[var(--muted)]">Loading...</div> : (
        <>
          {/* 1099 / Payouts Tracker Tab */}
          {tab === '1099_tracker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  YTD payouts per person across media jobs and studio sessions. 1099-NEC required for contractors paid ≥ $2,000.
                </p>
                <div className="flex items-center gap-2">
                  {contractors1099 > 0 && <span className="badge badge-danger">{contractors1099} require 1099</span>}
                  {pendingW9s > 0 && <span className="badge badge-warning">{pendingW9s} W-9 pending</span>}
                </div>
              </div>

              {/* Owner Section */}
              {teamWithPayouts.filter(t => t.role === 'owner').length > 0 && (
                <div className="card">
                  <div className="p-4 border-b border-[var(--border)]">
                    <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Owners (K-1 Recipients)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {teamWithPayouts.filter(t => t.role === 'owner').map(person => (
                      <div key={person.id} className="rounded-xl p-5" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{person.name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>Owner / K-1</span>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{fmt(person.payouts.total)}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>YTD Total</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface)' }}>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Media (Worker)</p>
                            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{fmt(person.payouts.media_worker)}</p>
                          </div>
                          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface)' }}>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Media (Sales)</p>
                            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{fmt(person.payouts.media_sales)}</p>
                          </div>
                          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--surface)' }}>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Studio</p>
                            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{fmt(person.payouts.studio)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                          <span>Needs: Schedule K-1, Schedule SE</span>
                          {estimatedTax.filter(e => e.partner_name === person.name.split(' ')[0] || e.partner_name === person.name).length > 0 && (
                            <span className="badge badge-info">Est. tax on file</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contractors / Engineers Section */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Contractors & Engineers (1099 Recipients)</h3>
                </div>
                <div className="table-container">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Entity</th>
                        <th className="text-right">Media Worker</th>
                        <th className="text-right">Media Sales</th>
                        <th className="text-right">Studio</th>
                        <th className="text-right">YTD Total</th>
                        <th>W-9</th>
                        <th>1099</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamWithPayouts.filter(t => t.role !== 'owner').length === 0 ? (
                        <tr><td colSpan={9} className="text-center text-[var(--muted)] py-8">No contractors or engineers</td></tr>
                      ) : (
                        teamWithPayouts.filter(t => t.role !== 'owner').map(person => (
                          <tr key={person.id} style={person.needs1099 ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : undefined}>
                            <td className="font-medium" style={{ color: 'var(--foreground)' }}>{person.name}</td>
                            <td>
                              <span className={`badge text-xs ${
                                person.role === 'engineer' ? 'badge-info' :
                                person.role === 'sales' ? 'badge-success' :
                                'badge-gray'
                              }`}>
                                {person.role}
                              </span>
                            </td>
                            <td className="text-xs" style={{ color: 'var(--muted)' }}>
                              {person.entity === 'sweet_dreams_us' ? 'SD US' :
                               person.entity === 'sweet_dreams_music' ? 'SD Music' : 'Both'}
                            </td>
                            <td className="text-right">{person.payouts.media_worker > 0 ? fmt(person.payouts.media_worker) : '—'}</td>
                            <td className="text-right">{person.payouts.media_sales > 0 ? fmt(person.payouts.media_sales) : '—'}</td>
                            <td className="text-right">{person.payouts.studio > 0 ? fmt(person.payouts.studio) : '—'}</td>
                            <td className="text-right font-semibold" style={{ color: person.payouts.total > 0 ? 'var(--foreground)' : 'var(--muted)' }}>
                              {fmt(person.payouts.total)}
                            </td>
                            <td>
                              {person.tax_status === 'w9_received' || person.documents_received?.includes('W-9') ? (
                                <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
                              )}
                            </td>
                            <td>
                              {person.needs1099 ? (
                                <span className="badge badge-danger">Required</span>
                              ) : person.payouts.total > 0 ? (
                                <span className="badge badge-gray">Below $2K</span>
                              ) : (
                                <span className="badge badge-gray">No payouts</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payout Detail by Job */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Media Payout Detail ({selectedYear})</h3>
                </div>
                <div className="table-container">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th className="text-right">Revenue</th>
                        <th>Workers</th>
                        <th>Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRecords.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-[var(--muted)] py-8">No payout records for {selectedYear}</td></tr>
                      ) : (
                        payoutRecords.map(pr => {
                          const workers = pr.calculation_details?.workerBreakdown || []
                          const sales = pr.calculation_details?.salesBreakdown || []
                          return (
                            <tr key={pr.id}>
                              <td className="whitespace-nowrap">{pr.date}</td>
                              <td className="font-medium" style={{ color: 'var(--foreground)' }}>{pr.client_name}</td>
                              <td className="text-right">{fmt(pr.total_revenue)}</td>
                              <td className="text-xs">
                                {workers.map((w: any, i: number) => (
                                  <span key={i} className="inline-block mr-2">
                                    {w.name} <span style={{ color: 'var(--accent)' }}>{fmt(w.amount)}</span>
                                  </span>
                                ))}
                              </td>
                              <td className="text-xs">
                                {sales.length > 0 ? sales.map((s: any, i: number) => (
                                  <span key={i} className="inline-block mr-2">
                                    {s.name} <span style={{ color: 'var(--success)' }}>{fmt(s.amount)}</span>
                                  </span>
                                )) : <span style={{ color: 'var(--muted)' }}>—</span>}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Tax Tab */}
          {tab === 'estimated' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)} className="btn-primary btn">{showForm ? 'Cancel' : 'Add/Update Payment'}</button>
              </div>
              {showForm && (
                <form onSubmit={handleEstTaxSubmit} className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="label">Quarter</label><select value={estTaxForm.quarter} onChange={e => setEstTaxForm({...estTaxForm, quarter: e.target.value})} className="input">{['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}</select></div>
                  <div><label className="label">Type</label><select value={estTaxForm.tax_type} onChange={e => setEstTaxForm({...estTaxForm, tax_type: e.target.value})} className="input"><option value="federal">Federal</option><option value="indiana">Indiana</option></select></div>
                  <div><label className="label">Partner</label>
                    <select value={estTaxForm.partner_name} onChange={e => setEstTaxForm({...estTaxForm, partner_name: e.target.value})} className="input">
                      {owners.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                      {owners.length === 0 && <><option value="Jay Mick">Jay Mick</option><option value="Cole Marcuccilli">Cole Marcuccilli</option></>}
                    </select>
                  </div>
                  <div><label className="label">GP YTD</label><input type="number" step="0.01" value={estTaxForm.guaranteed_payments_ytd} onChange={e => setEstTaxForm({...estTaxForm, guaranteed_payments_ytd: e.target.value})} className="input" /></div>
                  <div><label className="label">OI YTD</label><input type="number" step="0.01" value={estTaxForm.ordinary_income_ytd} onChange={e => setEstTaxForm({...estTaxForm, ordinary_income_ytd: e.target.value})} className="input" /></div>
                  <div><label className="label">Payment Amount</label><input type="number" step="0.01" value={estTaxForm.quarterly_payment_amount} onChange={e => setEstTaxForm({...estTaxForm, quarterly_payment_amount: e.target.value})} className="input" required /></div>
                  <div><label className="label">Payment Date</label><input type="date" value={estTaxForm.payment_date} onChange={e => setEstTaxForm({...estTaxForm, payment_date: e.target.value})} className="input" /></div>
                  <div className="flex items-end"><button type="submit" className="btn-primary btn w-full">Save</button></div>
                </form>
              )}

              {/* Per-owner section with YTD earnings context */}
              {owners.map(owner => {
                const partnerData = estimatedTax.filter(e => e.partner_name === owner.name || e.partner_name === owner.name.split(' ')[0])
                const ownerPayouts = personPayouts[owner.name] || { media_worker: 0, media_sales: 0, studio: 0, total: 0 }
                return (
                  <div key={owner.id} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{owner.name}&apos;s Estimated Tax</h3>
                      <div className="text-right">
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>YTD Earnings</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{fmt(ownerPayouts.total)}</p>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="table w-full">
                        <thead><tr><th>Quarter</th><th>Type</th><th className="text-right">GP YTD</th><th className="text-right">OI YTD</th><th className="text-right">Payment</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                          {partnerData.length === 0 ? <tr><td colSpan={7} className="text-center text-[var(--muted)] py-4">No payments recorded</td></tr> :
                            partnerData.map(e => (
                              <tr key={e.id}>
                                <td className="font-medium">{e.quarter}</td>
                                <td className="capitalize">{e.tax_type}</td>
                                <td className="text-right">{fmt(e.guaranteed_payments_ytd)}</td>
                                <td className="text-right">{fmt(e.ordinary_income_ytd)}</td>
                                <td className="text-right font-medium">{fmt(e.quarterly_payment_amount)}</td>
                                <td>{e.payment_date || '—'}</td>
                                <td><span className={`badge ${e.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{e.status}</span></td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sales Tax Tab */}
          {tab === 'sales_tax' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)} className="btn-primary btn">{showForm ? 'Cancel' : 'Add Filing Period'}</button>
              </div>
              {showForm && (
                <form onSubmit={handleSalesTaxSubmit} className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="label">Period Label</label><input value={salesTaxForm.period_label} onChange={e => setSalesTaxForm({...salesTaxForm, period_label: e.target.value})} className="input" placeholder="Q1 2026" required /></div>
                  <div><label className="label">Start Date</label><input type="date" value={salesTaxForm.period_start} onChange={e => setSalesTaxForm({...salesTaxForm, period_start: e.target.value})} className="input" required /></div>
                  <div><label className="label">End Date</label><input type="date" value={salesTaxForm.period_end} onChange={e => setSalesTaxForm({...salesTaxForm, period_end: e.target.value})} className="input" required /></div>
                  <div><label className="label">IN Taxable Sales ($)</label><input type="number" step="0.01" value={salesTaxForm.taxable_sales} onChange={e => setSalesTaxForm({...salesTaxForm, taxable_sales: e.target.value})} className="input" required /></div>
                  <div><label className="label">Tax Rate (%)</label><input type="number" step="0.01" value={salesTaxForm.tax_rate} onChange={e => setSalesTaxForm({...salesTaxForm, tax_rate: e.target.value})} className="input" /></div>
                  <div className="flex items-end"><button type="submit" className="btn-primary btn w-full">Save</button></div>
                </form>
              )}
              <div className="table-container">
                <table className="table w-full">
                  <thead><tr><th>Period</th><th className="text-right">Taxable Sales</th><th className="text-right">Tax Rate</th><th className="text-right">Tax Due</th><th>Status</th></tr></thead>
                  <tbody>
                    {salesTax.length === 0 ? <tr><td colSpan={5} className="text-center text-[var(--muted)] py-8">No sales tax filings</td></tr> :
                      salesTax.map(s => (
                        <tr key={s.id}>
                          <td className="font-medium">{s.period_label}</td>
                          <td className="text-right">{fmt(s.taxable_sales)}</td>
                          <td className="text-right">{s.tax_rate}%</td>
                          <td className="text-right">{fmt(s.net_tax_due)}</td>
                          <td><span className={`badge ${s.filing_status === 'paid' ? 'badge-success' : s.filing_status === 'filed' ? 'badge-info' : 'badge-warning'}`}>{s.filing_status}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Annual Filings Tab */}
          {tab === 'annual' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Track preparation and filing status for all annual tax documents. Click &quot;Initialize&quot; to start tracking a form.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { type: 'form_1065', name: 'Form 1065', desc: 'Federal Partnership Return', due: 'March 15' },
                  { type: 'schedule_k1_jay', name: 'Schedule K-1 (Jay)', desc: 'Partner Distributive Share', due: 'March 15' },
                  { type: 'schedule_k1_cole', name: 'Schedule K-1 (Cole)', desc: 'Partner Distributive Share', due: 'March 15' },
                  { type: 'it_65', name: 'Indiana IT-65', desc: 'State Partnership Return', due: 'March 15' },
                  { type: 'form_103', name: 'Form 103', desc: 'Business Property Tax', due: 'May 15' },
                  { type: '1099_nec_checklist', name: '1099-NEC', desc: 'Contractor Reporting', due: 'January 31' },
                ].map(form => {
                  const existing = annualTax.find(a => a.form_type === form.type)
                  return (
                    <div key={form.type} className="card p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold" style={{ color: 'var(--foreground)' }}>{form.name}</h4>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{form.desc}</p>
                        </div>
                        {existing ? (
                          <span className={`badge ${
                            existing.status === 'filed' ? 'badge-success' :
                            existing.status === 'reviewed' ? 'badge-info' :
                            existing.status === 'prepared' ? 'badge-warning' :
                            existing.status === 'in_progress' ? 'badge-warning' : 'badge-gray'
                          }`}>{existing.status.replace('_', ' ')}</span>
                        ) : (
                          <button onClick={() => initAnnualDoc(form.type)} className="btn btn-secondary btn-sm">Initialize</button>
                        )}
                      </div>
                      <div className="text-xs space-y-1" style={{ color: 'var(--muted)' }}>
                        <div className="flex justify-between"><span>Due</span><span>{form.due}</span></div>
                        {existing && existing.filed_date && <div className="flex justify-between"><span>Filed</span><span className="text-[var(--success)]">{existing.filed_date}</span></div>}
                        {existing && existing.extension_filed && <div className="flex justify-between"><span>Extended to</span><span>{existing.extended_due_date}</span></div>}
                      </div>
                      {existing && (
                        <div className="mt-3 flex gap-2">
                          {existing.reviewed_by_jay && <span className="badge badge-success text-xs">Jay ✓</span>}
                          {existing.reviewed_by_cole && <span className="badge badge-success text-xs">Cole ✓</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
