'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

const supabase = createSupabaseBrowserClient() as any
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

type Tab = 'pnl' | 'fund' | 'quarterly'

interface PnL {
  id: string; month: number; year: number; gross_receipts: number; returns_allowances: number;
  other_income: number; total_income: number; guaranteed_payments: number; contractor_payments: number;
  insurance: number; rent: number; professional_services: number; other_deductions: number;
  total_deductions: number; ordinary_income: number; status: string; reviewed_by: string | null; review_date: string | null;
}

interface Fund {
  id: string; period_start: string; period_end: string; period_type: string;
  inflow_media: number; inflow_studio: number; inflow_beats: number; total_inflows: number;
  total_outflows: number; balance_beginning: number; balance_ending: number; reserve_status: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function FinancialsPage() {
  const [tab, setTab] = useState<Tab>('pnl')
  const [pnls, setPnls] = useState<PnL[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // PnL form
  const [pnlForm, setPnlForm] = useState({ month: new Date().getMonth() + 1, year: selectedYear, gross_receipts: '', returns_allowances: '0', other_income: '0', guaranteed_payments: '', contractor_payments: '', insurance: '', rent: '', professional_services: '', other_deductions: '0' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [pnlRes, fundRes] = await Promise.all([
      supabase.from('monthly_pnl').select('*').eq('year', selectedYear).order('month'),
      supabase.from('business_fund').select('*').order('period_start', { ascending: false }).limit(12),
    ])
    setPnls(pnlRes.data || [])
    setFunds(fundRes.data || [])
    setLoading(false)
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePnlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const gross = parseFloat(pnlForm.gross_receipts) || 0
    const ret = parseFloat(pnlForm.returns_allowances) || 0
    const other = parseFloat(pnlForm.other_income) || 0
    const gp = parseFloat(pnlForm.guaranteed_payments) || 0
    const cp = parseFloat(pnlForm.contractor_payments) || 0
    const ins = parseFloat(pnlForm.insurance) || 0
    const rn = parseFloat(pnlForm.rent) || 0
    const ps = parseFloat(pnlForm.professional_services) || 0
    const od = parseFloat(pnlForm.other_deductions) || 0
    const totalIncome = gross - ret + other
    const totalDeductions = gp + cp + ins + rn + ps + od
    await supabase.from('monthly_pnl').upsert({
      month: pnlForm.month, year: pnlForm.year,
      gross_receipts: gross, returns_allowances: ret, other_income: other,
      total_income: totalIncome, guaranteed_payments: gp, contractor_payments: cp,
      insurance: ins, rent: rn, professional_services: ps, other_deductions: od,
      total_deductions: totalDeductions, ordinary_income: totalIncome - totalDeductions,
    }, { onConflict: 'month,year' })
    setShowForm(false)
    fetchData()
  }

  const ytdIncome = pnls.reduce((s, p) => s + (p.total_income || 0), 0)
  const ytdDeductions = pnls.reduce((s, p) => s + (p.total_deductions || 0), 0)
  const ytdProfit = pnls.reduce((s, p) => s + (p.ordinary_income || 0), 0)
  const latestFund = funds[0]

  return (
    <div className="p-6 space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Financial Statements</h1>
          <p className="page-description">P&L statements, business fund tracking, and quarterly reviews</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="input w-32">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><TrendingUp className="h-4 w-4 text-[var(--success)]" /> YTD Revenue</div>
          <div className="stat-card-value">{fmt(ytdIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><TrendingDown className="h-4 w-4 text-[var(--danger)]" /> YTD Deductions</div>
          <div className="stat-card-value">{fmt(ytdDeductions)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><DollarSign className="h-4 w-4 text-[var(--accent)]" /> YTD Profit</div>
          <div className="stat-card-value" style={{ color: ytdProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(ytdProfit)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 stat-card-title"><DollarSign className="h-4 w-4 text-[var(--info)]" /> Fund Balance</div>
          <div className="stat-card-value">{latestFund ? fmt(latestFund.balance_ending) : '$0.00'}</div>
          {latestFund && <span className={`badge mt-2 ${latestFund.reserve_status === 'healthy' ? 'badge-success' : latestFund.reserve_status === 'at_risk' ? 'badge-warning' : 'badge-danger'}`}>{latestFund.reserve_status}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-1">
        {([['pnl', 'Monthly P&L'], ['fund', 'Business Fund'], ['quarterly', 'Quarterly Review']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`tab ${tab === key ? 'tab-active' : ''}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-[var(--muted)]">Loading...</div> : (
        <>
          {/* Monthly P&L Tab */}
          {tab === 'pnl' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)} className="btn-primary btn">{showForm ? 'Cancel' : 'Add/Update Month'}</button>
              </div>
              {showForm && (
                <form onSubmit={handlePnlSubmit} className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="label">Month</label><select value={pnlForm.month} onChange={e => setPnlForm({...pnlForm, month: parseInt(e.target.value)})} className="input">{MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}</select></div>
                  <div><label className="label">Year</label><input type="number" value={pnlForm.year} onChange={e => setPnlForm({...pnlForm, year: parseInt(e.target.value)})} className="input" /></div>
                  <div><label className="label">Gross Receipts</label><input type="number" step="0.01" value={pnlForm.gross_receipts} onChange={e => setPnlForm({...pnlForm, gross_receipts: e.target.value})} className="input" required /></div>
                  <div><label className="label">Returns/Allowances</label><input type="number" step="0.01" value={pnlForm.returns_allowances} onChange={e => setPnlForm({...pnlForm, returns_allowances: e.target.value})} className="input" /></div>
                  <div><label className="label">Other Income</label><input type="number" step="0.01" value={pnlForm.other_income} onChange={e => setPnlForm({...pnlForm, other_income: e.target.value})} className="input" /></div>
                  <div><label className="label">Guaranteed Payments</label><input type="number" step="0.01" value={pnlForm.guaranteed_payments} onChange={e => setPnlForm({...pnlForm, guaranteed_payments: e.target.value})} className="input" required /></div>
                  <div><label className="label">Contractor Payments</label><input type="number" step="0.01" value={pnlForm.contractor_payments} onChange={e => setPnlForm({...pnlForm, contractor_payments: e.target.value})} className="input" required /></div>
                  <div><label className="label">Insurance</label><input type="number" step="0.01" value={pnlForm.insurance} onChange={e => setPnlForm({...pnlForm, insurance: e.target.value})} className="input" /></div>
                  <div><label className="label">Rent</label><input type="number" step="0.01" value={pnlForm.rent} onChange={e => setPnlForm({...pnlForm, rent: e.target.value})} className="input" /></div>
                  <div><label className="label">Professional Services</label><input type="number" step="0.01" value={pnlForm.professional_services} onChange={e => setPnlForm({...pnlForm, professional_services: e.target.value})} className="input" /></div>
                  <div><label className="label">Other Deductions</label><input type="number" step="0.01" value={pnlForm.other_deductions} onChange={e => setPnlForm({...pnlForm, other_deductions: e.target.value})} className="input" /></div>
                  <div className="flex items-end"><button type="submit" className="btn-primary btn w-full">Save P&L</button></div>
                </form>
              )}
              <div className="table-container">
                <table className="table w-full">
                  <thead><tr>
                    <th>Month</th><th className="text-right">Revenue</th><th className="text-right">Deductions</th><th className="text-right">Net Income</th><th className="text-right">Margin</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {pnls.length === 0 ? <tr><td colSpan={6} className="text-center text-[var(--muted)] py-8">No P&L statements for {selectedYear}</td></tr> :
                      pnls.map(p => (
                        <tr key={p.id}>
                          <td className="font-medium">{MONTHS[p.month - 1]} {p.year}</td>
                          <td className="text-right">{fmt(p.total_income)}</td>
                          <td className="text-right">{fmt(p.total_deductions)}</td>
                          <td className="text-right" style={{ color: p.ordinary_income >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(p.ordinary_income)}</td>
                          <td className="text-right">{p.total_income > 0 ? ((p.ordinary_income / p.total_income) * 100).toFixed(1) + '%' : '—'}</td>
                          <td><span className={`badge ${p.status === 'finalized' ? 'badge-success' : p.status === 'reviewed' ? 'badge-info' : 'badge-gray'}`}>{p.status}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                  {pnls.length > 0 && (
                    <tfoot>
                      <tr style={{ backgroundColor: 'var(--surface)' }}>
                        <td className="font-bold">YTD Total</td>
                        <td className="text-right font-bold">{fmt(ytdIncome)}</td>
                        <td className="text-right font-bold">{fmt(ytdDeductions)}</td>
                        <td className="text-right font-bold" style={{ color: ytdProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(ytdProfit)}</td>
                        <td className="text-right font-bold">{ytdIncome > 0 ? ((ytdProfit / ytdIncome) * 100).toFixed(1) + '%' : '—'}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Business Fund Tab */}
          {tab === 'fund' && (
            <div className="space-y-4">
              <div className="table-container">
                <table className="table w-full">
                  <thead><tr>
                    <th>Period</th><th className="text-right">Inflows</th><th className="text-right">Outflows</th><th className="text-right">Net</th><th className="text-right">Balance</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {funds.length === 0 ? <tr><td colSpan={6} className="text-center text-[var(--muted)] py-8">No fund records yet</td></tr> :
                      funds.map(f => (
                        <tr key={f.id}>
                          <td className="font-medium">{new Date(f.period_start).toLocaleDateString()} – {new Date(f.period_end).toLocaleDateString()}</td>
                          <td className="text-right text-[var(--success)]">{fmt(f.total_inflows)}</td>
                          <td className="text-right text-[var(--danger)]">{fmt(f.total_outflows)}</td>
                          <td className="text-right" style={{ color: (f.total_inflows - f.total_outflows) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(f.total_inflows - f.total_outflows)}</td>
                          <td className="text-right font-medium">{fmt(f.balance_ending)}</td>
                          <td><span className={`badge ${f.reserve_status === 'healthy' ? 'badge-success' : f.reserve_status === 'at_risk' ? 'badge-warning' : 'badge-danger'}`}>{f.reserve_status}</span></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quarterly Review Tab */}
          {tab === 'quarterly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(q => {
                const qMonths = [(q-1)*3+1, (q-1)*3+2, (q-1)*3+3]
                const qPnls = pnls.filter(p => qMonths.includes(p.month))
                const qRevenue = qPnls.reduce((s,p) => s + p.total_income, 0)
                const qDeductions = qPnls.reduce((s,p) => s + p.total_deductions, 0)
                const qProfit = qPnls.reduce((s,p) => s + p.ordinary_income, 0)
                const complete = qPnls.length === 3
                return (
                  <div key={q} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Q{q} {selectedYear}</h3>
                      <span className={`badge ${complete ? 'badge-success' : qPnls.length > 0 ? 'badge-warning' : 'badge-gray'}`}>
                        {complete ? 'Complete' : qPnls.length > 0 ? `${qPnls.length}/3 months` : 'No data'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted)' }}>Revenue</span><span style={{ color: 'var(--success)' }}>{fmt(qRevenue)}</span></div>
                      <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted)' }}>Deductions</span><span style={{ color: 'var(--danger)' }}>{fmt(qDeductions)}</span></div>
                      <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />
                      <div className="flex justify-between text-sm font-bold"><span>Net Income</span><span style={{ color: qProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(qProfit)}</span></div>
                      {qRevenue > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted)' }}>Margin</span><span>{((qProfit / qRevenue) * 100).toFixed(1)}%</span></div>}
                    </div>
                    {qPnls.length > 0 && (
                      <div className="mt-4 space-y-1">
                        {qPnls.map(p => (
                          <div key={p.id} className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
                            <span>{MONTHS[p.month-1]}</span>
                            <span style={{ color: p.ordinary_income >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(p.ordinary_income)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
