'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calculator, DollarSign, BarChart3, BookOpen, Lock, Unlock, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { getSeasonalFactors } from '@/lib/constants/seasonalIndices'
import { RETENTION_BRACKETS } from '@/lib/constants/feeStructure'
import RevenueChart from '@/components/charts/RevenueChart'

// ─── Reference Badge Component ──────────────────────────────────────────────
function RefBadge({ id, label }: { id: string; label: string }) {
  const handleClick = () => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
    >
      {label}
    </button>
  )
}

function SectionHeader({ id, label, title }: { id: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-2 p-4 border-b border-gray-200">
      <span id={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-700 text-white scroll-mt-24">
        {label}
      </span>
      <h3 className="font-semibold">{title}</h3>
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Stream {
  name: string
  monthlyAmount: number
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_STREAMS: Stream[] = [
  { name: 'Drop-in Sessions', monthlyAmount: 1500 },
  { name: 'Private Parties', monthlyAmount: 1000 },
  { name: 'Memberships', monthlyAmount: 800 },
  { name: 'League Nights', monthlyAmount: 700 },
]

const PRESET_SCENARIOS = [
  { label: '50%', value: 0.50 },
  { label: '100%', value: 1.00 },
  { label: '200%', value: 2.00 },
  { label: '300%', value: 3.00 },
  { label: '400%', value: 4.00 },
  { label: '500%', value: 5.00 },
]

const TABS = [
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
] as const

type TabId = typeof TABS[number]['id']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

// ─── Mock Marketing Data (Sim Racing niche) ─────────────────────────────────
const MOCK_FUNNEL = {
  impressions: 22000,
  clicks: 1400,
  leads: 85,
  deals: 42,
  revenue: 8200,
}

const MOCK_AD_CHANNELS = [
  { channel: 'Google Ads', spend: 800, impressions: 10000, clicks: 650, leads: 35, cpl: 23, roas: 4.1 },
  { channel: 'Facebook', spend: 500, impressions: 7000, clicks: 420, leads: 28, cpl: 18, roas: 5.2 },
  { channel: 'Instagram/TikTok', spend: 350, impressions: 5000, clicks: 330, leads: 22, cpl: 16, roas: 6.0 },
]

const MOCK_SOCIAL_SEO = {
  social: { followers: 1250, engagementRate: 6.8, postsPerMonth: 12 },
  seo: { domainAuthority: 18, keywordsRanked: 45, organicTraffic: 680 },
  reviews: { googleRating: 4.9, reviewCount: 67, responseRate: 100 },
}

// ─── Main Page Component ────────────────────────────────────────────────────
export default function MCRacingPage() {
  // ── Editable state ──
  const [baseline, setBaseline] = useState(4000)
  const [streams, setStreams] = useState<Stream[]>(DEFAULT_STREAMS)
  const [growthPercent, setGrowthPercent] = useState(1.00)
  const [customGrowth, setCustomGrowth] = useState('')
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1)
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [projectionMonths, setProjectionMonths] = useState(12)
  const [contractLocked, setContractLocked] = useState(false)
  const [lockDate, setLockDate] = useState<string | null>(null)
  const [inputsPanelOpen, setInputsPanelOpen] = useState(true)

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<TabId>('calculator')
  const [analyticsMode, setAnalyticsMode] = useState<'demo' | 'live'>('demo')

  // ── Contract lock handler ──
  const toggleLock = useCallback(() => {
    if (!contractLocked) {
      setContractLocked(true)
      setLockDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }))
    } else {
      setContractLocked(false)
      setLockDate(null)
    }
  }, [contractLocked])

  // ── Stream editor ──
  const updateStream = (index: number, field: 'name' | 'monthlyAmount', value: string | number) => {
    if (contractLocked) return
    const updated = [...streams]
    if (field === 'name') updated[index] = { ...updated[index], name: value as string }
    else updated[index] = { ...updated[index], monthlyAmount: Number(value) }
    setStreams(updated)
    const sum = updated.reduce((acc, s) => acc + s.monthlyAmount, 0)
    setBaseline(sum)
  }

  const selectPreset = (value: number) => {
    if (contractLocked) return
    setGrowthPercent(value)
    setCustomGrowth('')
  }

  const applyCustomGrowth = () => {
    if (contractLocked) return
    const val = parseFloat(customGrowth)
    if (!isNaN(val) && val > 0 && val <= 1000) {
      setGrowthPercent(val / 100)
    }
  }

  // ── Derived calculations ──
  const monthlyGrowthRate = useMemo(() => Math.pow(1 + growthPercent, 1 / 12) - 1, [growthPercent])

  const categoryInfo = useMemo(() => getTierRatesForBaseline(baseline), [baseline])
  const y1CategoryInfo = useMemo(() => getTierRatesForBaseline(baseline, true), [baseline])
  const seasonalFactors = getSeasonalFactors('sim_racing')

  const y1Projection = useMemo(() => projectScenario({
    baselineRevenue: baseline,
    industry: 'sim_racing',
    monthlyGrowthRate,
    startMonth,
    startYear,
    projectionMonths,
    isGrandSlam: true,
    applySeasonality: true,
  }), [baseline, monthlyGrowthRate, startMonth, startYear, projectionMonths])

  const fullProjection = useMemo(() => projectScenario({
    baselineRevenue: baseline,
    industry: 'sim_racing',
    monthlyGrowthRate,
    startMonth,
    startYear,
    projectionMonths: Math.max(projectionMonths, 24),
    isGrandSlam: true,
    applySeasonality: true,
  }), [baseline, monthlyGrowthRate, startMonth, startYear, projectionMonths])

  const chartData = useMemo(() => y1Projection.projections.map((p) => ({
    month: p.monthLabel.split(' ')[0],
    revenue: p.projectedRevenue,
    baseline: p.currentBaseline,
    fee: p.totalMonthlyFee,
  })), [y1Projection])

  const scenarioComparisons = useMemo(() => PRESET_SCENARIOS.map((s) => {
    const mgr = Math.pow(1 + s.value, 1 / 12) - 1
    const proj = projectScenario({
      baselineRevenue: baseline,
      industry: 'sim_racing',
      monthlyGrowthRate: mgr,
      startMonth,
      startYear,
      projectionMonths: 12,
      isGrandSlam: true,
      applySeasonality: true,
    })
    return {
      label: `${s.value * 100}% Growth`,
      growthPercent: s.value,
      totalRevenue: proj.summary.totalProjectedRevenue,
      totalFees: proj.summary.totalFees,
      avgMonthlyFee: proj.summary.avgMonthlyFee,
      effectiveRate: proj.summary.avgEffectiveRate,
      clientKeeps: proj.summary.totalProjectedRevenue - proj.summary.totalFees,
    }
  }), [baseline, startMonth, startYear])

  const growthLabel = `${Math.round(growthPercent * 100)}% Growth`

  // ── Marketing ROI calc ──
  const totalAdSpend = MOCK_AD_CHANNELS.reduce((s, c) => s + c.spend, 0)
  const marketingROAS = ((MOCK_FUNNEL.revenue - baseline) / totalAdSpend).toFixed(1)

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Header */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="card p-6 bg-gradient-to-r from-blue-700 to-purple-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">MC Racing</h1>
              {contractLocked ? (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/80 text-xs font-bold">
                  <Lock className="h-3 w-3" /> CONTRACT LOCKED
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/80 text-xs font-bold text-black">
                  <Unlock className="h-3 w-3" /> PROPOSAL MODE
                </span>
              )}
            </div>
            <p className="text-blue-200">Fort Wayne, IN &middot; Sim Racing &middot; {categoryInfo.categoryLabel}</p>
            {lockDate && (
              <p className="text-xs text-blue-300 mt-1">Locked on {lockDate}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                Baseline: {formatCurrency(baseline)}/mo
              </span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                Annual: {formatCurrency(baseline * 12)}
              </span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                Category: Micro (&lt;$10K)
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Revenue Streams</p>
            {streams.map((s) => (
              <p key={s.name} className="text-sm">{s.name}: {formatCurrency(s.monthlyAmount)}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Customize Scenario Panel */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="card border border-blue-200">
        <button
          onClick={() => setInputsPanelOpen(!inputsPanelOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50 transition-colors"
        >
          <h3 className="font-semibold text-blue-900">Customize Scenario</h3>
          {inputsPanelOpen ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
        </button>

        {inputsPanelOpen && (
          <div className="p-4 pt-0 space-y-4 border-t border-blue-100">
            {/* Baseline + Contract Lock */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Baseline</label>
                <input
                  type="number"
                  min={1000}
                  max={200000}
                  step={500}
                  value={baseline}
                  disabled={contractLocked}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v >= 1000 && v <= 200000) setBaseline(v)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-40 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <button
                onClick={toggleLock}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contractLocked
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {contractLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {contractLocked ? 'Unlock Contract' : 'Lock Contract'}
              </button>
            </div>

            {/* Stream Editor */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Streams (auto-sums to baseline)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {streams.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={s.name}
                      disabled={contractLocked}
                      onChange={(e) => updateStream(i, 'name', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <input
                      type="number"
                      value={s.monthlyAmount}
                      disabled={contractLocked}
                      min={0}
                      step={100}
                      onChange={(e) => updateStream(i, 'monthlyAmount', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Presets + Custom */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Annual Growth Target <span className="text-gray-400 font-normal">(compound annual growth %)</span></label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SCENARIOS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => selectPreset(s.value)}
                    disabled={contractLocked}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      growthPercent === s.value
                        ? 'bg-blue-700 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Custom %"
                    value={customGrowth}
                    disabled={contractLocked}
                    onChange={(e) => setCustomGrowth(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyCustomGrowth()}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-24 text-sm disabled:bg-gray-100"
                  />
                  <button
                    onClick={applyCustomGrowth}
                    disabled={contractLocked}
                    className="px-3 py-2 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Start Month/Year + Projection Length */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Month</label>
                <select
                  value={startMonth}
                  disabled={contractLocked}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Year</label>
                <input
                  type="number"
                  value={startYear}
                  disabled={contractLocked}
                  min={2024}
                  max={2030}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-24 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Projection Length</label>
                <select
                  value={projectionMonths}
                  disabled={contractLocked}
                  onChange={(e) => setProjectionMonths(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                  <option value={36}>36 Months (3 Years)</option>
                  <option value={48}>48 Months (4 Years)</option>
                  <option value={60}>60 Months (5 Years)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Tabs */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Calculator */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* Table 1A: Scenario Comparison */}
          <div className="card">
            <SectionHeader id="table-1a" label="Table 1A" title="Scenario Comparison (Year 1 - Premium Rates)" />
            <p className="px-4 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-100">
              Formula: Uplift &times; TierRate = Growth Fee <RefBadge id="table-3a" label="see Table 3A" />
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th className="text-right">Total Revenue</th>
                    <th className="text-right">Total Fees</th>
                    <th className="text-right">Client Keeps</th>
                    <th className="text-right">Avg/Mo Fee</th>
                    <th className="text-right">Eff. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioComparisons.map((s) => (
                    <tr key={s.label} className={s.growthPercent === growthPercent ? 'bg-blue-50' : ''}>
                      <td className="font-medium">{s.label}</td>
                      <td className="text-right">{formatCurrency(s.totalRevenue)}</td>
                      <td className="text-right text-blue-600">{formatCurrency(s.totalFees)}</td>
                      <td className="text-right text-green-600">{formatCurrency(s.clientKeeps)}</td>
                      <td className="text-right">{formatCurrency(s.avgMonthlyFee)}</td>
                      <td className="text-right">{s.effectiveRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Component Cards */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Fee Breakdown: {growthLabel}</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-gray-500 uppercase">Foundation</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(y1Projection.summary.totalFoundationFees)}
                </p>
                <p className="text-xs text-gray-400">$0 Year 1 (Grand Slam)</p>
                <p className="text-[10px] text-gray-400 mt-1">= Baseline &times; {formatPercent(categoryInfo.foundationFeeRate)} annual</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-500 uppercase">Sustaining</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(y1Projection.summary.totalSustainingFees)}
                </p>
                <p className="text-xs text-gray-400">$0 Year 1</p>
                <p className="text-[10px] text-gray-400 mt-1">= LastYrAvgFee - Foundation/12</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 uppercase">Growth</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(y1Projection.summary.totalGrowthFees)}
                </p>
                <p className="text-xs text-gray-400">Premium rates Y1</p>
                <p className="text-[10px] text-gray-400 mt-1">= &Sigma;(UpliftInTier &times; TierRate)</p>
              </div>
            </div>
          </div>

          {/* Table 2A: Monthly Projection */}
          <div className="card">
            <SectionHeader id="table-2a" label="Table 2A" title={`Monthly Projection (${growthLabel})`} />
            <div className="table-container max-h-[400px] overflow-auto">
              <table className="table">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Seasonal</th>
                    <th className="text-right">Baseline</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Uplift</th>
                    <th className="text-right">Growth %</th>
                    <th className="text-right">Growth Fee</th>
                    <th className="text-right">Foundation</th>
                    <th className="text-right">Sustaining</th>
                    <th className="text-right">Total Fee</th>
                    <th className="text-right">Year Cumul.</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows: React.ReactNode[] = []
                    let yearCumulFee = 0
                    let yrRevenue = 0, yrUplift = 0, yrGrowth = 0, yrFoundation = 0, yrSustaining = 0, yrTotal = 0
                    let yearNum = 1

                    const flushYear = () => {
                      rows.push(
                        <tr key={`yr-total-${yearNum}`} className="bg-blue-100 font-semibold border-t border-blue-300">
                          <td className="text-blue-800">Year {yearNum} Total</td>
                          <td></td><td></td>
                          <td className="text-right">{formatCurrency(yrRevenue)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(yrUplift)}</td>
                          <td></td>
                          <td className="text-right text-green-600">{formatCurrency(yrGrowth)}</td>
                          <td className="text-right text-amber-600">{formatCurrency(yrFoundation)}</td>
                          <td className="text-right text-purple-600">{formatCurrency(yrSustaining)}</td>
                          <td className="text-right font-bold text-blue-700">{formatCurrency(yrTotal)}</td>
                          <td className="text-right font-bold">{formatCurrency(yrTotal)}</td>
                        </tr>
                      )
                    }

                    y1Projection.projections.forEach((row, i) => {
                      if (row.isYearStart && i > 0) {
                        flushYear()
                        yearNum++
                        yearCumulFee = 0
                        yrRevenue = 0; yrUplift = 0; yrGrowth = 0; yrFoundation = 0; yrSustaining = 0; yrTotal = 0
                      }
                      yearCumulFee += row.totalMonthlyFee
                      yrRevenue += row.projectedRevenue; yrUplift += row.uplift
                      yrGrowth += row.growthFee; yrFoundation += row.foundationFee
                      yrSustaining += row.sustainingFee; yrTotal += row.totalMonthlyFee
                      rows.push(
                        <tr key={row.monthLabel} className={row.isYearStart ? 'bg-blue-50 border-t-2 border-blue-300' : ''}>
                          <td>{row.monthLabel}</td>
                          <td className="text-right text-gray-400 text-xs">{row.seasonalIndex.toFixed(2)}</td>
                          <td className="text-right text-gray-500">{formatCurrency(row.currentBaseline)}</td>
                          <td className="text-right">{formatCurrency(row.projectedRevenue)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(row.uplift)}</td>
                          <td className="text-right text-blue-600">{formatGrowthPercentage(row.growthPercentage)}</td>
                          <td className="text-right text-green-600">{formatCurrency(row.growthFee)}</td>
                          <td className="text-right text-amber-600">{formatCurrency(row.foundationFee)}</td>
                          <td className="text-right text-purple-600">{formatCurrency(row.sustainingFee)}</td>
                          <td className="text-right font-medium text-blue-700">{formatCurrency(row.totalMonthlyFee)}</td>
                          <td className="text-right font-medium">{formatCurrency(yearCumulFee)}</td>
                        </tr>
                      )
                      if (i === y1Projection.projections.length - 1) flushYear()
                    })
                    return rows
                  })()}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                  <tr>
                    <td>GRAND TOTAL</td>
                    <td className="text-right"></td>
                    <td className="text-right"></td>
                    <td className="text-right">{formatCurrency(y1Projection.summary.totalProjectedRevenue)}</td>
                    <td className="text-right text-blue-600">{formatCurrency(y1Projection.projections.reduce((s, p) => s + p.uplift, 0))}</td>
                    <td className="text-right"></td>
                    <td className="text-right text-green-600">{formatCurrency(y1Projection.summary.totalGrowthFees)}</td>
                    <td className="text-right text-amber-600">{formatCurrency(y1Projection.summary.totalFoundationFees)}</td>
                    <td className="text-right text-purple-600">{formatCurrency(y1Projection.summary.totalSustainingFees)}</td>
                    <td className="text-right font-bold text-blue-700">{formatCurrency(y1Projection.summary.totalFees)}</td>
                    <td className="text-right font-bold">{formatCurrency(y1Projection.summary.totalFees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Chart 1B: Revenue Projection */}
          <div className="card p-6">
            <SectionHeader id="chart-1b" label="Chart 1B" title="Revenue vs Baseline Projection" />
            <div className="mt-4">
              <RevenueChart data={chartData} showBaseline showFee />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Financials */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Table 5A: Invoice Breakdown */}
          <div className="card">
            <SectionHeader id="table-5a" label="Table 5A" title="Monthly Invoice Breakdown" />
            <p className="px-4 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-100">
              What you pay us vs. what you keep &mdash; every month, transparent.
            </p>
            <div className="table-container max-h-[500px] overflow-auto">
              <table className="table text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Baseline</th>
                    <th className="text-right">Uplift</th>
                    <th className="text-right bg-blue-50">Growth Fee</th>
                    <th className="text-right bg-blue-50">Foundation</th>
                    <th className="text-right bg-blue-50">Sustaining</th>
                    <th className="text-right bg-blue-50 font-bold">Total Due</th>
                    <th className="text-right bg-green-50 font-bold">You Keep</th>
                    <th className="text-right bg-blue-50">Cumul. Fees</th>
                    <th className="text-right bg-green-50">Cumul. Kept</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let cumulFees = 0
                    let cumulKept = 0
                    return fullProjection.projections.map((row) => {
                      const youKeep = row.projectedRevenue - row.totalMonthlyFee
                      cumulFees += row.totalMonthlyFee
                      cumulKept += youKeep
                      return (
                        <tr key={row.monthLabel} className={row.isYearStart ? 'bg-blue-50 border-t-2 border-blue-300' : ''}>
                          <td>{row.monthLabel}</td>
                          <td className="text-right">{formatCurrency(row.projectedRevenue)}</td>
                          <td className="text-right text-gray-500">{formatCurrency(row.currentBaseline)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(row.uplift)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(row.growthFee)}</td>
                          <td className="text-right text-amber-600">{formatCurrency(row.foundationFee)}</td>
                          <td className="text-right text-purple-600">{formatCurrency(row.sustainingFee)}</td>
                          <td className="text-right font-bold text-blue-700">{formatCurrency(row.totalMonthlyFee)}</td>
                          <td className="text-right font-bold text-green-600">{formatCurrency(youKeep)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(cumulFees)}</td>
                          <td className="text-right text-green-600">{formatCurrency(cumulKept)}</td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                  <tr>
                    <td>TOTALS</td>
                    <td className="text-right">{formatCurrency(fullProjection.summary.totalProjectedRevenue)}</td>
                    <td className="text-right text-gray-500">{formatCurrency(baseline * fullProjection.projections.length)}</td>
                    <td className="text-right text-blue-600">{formatCurrency(fullProjection.projections.reduce((s, p) => s + p.uplift, 0))}</td>
                    <td className="text-right text-blue-600">{formatCurrency(fullProjection.summary.totalGrowthFees)}</td>
                    <td className="text-right text-amber-600">{formatCurrency(fullProjection.summary.totalFoundationFees)}</td>
                    <td className="text-right text-purple-600">{formatCurrency(fullProjection.summary.totalSustainingFees)}</td>
                    <td className="text-right font-bold text-blue-700">{formatCurrency(fullProjection.summary.totalFees)}</td>
                    <td className="text-right font-bold text-green-600">{formatCurrency(fullProjection.summary.totalProjectedRevenue - fullProjection.summary.totalFees)}</td>
                    <td className="text-right text-blue-700">{formatCurrency(fullProjection.summary.totalFees)}</td>
                    <td className="text-right text-green-600">{formatCurrency(fullProjection.summary.totalProjectedRevenue - fullProjection.summary.totalFees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* How We Both Win — one card per year */}
          {fullProjection.yearSummaries.map((yr) => {
            const isY1 = yr.yearNumber === 1
            const baselineAnnual = yr.startBaseline * 12
            const revenueGained = yr.totalRevenue - baselineAnnual
            const feesPaid = yr.totalFees
            const netGain = revenueGained - feesPaid
            const roiMultiple = feesPaid > 0 ? (netGain / feesPaid).toFixed(1) : 'N/A'
            const costPerDollar = revenueGained > 0 ? (feesPaid / revenueGained).toFixed(2) : 'N/A'
            return (
              <div key={yr.yearNumber} className="card p-6">
                <h3 className="font-semibold text-blue-900 mb-1">
                  How We Both Win (Year {yr.yearNumber})
                  {isY1 && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Grand Slam</span>}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Baseline: {formatCurrency(yr.startBaseline)}/mo &middot; {growthLabel}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What you pay us */}
                  <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3">What You Pay Us</h4>
                    <div className="space-y-2 text-sm">
                      {!isY1 && yr.foundationFeeAnnual > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Foundation Fee</span>
                          <span className="font-medium text-amber-600">{formatCurrency(yr.foundationFeeAnnual)}</span>
                        </div>
                      )}
                      {!isY1 && yr.sustainingFeeTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sustaining Fee</span>
                          <span className="font-medium text-purple-600">{formatCurrency(yr.sustainingFeeTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Growth Fees</span>
                        <span className="font-medium text-green-600">{formatCurrency(yr.growthFeeTotal)}</span>
                      </div>
                      {isY1 && (
                        <p className="text-xs text-blue-500 italic">Year 1 Grand Slam: no Foundation or Sustaining fees</p>
                      )}
                      <hr className="border-blue-200" />
                      <div className="flex justify-between font-bold text-blue-800">
                        <span>Total Year {yr.yearNumber} Fees</span>
                        <span>{formatCurrency(feesPaid)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Avg Monthly Fee</span>
                        <span>{formatCurrency(yr.avgMonthlyFee)}/mo</span>
                      </div>
                    </div>
                  </div>
                  {/* What you keep */}
                  <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                    <h4 className="font-bold text-green-800 mb-3">What You Keep</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue</span>
                        <span className="font-medium">{formatCurrency(yr.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Existing Baseline ({formatCurrency(yr.startBaseline)}/mo &times; 12)</span>
                        <span className="font-medium text-gray-500">({formatCurrency(baselineAnnual)})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Revenue Generated</span>
                        <span className="font-medium text-green-700">{formatCurrency(revenueGained)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Less: Fees Paid</span>
                        <span className="font-medium text-blue-600">({formatCurrency(feesPaid)})</span>
                      </div>
                      <hr className="border-green-200" />
                      <div className="flex justify-between font-bold text-green-800">
                        <span>Net New Income After Fees</span>
                        <span>{formatCurrency(netGain)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ROI summary row */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500">Avg Monthly Fee</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(yr.avgMonthlyFee)}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-500">ROI Multiple</p>
                    <p className="text-lg font-bold text-green-700">{roiMultiple}x</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-500">Cost per $1 of Growth</p>
                    <p className="text-lg font-bold text-purple-700">${costPerDollar}</p>
                  </div>
                </div>
                {isY1 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Formula:</p>
                    <p className="font-mono text-xs text-gray-600">ROI = (Revenue Gained - Fees Paid) / Fees Paid</p>
                    <p className="text-gray-500 mt-2">
                      Our fee structure is performance-based: we only earn more when MC Racing earns more. In Year 1 (Grand Slam),
                      there are no foundation or sustaining fees &mdash; MC Racing only pays growth fees on actual uplift.
                      For a micro business, high growth rates are needed to make the partnership worthwhile for both sides.
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Table 4A: Year-by-Year P&L */}
          <div className="card">
            <SectionHeader id="table-4a" label="Table 4A" title={`Year-by-Year P&L (${growthLabel})`} />
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th className="text-right">Baseline</th>
                    <th className="text-right">Total Revenue</th>
                    <th className="text-right">Foundation</th>
                    <th className="text-right">Sustaining</th>
                    <th className="text-right">Growth Fees</th>
                    <th className="text-right font-bold">Total Fees</th>
                    <th className="text-right font-bold text-green-700">Net to Client</th>
                    <th className="text-right">Avg/Mo Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {fullProjection.yearSummaries.map((year) => (
                    <tr key={year.yearNumber}>
                      <td className="font-medium">Year {year.yearNumber}</td>
                      <td className="text-right text-gray-500">{formatCurrency(year.startBaseline)}</td>
                      <td className="text-right">{formatCurrency(year.totalRevenue)}</td>
                      <td className="text-right text-amber-600">{formatCurrency(year.foundationFeeAnnual)}</td>
                      <td className="text-right text-purple-600">
                        {year.sustainingFeeTotal > 0 ? formatCurrency(year.sustainingFeeTotal) : '-'}
                      </td>
                      <td className="text-right text-green-600">{formatCurrency(year.growthFeeTotal)}</td>
                      <td className="text-right font-semibold text-blue-700">{formatCurrency(year.totalFees)}</td>
                      <td className="text-right font-semibold text-green-600">{formatCurrency(year.totalRevenue - year.totalFees)}</td>
                      <td className="text-right text-blue-600">{formatCurrency(year.avgMonthlyFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4B: Baseline Resets */}
          {fullProjection.baselineResets.length > 0 && (
            <div className="card">
              <SectionHeader id="table-4b" label="Table 4B" title="Baseline Resets" />
              <p className="px-4 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-100">
                Formula: New = Old + (AvgUplift &times; RetentionRate%) &rarr; <RefBadge id="table-3b" label="see Table 3B" />
              </p>
              <div className="p-4 space-y-3">
                {fullProjection.baselineResets.map((reset, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="font-semibold text-blue-900 mb-2">
                      Year {reset.yearNumber} Start ({reset.monthLabel})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600 text-xs">Previous Baseline</p>
                        <p className="font-medium">{formatCurrency(reset.oldBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">New Baseline</p>
                        <p className="font-medium text-blue-800">{formatCurrency(reset.newBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Last Year Avg Fee</p>
                        <p className="font-medium">{formatCurrency(reset.lastYearAvgFee)}</p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Sustaining Fee</p>
                        <p className="font-semibold text-blue-800">{formatCurrency(reset.newSustainingFee)}/mo</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Analytics */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnalyticsMode('demo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                analyticsMode === 'demo' ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
              }`}
            >
              <WifiOff className="h-4 w-4" /> Demo Mode
            </button>
            <button
              onClick={() => setAnalyticsMode('live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                analyticsMode === 'live' ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Wifi className="h-4 w-4" /> Live Mode
            </button>
          </div>

          {analyticsMode === 'live' && (
            <div className="card p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4">Connect Real Data Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">M</div>
                  <div>
                    <p className="font-semibold text-blue-900">Connect Metricool</p>
                    <p className="text-xs text-gray-500">Social media analytics &amp; scheduling</p>
                    <span className="text-[10px] text-blue-500 font-medium">COMING SOON</span>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">Mo</div>
                  <div>
                    <p className="font-semibold text-blue-900">Connect Monday.com</p>
                    <p className="text-xs text-gray-500">Project management &amp; lead tracking</p>
                    <span className="text-[10px] text-blue-500 font-medium">COMING SOON</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">When live integrations are active, demo data will be replaced with real metrics.</p>
            </div>
          )}

          {/* Chart 6A: Marketing Funnel */}
          <div className="card">
            <SectionHeader id="chart-6a" label="Chart 6A" title="Marketing Funnel" />
            <div className="p-6">
              <div className="flex flex-col items-center gap-1">
                {[
                  { label: 'Impressions', value: MOCK_FUNNEL.impressions, color: 'bg-blue-100 text-blue-800', width: 'w-full' },
                  { label: 'Clicks', value: MOCK_FUNNEL.clicks, color: 'bg-blue-200 text-blue-900', width: 'w-5/6' },
                  { label: 'Leads', value: MOCK_FUNNEL.leads, color: 'bg-blue-400 text-white', width: 'w-3/5' },
                  { label: 'Closed Deals', value: MOCK_FUNNEL.deals, color: 'bg-blue-600 text-white', width: 'w-2/5' },
                  { label: 'Revenue', value: MOCK_FUNNEL.revenue, color: 'bg-blue-800 text-white', width: 'w-1/4' },
                ].map((step) => (
                  <div key={step.label} className={`${step.width} ${step.color} rounded-lg p-3 text-center transition-all`}>
                    <p className="text-xs font-medium opacity-80">{step.label}</p>
                    <p className="text-lg font-bold">
                      {step.label === 'Revenue' ? formatCurrency(step.value) : step.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-xs text-gray-500">
                Conversion: {((MOCK_FUNNEL.clicks / MOCK_FUNNEL.impressions) * 100).toFixed(1)}% CTR &rarr;
                {((MOCK_FUNNEL.leads / MOCK_FUNNEL.clicks) * 100).toFixed(1)}% Lead Rate &rarr;
                {((MOCK_FUNNEL.deals / MOCK_FUNNEL.leads) * 100).toFixed(0)}% Close Rate
              </div>
            </div>
          </div>

          {/* Table 6B: Ad Performance */}
          <div className="card">
            <SectionHeader id="table-6b" label="Table 6B" title="Ad Performance by Channel" />
            <div className="table-container">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th className="text-right">Spend</th>
                    <th className="text-right">Impressions</th>
                    <th className="text-right">Clicks</th>
                    <th className="text-right">CTR</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">CPL</th>
                    <th className="text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AD_CHANNELS.map((ch) => (
                    <tr key={ch.channel}>
                      <td className="font-medium">{ch.channel}</td>
                      <td className="text-right">{formatCurrency(ch.spend)}</td>
                      <td className="text-right">{ch.impressions.toLocaleString()}</td>
                      <td className="text-right">{ch.clicks.toLocaleString()}</td>
                      <td className="text-right">{((ch.clicks / ch.impressions) * 100).toFixed(1)}%</td>
                      <td className="text-right">{ch.leads}</td>
                      <td className="text-right">{formatCurrency(ch.cpl)}</td>
                      <td className="text-right font-semibold text-green-600">{ch.roas}x</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold border-t">
                  <tr>
                    <td>Total</td>
                    <td className="text-right">{formatCurrency(totalAdSpend)}</td>
                    <td className="text-right">{MOCK_AD_CHANNELS.reduce((s, c) => s + c.impressions, 0).toLocaleString()}</td>
                    <td className="text-right">{MOCK_AD_CHANNELS.reduce((s, c) => s + c.clicks, 0).toLocaleString()}</td>
                    <td className="text-right">{((MOCK_AD_CHANNELS.reduce((s, c) => s + c.clicks, 0) / MOCK_AD_CHANNELS.reduce((s, c) => s + c.impressions, 0)) * 100).toFixed(1)}%</td>
                    <td className="text-right">{MOCK_AD_CHANNELS.reduce((s, c) => s + c.leads, 0)}</td>
                    <td className="text-right">{formatCurrency(Math.round(totalAdSpend / MOCK_AD_CHANNELS.reduce((s, c) => s + c.leads, 0)))}</td>
                    <td className="text-right text-green-600">{marketingROAS}x</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Table 6C: Social & SEO */}
          <div className="card">
            <SectionHeader id="table-6c" label="Table 6C" title="Social, SEO & Reviews" />
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-900 text-sm mb-3">Social Media</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Followers</span><span className="font-medium">{MOCK_SOCIAL_SEO.social.followers.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Engagement Rate</span><span className="font-medium">{MOCK_SOCIAL_SEO.social.engagementRate}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Posts/Month</span><span className="font-medium">{MOCK_SOCIAL_SEO.social.postsPerMonth}</span></div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 text-sm mb-3">SEO</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Domain Authority</span><span className="font-medium">{MOCK_SOCIAL_SEO.seo.domainAuthority}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Keywords Ranked</span><span className="font-medium">{MOCK_SOCIAL_SEO.seo.keywordsRanked}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Organic Traffic</span><span className="font-medium">{MOCK_SOCIAL_SEO.seo.organicTraffic.toLocaleString()}/mo</span></div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-green-900 text-sm mb-3">Reviews</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Google Rating</span><span className="font-medium">{MOCK_SOCIAL_SEO.reviews.googleRating} / 5.0</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Review Count</span><span className="font-medium">{MOCK_SOCIAL_SEO.reviews.reviewCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Response Rate</span><span className="font-medium">{MOCK_SOCIAL_SEO.reviews.responseRate}%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Marketing → Revenue Connection */}
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4">Marketing &rarr; Revenue Connection</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Total Ad Spend/mo</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(totalAdSpend)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Revenue Generated</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(MOCK_FUNNEL.revenue)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Avg Monthly Fee</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(fullProjection.yearSummaries.length > 0 ? fullProjection.yearSummaries[0].avgMonthlyFee : 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-600">ROAS = (Revenue - Baseline) / Ad Spend = ({formatCurrency(MOCK_FUNNEL.revenue)} - {formatCurrency(baseline)}) / {formatCurrency(totalAdSpend)} = {marketingROAS}x</p>
              <p className="mt-2 text-gray-600 font-medium">
                For every $1 spent on marketing, MC Racing earned ${marketingROAS} in new revenue above baseline.
              </p>
            </div>
          </div>

          {/* Chart 2B: Seasonal Factors */}
          <div className="card p-6">
            <SectionHeader id="chart-2b" label="Chart 2B" title="Seasonal Factors: Sim Racing Industry" />
            <div className="grid grid-cols-12 gap-1 items-end h-48 mt-4">
              {seasonalFactors.map((factor, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${factor >= 1.0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                    style={{ height: `${(factor / 1.5) * 100}%` }}
                  />
                  <p className="text-xs mt-1 text-gray-500">{MONTH_NAMES[i]}</p>
                  <p className="text-xs font-medium">{factor.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Sim Racing peaks in winter (Jan: 1.20) as an indoor activity, dips in summer (May: 0.85). Opposite pattern to outdoor entertainment.
            </p>
          </div>

          {/* Table 3A: Tier Rates */}
          <div className="card">
            <SectionHeader id="table-3a" label="Table 3A" title="Growth Fee Tier Rates (Micro Category)" />
            <div className="table-container">
              <table className="table text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th>Tier</th>
                    <th>Growth Range</th>
                    <th className="text-center">Year 1 (Premium)</th>
                    <th className="text-center">Year 2+ (Standard)</th>
                  </tr>
                </thead>
                <tbody>
                  {y1CategoryInfo.tiers.map((tier, i) => {
                    const y2Tier = categoryInfo.tiers[i]
                    return (
                      <tr key={tier.tierNumber} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                        <td className="font-medium">Tier {tier.tierNumber}</td>
                        <td>{tier.label}</td>
                        <td className="text-center text-blue-600 font-semibold">{formatPercent(tier.feeRate)}</td>
                        <td className="text-center text-gray-600">{formatPercent(y2Tier.feeRate)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-800">
                <strong>Micro businesses have the highest rates</strong> because absolute fee amounts are small.
                At {formatCurrency(baseline)} baseline growing 100%, the uplift is only {formatCurrency(baseline)}.
                Higher rates ensure the fee justifies marketing effort.
              </p>
            </div>
          </div>

          {/* Table 3B: Retention Brackets */}
          <div className="card">
            <SectionHeader id="table-3b" label="Table 3B" title="Baseline Retention Brackets" />
            <div className="p-4 space-y-2">
              {RETENTION_BRACKETS.map((b) => (
                <div key={b.label} className="flex justify-between text-sm p-2 bg-blue-50 rounded border border-blue-100">
                  <span className="text-gray-700">{b.label} growth</span>
                  <span className="font-medium text-blue-700">{(b.retentionRate * 100).toFixed(0)}% retained into new baseline</span>
                </div>
              ))}
            </div>
          </div>

          {/* Viability Assessment */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Client Viability Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-lg font-bold text-orange-700">Micro</p>
                <p className="text-xs text-gray-500">&lt;$10K/mo</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-gray-500">Foundation Rate</p>
                <p className="text-lg font-bold text-orange-700">{formatPercent(categoryInfo.foundationFeeRate)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(categoryInfo.foundationFeeAnnual)}/yr</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500">Industry Growth</p>
                <p className="text-lg font-bold text-blue-700">18%/yr</p>
                <p className="text-xs text-gray-500">High growth</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-500">Seasonality</p>
                <p className="text-lg font-bold text-purple-700">Winter Peak</p>
                <p className="text-xs text-gray-500">Indoor activity</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Incubator Client:</strong> MC Racing&apos;s {formatCurrency(baseline)} baseline requires high growth (100%+) to be viable.
                Sim racing&apos;s 18%/yr natural growth is favorable, but significant marketing effort
                is needed to hit the 100-200% growth targets that make this profitable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: How It Works */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'how-it-works' && (
        <div className="space-y-6">
          {/* ── 10-Step Walkthrough ── */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">How The Grand Slam Model Works for MC Racing</h2>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Establish the Baseline</h3>
                  <p className="text-gray-600 mt-1">
                    MC Racing&apos;s current monthly revenue is <strong>{formatCurrency(baseline)}/month</strong>.
                    This is the starting point &mdash; fees are only charged on revenue <em>above</em> this amount.
                  </p>
                  <div className="mt-2 bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium">Revenue Streams:</p>
                    {streams.map((s) => (
                      <p key={s.name} className="text-gray-600">{s.name}: {formatCurrency(s.monthlyAmount)}/mo</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Classify the Business</h3>
                  <p className="text-gray-600 mt-1">
                    At {formatCurrency(baseline)}/mo, MC Racing falls in the <strong>Micro (&lt;$10K)</strong> category
                    with a {formatPercent(categoryInfo.foundationFeeRate)} foundation rate. Micro businesses have the highest
                    growth fee rates because absolute fee amounts are small.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 1: Grand Slam (Zero Risk)</h3>
                  <p className="text-gray-600 mt-1">
                    In Year 1, there&apos;s <strong>no Foundation Fee</strong> and <strong>no Sustaining Fee</strong>.
                    MC Racing only pays when they grow. If marketing doesn&apos;t work, they pay nothing.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tiered Growth Fees</h3>
                  <p className="text-gray-600 mt-1">
                    Growth fees are calculated in tiers. At your selected <strong>{growthLabel} annual</strong> target:
                  </p>
                  <div className="mt-2 bg-blue-50 rounded-lg p-3 text-sm font-mono border border-blue-100">
                    <p>Baseline: {formatCurrency(baseline)}/mo</p>
                    <p>Revenue at {growthLabel}: {formatCurrency(baseline * (1 + growthPercent))}/mo (end-of-year)</p>
                    <p>Max Monthly Uplift: {formatCurrency(baseline * growthPercent)}</p>
                    {growthPercent <= 0.5 ? (
                      <>
                        <p className="mt-2">Tier 1 (0-50%): {formatCurrency(baseline * growthPercent)} &times; {formatPercent(y1CategoryInfo.tiers[0].feeRate)} = {formatCurrency(Math.round(baseline * growthPercent * y1CategoryInfo.tiers[0].feeRate))}</p>
                        <p className="font-bold text-blue-700">Growth Fee: {formatCurrency(Math.round(baseline * growthPercent * y1CategoryInfo.tiers[0].feeRate))}</p>
                      </>
                    ) : growthPercent <= 1.0 ? (
                      <>
                        <p className="mt-2">Tier 1 (0-50%): {formatCurrency(baseline * 0.5)} &times; {formatPercent(y1CategoryInfo.tiers[0].feeRate)} = {formatCurrency(Math.round(baseline * 0.5 * y1CategoryInfo.tiers[0].feeRate))}</p>
                        <p>Tier 2 (51-100%): {formatCurrency(baseline * (growthPercent - 0.5))} &times; {formatPercent(y1CategoryInfo.tiers[1].feeRate)} = {formatCurrency(Math.round(baseline * (growthPercent - 0.5) * y1CategoryInfo.tiers[1].feeRate))}</p>
                        <p className="font-bold text-blue-700">Growth Fee: {formatCurrency(Math.round(baseline * 0.5 * y1CategoryInfo.tiers[0].feeRate + baseline * (growthPercent - 0.5) * y1CategoryInfo.tiers[1].feeRate))}</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2">Tier 1 (0-50%): {formatCurrency(baseline * 0.5)} &times; {formatPercent(y1CategoryInfo.tiers[0].feeRate)}</p>
                        <p>Tier 2 (51-100%): {formatCurrency(baseline * 0.5)} &times; {formatPercent(y1CategoryInfo.tiers[1].feeRate)}</p>
                        <p>Tier 3 (101%+): remaining uplift at {formatPercent(y1CategoryInfo.tiers[2].feeRate)}</p>
                        <p className="text-xs text-gray-500 mt-1">See the full worked example below for exact breakdown.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seasonal Adjustments</h3>
                  <p className="text-gray-600 mt-1">
                    Sim Racing is an indoor activity &mdash; it peaks in <strong>winter (Jan: 1.20x)</strong> and dips in
                    <strong> summer (May: 0.85x)</strong>. This is the opposite pattern of outdoor entertainment.
                    Revenue projections adjust for this natural cycle.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">6</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 1 Summary</h3>
                  <p className="text-gray-600 mt-1">
                    At {growthLabel} annual growth rate with {formatCurrency(baseline)}/mo baseline:
                  </p>
                  {fullProjection.yearSummaries.length > 0 && (() => {
                    const yr1 = fullProjection.yearSummaries[0]
                    return (
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Year 1 Revenue</p>
                          <p className="font-bold text-blue-700">{formatCurrency(yr1.totalRevenue)}</p>
                          <p className="text-xs text-gray-400">vs {formatCurrency(yr1.startBaseline * 12)} baseline</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Year 1 Fees (Growth only)</p>
                          <p className="font-bold text-purple-600">{formatCurrency(yr1.totalFees)}</p>
                          <p className="text-xs text-gray-400">avg {formatCurrency(yr1.avgMonthlyFee)}/mo</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Client Keeps</p>
                          <p className="font-bold text-green-600">{formatCurrency(yr1.totalRevenue - yr1.totalFees)}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(yr1.totalRevenue - yr1.totalFees - yr1.startBaseline * 12)} new income</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">7</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2: Baseline Reset</h3>
                  <p className="text-gray-600 mt-1">
                    At the start of Year 2, the baseline is reset upward. A portion of the growth is &quot;retained&quot;
                    into the new baseline based on performance brackets (20-60% retention).
                  </p>
                  <div className="mt-2 bg-blue-50 rounded-lg p-3 text-sm font-mono border border-blue-100">
                    <p>New Baseline = Old + (AvgUplift &times; RetentionRate%)</p>
                  </div>
                </div>
              </div>

              {/* Step 8 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">8</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2: Three-Part Fee Model</h3>
                  <p className="text-gray-600 mt-1">
                    From Year 2, all three components apply: Foundation Fee ({formatPercent(categoryInfo.foundationFeeRate)} annually =
                    {' '}{formatCurrency(categoryInfo.foundationFeeMonthly)}/mo), Sustaining Fee (protects our income),
                    and Growth Fees (at lower standard rates).
                  </p>
                </div>
              </div>

              {/* Step 9 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">9</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Why Micro Rates Are Higher</h3>
                  <p className="text-gray-600 mt-1">
                    MC Racing&apos;s {formatCurrency(baseline)} baseline means even at 100% growth, the uplift is only
                    {' '}{formatCurrency(baseline)}/mo. Higher tier rates ensure the fee justifies our marketing investment.
                    As MC Racing grows past $10K/mo, they&apos;d graduate to the Small category with lower rates.
                  </p>
                </div>
              </div>

              {/* Step 10 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">10</div>
                <div>
                  <h3 className="font-semibold text-gray-900">The Upside for MC Racing</h3>
                  <p className="text-gray-600 mt-1">
                    Sim Racing has an 18%/yr industry growth factor &mdash; one of the highest in our portfolio.
                    A successful marketing campaign could push MC Racing to 200-300% growth,
                    turning a {formatCurrency(baseline)}/mo micro business into a {formatCurrency(baseline * 3)}-{formatCurrency(baseline * 4)}/mo small business within a year.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* FULL REFERENCE: Equations, Rate Tables & Worked Examples */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="border-t-2 border-blue-300 pt-8">
            <h2 className="text-2xl font-bold mb-2">Complete Math Reference</h2>
            <p className="text-gray-600 mb-6">
              Every equation, rate table, and bracket used to calculate MC Racing&apos;s fees.
            </p>
          </div>

          {/* ── Three-Part Fee Overview ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">The Three-Part Fee Model</h3>
            <div className="bg-blue-50 rounded-lg p-4 font-mono text-sm mb-4 border border-blue-200">
              <p className="text-gray-600 mb-2">Total Monthly Fee =</p>
              <p className="ml-4">
                <span className="text-amber-600 font-semibold">Foundation Fee</span>
                {' + '}
                <span className="text-purple-600 font-semibold">Sustaining Fee</span>
                {' + '}
                <span className="text-green-600 font-semibold">Growth Fee</span>
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-semibold text-amber-800">Foundation Fee</p>
                <p className="text-amber-700">Annual minimum based on business size.</p>
                <p className="mt-2 font-mono text-xs bg-white p-2 rounded border">= Baseline &times; 12 &times; Rate &divide; 12</p>
                <p className="text-xs text-amber-600 mt-1">MC Racing: {formatCurrency(baseline)} &times; 12 &times; {formatPercent(categoryInfo.foundationFeeRate)} = {formatCurrency(categoryInfo.foundationFeeAnnual)}/yr ({formatCurrency(categoryInfo.foundationFeeMonthly)}/mo)</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-semibold text-purple-800">Sustaining Fee</p>
                <p className="text-purple-700">Year 2+ income protection.</p>
                <p className="mt-2 font-mono text-xs bg-white p-2 rounded border">= LastYrAvgFee - Foundation/12</p>
                <p className="text-xs text-purple-600 mt-1">If negative, Sustaining = $0</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800">Growth Fee</p>
                <p className="text-green-700">Performance fees on uplift. Tiered rates.</p>
                <p className="mt-2 font-mono text-xs bg-white p-2 rounded border">= &Sigma;(UpliftInTier &times; TierRate)</p>
                <p className="text-xs text-green-600 mt-1">Only on actual uplift above baseline</p>
              </div>
            </div>
          </div>

          {/* ── Core Equations ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Core Equations</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Uplift (Growth Amount)</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Uplift = Current Revenue - Baseline</p>
                <p className="text-xs text-gray-500 mt-1">MC Racing example: {formatCurrency(baseline * 2)} - {formatCurrency(baseline)} = {formatCurrency(baseline)} uplift</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Growth Percentage</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Growth % = (Uplift &divide; Baseline) &times; 100</p>
                <p className="text-xs text-gray-500 mt-1">MC Racing example: ({formatCurrency(baseline)} &divide; {formatCurrency(baseline)}) &times; 100 = 100% growth</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Effective Rate</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Effective Rate = (Total Fees &divide; Total Uplift) &times; 100</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Monthly &harr; Annual Growth Conversion</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Annual % = ((1 + Monthly%)^12 - 1) &times; 100</p>
              </div>
            </div>
          </div>

          {/* ── Foundation Fee Rates by Business Size ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Foundation Fee Rates by Business Size</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Monthly Baseline</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Foundation Rate</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Example Annual Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Micro', range: '$0 - $10K', rate: '3.0%', ex: `${formatCurrency(categoryInfo.foundationFeeAnnual)} (${formatCurrency(baseline)} baseline)`, highlight: true },
                    { cat: 'Small', range: '$10K - $30K', rate: '2.5%', ex: '$6,000 ($20K baseline)', highlight: false },
                    { cat: 'Medium', range: '$30K - $75K', rate: '2.0%', ex: '$12,000 ($50K baseline)', highlight: false },
                    { cat: 'Large', range: '$75K - $150K', rate: '1.5%', ex: '$18,000 ($100K baseline)', highlight: false },
                    { cat: 'Major', range: '$150K - $300K', rate: '1.25%', ex: '$30,000 ($200K baseline)', highlight: false },
                    { cat: 'Enterprise', range: '$300K - $500K', rate: '1.0%', ex: '$48,000 ($400K baseline)', highlight: false },
                    { cat: 'Elite', range: '$500K+', rate: '0.75%', ex: '$54,000 ($600K baseline)', highlight: false },
                  ].map((row, i) => (
                    <tr key={row.cat} className={row.highlight ? 'bg-blue-100 font-semibold' : i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-4 py-2">{row.cat} {row.highlight && <span className="text-blue-700">&larr; MC Racing</span>}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.range}</td>
                      <td className="border border-gray-300 px-4 py-2 text-blue-700 font-semibold">{row.rate}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Y1 Premium Growth Fee Tiers (all categories) ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Year 1 Premium Growth Fee Tiers</h3>
            <p className="text-sm text-gray-600 mb-4">MC Racing&apos;s Micro column is highlighted.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-2 py-2 text-left">Tier</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Growth %</th>
                    <th className="border border-gray-300 px-2 py-2 text-center bg-blue-100">Micro<br /><span className="text-xs font-normal">&lt;$10K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Small<br /><span className="text-xs font-normal">$10-30K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Medium<br /><span className="text-xs font-normal">$30-75K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Large<br /><span className="text-xs font-normal">$75-150K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Major<br /><span className="text-xs font-normal">$150-300K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Enterprise<br /><span className="text-xs font-normal">$300-500K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Elite<br /><span className="text-xs font-normal">$500K+</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tier: 1, range: '0-50%', rates: ['25%', '20%', '15%', '12%', '9%', '6%', '5%'] },
                    { tier: 2, range: '51-100%', rates: ['30%', '25%', '19%', '15%', '12%', '8%', '6%'] },
                    { tier: 3, range: '101-200%', rates: ['35%', '30%', '23%', '18%', '14%', '10%', '7%'] },
                    { tier: 4, range: '201-300%', rates: ['33%', '27%', '21%', '16%', '12%', '9%', '6.5%'] },
                    { tier: 5, range: '301-500%', rates: ['30%', '25%', '19%', '14%', '11%', '8%', '6%'] },
                    { tier: 6, range: '501-750%', rates: ['27%', '22%', '16%', '12%', '10%', '7%', '5%'] },
                    { tier: 7, range: '751-1000%', rates: ['25%', '20%', '14%', '11%', '9%', '6%', '4.5%'] },
                    { tier: 8, range: '1001%+', rates: ['22%', '17%', '12%', '10%', '8%', '5%', '4%'] },
                  ].map((row, i) => (
                    <tr key={row.tier} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-2 py-2 font-semibold">{row.tier}</td>
                      <td className="border border-gray-300 px-2 py-2">{row.range}</td>
                      {row.rates.map((rate, j) => (
                        <td key={j} className={`border border-gray-300 px-2 py-2 text-center ${j === 0 ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600'}`}>
                          {rate}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Why Micro rates are highest:</strong> A {formatCurrency(baseline)} business growing 50% = {formatCurrency(baseline * 0.5)} uplift.
                At 25% rate = {formatCurrency(baseline * 0.5 * 0.25)}/mo fee. Lower rates would not cover the cost of marketing management.
              </p>
            </div>
          </div>

          {/* ── Y2+ Standard Growth Fee Tiers ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Year 2+ Standard Growth Fee Tiers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 px-2 py-2 text-left">Tier</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Growth %</th>
                    <th className="border border-gray-300 px-2 py-2 text-center bg-blue-100">Micro<br /><span className="text-xs font-normal">&lt;$10K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Small<br /><span className="text-xs font-normal">$10-30K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Medium<br /><span className="text-xs font-normal">$30-75K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Large<br /><span className="text-xs font-normal">$75-150K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Major<br /><span className="text-xs font-normal">$150-300K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Enterprise<br /><span className="text-xs font-normal">$300-500K</span></th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Elite<br /><span className="text-xs font-normal">$500K+</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tier: 1, range: '0-50%', rates: ['20%', '15%', '10%', '8%', '6%', '4%', '3%'] },
                    { tier: 2, range: '51-100%', rates: ['25%', '20%', '14%', '11%', '8%', '5.5%', '4%'] },
                    { tier: 3, range: '101-200%', rates: ['30%', '25%', '18%', '14%', '10%', '7%', '5%'] },
                    { tier: 4, range: '201-300%', rates: ['28%', '22%', '16%', '12%', '9%', '6%', '4.5%'] },
                    { tier: 5, range: '301-500%', rates: ['25%', '20%', '14%', '10%', '8%', '5%', '4%'] },
                    { tier: 6, range: '501-750%', rates: ['22%', '18%', '12%', '9%', '7%', '4.5%', '3.5%'] },
                    { tier: 7, range: '751-1000%', rates: ['20%', '15%', '10%', '8%', '6%', '4%', '3%'] },
                    { tier: 8, range: '1001%+', rates: ['18%', '12%', '8%', '7%', '5%', '3.5%', '2.5%'] },
                  ].map((row, i) => (
                    <tr key={row.tier} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-2 py-2 font-semibold">{row.tier}</td>
                      <td className="border border-gray-300 px-2 py-2">{row.range}</td>
                      {row.rates.map((rate, j) => (
                        <td key={j} className={`border border-gray-300 px-2 py-2 text-center ${j === 0 ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600'}`}>
                          {rate}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Growth Fee Worked Example ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Growth Fee Worked Example (MC Racing @ {growthLabel})</h3>
            {(() => {
              const gp = growthPercent
              const uplift = baseline * gp
              const tierBreaks = [0.5, 1.0, 2.0, 3.0, 5.0, 7.5, 10.0]
              const tierRows: { tier: number; rangeLabel: string; amount: number; rate: number; fee: number }[] = []
              let remaining = uplift
              let prevPct = 0
              for (let t = 0; t < y1CategoryInfo.tiers.length && remaining > 0; t++) {
                const capPct = t < tierBreaks.length ? tierBreaks[t] : 999
                const tierCap = baseline * (capPct - prevPct)
                const inTier = Math.min(remaining, tierCap)
                const fee = Math.round(inTier * y1CategoryInfo.tiers[t].feeRate)
                tierRows.push({
                  tier: t + 1,
                  rangeLabel: `${(prevPct * 100).toFixed(0)}-${gp >= capPct ? (capPct * 100).toFixed(0) : (gp * 100).toFixed(0)}%`,
                  amount: inTier,
                  rate: y1CategoryInfo.tiers[t].feeRate,
                  fee,
                })
                remaining -= inTier
                prevPct = capPct
              }
              const totalFee = tierRows.reduce((s, r) => s + r.fee, 0)
              return (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Scenario:</strong> MC Racing ({formatCurrency(baseline)}/mo baseline) at {growthLabel} annual growth — end-of-year month
                    </p>
                    <div className="font-mono text-sm space-y-1">
                      <p>Baseline: {formatCurrency(baseline)}</p>
                      <p>Revenue: {formatCurrency(baseline + uplift)}</p>
                      <p>Uplift: {formatCurrency(uplift)} ({(gp * 100).toFixed(0)}% growth)</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Tier</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Growth Range</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">$ in Tier</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Y1 Rate</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tierRows.map((row, i) => (
                          <tr key={row.tier} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border border-gray-300 px-4 py-2">Tier {row.tier}</td>
                            <td className="border border-gray-300 px-4 py-2">{row.rangeLabel}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(row.amount)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatPercent(row.rate)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-blue-600 font-semibold">{formatCurrency(row.fee)}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-100">
                          <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={4}>Total Growth Fee (peak month)</td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-blue-700 font-bold">
                            {formatCurrency(totalFee)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>

          {/* ── Retention Brackets ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Baseline Reset &amp; Retention Brackets</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
              <p className="font-semibold text-blue-800 mb-2">New Baseline Formula</p>
              <p className="font-mono text-sm bg-white p-3 rounded border border-blue-200">
                New Baseline = Old Baseline + (Avg Monthly Uplift &times; Retention %)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Growth Achieved</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Retention %</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">MC Racing Example ({formatCurrency(baseline)} &rarr; {formatCurrency(baseline * 2)})</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">New Baseline</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION_BRACKETS.map((b, i) => {
                    const exUplift = baseline
                    const retained = exUplift * b.retentionRate
                    return (
                      <tr key={b.label} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2">{b.label}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-700">{(b.retentionRate * 100).toFixed(0)}%</td>
                        <td className="border border-gray-300 px-4 py-2">{formatCurrency(exUplift)} &times; {(b.retentionRate * 100).toFixed(0)}% = {formatCurrency(retained)}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{formatCurrency(baseline + retained)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Sustaining Fee Walkthrough ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Sustaining Fee Calculation</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
              <p className="font-mono text-sm bg-white p-3 rounded border border-blue-200">
                Sustaining Fee = Last Year Avg Monthly Fee - New Foundation Fee (monthly)
              </p>
              <p className="text-xs text-blue-600 mt-2">If result is negative, Sustaining Fee = $0</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
              <p><span className="text-gray-500">Year 1 average fee:</span> {formatCurrency(fullProjection.yearSummaries.length > 0 ? fullProjection.yearSummaries[0].avgMonthlyFee : 0)}/month</p>
              <p><span className="text-gray-500">New baseline (Year 2):</span> {fullProjection.baselineResets.length > 0 ? formatCurrency(fullProjection.baselineResets[0].newBaseline) : 'TBD'}</p>
              {fullProjection.baselineResets.length > 0 && (() => {
                const reset = fullProjection.baselineResets[0]
                const newFoundationMonthly = Math.round(reset.newBaseline * 12 * categoryInfo.foundationFeeRate / 12)
                return (
                  <>
                    <p><span className="text-gray-500">Monthly foundation:</span> <span className="text-amber-600 font-semibold">{formatCurrency(newFoundationMonthly)}</span></p>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <p><span className="text-gray-500">Sustaining fee:</span> {formatCurrency(Math.round(reset.lastYearAvgFee))} - {formatCurrency(newFoundationMonthly)} = <span className="text-purple-600 font-semibold">{formatCurrency(reset.newSustainingFee)}/month</span></p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* ── Y1→Y2 Transition ── */}
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4">MC Racing: Year 1 &rarr; Year 2 Transition</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="font-semibold text-blue-800 mb-3">YEAR 1 (Grand Slam)</p>
                {fullProjection.yearSummaries.length > 0 && (() => {
                  const yr1 = fullProjection.yearSummaries[0]
                  return (
                    <div className="font-mono text-sm space-y-1">
                      <p>Baseline: {formatCurrency(yr1.startBaseline)}/month</p>
                      <p>Growth: {growthLabel} annual</p>
                      <p>Total Revenue: {formatCurrency(yr1.totalRevenue)}</p>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <p className="text-amber-600">Foundation: $0 (Grand Slam)</p>
                        <p className="text-purple-600">Sustaining: $0 (Year 1)</p>
                        <p className="text-green-600">Growth Fees: {formatCurrency(yr1.growthFeeTotal)} total</p>
                        <p className="font-bold text-blue-700 mt-1">Total: {formatCurrency(yr1.totalFees)}</p>
                        <p className="text-gray-500">Avg: {formatCurrency(yr1.avgMonthlyFee)}/month</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="font-semibold text-green-800 mb-3">YEAR 2 (After Reset)</p>
                {fullProjection.baselineResets.length > 0 ? (() => {
                  const reset = fullProjection.baselineResets[0]
                  const y2Summary = fullProjection.yearSummaries.length > 1 ? fullProjection.yearSummaries[1] : null
                  return (
                    <div className="font-mono text-sm space-y-1">
                      <p>Old Baseline: {formatCurrency(reset.oldBaseline)}</p>
                      <p>New Baseline: <span className="font-bold">{formatCurrency(reset.newBaseline)}</span></p>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <p className="text-amber-600">Foundation: {formatCurrency(Math.round(reset.newBaseline * 12 * categoryInfo.foundationFeeRate / 12))}/mo</p>
                        <p className="text-purple-600">Sustaining: {formatCurrency(reset.newSustainingFee)}/mo</p>
                        {y2Summary && (
                          <>
                            <p className="text-green-600">Growth Fees: {formatCurrency(y2Summary.growthFeeTotal)} total</p>
                            <p className="font-bold text-blue-700 mt-1">Total: {formatCurrency(y2Summary.totalFees)}</p>
                            <p className="text-gray-500">Avg: {formatCurrency(y2Summary.avgMonthlyFee)}/month</p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })() : (
                  <p className="text-sm text-gray-500">Extend projection to 24+ months to see Year 2 data.</p>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Key insight:</strong> At high growth rates, MC Racing could graduate from Micro to Small category,
                lowering their growth fee rates. The three-part model ensures fair compensation as the business scales.
              </p>
            </div>
          </div>

          {/* ── Seasonal Factors (inline) ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Seasonal Adjustment Factors: Sim Racing</h3>
            <div className="grid grid-cols-12 gap-1 items-end h-48">
              {seasonalFactors.map((factor, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${factor >= 1.0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                    style={{ height: `${(factor / 1.5) * 100}%` }}
                  />
                  <p className="text-xs mt-1 text-gray-500">{MONTH_NAMES[i]}</p>
                  <p className="text-xs font-medium">{factor.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-600">Seasonal Revenue = Base Revenue &times; Seasonal Factor</p>
              <p className="text-gray-500 mt-1">
                Peak: January (1.20) &middot; Trough: May (0.85) &middot; Indoor activity = winter-dominant. Opposite of outdoor businesses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
