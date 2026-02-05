'use client'

import { useState, useMemo, useEffect } from 'react'
import { FileSignature, DollarSign, TrendingUp, Megaphone, BarChart3, BookOpen, Sparkles, Lock, ChevronDown, ChevronUp, Wifi, WifiOff, LogOut } from 'lucide-react'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { getSeasonalFactors } from '@/lib/constants/seasonalIndices'
import { RETENTION_BRACKETS } from '@/lib/constants/feeStructure'
import RevenueChart from '@/components/charts/RevenueChart'

// ─── Password Gate ──────────────────────────────────────────────────────────
function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const correctUsername = 'mcracing'
  const correctPassword = 'RacingDreams2025'
  const storageKey = 'client-portal-mc-racing'

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === correctPassword) {
      setAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.toLowerCase() === correctUsername.toLowerCase() && password === correctPassword) {
      localStorage.setItem(storageKey, password)
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect username or password.')
      setPassword('')
    }
  }

  const handleLock = () => {
    localStorage.removeItem(storageKey)
    setAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="w-full max-w-sm mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">MC Racing</h1>
            <p className="text-sm text-gray-500 mb-6">Enter your portal credentials to continue</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Username"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                Enter Portal
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleLock}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Lock Portal
      </button>
      {children}
    </div>
  )
}

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

interface BudgetItem {
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

const DEFAULT_EXPENSES: BudgetItem[] = [
  { name: 'Rent', monthlyAmount: 2200 },
  { name: 'Payroll', monthlyAmount: 1200 },
  { name: 'Utilities', monthlyAmount: 1000 },
  { name: 'Equipment & Repairs', monthlyAmount: 200 },
  { name: 'Marketing & Ads', monthlyAmount: 0 },
  { name: 'Insurance', monthlyAmount: 150 },
]

const PRESET_SCENARIOS = [
  { label: '50%', value: 0.50 },
  { label: '100%', value: 1.00 },
  { label: '200%', value: 2.00 },
  { label: '300%', value: 3.00 },
  { label: '400%', value: 4.00 },
  { label: '500%', value: 5.00 },
]

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  locked?: boolean
}

const TABS: Tab[] = [
  { id: 'contract', label: 'Contract', icon: FileSignature },
  { id: 'profitability', label: 'Profitability', icon: TrendingUp },
  { id: 'market-intel', label: 'Market Intel', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
  { id: 'offer-refiner', label: 'Offer Refiner', icon: Sparkles, locked: true },
]

type TabId = 'contract' | 'profitability' | 'market-intel' | 'analytics' | 'how-it-works' | 'offer-refiner'

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

// ─── Main Content Component ────────────────────────────────────────────────
function MCRacingContent() {
  // ── Fixed contract values (view-only for client) ──
  const baseline = 4000
  const streams = DEFAULT_STREAMS
  const growthPercent = 1.00 // 100% growth target
  const startMonth = 2 // February
  const startYear = 2026
  const projectionMonths = 24
  const expenseBudget = DEFAULT_EXPENSES

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<TabId>('contract')
  const [analyticsMode, setAnalyticsMode] = useState<'demo' | 'live'>('demo')
  const [showProjections, setShowProjections] = useState(false)

  // ── Expense calculations ──
  const totalMonthlyExpenses = expenseBudget.reduce((s, e) => s + e.monthlyAmount, 0)
  const monthlyNetIncome = baseline - totalMonthlyExpenses

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
    projectionMonths: 12,
    isGrandSlam: true,
    applySeasonality: true,
  }), [monthlyGrowthRate, startMonth, startYear])

  const fullProjection = useMemo(() => projectScenario({
    baselineRevenue: baseline,
    industry: 'sim_racing',
    monthlyGrowthRate,
    startMonth,
    startYear,
    projectionMonths: Math.max(projectionMonths, 24),
    isGrandSlam: true,
    applySeasonality: true,
  }), [monthlyGrowthRate, startMonth, startYear, projectionMonths])

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
  }), [startMonth, startYear])

  const growthLabel = `${Math.round(growthPercent * 100)}% Growth`

  // ── Marketing ROI calc ──
  const totalAdSpend = MOCK_AD_CHANNELS.reduce((s, c) => s + c.spend, 0)
  const marketingROAS = ((MOCK_FUNNEL.revenue - baseline) / totalAdSpend).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Header */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="card p-6 bg-gradient-to-r from-blue-700 to-purple-700 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">MC Racing</h1>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/80 text-xs font-bold">
                  <Lock className="h-3 w-3" /> CONTRACT ACTIVE
                </span>
              </div>
              <p className="text-blue-200">Fort Wayne, IN &middot; Sim Racing &middot; {categoryInfo.categoryLabel}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Baseline: {formatCurrency(baseline)}/mo
                </span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Growth Target: {growthLabel}
                </span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Start: {MONTH_NAMES[startMonth - 1]} {startYear}
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Tabs */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto mb-6 border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.locked && setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab.locked
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : activeTab === tab.id
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.locked && <Lock className="h-3 w-3" />}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Contract */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'contract' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Business Model Setup */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Business Model Overview</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Streams Summary */}
              <div>
                <h4 className="text-sm font-semibold text-green-800 mb-2">Revenue Streams</h4>
                <div className="space-y-1">
                  {streams.map((s) => (
                    <div key={s.name} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.name}</span>
                      <span className="font-medium text-green-700">{formatCurrency(s.monthlyAmount)}/mo</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between text-sm font-semibold">
                    <span>Total Revenue</span>
                    <span className="text-green-700">{formatCurrency(baseline)}/mo</span>
                  </div>
                </div>
              </div>
              {/* Expense Budget Summary */}
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-2">Expense Budget</h4>
                <div className="space-y-1">
                  {expenseBudget.map((e) => (
                    <div key={e.name} className="flex justify-between text-sm">
                      <span className="text-gray-600">{e.name}</span>
                      <span className="font-medium text-red-600">{formatCurrency(e.monthlyAmount)}/mo</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between text-sm font-semibold">
                    <span>Total Expenses</span>
                    <span className="text-red-600">{formatCurrency(totalMonthlyExpenses)}/mo</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Monthly Summary */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(baseline)}/mo</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-gray-500">Expenses</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}/mo</p>
                </div>
                <div className={`text-center p-3 rounded-lg border ${monthlyNetIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                  <p className="text-xs text-gray-500">Net Income</p>
                  <p className={`text-lg font-bold ${monthlyNetIncome >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(monthlyNetIncome)}/mo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table 1A: Scenario Comparison */}
          <div className="card">
            <SectionHeader id="table-1a" label="Table 1A" title="Scenario Comparison (Year 1 - Premium Rates)" />
            <p className="px-4 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-100">
              Formula: Uplift &times; TierRate = Growth Fee <RefBadge id="table-3a" label="see Table 3A" />
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Scenario</th>
                    <th className="text-right px-4 py-3">Total Revenue</th>
                    <th className="text-right px-4 py-3">Total Fees</th>
                    <th className="text-right px-4 py-3">Client Keeps</th>
                    <th className="text-right px-4 py-3">Avg/Mo Fee</th>
                    <th className="text-right px-4 py-3">Eff. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scenarioComparisons.map((s) => (
                    <tr key={s.label} className={s.growthPercent === growthPercent ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 font-medium">{s.label}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(s.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(s.totalFees)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrency(s.clientKeeps)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(s.avgMonthlyFee)}</td>
                      <td className="px-4 py-3 text-right">{s.effectiveRate.toFixed(1)}%</td>
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
                <p className="text-xs text-gray-400">$0 Year 1 (Partnership Offer)</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-500 uppercase">Sustaining</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(y1Projection.summary.totalSustainingFees)}
                </p>
                <p className="text-xs text-gray-400">$0 Year 1</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 uppercase">Growth</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(y1Projection.summary.totalGrowthFees)}
                </p>
                <p className="text-xs text-gray-400">Premium rates Y1</p>
              </div>
            </div>
          </div>

          {/* Projections Toggle */}
          <button
            onClick={() => setShowProjections(!showProjections)}
            className="w-full card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-700">Revenue Projection Chart</span>
            {showProjections ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>

          {showProjections && (
            <div className="card p-6">
              <RevenueChart data={chartData} showBaseline showFee />
            </div>
          )}

          {/* Table 5A: Invoice Breakdown */}
          <div className="card">
            <SectionHeader id="table-5a" label="Table 5A" title="Monthly Invoice Breakdown" />
            <p className="px-4 py-2 text-xs text-gray-500 bg-blue-50 border-b border-blue-100">
              What you pay us vs. what you keep &mdash; every month, transparent.
            </p>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Month</th>
                    <th className="text-right px-4 py-3">Revenue</th>
                    <th className="text-right px-4 py-3">Baseline</th>
                    <th className="text-right px-4 py-3">Uplift</th>
                    <th className="text-right px-4 py-3 bg-blue-50">Total Due</th>
                    <th className="text-right px-4 py-3 bg-green-50">You Keep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fullProjection.projections.slice(0, 24).map((row) => {
                    const youKeep = row.projectedRevenue - row.totalMonthlyFee
                    return (
                      <tr key={row.monthLabel} className={row.isYearStart ? 'bg-blue-50 border-t-2 border-blue-300' : ''}>
                        <td className="px-4 py-3">{row.monthLabel}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(row.projectedRevenue)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(row.currentBaseline)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(row.uplift)}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{formatCurrency(row.totalMonthlyFee)}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(youKeep)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Profitability */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profitability' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* How We Both Win — Year 1 */}
          {fullProjection.yearSummaries.slice(0, 2).map((yr) => {
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
                  {isY1 && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Partnership Offer</span>}
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
                        <p className="text-xs text-blue-500 italic">Year 1 Partnership Offer: no Foundation or Sustaining fees</p>
                      )}
                      <hr className="border-blue-200" />
                      <div className="flex justify-between font-bold text-blue-800">
                        <span>Total Year {yr.yearNumber} Fees</span>
                        <span>{formatCurrency(feesPaid)}</span>
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
              </div>
            )
          })}

          {/* Table 4A: Year-by-Year P&L */}
          <div className="card">
            <SectionHeader id="table-4a" label="Table 4A" title={`Year-by-Year P&L (${growthLabel})`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Year</th>
                    <th className="text-right px-4 py-3">Baseline</th>
                    <th className="text-right px-4 py-3">Total Revenue</th>
                    <th className="text-right px-4 py-3">Total Fees</th>
                    <th className="text-right px-4 py-3 text-green-700">Net to Client</th>
                    <th className="text-right px-4 py-3">Avg/Mo Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fullProjection.yearSummaries.map((year) => (
                    <tr key={year.yearNumber}>
                      <td className="px-4 py-3 font-medium">Year {year.yearNumber}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(year.startBaseline)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(year.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(year.totalFees)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(year.totalRevenue - year.totalFees)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(year.avgMonthlyFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Market Intel */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'market-intel' && (
        <div className="max-w-6xl mx-auto space-y-6">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Channel</th>
                    <th className="text-right px-4 py-3">Spend</th>
                    <th className="text-right px-4 py-3">Impressions</th>
                    <th className="text-right px-4 py-3">Clicks</th>
                    <th className="text-right px-4 py-3">Leads</th>
                    <th className="text-right px-4 py-3">CPL</th>
                    <th className="text-right px-4 py-3">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_AD_CHANNELS.map((ch) => (
                    <tr key={ch.channel}>
                      <td className="px-4 py-3 font-medium">{ch.channel}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(ch.spend)}</td>
                      <td className="px-4 py-3 text-right">{ch.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{ch.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{ch.leads}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(ch.cpl)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{ch.roas}x</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold border-t">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totalAdSpend)}</td>
                    <td className="px-4 py-3 text-right">{MOCK_AD_CHANNELS.reduce((s, c) => s + c.impressions, 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{MOCK_AD_CHANNELS.reduce((s, c) => s + c.clicks, 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{MOCK_AD_CHANNELS.reduce((s, c) => s + c.leads, 0)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Math.round(totalAdSpend / MOCK_AD_CHANNELS.reduce((s, c) => s + c.leads, 0)))}</td>
                    <td className="px-4 py-3 text-right text-green-600">{marketingROAS}x</td>
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

          {/* Marketing ROI Summary */}
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
                <p className="text-xs text-gray-500">Marketing ROAS</p>
                <p className="text-xl font-bold text-blue-600">{marketingROAS}x</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-sm">
              <p className="text-gray-600 font-medium">
                For every $1 spent on marketing, MC Racing earned ${marketingROAS} in new revenue above baseline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Analytics */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="max-w-6xl mx-auto space-y-6">
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
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">M</div>
                  <div>
                    <p className="font-semibold text-blue-900">Connect Metricool</p>
                    <p className="text-xs text-gray-500">Social media analytics & scheduling</p>
                    <span className="text-[10px] text-blue-500 font-medium">COMING SOON</span>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">Mo</div>
                  <div>
                    <p className="font-semibold text-blue-900">Connect Monday.com</p>
                    <p className="text-xs text-gray-500">Project management & lead tracking</p>
                    <span className="text-[10px] text-blue-500 font-medium">COMING SOON</span>
                  </div>
                </button>
              </div>
            </div>
          )}

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left px-4 py-3">Tier</th>
                    <th className="text-left px-4 py-3">Growth Range</th>
                    <th className="text-center px-4 py-3">Year 1 (Premium)</th>
                    <th className="text-center px-4 py-3">Year 2+ (Standard)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {y1CategoryInfo.tiers.map((tier, i) => {
                    const y2Tier = categoryInfo.tiers[i]
                    return (
                      <tr key={tier.tierNumber} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium">Tier {tier.tierNumber}</td>
                        <td className="px-4 py-3">{tier.label}</td>
                        <td className="px-4 py-3 text-center text-blue-600 font-semibold">{formatPercent(tier.feeRate)}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{formatPercent(y2Tier.feeRate)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: How It Works */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'how-it-works' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">How The Partnership Model Works for MC Racing</h2>

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
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 1: Partnership Offer (Zero Risk)</h3>
                  <p className="text-gray-600 mt-1">
                    In Year 1, there&apos;s <strong>no Foundation Fee</strong> and <strong>no Sustaining Fee</strong>.
                    MC Racing only pays when they grow. If marketing doesn&apos;t work, they pay nothing.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tiered Growth Fees</h3>
                  <p className="text-gray-600 mt-1">
                    Growth fees are calculated in tiers based on how much you grow. Higher growth = more fees, but you keep the majority of every dollar.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seasonal Adjustments</h3>
                  <p className="text-gray-600 mt-1">
                    Sim Racing is an indoor activity &mdash; it peaks in <strong>winter</strong> and dips in <strong>summer</strong>.
                    Revenue projections adjust for this natural cycle.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 1 Summary</h3>
                  {fullProjection.yearSummaries.length > 0 && (() => {
                    const yr1 = fullProjection.yearSummaries[0]
                    return (
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Year 1 Revenue</p>
                          <p className="font-bold text-blue-700">{formatCurrency(yr1.totalRevenue)}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Year 1 Fees</p>
                          <p className="font-bold text-purple-600">{formatCurrency(yr1.totalFees)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">You Keep</p>
                          <p className="font-bold text-green-600">{formatCurrency(yr1.totalRevenue - yr1.totalFees)}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">6</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2+: Three-Part Fee Model</h3>
                  <p className="text-gray-600 mt-1">
                    From Year 2, all three components apply: Foundation Fee, Sustaining Fee, and Growth Fees (at lower standard rates).
                    The baseline also resets upward based on your growth.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Formula Card */}
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
                <p className="text-amber-700">Annual minimum based on business size. <strong>$0 in Year 1</strong>.</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-semibold text-purple-800">Sustaining Fee</p>
                <p className="text-purple-700">Year 2+ income protection. <strong>$0 in Year 1</strong>.</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800">Growth Fee</p>
                <p className="text-green-700">Performance fees on uplift. Only pay when you grow.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: Offer Refiner (Locked) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'offer-refiner' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Offer Refiner</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              AI-powered offer optimization that analyzes your contract terms, market data, and profitability to suggest refined pricing and growth targets.
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
              <Sparkles className="h-4 w-4" />
              Coming Soon
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page Export ────────────────────────────────────────────────────
export default function MCRacingClientPage() {
  return (
    <PasswordGate>
      <MCRacingContent />
    </PasswordGate>
  )
}
