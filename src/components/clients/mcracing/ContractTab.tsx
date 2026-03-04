'use client'

import { useState, useEffect, useMemo } from 'react'
import { Lock, Shield, FileSignature, DollarSign, Calculator, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { calculateMonthlyFee, getTierRatesForBaseline } from '@/lib/calculations/feeCalculator'
import { getRevenueEntries, getMonthlyExpenses } from '@/lib/services/mcRacingService'
import type { RevenueEntry, MonthlyExpense } from '@/lib/supabase/types'

const STORAGE_KEY = 'mcracing-contract-finalized'
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ─── Contract Terms Interface ───────────────────────────────────────────────

interface ContractTerms {
  clientOwner: string
  effectiveMonth: number
  effectiveYear: number
  contractLength: number
  trailingPeriod: number
  monthlyBaseline: number
  seasonalAdjustment: boolean
  minimumMonthlyFee: number
  foundationFeeDeferred: boolean
  finalizedDate: string
}

const DEFAULT_TERMS: Omit<ContractTerms, 'finalizedDate'> = {
  clientOwner: 'Mark',
  effectiveMonth: 3,
  effectiveYear: 2026,
  contractLength: 12,
  trailingPeriod: 3,
  monthlyBaseline: 4000,
  seasonalAdjustment: false,
  minimumMonthlyFee: 250,
  foundationFeeDeferred: true,
}

interface MonthLedgerRow {
  month: number; year: number; label: string; revenue: number; expenses: number
  baseline: number; uplift: number; growthFee: number; minimumApplied: boolean
  totalFee: number; netToClient: number; sweetDreamsEarns: number
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ContractTab() {
  const [finalized, setFinalized] = useState<ContractTerms | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  const [ledgerRows, setLedgerRows] = useState<MonthLedgerRow[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { setFinalized(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (!finalized) return
    loadLedger(finalized)
  }, [finalized])

  async function loadLedger(t: ContractTerms) {
    setLedgerLoading(true)
    const rows: MonthLedgerRow[] = []
    const now = new Date()
    const curMonth = now.getMonth() + 1
    const curYear = now.getFullYear()

    for (let i = 0; i < t.contractLength; i++) {
      const m = ((t.effectiveMonth - 1 + i) % 12) + 1
      const y = t.effectiveYear + Math.floor((t.effectiveMonth - 1 + i) / 12)
      const isFuture = y > curYear || (y === curYear && m > curMonth)

      if (isFuture) {
        rows.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}`, revenue: 0, expenses: 0, baseline: t.monthlyBaseline, uplift: 0, growthFee: 0, minimumApplied: false, totalFee: 0, netToClient: 0, sweetDreamsEarns: 0 })
        continue
      }

      try {
        const [revs, exps] = await Promise.all([getRevenueEntries(y, m), getMonthlyExpenses(y, m)])
        const revenue = revs.reduce((s: number, e: RevenueEntry) => s + Number(e.amount), 0)
        const expenses = exps.reduce((s: number, e: MonthlyExpense) => s + Number(e.amount), 0)
        const fee = calculateMonthlyFee(t.monthlyBaseline, revenue, { isYear1: true })
        const actualFee = Math.max(fee.grossMonthlyFee, t.minimumMonthlyFee)
        const minimumApplied = fee.grossMonthlyFee < t.minimumMonthlyFee && revenue > 0
        rows.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}`, revenue, expenses, baseline: t.monthlyBaseline, uplift: fee.upliftAmount, growthFee: fee.growthFee, minimumApplied, totalFee: revenue > 0 ? actualFee : 0, netToClient: revenue > 0 ? revenue - actualFee : 0, sweetDreamsEarns: revenue > 0 ? actualFee : 0 })
      } catch {
        rows.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}`, revenue: 0, expenses: 0, baseline: t.monthlyBaseline, uplift: 0, growthFee: 0, minimumApplied: false, totalFee: 0, netToClient: 0, sweetDreamsEarns: 0 })
      }
    }
    setLedgerRows(rows)
    setLedgerLoading(false)
  }

  const handleFinalize = () => {
    const full: ContractTerms = { ...terms, finalizedDate: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full))
    setFinalized(full)
    setShowConfirm(false)
  }

  const handleUnlock = () => { localStorage.removeItem(STORAGE_KEY); setFinalized(null) }

  if (finalized) {
    return <PostFinalizationView terms={finalized} rows={ledgerRows} loading={ledgerLoading} onUnlock={handleUnlock} />
  }

  return <PreFinalizationView terms={terms} setTerms={setTerms} showConfirm={showConfirm} setShowConfirm={setShowConfirm} onFinalize={handleFinalize} />
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`

function Section({ id, title, expanded, onToggle, children, badge }: {
  id: string; title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode; badge?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">{id}</span>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge && <span className="text-xs bg-mcracing-100 text-mcracing-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {expanded && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>{children}</div>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
}

// ─── PRE-FINALIZATION ───────────────────────────────────────────────────────

function PreFinalizationView({
  terms, setTerms, showConfirm, setShowConfirm, onFinalize,
}: {
  terms: Omit<ContractTerms, 'finalizedDate'>
  setTerms: (t: Omit<ContractTerms, 'finalizedDate'>) => void
  showConfirm: boolean; setShowConfirm: (v: boolean) => void; onFinalize: () => void
}) {
  const [expanded, setExpanded] = useState<string | null>('header')
  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)
  const update = (patch: Partial<typeof terms>) => setTerms({ ...terms, ...patch })

  const tierRates = useMemo(() => getTierRatesForBaseline(terms.monthlyBaseline, true), [terms.monthlyBaseline])
  const annualBaseline = terms.monthlyBaseline * 12

  const feePreview = useMemo(() => {
    return [terms.monthlyBaseline, terms.monthlyBaseline * 1.5, terms.monthlyBaseline * 2, terms.monthlyBaseline * 3, terms.monthlyBaseline * 4].map(rev => {
      const r = calculateMonthlyFee(terms.monthlyBaseline, rev, { isYear1: true })
      const actual = Math.max(r.grossMonthlyFee, terms.minimumMonthlyFee)
      const minApplied = r.grossMonthlyFee < terms.minimumMonthlyFee
      return { revenue: rev, uplift: r.upliftAmount, growthFee: r.growthFee, actualFee: actual, minApplied, netToClient: rev - actual, keepPct: ((rev - actual) / rev * 100) }
    })
  }, [terms.monthlyBaseline, terms.minimumMonthlyFee])

  const buyoutPreview = useMemo(() => {
    const avgFee = terms.minimumMonthlyFee
    return [
      { label: 'Less than 3 months', multiplier: 1, buyout: avgFee * 1 },
      { label: '3 – 6 months', multiplier: 2, buyout: avgFee * 2 },
      { label: '6 – 12 months', multiplier: 4, buyout: avgFee * 4 },
      { label: '12 – 24 months', multiplier: 6, buyout: avgFee * 6 },
      { label: '24+ months', multiplier: 10, buyout: avgFee * 10 },
    ]
  }, [terms.minimumMonthlyFee])

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-mcracing-500 focus:border-mcracing-500"
  const selectClass = inputClass

  return (
    <div className="space-y-3">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <FileSignature className="h-5 w-5 text-amber-700 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">GRAND SLAM Growth Partnership Agreement — Draft for Review</h3>
          <p className="text-xs text-amber-600">This document is a working draft. Both parties will review, negotiate, and finalize all terms before execution.</p>
        </div>
      </div>

      {/* Contract Header */}
      <Section id="§" title="Contract Header" expanded={expanded === 'header'} onToggle={() => toggle('header')} badge="Configure">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Provider">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-gray-900">Sweet Dreams US LLC</div>
          </Field>
          <Field label="Client">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-gray-900">MC Sim Racing & RC Lounge</div>
          </Field>
          <Field label="Client Owner">
            <input type="text" value={terms.clientOwner} onChange={e => update({ clientOwner: e.target.value })} className={inputClass} placeholder="Mark" />
          </Field>
          <Field label="Effective Date">
            <div className="flex gap-2">
              <select value={terms.effectiveMonth} onChange={e => update({ effectiveMonth: Number(e.target.value) })} className={selectClass}>
                {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={terms.effectiveYear} onChange={e => update({ effectiveYear: Number(e.target.value) })} className={selectClass}>
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Contract Term">
            <select value={terms.contractLength} onChange={e => update({ contractLength: Number(e.target.value) })} className={selectClass}>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </Field>
          <Field label="Document Version">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">1.1 — Draft for Review</div>
          </Field>
        </div>
      </Section>

      {/* Section 1: Definitions */}
      <Section id="§1" title="Definitions" expanded={expanded === 's1'} onToggle={() => toggle('s1')}>
        <P><strong>&ldquo;Provider&rdquo;</strong> — Sweet Dreams US LLC, a media production and growth marketing company based in Fort Wayne, Indiana.</P>
        <P><strong>&ldquo;Client&rdquo;</strong> — MC Sim Racing & RC Lounge, a racing simulator entertainment business based in Fort Wayne, Indiana.</P>
        <P><strong>&ldquo;Baseline Revenue&rdquo;</strong> — The trailing average monthly gross revenue of the Client prior to the Effective Date, established through verified financial records. Used as the benchmark against which growth is measured.</P>
        <P><strong>&ldquo;Growth&rdquo;</strong> — The percentage increase in the Client&rsquo;s monthly gross revenue compared to the Baseline Revenue. Growth describes the rate of change. For example, if the Baseline is $5,000 and the Client&rsquo;s revenue reaches $7,000, Growth is 40%.</P>
        <P><strong>&ldquo;Uplift&rdquo;</strong> — The dollar amount of revenue above the Baseline Revenue in any given month. Uplift is the actual money that Growth Fee calculations are applied to. In the example above, the Uplift is $2,000. Growth is the percentage; Uplift is the dollars.</P>
        <P><strong>&ldquo;Foundation Fee&rdquo;</strong> — An annual minimum commitment fee paid by the Client, calculated as a percentage of the annual Baseline Revenue. Deferred to Year 2 for this Agreement.</P>
        <P><strong>&ldquo;Growth Fee&rdquo;</strong> — A monthly performance fee paid by the Client, calculated as tiered percentages of the monthly Uplift. Rates decrease as growth tiers increase, rewarding early wins at a higher rate while keeping fees fair at scale.</P>
        <P><strong>&ldquo;Sustaining Fee&rdquo;</strong> — A monthly fee that activates in Year 2 and beyond. When the Baseline resets upward at renewal, this fee ensures the Provider&rsquo;s income does not drop below the average earned in the prior year. It protects the Provider from losing income on growth they already created. This is separate from the Minimum Monthly Fee.</P>
        <P><strong>&ldquo;Minimum Monthly Fee&rdquo;</strong> — The floor amount the Client pays each month during Year 1 regardless of Growth Fee calculation. This protects the Provider from earning near-zero during months of slow growth while actively delivering services. If the Growth Fee exceeds this amount, the Client pays the Growth Fee instead. This is separate from the Sustaining Fee.</P>
        <P><strong>&ldquo;Baseline Reset&rdquo;</strong> — The recalculation of Baseline Revenue at contract renewal, adjusted upward to reflect growth achieved during the prior contract term.</P>
        <P><strong>&ldquo;Buyout Fee&rdquo;</strong> — A termination payment owed by the Client if they exit the contract and wish to retain systems, assets, and intellectual property created by the Provider.</P>
        <P><strong>&ldquo;Service Pillars&rdquo;</strong> — The six categories of work the Provider delivers under this agreement: Content Engine, Brand Assets, Social Management, Web Development, Offer Refinement, and Fluid Communication.</P>
        <P><strong>&ldquo;Decision Meeting&rdquo;</strong> — A formal meeting between both parties to review performance data, discuss strategy, and make decisions about the partnership.</P>
        <P><strong>&ldquo;Nightmares Webapp&rdquo;</strong> — The Provider&rsquo;s proprietary business management dashboard built for the Client, which includes contract details, accounting tracking, offer refinement tools, social analytics, and full business optimization data. This system remains the intellectual property of the Provider at all times.</P>
      </Section>

      {/* Section 2: Partnership Overview */}
      <Section id="§2" title="Partnership Overview" expanded={expanded === 's2'} onToggle={() => toggle('s2')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">2.1 Purpose</h4>
        <P>This Agreement establishes a performance-based growth partnership between Sweet Dreams US LLC and MC Sim Racing & RC Lounge. Unlike traditional agency retainers where the agency earns the same fee regardless of results, this partnership ties the Provider&rsquo;s compensation directly to the Client&rsquo;s revenue growth. Both parties share the risk and the reward.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">2.2 Core Philosophy</h4>
        <P>The Provider only earns meaningfully when the Client grows. If the Provider does not move the needle, the Provider does not get paid beyond the Minimum Monthly Fee. This alignment of incentives ensures both parties are working toward the same goal: sustainable, measurable revenue growth for the Client.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">2.3 Term</h4>
        <P>This Agreement shall be effective for <strong>{terms.contractLength}</strong> months beginning on the Effective Date ({FULL_MONTHS[terms.effectiveMonth - 1]} {terms.effectiveYear}). The contract may be renewed, renegotiated, or terminated at the end of the term subject to the renewal and termination provisions outlined in this Agreement.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">2.4 Client Classification</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700 w-1/3">Business Size Tier</td><td className="px-3 py-2">Micro (Under $10,000/month)</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Estimated Monthly Baseline</td><td className="px-3 py-2">{fmt(terms.monthlyBaseline)} /month (to be verified)</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Estimated Annual Baseline</td><td className="px-3 py-2">{fmt(annualBaseline)} /year</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Industry</td><td className="px-3 py-2">Entertainment / Racing Simulation</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Market Position</td><td className="px-3 py-2">Only racing simulator venue in Fort Wayne</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Competitive Landscape</td><td className="px-3 py-2">Zero direct competitors in market</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Section 3: Baseline Revenue Determination */}
      <Section id="§3" title="Baseline Revenue Determination" expanded={expanded === 's3'} onToggle={() => toggle('s3')} badge="Configure">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">3.1 Method</h4>
        <P>The Baseline Revenue shall be determined by calculating the trailing average of the Client&rsquo;s monthly gross revenue for the most recent period available prior to the Effective Date. Both parties must agree on the final Baseline figure before this Agreement becomes binding.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">3.2 Verification Requirements</h4>
        <P>The Client shall provide the following documentation to establish the Baseline:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Business bank account statements for the trailing period</li>
          <li>Swipe Simple transaction history and reports</li>
          <li>Booking platform records (if applicable)</li>
          <li>Any additional financial records mutually agreed upon</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">3.3 Seasonal Adjustments</h4>
        <P>Both parties acknowledge that the Client&rsquo;s business may experience seasonal fluctuations. The Baseline may incorporate seasonal adjustment factors if both parties agree that the trailing average does not accurately represent normal operations. Any seasonal adjustments must be documented in Exhibit A attached to this Agreement.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">3.4 Agreed Baseline</h4>
        <div className="bg-mcracing-50 rounded-xl p-4 border border-mcracing-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Trailing Period Used">
              <select value={terms.trailingPeriod} onChange={e => update({ trailingPeriod: Number(e.target.value) })} className={selectClass}>
                <option value={1}>1 month</option>
                <option value={2}>2 months</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </Field>
            <Field label="Monthly Baseline Revenue">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                <input type="number" value={terms.monthlyBaseline} onChange={e => update({ monthlyBaseline: Number(e.target.value) })} className={`${inputClass} pl-7`} min={0} step={500} />
              </div>
            </Field>
            <Field label="Annual Baseline Revenue">
              <div className="bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-900 border border-gray-200">{fmt(annualBaseline)}</div>
            </Field>
            <Field label="Seasonal Adjustment Applied?">
              <select value={terms.seasonalAdjustment ? 'yes' : 'no'} onChange={e => update({ seasonalAdjustment: e.target.value === 'yes' })} className={selectClass}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* Section 4: Fee Structure */}
      <Section id="§4" title="Fee Structure" expanded={expanded === 's4'} onToggle={() => toggle('s4')} badge="Configure">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">4.1 Foundation Fee</h4>
        <P>The Foundation Fee is an annual minimum commitment based on the Client&rsquo;s Baseline Revenue. It represents the Client&rsquo;s investment in the partnership and covers the Provider&rsquo;s cost of entry.</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700 w-1/3">Rate</td><td className="px-3 py-2">Determined by size tier (see Grand Slam Tracker)</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Payment Options</td><td className="px-3 py-2">Annual lump sum OR quarterly installments</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Year 1</td><td className="px-3 py-2 text-green-700 font-medium">Deferred — no Foundation Fee in Year 1</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Year 2+</td><td className="px-3 py-2">Calculated on the new Baseline at renewal</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Due Date (Year 2+)</td><td className="px-3 py-2">First payment due on or before the renewal date</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">4.2 Minimum Monthly Fee</h4>
        <P>Because the Client falls within the Micro tier, a Minimum Monthly Fee is required to ensure the partnership remains economically viable for the Provider. This fee functions as a floor during Year 1.</P>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4">
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border border-amber-200 rounded-lg overflow-hidden">
              <tbody className="divide-y divide-amber-200">
                <tr><td className="px-3 py-2 bg-amber-100/50 font-medium text-gray-700 w-1/3">Minimum Monthly Fee</td><td className="px-3 py-2">{fmt(terms.minimumMonthlyFee)} per month</td></tr>
                <tr><td className="px-3 py-2 bg-amber-100/50 font-medium text-gray-700">How It Works</td><td className="px-3 py-2">If Growth Fee &lt; {fmt(terms.minimumMonthlyFee)}, Client pays {fmt(terms.minimumMonthlyFee)}. If Growth Fee &gt; {fmt(terms.minimumMonthlyFee)}, Client pays the Growth Fee. The higher of the two amounts applies each month.</td></tr>
                <tr><td className="px-3 py-2 bg-amber-100/50 font-medium text-gray-700">Due Date</td><td className="px-3 py-2">Due by the 15th of the following month</td></tr>
              </tbody>
            </table>
          </div>
          <Field label="Adjust Minimum Monthly Fee">
            <div className="relative w-48">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
              <input type="number" value={terms.minimumMonthlyFee} onChange={e => update({ minimumMonthlyFee: Number(e.target.value) })} className={`${inputClass} pl-7`} min={0} step={50} />
            </div>
          </Field>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">4.3 Growth Fee</h4>
        <P>The Growth Fee is a monthly performance fee calculated on the Uplift (the dollar amount of revenue above the Baseline). Growth is broken into tiers. Rates are highest at the first tier and decrease as growth scales upward — this rewards early wins at a premium rate while keeping fees proportional as the Client reaches higher revenue levels.</P>
        <P>Specific tier rates are maintained in the Grand Slam Tracker application and are agreed upon by both parties at the time of contract execution.</P>
        <P><strong>Rate Structure:</strong> Tier 1 carries the highest percentage. Each subsequent tier decreases. This means the Provider earns the most on the first wave of growth (the hardest lift), and progressively less as revenue compounds higher (where the Client is keeping more and more of the upside). Exact percentages are documented in the Grand Slam Tracker and acknowledged by both parties in Exhibit B.</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Growth Tier</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Uplift Range</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">$ Range (at {fmt(terms.monthlyBaseline)})</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tierRates.tiers.slice(0, 5).map(tier => (
                <tr key={tier.tierNumber}>
                  <td className="px-3 py-2 font-medium text-gray-900">Tier {tier.tierNumber}</td>
                  <td className="px-3 py-2 text-gray-600">{tier.label} above baseline</td>
                  <td className="px-3 py-2 text-right text-gray-500">{fmt(terms.monthlyBaseline + Math.round(tier.growthFloor * terms.monthlyBaseline))} – {fmt(terms.monthlyBaseline + Math.round(Math.min(tier.growthCeiling, 5) * terms.monthlyBaseline))}</td>
                  <td className="px-3 py-2 text-right font-medium text-mcracing-600">{(tier.feeRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">4.4 Sustaining Fee (Year 2+)</h4>
        <P>The Sustaining Fee activates only upon contract renewal when the Baseline resets upward. It protects the Provider&rsquo;s earned income by ensuring that growth created in Year 1 does not simply become the new &ldquo;free&rdquo; baseline.</P>
        <P><strong>How it differs from the Minimum Monthly Fee:</strong> The Minimum Monthly Fee is a flat {fmt(terms.minimumMonthlyFee)} floor in Year 1 to protect against low-growth months. The Sustaining Fee is a calculated floor in Year 2+ that preserves the Provider&rsquo;s average Year 1 earnings after the Baseline moves up.</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700 w-1/3">Activates</td><td className="px-3 py-2">Year 2 and beyond only</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Formula</td><td className="px-3 py-2">Year 1 Avg Monthly Fee - (New Foundation Fee / 12)</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Revenue Cap</td><td className="px-3 py-2">Sustaining Fee cannot exceed 15% of current month revenue</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Baseline Pause</td><td className="px-3 py-2">Sustaining Fee = $0 if revenue falls below baseline for 2+ consecutive months</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Direction</td><td className="px-3 py-2">Can only increase at subsequent renewals, never decrease</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">4.5 Fee Summary</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Fee Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">When</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">How Calculated</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Year 1?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2 font-medium">Foundation Fee</td><td className="px-3 py-2">Annual/Quarterly</td><td className="px-3 py-2">% of Annual Baseline</td><td className="px-3 py-2 text-center text-green-600 font-medium">No (Deferred)</td></tr>
              <tr><td className="px-3 py-2 font-medium">Minimum Monthly</td><td className="px-3 py-2">Monthly</td><td className="px-3 py-2">{fmt(terms.minimumMonthlyFee)} floor</td><td className="px-3 py-2 text-center font-medium">Yes</td></tr>
              <tr><td className="px-3 py-2 font-medium">Growth Fee</td><td className="px-3 py-2">Monthly</td><td className="px-3 py-2">Tiered % of Uplift (decreasing rates)</td><td className="px-3 py-2 text-center font-medium">Yes</td></tr>
              <tr><td className="px-3 py-2 font-medium">Sustaining Fee</td><td className="px-3 py-2">Monthly</td><td className="px-3 py-2">Protects prior year income</td><td className="px-3 py-2 text-center text-green-600 font-medium">No (Year 2+)</td></tr>
            </tbody>
          </table>
        </div>

        {/* Fee Calculator Preview */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-mcracing-600" />
            <h4 className="text-sm font-semibold text-gray-900">Fee Preview at {fmt(terms.monthlyBaseline)} Baseline</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white">
                <tr>
                  <th className="text-left px-3 py-1.5 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-3 py-1.5 font-medium text-gray-500">Uplift</th>
                  <th className="text-right px-3 py-1.5 font-medium text-gray-500">Growth Fee</th>
                  <th className="text-right px-3 py-1.5 font-medium text-gray-500">You Pay</th>
                  <th className="text-right px-3 py-1.5 font-medium text-gray-500">You Keep</th>
                  <th className="text-right px-3 py-1.5 font-medium text-gray-500">Keep %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feePreview.map(row => (
                  <tr key={row.revenue}>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{fmt(row.revenue)}</td>
                    <td className="px-3 py-1.5 text-right text-green-600">{fmt(row.uplift)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500">{fmt(row.growthFee)}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-mcracing-600">{fmt(row.actualFee)}{row.minApplied && <span className="text-amber-500 ml-1">*</span>}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-gray-900">{fmt(row.netToClient)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500">{row.keepPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-amber-600 mt-1">* Minimum monthly fee of {fmt(terms.minimumMonthlyFee)} applied</p>
          </div>
        </div>
      </Section>

      {/* Section 5: Revenue Reporting & Payment */}
      <Section id="§5" title="Revenue Reporting & Payment" expanded={expanded === 's5'} onToggle={() => toggle('s5')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">5.1 Revenue Transparency</h4>
        <P>The Client agrees to provide full transparency into monthly gross revenue figures. This is the foundation of the performance-based model. Without accurate revenue data, fees cannot be calculated and the partnership cannot function.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">5.2 Reporting & Tracking Requirements</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-2">
          <li>The Provider shall be granted access to the Client&rsquo;s Swipe Simple account for real-time transaction monitoring and revenue verification.</li>
          <li>All accounting transactions — both positive (revenue) and negative (expenses, refunds) — must be recorded into the Nightmares webapp by the Client or the Provider on an ongoing basis.</li>
          <li>The Nightmares webapp contains built-in tracking that automatically feeds accounting records into the contract fee calculator. This is the authoritative source for monthly fee determination.</li>
          <li>The Client shall ensure all transactions are entered accurately and promptly. Failure to maintain accounting records in the Nightmares webapp may result in delayed fee calculations and billing adjustments.</li>
          <li>Revenue from gift cards is recognized when redeemed, not when purchased.</li>
          <li>Revenue from memberships is recognized on the billing date.</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">5.3 Payment Schedule</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Payment</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Due Date</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2">Foundation Fee (Year 2+, if annual)</td><td className="px-3 py-2">On or before renewal date</td><td className="px-3 py-2">Invoice / ACH / Check</td></tr>
              <tr><td className="px-3 py-2">Foundation Fee (Year 2+, if quarterly)</td><td className="px-3 py-2">1st of each quarter</td><td className="px-3 py-2">Invoice / ACH / Check</td></tr>
              <tr><td className="px-3 py-2">Monthly Fee (Minimum or Growth)</td><td className="px-3 py-2">15th of following month</td><td className="px-3 py-2">Invoice / ACH / Check</td></tr>
              <tr><td className="px-3 py-2">Buyout Fee (if applicable)</td><td className="px-3 py-2">Within 30 days of termination</td><td className="px-3 py-2">Invoice / ACH / Check</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">5.4 Late Payment</h4>
        <P>Payments not received within fifteen (15) days of the due date shall incur a late fee of 5% of the outstanding amount. Payments not received within thirty (30) days constitute a material breach of this Agreement and may trigger termination under Section 10.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">5.5 Disputes</h4>
        <P>If the Client disputes any fee calculation, the Client must notify the Provider in writing within ten (10) business days of receiving the invoice. Both parties agree to review the calculation together using the Nightmares webapp data and resolve the dispute within fifteen (15) business days. Undisputed portions remain due on the original schedule.</P>
      </Section>

      {/* Section 6: Scope of Services */}
      <Section id="§6" title="Scope of Services" expanded={expanded === 's6'} onToggle={() => toggle('s6')}>
        <P>The Provider shall deliver services across six core pillars. These pillars represent the full scope of marketing, media, and growth infrastructure that the Provider will build and manage for the Client.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.1 Content Engine</h4>
        <P>Unlimited video and photo content production, distributed daily across all relevant platforms. Includes short-form reels, stories, testimonials, behind-the-scenes footage, event coverage, and promotional content. Content is produced and posted by the Provider without requiring Client approval on individual posts, though the Client may request content direction at any time.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.2 Brand Assets</h4>
        <P>Foundational brand media including a business trailer, founder story video, and premium photography that positions the Client as the premier racing entertainment destination in the market. These assets are used across all marketing channels and serve as long-term conversion tools.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.3 Social Management</h4>
        <P>Complete takeover and daily management of all social media platforms. The Provider handles posting, engagement, community management, and strategy. The Client does not need to manage any social accounts during the term of this Agreement.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.4 Web Development</h4>
        <P>Design, development, and ongoing management of the Client&rsquo;s website. Includes conversion-optimized landing pages, booking integration, SEO optimization, and any updates needed to support marketing campaigns. The Provider hosts and maintains the site for the duration of the Agreement.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.5 Offer Refinement</h4>
        <P>Strategic consulting on pricing, packaging, and competitive positioning. This includes structuring birthday party packages, membership tiers, league pricing, corporate event offerings, and any new revenue streams identified during the partnership. The Provider advises; the Client makes final pricing decisions.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.6 Fluid Communication</h4>
        <P>The Provider operates as an embedded extension of the Client&rsquo;s team with direct communication access via text, phone, and/or Slack. Response times target within 24 hours on business days. The Client agrees to maintain responsive communication for time-sensitive requests related to content, scheduling, and business operations.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.7 Advertising Spend</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700 w-1/3">Google Ads (Initial)</td><td className="px-3 py-2">The Provider will match the Client&rsquo;s initial Google Ads spend to launch the first campaign</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Google Ads (Ongoing)</td><td className="px-3 py-2">After the initial matched campaign, all subsequent Google Ads spend is the responsibility of the Client</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Meta Ads (All)</td><td className="px-3 py-2">All Meta advertising spend (Facebook, Instagram) is the responsibility of the Client from day one</td></tr>
              <tr><td className="px-3 py-2 bg-gray-50 font-medium text-gray-700">Management</td><td className="px-3 py-2">The Provider manages all ad campaigns as part of the service pillars; only the media buying budget is separate</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.8 Service Exclusions</h4>
        <P>The following are NOT included in this Agreement unless separately negotiated:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Physical merchandise or signage production</li>
          <li>Legal, accounting, or tax services</li>
          <li>Staffing or HR support</li>
          <li>Equipment purchases for the Client&rsquo;s business</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">6.9 Nightmares Webapp (Business Dashboard)</h4>
        <P>The Provider will build and maintain a proprietary business management dashboard (&ldquo;Nightmares webapp&rdquo;) for the Client. This dashboard serves as the central hub for the partnership and includes:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Full contract details and fee tracking</li>
          <li>Accounting transaction entry and automated fee calculation</li>
          <li>Offer refinement tools and pricing optimization</li>
          <li>Social media analytics and performance data</li>
          <li>Business optimization insights and recommendations</li>
        </ul>
        <P>The Nightmares webapp provides complete transparency into every aspect of the partnership. Both parties can view the same data, the same calculations, and the same results at any time. This system remains the intellectual property of the Provider (see Section 9).</P>
      </Section>

      {/* Section 7: Client Obligations */}
      <Section id="§7" title="Client Obligations" expanded={expanded === 's7'} onToggle={() => toggle('s7')}>
        <P>The success of this partnership depends on both parties fulfilling their commitments. The Client agrees to the following obligations:</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">7.1 Financial Infrastructure</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Maintain a dedicated business bank account separate from personal finances.</li>
          <li>Maintain organized bookkeeping or accounting records accessible for revenue verification.</li>
          <li>Operate a point-of-sale system (Swipe Simple) that tracks all transactions.</li>
          <li>Record all accounting transactions into the Nightmares webapp accurately and promptly.</li>
          <li>Provide revenue reports as outlined in Section 5.</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">7.2 Access Granted</h4>
        <P>The Client shall grant the Provider administrative access to the following within seven (7) days of the Effective Date:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>All social media accounts (Instagram, Facebook, TikTok, YouTube, etc.)</li>
          <li>Google Business Profile</li>
          <li>Apple Business Connect</li>
          <li>Bing Places for Business</li>
          <li>Website hosting and domain management</li>
          <li>Booking/scheduling platform (if applicable)</li>
          <li>Swipe Simple POS system (read access for transaction monitoring)</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">7.3 Communication & Cooperation</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Respond to Provider communications within 48 hours on business days.</li>
          <li>Participate in monthly Decision Meetings (minimum 1 hour per month).</li>
          <li>Provide timely feedback on strategic recommendations.</li>
          <li>Implement agreed-upon operational changes (e.g., new pricing, packages, schedules).</li>
          <li>Notify the Provider promptly of any significant business changes, closures, or disruptions.</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">7.4 Exclusivity</h4>
        <P>During the term of this Agreement, the Client shall not engage any other marketing agency, social media manager, or growth consultant to perform services that overlap with the Provider&rsquo;s six service pillars. The Client may continue to perform in-house marketing activities. If the Client wishes to bring on additional marketing support for services outside the Provider&rsquo;s scope (e.g., radio ads, print), the Client shall notify the Provider in advance.</P>
      </Section>

      {/* Section 8: Provider Obligations */}
      <Section id="§8" title="Provider Obligations" expanded={expanded === 's8'} onToggle={() => toggle('s8')}>
        <P>The Provider agrees to the following commitments:</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">8.1 Service Delivery</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Deliver all six service pillars as described in Section 6 throughout the contract term.</li>
          <li>Maintain consistent content production and distribution schedules.</li>
          <li>Provide monthly performance reports showing key metrics (followers, engagement, website traffic, booking data, and revenue trajectory).</li>
          <li>Attend all scheduled Decision Meetings and provide strategic recommendations.</li>
          <li>Respond to Client communications within 24 hours on business days.</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">8.2 Transparency</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Provide clear, itemized monthly fee calculations showing how Growth Fees were computed.</li>
          <li>Maintain the Nightmares webapp as the single source of truth for all contract data, accounting records, social analytics, offer refinement tools, and business optimization insights. Both parties have access at all times.</li>
          <li>Share analytics dashboards and platform insights with the Client upon request.</li>
          <li>Proactively communicate any strategy changes, pivots, or concerns.</li>
          <li>Disclose any conflicts of interest that may arise during the partnership.</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">8.3 Non-Compete</h4>
        <P>During the term of this Agreement, the Provider shall not provide services to any direct competitor of the Client within the Fort Wayne metropolitan area. A direct competitor is defined as any business whose primary offering is racing simulation entertainment. This restriction does not apply to businesses in adjacent entertainment categories (bowling, axe throwing, etc.) unless they add racing simulators as a primary offering.</P>
      </Section>

      {/* Section 9: Intellectual Property */}
      <Section id="§9" title="Intellectual Property & Content Ownership" expanded={expanded === 's9'} onToggle={() => toggle('s9')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">9.1 Content Ownership</h4>
        <P>All photos, videos, graphics, and marketing content created by the Provider specifically for the Client shall become the property of the Client upon creation. The Client may use this content in perpetuity, regardless of whether the Agreement is renewed or terminated.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">9.2 Portfolio Rights</h4>
        <P>The Provider retains the right to use all content created for the Client in the Provider&rsquo;s portfolio, case studies, social media, website, and marketing materials. This right is perpetual and survives termination of this Agreement.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">9.3 Systems & Intellectual Property</h4>
        <P>The Provider has built and continues to maintain proprietary systems for the Client, including but not limited to: custom website code, marketing automations, workflow tools, the Nightmares webapp dashboard, and any future technology developed during the partnership. All of these (&ldquo;Provider Systems&rdquo;) remain the intellectual property of the Provider at all times.</P>
        <P>During the term of this Agreement, the Client is granted a license to benefit from these systems. Upon termination:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li><strong>If the Client pays the applicable Buyout Fee:</strong> The Client receives a perpetual, non-transferable license to continue using the website and marketing automations in their current state. No future updates or support are included. The Nightmares webapp is excluded (see Section 9.5).</li>
          <li><strong>If the Client does not pay the Buyout Fee:</strong> The Provider will remove or deactivate all Provider Systems within thirty (30) days of termination. The Client retains all content and standard marketing assets.</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">9.4 Website Ownership</h4>
        <P>The website built by the Provider shall transfer to full Client ownership upon any of the following: (a) the Client pays the Buyout Fee, (b) the Agreement completes its full term without early termination, or (c) as otherwise negotiated. Domain names registered by the Client remain Client property at all times. Domain names registered by the Provider on behalf of the Client will be transferred upon request.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">9.5 Nightmares Webapp</h4>
        <P>The Nightmares webapp (the Provider&rsquo;s proprietary business management dashboard) is core technology of Sweet Dreams US LLC and is <strong className="text-red-700">never transferred to the Client under any circumstances, including buyout</strong>. Upon termination of this Agreement, the Client&rsquo;s access to the Nightmares webapp will be deactivated. The Provider will export and deliver any raw accounting data and reports the Client needs for their records prior to deactivation.</P>
      </Section>

      {/* Section 10: Termination */}
      <Section id="§10" title="Termination" expanded={expanded === 's10'} onToggle={() => toggle('s10')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">10.1 Termination by Mutual Agreement</h4>
        <P>Either party may propose termination at any time. If both parties agree in writing, the Agreement terminates on the mutually agreed-upon date. Fees owed through the termination date remain due.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">10.2 Termination for Cause (Client Breach)</h4>
        <P>The Provider may terminate this Agreement if the Client commits a material breach, including but not limited to:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Failure to pay fees within thirty (30) days of the due date.</li>
          <li>Providing false or misleading revenue data.</li>
          <li>Failing to record transactions into the Nightmares webapp for thirty (30) or more consecutive days.</li>
          <li>Refusing to provide access to required accounts or platforms.</li>
          <li>Engaging a competing agency in violation of the exclusivity clause.</li>
          <li>Failure to participate in Decision Meetings for two (2) or more consecutive months.</li>
        </ul>
        <P>The Provider shall provide written notice of the breach and allow the Client fifteen (15) days to cure. If the breach is not cured, the Agreement terminates and the Client owes all fees accrued through the termination date plus the Buyout Fee if applicable.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">10.3 Termination for Cause (Provider Breach)</h4>
        <P>The Client may terminate this Agreement if the Provider commits a material breach, including but not limited to:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Failure to deliver services for thirty (30) or more consecutive days without prior notice.</li>
          <li>Misrepresentation of performance data or analytics.</li>
          <li>Unauthorized use of Client financial data outside the scope of this Agreement.</li>
          <li>Violation of the non-compete clause.</li>
        </ul>
        <P>The Client shall provide written notice of the breach and allow the Provider fifteen (15) days to cure. If the breach is not cured, the Agreement terminates and the Client owes only fees accrued through the termination date. No Buyout Fee applies.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">10.4 Early Termination by Client (Without Cause)</h4>
        <P>The Client may terminate this Agreement early without cause by providing thirty (30) days written notice. In this case:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>All fees accrued through the termination date are due immediately.</li>
          <li>The Buyout Fee applies if the Client wishes to retain the website and marketing automations (see Section 11).</li>
          <li>If the Client does not pay the Buyout Fee, the Provider will remove all Provider Systems within thirty (30) days.</li>
          <li>All content created by the Provider transfers to the Client regardless.</li>
          <li>Access to the Nightmares webapp is deactivated (raw data exported to Client).</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">10.5 Termination by Provider (Without Cause)</h4>
        <P>The Provider may terminate this Agreement without cause by providing sixty (60) days written notice. In this case:</P>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>No Buyout Fee applies to the Client.</li>
          <li>All content and the website transfer to the Client.</li>
          <li>The Provider will provide a reasonable transition period to hand off assets and documentation.</li>
          <li>Access to the Nightmares webapp is deactivated (raw data exported to Client).</li>
        </ul>
      </Section>

      {/* Section 11: Exit & Buyout */}
      <Section id="§11" title="Exit & Buyout" expanded={expanded === 's11'} onToggle={() => toggle('s11')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">11.1 Purpose</h4>
        <P>The Buyout Fee compensates the Provider for the value of systems, workflows, and growth infrastructure built during the partnership. It prevents the Client from benefiting from the Provider&rsquo;s investment (time, strategy, IP) without fair compensation after walking away.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">11.2 Buyout Calculation</h4>
        <P>The Buyout Fee is calculated using the average of the last three (3) months of total fees paid, multiplied by a longevity factor based on how long the partnership has sustained meaningful growth.</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Sustained Growth Duration</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Multiplier</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Buyout (at {fmt(terms.minimumMonthlyFee)} avg fee)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {buyoutPreview.map(row => (
                <tr key={row.label}>
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2 text-right font-medium">{row.multiplier}&times;</td>
                  <td className="px-3 py-2 text-right font-medium text-mcracing-600">{fmt(row.buyout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>&ldquo;Sustained growth&rdquo; is defined as months where the Client&rsquo;s revenue exceeded the Baseline by 50% or more.</P>
        <P><strong>Example:</strong> The partnership is 9 months in. The Client&rsquo;s last three monthly fees were $800, $900, and $1,000. The average is $900. Sustained growth above 50% has been maintained for 7 months, placing this in the 6–12 month bracket (4&times; multiplier). The base Buyout Fee is $900 &times; 4 = $3,600, plus applicable premiums (see 11.3).</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">11.3 Premiums</h4>
        <P>The Provider has already built custom code, a website, and marketing automations for the Client as part of this partnership. These assets represent significant IP investment. The following premiums are applied to the Buyout Fee to account for this existing infrastructure:</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Asset</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2">Custom code, website, and automation systems (already built)</td><td className="px-3 py-2 text-right font-medium">+25% added to Buyout Fee</td></tr>
              <tr><td className="px-3 py-2">Trained AI systems or automated marketing tools (if developed)</td><td className="px-3 py-2 text-right font-medium">+15% added to Buyout Fee</td></tr>
            </tbody>
          </table>
        </div>
        <P>Continuing the example from 11.2: Base Buyout Fee is $3,600. The +25% premium for existing custom systems adds $900. Total Buyout Fee = $4,500. If AI tools were also developed during the partnership, the additional +15% ($540) would bring the total to $5,040.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">11.4 What the Client Gets with Buyout</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>Website ownership transfer (full files and hosting migration)</li>
          <li>Social media assets and content library</li>
          <li>Custom workflows and marketing automations (perpetual license, no future updates)</li>
          <li>Marketing templates and brand guidelines</li>
          <li>Lead tracking systems and data</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">11.5 What the Client Does NOT Get</h4>
        <ul className="text-sm text-gray-700 list-disc pl-6 mb-3 space-y-1">
          <li>The Nightmares webapp (Turn to Dreams) — this is Provider core technology and is never transferred under any circumstances</li>
          <li>Sweet Dreams proprietary engine or core technology</li>
          <li>Ongoing support, maintenance, or updates</li>
          <li>Future content production</li>
          <li>Access to Provider&rsquo;s other tools or resources</li>
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">11.6 Buyout Payment Terms</h4>
        <P>The Buyout Fee is due within thirty (30) days of the termination date. The Provider may offer a payment plan at its discretion. Until the Buyout Fee is paid in full, the Provider retains the right to deactivate Provider Systems.</P>
      </Section>

      {/* Section 12: Renewal */}
      <Section id="§12" title="Renewal" expanded={expanded === 's12'} onToggle={() => toggle('s12')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">12.1 Renewal Process</h4>
        <P>Beginning sixty (60) days before the end of the contract term, both parties shall initiate a renewal review. This includes pulling Year 1 performance data, calculating the average monthly fee, assessing the relationship quality, and projecting the Year 2 baseline and fee structure.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">12.2 Renewal Timeline</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Milestone</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Timing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2">Pull performance data and assess</td><td className="px-3 py-2">60 days before term end</td></tr>
              <tr><td className="px-3 py-2">Schedule renewal conversation</td><td className="px-3 py-2">45 days before term end</td></tr>
              <tr><td className="px-3 py-2">Complete renewal decision</td><td className="px-3 py-2">30 days before term end</td></tr>
              <tr><td className="px-3 py-2">Sign renewal contract / collect Year 2 Foundation Fee</td><td className="px-3 py-2">On or before term end</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">12.3 Baseline Reset at Renewal</h4>
        <P>Upon renewal, the Baseline Revenue resets upward based on the growth achieved. The retention percentage determines how much of the growth is incorporated into the new baseline. Both parties must agree on the new baseline figure.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">12.4 Renewal Criteria</h4>
        <P>Growth thresholds are evaluated on a trailing 12-month annual basis (total Year 1 revenue vs. total Baseline annual revenue). However, renewal decisions must account for the Client&rsquo;s margin profile. A small-baseline business with tight margins needs proportionally larger growth to justify renewal compared to a larger business with healthier margins.</P>
        <P><strong>Baseline-Adjusted Renewal Thresholds:</strong></P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Client Monthly Baseline</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-green-600">Renew</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-amber-600">Renegotiate</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-red-600">Don&apos;t Renew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-mcracing-50"><td className="px-3 py-2 font-medium">Under $10K (Micro)</td><td className="px-3 py-2 text-right text-green-600">&gt; 150%</td><td className="px-3 py-2 text-right text-amber-600">75% – 150%</td><td className="px-3 py-2 text-right text-red-600">&lt; 75%</td></tr>
              <tr><td className="px-3 py-2">$10K – $30K (Small)</td><td className="px-3 py-2 text-right text-green-600">&gt; 75%</td><td className="px-3 py-2 text-right text-amber-600">40% – 75%</td><td className="px-3 py-2 text-right text-red-600">&lt; 40%</td></tr>
              <tr><td className="px-3 py-2">$30K – $75K (Medium)</td><td className="px-3 py-2 text-right text-green-600">&gt; 50%</td><td className="px-3 py-2 text-right text-amber-600">20% – 50%</td><td className="px-3 py-2 text-right text-red-600">&lt; 20%</td></tr>
              <tr><td className="px-3 py-2">$75K+ (Large/Elite)</td><td className="px-3 py-2 text-right text-green-600">&gt; 30%</td><td className="px-3 py-2 text-right text-amber-600">15% – 30%</td><td className="px-3 py-2 text-right text-red-600">&lt; 15%</td></tr>
            </tbody>
          </table>
        </div>
        <P><strong>Why smaller businesses need bigger growth:</strong> A Micro-tier business at $5K/month with $4K in expenses has $1K margin. Even 50% growth ($7,500/month) only gives $3,500 margin — not enough to sustain meaningful fees for the Provider or transformative results for the Client. At 150%+ ($12,500/month), the business is fundamentally different and the partnership is clearly working. Larger businesses with better margins can sustain renewal at lower growth rates because even modest percentage gains represent significant dollar volume.</P>
        <P><strong>Additional Renewal Factors:</strong></P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Metric</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-green-600">Renew</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-amber-600">Renegotiate</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-red-600">Don&apos;t Renew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2">Client Relationship</td><td className="px-3 py-2 text-right">Strong & responsive</td><td className="px-3 py-2 text-right">Adequate</td><td className="px-3 py-2 text-right">Difficult</td></tr>
              <tr><td className="px-3 py-2">Payment History</td><td className="px-3 py-2 text-right">On time</td><td className="px-3 py-2 text-right">Mostly on time</td><td className="px-3 py-2 text-right">Late / Issues</td></tr>
              <tr><td className="px-3 py-2">Effort Required</td><td className="px-3 py-2 text-right">Reasonable</td><td className="px-3 py-2 text-right">High but manageable</td><td className="px-3 py-2 text-right">Excessive</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">12.5 Non-Renewal</h4>
        <P>If either party elects not to renew, the Agreement expires at the end of the current term. All provisions of Section 10 (Termination) and Section 11 (Buyout) apply as if the Client terminated without cause.</P>
      </Section>

      {/* Section 13: Confidentiality */}
      <Section id="§13" title="Confidentiality" expanded={expanded === 's13'} onToggle={() => toggle('s13')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">13.1 Mutual Obligations</h4>
        <P>Both parties agree to keep confidential all non-public business information, financial data, strategies, customer lists, pricing structures, and internal processes shared during the course of this partnership. This obligation survives termination of this Agreement for a period of two (2) years.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">13.2 Exceptions</h4>
        <P>Confidential information does not include information that: (a) is or becomes publicly available through no fault of the receiving party, (b) was already known to the receiving party before disclosure, (c) is independently developed by the receiving party, or (d) is required to be disclosed by law or legal process.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">13.3 Revenue Data</h4>
        <P>The Client&rsquo;s revenue data shared with the Provider shall be used solely for the purpose of calculating fees under this Agreement and informing marketing strategy. The Provider shall not share specific revenue figures with any third party. The Provider may reference general growth percentages and outcomes (e.g., &ldquo;Client grew 300%&rdquo;) in case studies and marketing materials without disclosing exact dollar amounts, unless the Client provides written consent.</P>
      </Section>

      {/* Section 14: Limitation of Liability */}
      <Section id="§14" title="Limitation of Liability" expanded={expanded === 's14'} onToggle={() => toggle('s14')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">14.1 No Revenue Guarantee</h4>
        <P>The Provider does not guarantee any specific revenue outcome, growth percentage, or financial result. Marketing and growth services are subject to market conditions, consumer behavior, competition, and other factors outside the Provider&rsquo;s control. The performance-based fee structure reflects this shared risk.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">14.2 Liability Cap</h4>
        <P>The Provider&rsquo;s total liability under this Agreement shall not exceed the total fees paid by the Client during the twelve (12) months preceding the claim. This cap applies to all claims regardless of the theory of liability.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">14.3 Consequential Damages</h4>
        <P>Neither party shall be liable for indirect, incidental, special, or consequential damages, including lost profits, loss of data, or business interruption, regardless of whether such damages were foreseeable.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">14.4 Force Majeure</h4>
        <P>Neither party shall be liable for failure to perform due to circumstances beyond their reasonable control, including natural disasters, pandemics, government actions, internet outages, or other force majeure events. The affected party shall notify the other party as soon as practicable and both parties shall work in good faith to resume performance.</P>
      </Section>

      {/* Section 15: Dispute Resolution */}
      <Section id="§15" title="Dispute Resolution" expanded={expanded === 's15'} onToggle={() => toggle('s15')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">15.1 Good Faith Negotiation</h4>
        <P>In the event of any dispute arising under this Agreement, both parties agree to first attempt to resolve the matter through direct, good faith negotiation between the principals (Cole at Sweet Dreams and {terms.clientOwner} at MC Racing).</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">15.2 Mediation</h4>
        <P>If direct negotiation fails to resolve the dispute within thirty (30) days, either party may request mediation. Mediation shall be conducted in Fort Wayne, Indiana by a mutually agreed-upon mediator. Each party shall bear its own costs plus one-half of the mediator&rsquo;s fees.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">15.3 Governing Law</h4>
        <P>This Agreement shall be governed by and construed in accordance with the laws of the State of Indiana. Any legal proceedings shall be brought in the courts of Allen County, Indiana.</P>
      </Section>

      {/* Section 16: General Provisions */}
      <Section id="§16" title="General Provisions" expanded={expanded === 's16'} onToggle={() => toggle('s16')}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">16.1 Entire Agreement</h4>
        <P>This Agreement constitutes the entire understanding between the parties and supersedes all prior negotiations, representations, and agreements, whether written or oral. Any amendments must be in writing and signed by both parties.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">16.2 Severability</h4>
        <P>If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">16.3 Assignment</h4>
        <P>Neither party may assign this Agreement without the prior written consent of the other party, except in connection with a merger, acquisition, or sale of substantially all of the assigning party&rsquo;s assets.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">16.4 Notices</h4>
        <P>All formal notices under this Agreement shall be in writing and delivered via email, certified mail, or hand delivery to the addresses listed below. Notices are effective upon receipt.</P>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-semibold text-gray-900">Provider</div>
            <div className="text-gray-600">Cole — Sweet Dreams US LLC</div>
            <div className="text-gray-400 text-xs">3943 Parnell Ave, Fort Wayne, IN 46805</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-semibold text-gray-900">Client</div>
            <div className="text-gray-600">{terms.clientOwner} — MC Sim Racing & RC Lounge</div>
            <div className="text-gray-400 text-xs">1205 W Main St, Fort Wayne, IN 46802</div>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">16.5 Independent Contractor</h4>
        <P>The Provider is an independent contractor. Nothing in this Agreement creates an employer-employee, partnership, or joint venture relationship. The Provider is responsible for its own taxes, insurance, and employment obligations.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">16.6 Waiver</h4>
        <P>Failure by either party to enforce any provision of this Agreement shall not constitute a waiver of that provision or any other provision.</P>
      </Section>

      {/* Section 17: Growth Targets & Milestones */}
      <Section id="§17" title="Growth Targets & Milestones (Non-Binding)" expanded={expanded === 's17'} onToggle={() => toggle('s17')}>
        <P>The following targets represent shared goals for the partnership. They are not guarantees and do not create additional obligations. They serve as benchmarks for Decision Meetings and renewal conversations.</P>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">17.1 Revenue Milestones</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Milestone</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Target</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2">First $6K month</td><td className="px-3 py-2">Month 2–3</td><td className="px-3 py-2 text-gray-600">Model is working</td></tr>
              <tr><td className="px-3 py-2">First $10K month</td><td className="px-3 py-2">Month 5–6</td><td className="px-3 py-2 text-gray-600">Hiring becomes possible</td></tr>
              <tr><td className="px-3 py-2">First waitlist</td><td className="px-3 py-2">Month 8–10</td><td className="px-3 py-2 text-gray-600">Demand exceeds supply</td></tr>
              <tr><td className="px-3 py-2">First price increase</td><td className="px-3 py-2">Month 6–9</td><td className="px-3 py-2 text-gray-600">Pricing power confirmed</td></tr>
              <tr><td className="px-3 py-2">First $16K month</td><td className="px-3 py-2">Month 10–12</td><td className="px-3 py-2 text-gray-600">Capacity ceiling reached</td></tr>
              <tr><td className="px-3 py-2">First employee hired</td><td className="px-3 py-2">Month 6–10</td><td className="px-3 py-2 text-gray-600">{terms.clientOwner} gets operational freedom</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">17.2 Growth Levers</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Lever</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Impact</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Effort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2">Google / Apple / Bing optimization</td><td className="px-3 py-2 text-green-600 font-medium">High</td><td className="px-3 py-2">Low</td></tr>
              <tr><td className="px-3 py-2">Instagram content presence</td><td className="px-3 py-2 text-green-600 font-medium">High</td><td className="px-3 py-2">Medium</td></tr>
              <tr><td className="px-3 py-2">Birthday party marketing push</td><td className="px-3 py-2 text-green-600 font-medium">High</td><td className="px-3 py-2">Medium</td></tr>
              <tr><td className="px-3 py-2">Launch league night(s)</td><td className="px-3 py-2 text-amber-600 font-medium">Medium</td><td className="px-3 py-2">Low</td></tr>
              <tr><td className="px-3 py-2">Launch membership tiers</td><td className="px-3 py-2 text-amber-600 font-medium">Medium</td><td className="px-3 py-2">Low</td></tr>
              <tr><td className="px-3 py-2">Corporate outreach</td><td className="px-3 py-2 text-amber-600 font-medium">Medium</td><td className="px-3 py-2">Medium</td></tr>
              <tr><td className="px-3 py-2">Video content (reels, stories)</td><td className="px-3 py-2 text-green-600 font-medium">High</td><td className="px-3 py-2">Ongoing</td></tr>
              <tr><td className="px-3 py-2">Price increases as demand grows</td><td className="px-3 py-2 text-green-600 font-medium">High</td><td className="px-3 py-2">Zero</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">17.3 Revenue Priority Stack</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Priority</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Revenue Stream</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr><td className="px-3 py-2 font-bold text-mcracing-600">1</td><td className="px-3 py-2 font-medium">Birthday Parties</td><td className="px-3 py-2 text-gray-600">Highest per-hour yield, books ahead, referrals</td></tr>
              <tr><td className="px-3 py-2 font-bold text-mcracing-600">2</td><td className="px-3 py-2 font-medium">Memberships</td><td className="px-3 py-2 text-gray-600">Recurring, predictable, builds loyalty</td></tr>
              <tr><td className="px-3 py-2 font-bold text-mcracing-600">3</td><td className="px-3 py-2 font-medium">League Nights</td><td className="px-3 py-2 text-gray-600">Recurring, fills dead nights, community</td></tr>
              <tr><td className="px-3 py-2 font-bold text-mcracing-600">4</td><td className="px-3 py-2 font-medium">Group Sessions</td><td className="px-3 py-2 text-gray-600">Good yield, walk-in / booking</td></tr>
              <tr><td className="px-3 py-2 font-bold text-mcracing-600">5</td><td className="px-3 py-2 font-medium">Solo Sessions</td><td className="px-3 py-2 text-gray-600">Entry point, fills gaps</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Section 18: Signatures */}
      <Section id="§18" title="Signatures" expanded={expanded === 's18'} onToggle={() => toggle('s18')}>
        <P>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions set forth in this Agreement.</P>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="text-sm font-medium text-gray-900">Cole — Sweet Dreams US LLC</div>
            <div className="text-xs text-gray-500 mt-1">Provider</div>
            <div className="text-xs text-gray-400 mt-3">Date: _______________</div>
          </div>
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="text-sm font-medium text-gray-900">{terms.clientOwner} — MC Sim Racing & RC Lounge</div>
            <div className="text-xs text-gray-500 mt-1">Client</div>
            <div className="text-xs text-gray-400 mt-3">Date: _______________</div>
          </div>
        </div>
      </Section>

      {/* Finalize */}
      <div className="bg-white rounded-xl border-2 border-mcracing-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ready to Finalize?</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {terms.clientOwner} + Cole agree on: {fmt(terms.monthlyBaseline)}/mo baseline | {terms.contractLength} months | {FULL_MONTHS[terms.effectiveMonth - 1]} {terms.effectiveYear} | {fmt(terms.minimumMonthlyFee)} minimum
            </p>
          </div>
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} className="px-5 py-2.5 bg-mcracing-600 text-white rounded-lg text-sm font-medium hover:bg-mcracing-700 transition-colors">Finalize Contract</button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-4 w-4" /><span className="text-xs font-medium">Locks for {terms.contractLength} months</span></div>
              <button onClick={onFinalize} className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Confirm & Lock</button>
              <button onClick={() => setShowConfirm(false)} className="px-3 py-2.5 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── POST-FINALIZATION ──────────────────────────────────────────────────────

function PostFinalizationView({ terms, rows, loading, onUnlock }: {
  terms: ContractTerms; rows: MonthLedgerRow[]; loading: boolean; onUnlock: () => void
}) {
  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear = now.getFullYear()

  const activeRows = rows.filter(r => r.year < curYear || (r.year === curYear && r.month <= curMonth))
  const futureRows = rows.filter(r => r.year > curYear || (r.year === curYear && r.month > curMonth))

  const ytdRevenue = activeRows.reduce((s, r) => s + r.revenue, 0)
  const ytdFees = activeRows.reduce((s, r) => s + r.totalFee, 0)
  const ytdNet = activeRows.reduce((s, r) => s + r.netToClient, 0)
  const ytdSD = activeRows.reduce((s, r) => s + r.sweetDreamsEarns, 0)

  const endMonth = ((terms.effectiveMonth - 1 + terms.contractLength - 1) % 12)
  const endYear = terms.effectiveYear + Math.floor((terms.effectiveMonth - 1 + terms.contractLength - 1) / 12)

  return (
    <div className="space-y-5">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-green-700 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-green-900">Grand Slam Contract — Signed & Locked</h3>
          <p className="text-xs text-green-600">
            Finalized {new Date(terms.finalizedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            {terms.clientOwner} + Cole | {fmt(terms.monthlyBaseline)}/mo baseline | {FULL_MONTHS[terms.effectiveMonth - 1]} {terms.effectiveYear} — {FULL_MONTHS[endMonth]} {endYear}
          </p>
        </div>
        <Lock className="h-5 w-5 text-green-400" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-xs text-gray-500">Baseline</div><div className="text-lg font-bold text-gray-900">{fmt(terms.monthlyBaseline)}</div><div className="text-xs text-gray-400">per month</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-xs text-gray-500">Minimum Fee</div><div className="text-lg font-bold text-gray-900">{fmt(terms.minimumMonthlyFee)}</div><div className="text-xs text-gray-400">monthly floor</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-xs text-gray-500">Contract</div><div className="text-lg font-bold text-gray-900">{terms.contractLength} mo</div><div className="text-xs text-gray-400">{MONTH_NAMES[terms.effectiveMonth - 1]} {terms.effectiveYear}</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-xs text-gray-500">Foundation Fee</div><div className="text-lg font-bold text-green-600">$0</div><div className="text-xs text-gray-400">deferred Y1</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3"><div className="text-xs text-gray-500">Deal Type</div><div className="text-lg font-bold text-mcracing-600">Grand Slam</div><div className="text-xs text-gray-400">growth partnership</div></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-mcracing-50 rounded-xl border border-mcracing-100 p-3"><div className="text-xs text-mcracing-600 font-medium">YTD Revenue</div><div className="text-xl font-bold text-mcracing-900">{fmt(ytdRevenue)}</div></div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3"><div className="text-xs text-indigo-600 font-medium">YTD Fees Owed</div><div className="text-xl font-bold text-indigo-900">{fmt(ytdFees)}</div></div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-3"><div className="text-xs text-green-600 font-medium">MC Racing Keeps</div><div className="text-xl font-bold text-green-900">{fmt(ytdNet)}</div></div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-3"><div className="text-xs text-purple-600 font-medium">Sweet Dreams Earns</div><div className="text-xl font-bold text-purple-900">{fmt(ytdSD)}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-mcracing-600" />
          <h3 className="text-sm font-semibold text-gray-900">Monthly Accounting Ledger</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcracing-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Month</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Baseline</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Uplift</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Fee</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">MC Keeps</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">SD Earns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRows.map(row => (
                  <tr key={`${row.year}-${row.month}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{row.label}</td>
                    <td className="px-3 py-2 text-right">{row.revenue > 0 ? fmt(row.revenue) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{fmt(row.baseline)}</td>
                    <td className="px-3 py-2 text-right text-green-600">{row.uplift > 0 ? fmt(row.uplift) : <span className="text-gray-300">$0</span>}</td>
                    <td className="px-3 py-2 text-right font-medium text-indigo-600">{row.totalFee > 0 ? fmt(row.totalFee) : <span className="text-gray-300">$0</span>}{row.minimumApplied && <span className="text-amber-500 ml-0.5">*</span>}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{row.revenue > 0 ? fmt(row.netToClient) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-right text-purple-600">{row.sweetDreamsEarns > 0 ? fmt(row.sweetDreamsEarns) : <span className="text-gray-300">$0</span>}</td>
                  </tr>
                ))}
                {futureRows.length > 0 && (
                  <>
                    <tr className="bg-gray-50"><td colSpan={7} className="px-3 py-1.5 text-xs text-gray-400 italic">Upcoming</td></tr>
                    {futureRows.map(row => (
                      <tr key={`${row.year}-${row.month}`} className="text-gray-300">
                        <td className="px-3 py-2 font-medium">{row.label}</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">{fmt(row.baseline)}</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-medium text-sm">
                <tr>
                  <td className="px-3 py-2 font-semibold">YTD Total</td>
                  <td className="px-3 py-2 text-right">{fmt(ytdRevenue)}</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right text-green-600">{fmt(activeRows.reduce((s, r) => s + r.uplift, 0))}</td>
                  <td className="px-3 py-2 text-right text-indigo-600">{fmt(ytdFees)}</td>
                  <td className="px-3 py-2 text-right font-bold">{fmt(ytdNet)}</td>
                  <td className="px-3 py-2 text-right text-purple-600">{fmt(ytdSD)}</td>
                </tr>
              </tfoot>
            </table>
            {activeRows.some(r => r.minimumApplied) && (
              <p className="px-3 py-1.5 text-xs text-amber-600">* Minimum monthly fee of {fmt(terms.minimumMonthlyFee)} applied (Growth Fee was lower)</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={onUnlock} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Admin: Unlock Contract for Editing</button>
      </div>
    </div>
  )
}
