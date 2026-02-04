'use client'

import { useState, useMemo, useCallback } from 'react'
import { FileSignature, DollarSign, TrendingUp, Megaphone, BarChart3, BookOpen, Sparkles, Lock, Unlock, ChevronDown, ChevronUp, Wifi, WifiOff, ArrowUpCircle, ArrowDownCircle, X, Trash2, Plus } from 'lucide-react'
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

interface BudgetItem {
  name: string
  monthlyAmount: number
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  account: string
  amount: number
  description: string
  date: string
}

// ─── Accounting Accounts ─────────────────────────────────────────────────────
const INCOME_ACCOUNTS = [
  { value: 'drop-in', label: 'Drop-in Sessions' },
  { value: 'parties', label: 'Private Parties' },
  { value: 'memberships', label: 'Memberships' },
  { value: 'leagues', label: 'League Nights' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'other-income', label: 'Other Income' },
]

const EXPENSE_ACCOUNTS = [
  { value: 'equipment', label: 'Equipment & Repairs' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'marketing', label: 'Marketing & Ads' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'software', label: 'Software & Subscriptions' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other-expense', label: 'Other Expense' },
]

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
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'profitability', label: 'Profitability', icon: TrendingUp },
  { id: 'market-intel', label: 'Market Intel', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
  { id: 'offer-refiner', label: 'Offer Refiner', icon: Sparkles, locked: true },
]

type TabId = 'contract' | 'financials' | 'profitability' | 'market-intel' | 'analytics' | 'how-it-works' | 'offer-refiner'

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
  const [startMonth, setStartMonth] = useState(2) // February
  const [startYear, setStartYear] = useState(2026)
  const [projectionMonths, setProjectionMonths] = useState(12)
  const [contractLocked, setContractLocked] = useState(false)
  const [lockDate, setLockDate] = useState<string | null>(null)
  const [inputsPanelOpen, setInputsPanelOpen] = useState(true)

  // ── Expense budget state ──
  const [expenseBudget, setExpenseBudget] = useState<BudgetItem[]>(DEFAULT_EXPENSES)

  // ── Growth target mode ──
  const [growthInputMode, setGrowthInputMode] = useState<'percent' | 'revenue'>('percent')
  const [revenueTarget, setRevenueTarget] = useState('')

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<TabId>('contract')
  const [analyticsMode, setAnalyticsMode] = useState<'demo' | 'live'>('demo')

  // ── Accounting state ──
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showTransactionForm, setShowTransactionForm] = useState<'income' | 'expense' | null>(null)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionAccount, setTransactionAccount] = useState('')
  const [transactionDescription, setTransactionDescription] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])

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

  // ── Expense budget editor ──
  const updateExpense = (index: number, field: 'name' | 'monthlyAmount', value: string | number) => {
    if (contractLocked) return
    const updated = [...expenseBudget]
    if (field === 'name') updated[index] = { ...updated[index], name: value as string }
    else updated[index] = { ...updated[index], monthlyAmount: Number(value) }
    setExpenseBudget(updated)
  }

  const addExpenseItem = () => {
    if (contractLocked) return
    setExpenseBudget([...expenseBudget, { name: '', monthlyAmount: 0 }])
  }

  const removeExpenseItem = (index: number) => {
    if (contractLocked) return
    setExpenseBudget(expenseBudget.filter((_, i) => i !== index))
  }

  const totalMonthlyExpenses = expenseBudget.reduce((s, e) => s + e.monthlyAmount, 0)
  const monthlyNetIncome = baseline - totalMonthlyExpenses

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

  // Binary search for the growth % that makes the projection engine
  // produce a given total Y1 revenue (accounts for compounding + seasonality)
  const solveGrowthForTarget = useCallback((targetAnnual: number): number | null => {
    const baselineAnnual = baseline * 12
    if (targetAnnual <= baselineAnnual) return null
    let lo = 0, hi = 10 // Allow up to 1000% growth for sim racing
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2
      const mgr = Math.pow(1 + mid, 1 / 12) - 1
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
      if (proj.summary.totalProjectedRevenue < targetAnnual) {
        lo = mid
      } else {
        hi = mid
      }
    }
    const result = (lo + hi) / 2
    return result <= 10 ? result : null
  }, [baseline, startMonth, startYear])

  const applyRevenueTarget = () => {
    if (contractLocked) return
    const targetAnnual = parseFloat(revenueTarget)
    if (isNaN(targetAnnual)) return
    const solved = solveGrowthForTarget(targetAnnual)
    if (solved === null) return
    setGrowthPercent(solved)
    setCustomGrowth('')
  }

  // ── Transaction handlers ──
  const openTransactionForm = (type: 'income' | 'expense') => {
    setShowTransactionForm(type)
    setTransactionAmount('')
    setTransactionAccount(type === 'income' ? INCOME_ACCOUNTS[0].value : EXPENSE_ACCOUNTS[0].value)
    setTransactionDescription('')
    setTransactionDate(new Date().toISOString().split('T')[0])
  }

  const closeTransactionForm = () => {
    setShowTransactionForm(null)
  }

  const addTransaction = () => {
    if (!transactionAmount || !transactionAccount || !showTransactionForm) return
    const amount = parseFloat(transactionAmount)
    if (isNaN(amount) || amount <= 0) return

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: showTransactionForm,
      account: transactionAccount,
      amount,
      description: transactionDescription,
      date: transactionDate,
    }
    setTransactions(prev => [newTransaction, ...prev])
    closeTransactionForm()
  }

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const getAccountLabel = (type: 'income' | 'expense', value: string) => {
    const accounts = type === 'income' ? INCOME_ACCOUNTS : EXPENSE_ACCOUNTS
    return accounts.find(a => a.value === value)?.label || value
  }

  // ── Accounting calculations ──
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netCashFlow = totalIncome - totalExpenses

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

            {/* Expense Budget Editor */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Expense Budget</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {expenseBudget.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={e.name}
                      disabled={contractLocked}
                      onChange={(ev) => updateExpense(i, 'name', ev.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <input
                      type="number"
                      value={e.monthlyAmount}
                      disabled={contractLocked}
                      min={0}
                      step={50}
                      onChange={(ev) => updateExpense(i, 'monthlyAmount', ev.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <button
                      onClick={() => removeExpenseItem(i)}
                      disabled={contractLocked}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={addExpenseItem}
                  disabled={contractLocked}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add Expense
                </button>
                <div className="text-sm text-gray-600">
                  Total Expenses: <span className="font-semibold text-red-600">{formatCurrency(totalMonthlyExpenses)}/mo</span>
                  {' | '}
                  Net Income: <span className={`font-semibold ${monthlyNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(monthlyNetIncome)}/mo</span>
                </div>
              </div>
            </div>

            {/* Growth Presets + Custom / Revenue Target Toggle */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="block text-xs font-medium text-gray-600">Annual Growth Target</label>
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  <button
                    onClick={() => setGrowthInputMode('percent')}
                    className={`px-3 py-1 font-medium transition-colors ${growthInputMode === 'percent' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Growth %
                  </button>
                  <button
                    onClick={() => setGrowthInputMode('revenue')}
                    className={`px-3 py-1 font-medium transition-colors ${growthInputMode === 'revenue' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Revenue Target
                  </button>
                </div>
                {growthInputMode === 'revenue' && revenueTarget && growthPercent > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    Target: {formatCurrency(parseFloat(revenueTarget))}/yr ({(growthPercent * 100).toFixed(1)}% growth)
                  </span>
                )}
              </div>

              {growthInputMode === 'percent' ? (
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
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Current baseline: {formatCurrency(baseline * 12)}/year. Enter your target annual revenue.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-1">
                      <span className="flex items-center text-sm text-gray-500 pl-1">$</span>
                      <input
                        type="number"
                        placeholder="e.g. 100000"
                        value={revenueTarget}
                        disabled={contractLocked}
                        onChange={(e) => setRevenueTarget(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyRevenueTarget()}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-36 text-sm disabled:bg-gray-100"
                      />
                      <button
                        onClick={applyRevenueTarget}
                        disabled={contractLocked}
                        className="px-3 py-2 rounded-lg text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50"
                      >
                        Set Target
                      </button>
                    </div>
                    {revenueTarget && !isNaN(parseFloat(revenueTarget)) && parseFloat(revenueTarget) > baseline * 12 && (
                      <span className="text-xs text-gray-500">
                        Click &quot;Set Target&quot; to calculate exact growth %
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[75000, 100000, 150000, 200000, 250000].filter((v) => v > baseline * 12).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          if (contractLocked) return
                          const solved = solveGrowthForTarget(v)
                          if (solved === null) return
                          setGrowthPercent(solved)
                          setRevenueTarget(String(v))
                          setCustomGrowth('')
                        }}
                        disabled={contractLocked}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        {formatCurrency(v)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
        <div className="space-y-6">
          {/* Business Model Setup */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Business Model Setup</h3>
              <p className="text-xs text-gray-500 mt-1">Edit values in the Customize Scenario panel above</p>
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
                <p className="text-xs text-gray-400">$0 Year 1 (Partnership Offer)</p>
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Financials */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section A: Transaction Entry */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Transaction Entry</h3>
            </div>
            <div className="p-6">
              {/* Big Action Buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => openTransactionForm('income')}
                  className="flex-1 flex items-center justify-center gap-3 p-6 bg-green-50 hover:bg-green-100 border-2 border-green-300 hover:border-green-400 rounded-xl transition-all group"
                >
                  <ArrowUpCircle className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-xl font-bold text-green-700">Money In</p>
                    <p className="text-sm text-green-600">Record income</p>
                  </div>
                </button>
                <button
                  onClick={() => openTransactionForm('expense')}
                  className="flex-1 flex items-center justify-center gap-3 p-6 bg-red-50 hover:bg-red-100 border-2 border-red-300 hover:border-red-400 rounded-xl transition-all group"
                >
                  <ArrowDownCircle className="h-10 w-10 text-red-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-xl font-bold text-red-700">Money Out</p>
                    <p className="text-sm text-red-600">Record expense</p>
                  </div>
                </button>
              </div>

              {/* Transaction Form Modal */}
              {showTransactionForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                    <div className={`flex items-center justify-between p-4 rounded-t-xl ${showTransactionForm === 'income' ? 'bg-green-600' : 'bg-red-600'}`}>
                      <div className="flex items-center gap-2 text-white">
                        {showTransactionForm === 'income' ? (
                          <ArrowUpCircle className="h-6 w-6" />
                        ) : (
                          <ArrowDownCircle className="h-6 w-6" />
                        )}
                        <h3 className="text-lg font-bold">
                          {showTransactionForm === 'income' ? 'Record Income' : 'Record Expense'}
                        </h3>
                      </div>
                      <button onClick={closeTransactionForm} className="text-white/80 hover:text-white">
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                          <input
                            type="number"
                            value={transactionAmount}
                            onChange={(e) => setTransactionAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                        <select
                          value={transactionAccount}
                          onChange={(e) => setTransactionAccount(e.target.value)}
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {(showTransactionForm === 'income' ? INCOME_ACCOUNTS : EXPENSE_ACCOUNTS).map((account) => (
                            <option key={account.value} value={account.value}>
                              {account.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={transactionDescription}
                          onChange={(e) => setTransactionDescription(e.target.value)}
                          placeholder="What was this for?"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={addTransaction}
                        disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                        className={`w-full py-4 text-lg font-bold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          showTransactionForm === 'income'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {showTransactionForm === 'income' ? 'Add Income' : 'Add Expense'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction List */}
              {transactions.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Account</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {t.type === 'income' ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                              {getAccountLabel(t.type, t.account)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{t.description || '-'}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => deleteTransaction(t.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No transactions yet</p>
                  <p className="text-gray-400 text-sm">Click &quot;Money In&quot; or &quot;Money Out&quot; to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section B: Summary Cards */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-sm text-green-600 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-sm text-red-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className={`card p-4 text-center`}>
              <p className={`text-sm font-medium ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Cash Flow</p>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(netCashFlow)}</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section C: Income Statement (P&L) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Income Statement (P&amp;L)</h3>
            </div>
            {transactions.length > 0 ? (
              <div className="p-6 font-mono text-sm">
                {/* Revenue section */}
                <p className="font-bold text-gray-800 mb-2">REVENUE</p>
                {(() => {
                  const incomeByAccount: Record<string, number> = {}
                  transactions.filter(t => t.type === 'income').forEach(t => {
                    const label = getAccountLabel('income', t.account)
                    incomeByAccount[label] = (incomeByAccount[label] || 0) + t.amount
                  })
                  return Object.entries(incomeByAccount).map(([label, amount]) => (
                    <div key={label} className="flex justify-between py-0.5 pl-4">
                      <span className="text-gray-600">{label}</span>
                      <span className="text-green-700">{formatCurrency(amount)}</span>
                    </div>
                  ))
                })()}
                <div className="border-t border-gray-300 mt-2 pt-1 flex justify-between pl-4 font-semibold">
                  <span>Total Revenue</span>
                  <span className="text-green-700">{formatCurrency(totalIncome)}</span>
                </div>

                {/* Expenses section */}
                <p className="font-bold text-gray-800 mt-6 mb-2">EXPENSES</p>
                {(() => {
                  const expenseByAccount: Record<string, number> = {}
                  transactions.filter(t => t.type === 'expense').forEach(t => {
                    const label = getAccountLabel('expense', t.account)
                    expenseByAccount[label] = (expenseByAccount[label] || 0) + t.amount
                  })
                  return Object.entries(expenseByAccount).map(([label, amount]) => (
                    <div key={label} className="flex justify-between py-0.5 pl-4">
                      <span className="text-gray-600">{label}</span>
                      <span className="text-red-600">{formatCurrency(amount)}</span>
                    </div>
                  ))
                })()}
                <div className="border-t border-gray-300 mt-2 pt-1 flex justify-between pl-4 font-semibold">
                  <span>Total Expenses</span>
                  <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>

                {/* Net Income */}
                <div className="border-t-2 border-gray-800 mt-4 pt-2 flex justify-between font-bold text-base">
                  <span>NET INCOME</span>
                  <span className={netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}>{formatCurrency(netCashFlow)}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>Record transactions to see reports</p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section D: Cash Flow Summary */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Cash Flow Summary</h3>
            </div>
            {transactions.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <p className="text-xs text-gray-500">Operating Cash In</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                    <p className="text-xs text-gray-500">Operating Cash Out</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className={`p-3 rounded-lg border text-center ${netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <p className="text-xs text-gray-500">Net Cash Flow</p>
                    <p className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(netCashFlow)}</p>
                  </div>
                </div>
                {/* Monthly bar chart */}
                {(() => {
                  const monthlyData: Record<string, { income: number; expense: number }> = {}
                  transactions.forEach(t => {
                    const d = new Date(t.date)
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 }
                    if (t.type === 'income') monthlyData[key].income += t.amount
                    else monthlyData[key].expense += t.amount
                  })
                  const months = Object.keys(monthlyData).sort()
                  if (months.length < 2) return null
                  const maxVal = Math.max(...months.map(m => Math.max(monthlyData[m].income, monthlyData[m].expense)), 1)
                  return (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Monthly Cash In / Out</p>
                      <div className="flex items-end gap-2 h-40">
                        {months.map(m => {
                          const d = monthlyData[m]
                          const label = MONTH_NAMES[parseInt(m.split('-')[1]) - 1] + ' ' + m.split('-')[0].slice(2)
                          return (
                            <div key={m} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
                                <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${(d.income / maxVal) * 100}%`, minHeight: d.income > 0 ? '4px' : '0' }} />
                                <div className="flex-1 bg-red-400 rounded-t" style={{ height: `${(d.expense / maxVal) * 100}%`, minHeight: d.expense > 0 ? '4px' : '0' }} />
                              </div>
                              <p className="text-[10px] text-gray-500">{label}</p>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> Income</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" /> Expenses</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>Record transactions to see reports</p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section E: Revenue Breakdown */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Revenue Breakdown</h3>
            </div>
            {transactions.filter(t => t.type === 'income').length > 0 ? (
              <div className="p-6">
                {(() => {
                  const incomeByAccount: Record<string, number> = {}
                  transactions.filter(t => t.type === 'income').forEach(t => {
                    const label = getAccountLabel('income', t.account)
                    incomeByAccount[label] = (incomeByAccount[label] || 0) + t.amount
                  })
                  const entries = Object.entries(incomeByAccount).sort((a, b) => b[1] - a[1])
                  const total = entries.reduce((s, [, v]) => s + v, 0)
                  const colors = ['bg-green-500', 'bg-green-400', 'bg-green-300', 'bg-emerald-500', 'bg-emerald-400', 'bg-teal-400']
                  return (
                    <div className="space-y-3">
                      {/* Stacked bar */}
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        {entries.map(([label, amount], i) => (
                          <div
                            key={label}
                            className={`${colors[i % colors.length]} transition-all`}
                            style={{ width: `${(amount / total) * 100}%` }}
                            title={`${label}: ${formatCurrency(amount)}`}
                          />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="space-y-2">
                        {entries.map(([label, amount], i) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                              <span className="text-gray-700">{label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{formatCurrency(amount)}</span>
                              <span className="text-gray-400 w-12 text-right">{((amount / total) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>Record transactions to see reports</p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section F: Expense Breakdown */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Expense Breakdown</h3>
            </div>
            {transactions.filter(t => t.type === 'expense').length > 0 ? (
              <div className="p-6">
                {(() => {
                  const expenseByAccount: Record<string, number> = {}
                  transactions.filter(t => t.type === 'expense').forEach(t => {
                    const label = getAccountLabel('expense', t.account)
                    expenseByAccount[label] = (expenseByAccount[label] || 0) + t.amount
                  })
                  const entries = Object.entries(expenseByAccount).sort((a, b) => b[1] - a[1])
                  const total = entries.reduce((s, [, v]) => s + v, 0)
                  const colors = ['bg-red-500', 'bg-red-400', 'bg-red-300', 'bg-orange-500', 'bg-orange-400', 'bg-amber-400', 'bg-rose-400', 'bg-pink-400', 'bg-rose-300']
                  return (
                    <div className="space-y-3">
                      {/* Stacked bar */}
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        {entries.map(([label, amount], i) => (
                          <div
                            key={label}
                            className={`${colors[i % colors.length]} transition-all`}
                            style={{ width: `${(amount / total) * 100}%` }}
                            title={`${label}: ${formatCurrency(amount)}`}
                          />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="space-y-2">
                        {entries.map(([label, amount], i) => (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                              <span className="text-gray-700">{label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{formatCurrency(amount)}</span>
                              <span className="text-gray-400 w-12 text-right">{((amount / total) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>Record transactions to see reports</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Profitability */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
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
                      Our fee structure is performance-based: we only earn more when MC Racing earns more. In Year 1 (Partnership Offer),
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
      {/* TAB 4: Market Intel */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'market-intel' && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: Analytics */}
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
                  <h3 className="font-semibold text-gray-900">Year 1: Partnership Offer (Zero Risk)</h3>
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
                <p className="font-semibold text-blue-800 mb-3">YEAR 1 (Partnership Offer)</p>
                {fullProjection.yearSummaries.length > 0 && (() => {
                  const yr1 = fullProjection.yearSummaries[0]
                  return (
                    <div className="font-mono text-sm space-y-1">
                      <p>Baseline: {formatCurrency(yr1.startBaseline)}/month</p>
                      <p>Growth: {growthLabel} annual</p>
                      <p>Total Revenue: {formatCurrency(yr1.totalRevenue)}</p>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <p className="text-amber-600">Foundation: $0 (Partnership Offer)</p>
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 7: Offer Refiner (Locked) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'offer-refiner' && (
        <div className="space-y-6">
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
