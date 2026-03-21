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
  business_amount: number
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

  // Generate 1099-NEC data for a contractor
  function generate1099Data(person: typeof teamWithPayouts[0]) {
    return {
      payerName: 'Sweet Dreams US LLC',
      payerEIN: '', // Fill from Xero / settings
      recipientName: person.name,
      recipientTIN: '', // From W-9 on file
      box1_nonemployeeComp: person.payouts.total,
      taxYear: selectedYear,
    }
  }

  // Total business revenue for partnership return
  const totalMediaRevenue = payoutRecords.reduce((s, p) => s + Number(p.total_revenue || 0), 0)
  const totalBusinessRetention = payoutRecords.reduce((s, p) => s + Number(p.business_amount || 0), 0)
  const totalWorkerPayouts = payoutRecords.reduce((s, p) => s + Number(p.worker_amount || 0), 0)
  const totalSalesPayouts = payoutRecords.reduce((s, p) => s + Number(p.sales_amount || 0), 0)
  const studioTotalRevenue = studioData?.summary?.totalStudioRevenue || 0
  const studioBusinessRetention = studioData?.summary?.totalBusinessRetention || 0

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
            <div className="space-y-6">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Auto-generated tax form data from your payout records. Review the pre-filled numbers, then file with the IRS/state.
              </p>

              {/* 1099-NEC Forms — Auto-generated per contractor */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>1099-NEC Forms</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Due January 31 — File for each contractor paid ≥ $2,000</p>
                  </div>
                  <span className="badge badge-danger">{contractors1099} to file</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {teamWithPayouts.filter(t => t.role !== 'owner' && t.payouts.total > 0).map(person => {
                    const data = generate1099Data(person)
                    return (
                      <div key={person.id} className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold" style={{ color: 'var(--foreground)' }}>1099-NEC — {person.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {person.needs1099 ? (
                                <span className="badge badge-danger">Required</span>
                              ) : (
                                <span className="badge badge-gray">Below threshold</span>
                              )}
                              {person.tax_status === 'w9_received' || person.documents_received?.includes('W-9') ? (
                                <span className="badge badge-success">W-9 on file</span>
                              ) : (
                                <span className="badge badge-warning">W-9 missing</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{fmt(person.payouts.total)}</p>
                        </div>
                        <div className="rounded-lg p-4 text-sm font-mono" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            <div>
                              <span className="text-xs uppercase" style={{ color: 'var(--muted)' }}>Payer</span>
                              <p style={{ color: 'var(--foreground)' }}>Sweet Dreams US LLC</p>
                            </div>
                            <div>
                              <span className="text-xs uppercase" style={{ color: 'var(--muted)' }}>Payer TIN</span>
                              <p style={{ color: 'var(--muted)' }}>Set in Settings</p>
                            </div>
                            <div>
                              <span className="text-xs uppercase" style={{ color: 'var(--muted)' }}>Recipient</span>
                              <p style={{ color: 'var(--foreground)' }}>{person.name}</p>
                            </div>
                            <div>
                              <span className="text-xs uppercase" style={{ color: 'var(--muted)' }}>Recipient TIN</span>
                              <p style={{ color: person.tax_status === 'w9_received' ? 'var(--foreground)' : 'var(--danger)' }}>
                                {person.tax_status === 'w9_received' ? 'From W-9' : 'Need W-9'}
                              </p>
                            </div>
                            <div className="col-span-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                              <span className="text-xs uppercase" style={{ color: 'var(--muted)' }}>Box 1 — Nonemployee Compensation</span>
                              <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{fmt(person.payouts.total)}</p>
                              <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                                {person.payouts.media_worker > 0 && <span>Media work: {fmt(person.payouts.media_worker)}</span>}
                                {person.payouts.media_sales > 0 && <span>Sales comm: {fmt(person.payouts.media_sales)}</span>}
                                {person.payouts.studio > 0 && <span>Studio eng: {fmt(person.payouts.studio)}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {teamWithPayouts.filter(t => t.role !== 'owner' && t.payouts.total > 0).length === 0 && (
                    <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>No contractor payouts for {selectedYear}</div>
                  )}
                </div>
              </div>

              {/* Form 1065 — Partnership Return Summary */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Form 1065 — Partnership Return Data</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Due March 15 — Key line items auto-calculated from your records</p>
                </div>
                <div className="p-5">
                  <div className="rounded-lg p-5 font-mono text-sm space-y-3" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                    <div className="text-xs font-bold uppercase tracking-wider pb-2 mb-2" style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
                      Income
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Line 1a — Gross receipts (Media)</span>
                      <span style={{ color: 'var(--foreground)' }}>{fmt(totalMediaRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Line 1a — Gross receipts (Studio)</span>
                      <span style={{ color: 'var(--foreground)' }}>{fmt(studioTotalRevenue)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--foreground)' }}>Total Gross Receipts</span>
                      <span style={{ color: 'var(--accent)' }}>{fmt(totalMediaRevenue + studioTotalRevenue)}</span>
                    </div>

                    <div className="text-xs font-bold uppercase tracking-wider pb-2 mb-2 mt-4" style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
                      Deductions
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Line 10 — Guaranteed payments (Worker payouts)</span>
                      <span style={{ color: 'var(--foreground)' }}>{fmt(totalWorkerPayouts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Line 10 — Guaranteed payments (Sales commissions)</span>
                      <span style={{ color: 'var(--foreground)' }}>{fmt(totalSalesPayouts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Contractor payments (Studio engineers)</span>
                      <span style={{ color: 'var(--foreground)' }}>{fmt(studioData?.summary?.totalEngineerPayouts || 0)}</span>
                    </div>

                    <div className="text-xs font-bold uppercase tracking-wider pb-2 mb-2 mt-4" style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
                      Bottom Line
                    </div>
                    <div className="flex justify-between font-bold">
                      <span style={{ color: 'var(--foreground)' }}>Ordinary Business Income (est.)</span>
                      <span style={{ color: 'var(--success)' }}>{fmt(totalBusinessRetention + studioBusinessRetention)}</span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                      Note: This is a simplified view. Actual 1065 requires expenses from Xero. Connect Xero to auto-populate remaining deductions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule K-1 — Per Partner */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Schedule K-1 — Partner Shares</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Due March 15 — Each partner&apos;s distributive share</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  {teamWithPayouts.filter(t => t.role === 'owner').map(owner => {
                    const ownerPayouts = personPayouts[owner.name] || { media_worker: 0, media_sales: 0, studio: 0, total: 0 }
                    const businessShare = (totalBusinessRetention + studioBusinessRetention) * 0.5 // 50/50 partnership
                    return (
                      <div key={owner.id} className="rounded-lg p-5 font-mono text-sm" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                        <h4 className="font-bold mb-3" style={{ color: 'var(--foreground)' }}>K-1 — {owner.name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--muted)' }}>Box 1 — Ordinary income (50%)</span>
                            <span style={{ color: 'var(--foreground)' }}>{fmt(businessShare)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--muted)' }}>Box 4 — Guaranteed payments</span>
                            <span style={{ color: 'var(--foreground)' }}>{fmt(ownerPayouts.total)}</span>
                          </div>
                          <div className="flex justify-between pt-2 font-bold" style={{ borderTop: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--foreground)' }}>Total K-1 income</span>
                            <span style={{ color: 'var(--accent)' }}>{fmt(businessShare + ownerPayouts.total)}</span>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                            <span>Worker: {fmt(ownerPayouts.media_worker)}</span>
                            <span>Sales: {fmt(ownerPayouts.media_sales)}</span>
                            <span>Studio: {fmt(ownerPayouts.studio)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Indiana IT-65 + Form 103 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-6">
                  <h4 className="font-bold mb-1" style={{ color: 'var(--foreground)' }}>Indiana IT-65</h4>
                  <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>State Partnership Return — Due March 15</p>
                  <div className="rounded-lg p-4 font-mono text-sm" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between mb-2">
                      <span style={{ color: 'var(--muted)' }}>Total partnership income</span>
                      <span style={{ color: 'var(--foreground)' }}>{fmt(totalBusinessRetention + studioBusinessRetention)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>IN tax rate</span>
                      <span style={{ color: 'var(--foreground)' }}>3.05%</span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 font-bold" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--foreground)' }}>Estimated IN tax</span>
                      <span style={{ color: 'var(--accent)' }}>{fmt((totalBusinessRetention + studioBusinessRetention) * 0.0305)}</span>
                    </div>
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>Pass-through: each partner reports their share on personal IN return.</p>
                </div>

                <div className="card p-6">
                  <h4 className="font-bold mb-1" style={{ color: 'var(--foreground)' }}>Form 103</h4>
                  <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Business Personal Property — Due May 15</p>
                  <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--muted)' }}>
                      List all business equipment (cameras, computers, studio gear, furniture) with acquisition date and cost.
                      Property is assessed at a percentage of cost based on age.
                    </p>
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Connect Xero for automatic asset tracking</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>Fixed assets from Xero will auto-populate here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
