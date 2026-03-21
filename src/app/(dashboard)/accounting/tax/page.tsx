'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { FileText, DollarSign, AlertTriangle, CheckCircle, Calendar, Shield } from 'lucide-react'

const supabase = createSupabaseBrowserClient() as any
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

type Tab = 'sales_tax' | 'estimated' | 'annual' | '1099_tracker'

export default function TaxPage() {
  const [tab, setTab] = useState<Tab>('sales_tax')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Data
  const [salesTax, setSalesTax] = useState<any[]>([])
  const [estimatedTax, setEstimatedTax] = useState<any[]>([])
  const [annualTax, setAnnualTax] = useState<any[]>([])
  const [contractors, setContractors] = useState<any[]>([])
  const [contractorPayments, setContractorPayments] = useState<any[]>([])

  // Forms
  const [salesTaxForm, setSalesTaxForm] = useState({ period_label: '', period_start: '', period_end: '', total_beat_sales: 0, in_taxable_sales: 0, out_of_state_sales: 0, gross_retail_sales_in: '', taxable_sales: '', tax_rate: '7.00', sales_tax_due: '' })
  const [estTaxForm, setEstTaxForm] = useState({ quarter: 'Q1', tax_type: 'federal', partner_name: 'Jay', guaranteed_payments_ytd: '', ordinary_income_ytd: '', quarterly_payment_amount: '', payment_date: '', confirmation_number: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [stRes, etRes, atRes, cRes, cpRes] = await Promise.all([
      supabase.from('sales_tax_filings').select('*').order('period_start', { ascending: false }),
      supabase.from('estimated_tax_payments').select('*').eq('tax_year', selectedYear).order('quarter'),
      supabase.from('annual_tax_filings').select('*').eq('tax_year', selectedYear).order('form_type'),
      supabase.from('contractors').select('*').eq('active', true),
      supabase.from('contractor_payments').select('*').gte('payment_date', `${selectedYear}-01-01`).lte('payment_date', `${selectedYear}-12-31`),
    ])
    setSalesTax(stRes.data || [])
    setEstimatedTax(etRes.data || [])
    setAnnualTax(atRes.data || [])
    setContractors(cRes.data || [])
    setContractorPayments(cpRes.data || [])
    setLoading(false)
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  // Calculate 1099 data from contractor payments
  const contractorYTD = contractors.map(c => {
    const payments = contractorPayments.filter(p => p.contractor_id === c.id)
    const total = payments.reduce((s: number, p: any) => s + (p.gross_payment || 0), 0)
    return { ...c, ytd_total: total, needs_1099: total >= 2000, payment_count: payments.length }
  }).sort((a, b) => b.ytd_total - a.ytd_total)

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
  const contractors1099 = contractorYTD.filter(c => c.needs_1099).length

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-1">
        {([['sales_tax', 'Sales Tax (ST-103)'], ['estimated', 'Estimated Tax'], ['annual', 'Annual Filings'], ['1099_tracker', '1099 Tracker']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setShowForm(false) }} className={`tab ${tab === key ? 'tab-active' : ''}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-[var(--muted)]">Loading...</div> : (
        <>
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
                  <div><label className="label">Partner</label><select value={estTaxForm.partner_name} onChange={e => setEstTaxForm({...estTaxForm, partner_name: e.target.value})} className="input"><option value="Jay">Jay</option><option value="Cole">Cole</option></select></div>
                  <div><label className="label">GP YTD</label><input type="number" step="0.01" value={estTaxForm.guaranteed_payments_ytd} onChange={e => setEstTaxForm({...estTaxForm, guaranteed_payments_ytd: e.target.value})} className="input" /></div>
                  <div><label className="label">OI YTD</label><input type="number" step="0.01" value={estTaxForm.ordinary_income_ytd} onChange={e => setEstTaxForm({...estTaxForm, ordinary_income_ytd: e.target.value})} className="input" /></div>
                  <div><label className="label">Payment Amount</label><input type="number" step="0.01" value={estTaxForm.quarterly_payment_amount} onChange={e => setEstTaxForm({...estTaxForm, quarterly_payment_amount: e.target.value})} className="input" required /></div>
                  <div><label className="label">Payment Date</label><input type="date" value={estTaxForm.payment_date} onChange={e => setEstTaxForm({...estTaxForm, payment_date: e.target.value})} className="input" /></div>
                  <div className="flex items-end"><button type="submit" className="btn-primary btn w-full">Save</button></div>
                </form>
              )}
              {/* Jay and Cole sections */}
              {['Jay', 'Cole'].map(partner => {
                const partnerData = estimatedTax.filter(e => e.partner_name === partner)
                return (
                  <div key={partner} className="card p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>{partner}&apos;s Estimated Tax</h3>
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

          {/* 1099 Tracker Tab */}
          {tab === '1099_tracker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--muted)' }}>1099-NEC required for contractors paid ≥ $2,000 (2026 threshold per One Big Beautiful Bill Act)</p>
                <div className="flex items-center gap-2">
                  <span className="badge badge-danger">{contractors1099} require 1099</span>
                  <span className="badge badge-gray">{contractorYTD.filter(c => !c.needs_1099).length} below threshold</span>
                </div>
              </div>
              <div className="table-container">
                <table className="table w-full">
                  <thead><tr><th>Contractor</th><th>Type</th><th className="text-right">YTD Total</th><th className="text-right">Payments</th><th>W-9</th><th>IC Agreement</th><th>1099 Required</th></tr></thead>
                  <tbody>
                    {contractorYTD.length === 0 ? <tr><td colSpan={7} className="text-center text-[var(--muted)] py-8">No contractors found</td></tr> :
                      contractorYTD.map(c => (
                        <tr key={c.id} style={c.needs_1099 ? { backgroundColor: 'rgba(239, 68, 68, 0.05)' } : undefined}>
                          <td className="font-medium">{c.display_name}<br /><span className="text-xs" style={{ color: 'var(--muted)' }}>{c.legal_name}</span></td>
                          <td className="capitalize">{c.contractor_type.replace('_', ' ')}</td>
                          <td className="text-right font-medium">{fmt(c.ytd_total)}</td>
                          <td className="text-right">{c.payment_count}</td>
                          <td>{c.w9_on_file ? <CheckCircle className="h-4 w-4 text-[var(--success)]" /> : <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />}</td>
                          <td>{c.ic_agreement_on_file ? <CheckCircle className="h-4 w-4 text-[var(--success)]" /> : <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />}</td>
                          <td>{c.needs_1099 ? <span className="badge badge-danger">Required</span> : <span className="badge badge-gray">No</span>}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
