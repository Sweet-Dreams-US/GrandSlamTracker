'use client'

import { useState, useMemo, useCallback } from 'react'
import { FileSignature, DollarSign, TrendingUp, Megaphone, BarChart3, BookOpen, Sparkles, Lock, Unlock, ChevronDown, ChevronUp, Wifi, WifiOff, ArrowUpCircle, ArrowDownCircle, X, Trash2, Plus, LogOut } from 'lucide-react'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { getSeasonalFactors } from '@/lib/constants/seasonalIndices'
import { RETENTION_BRACKETS } from '@/lib/constants/feeStructure'
import RevenueChart from '@/components/charts/RevenueChart'
import { useEffect } from 'react'

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

// ─── Main Component ────────────────────────────────────────────────────
function MCRacingContent() {
  // ── Editable state ──
  const [baseline, setBaseline] = useState(4000)
  const [streams, setStreams] = useState<Stream[]>(DEFAULT_STREAMS)
  const [growthPercent, setGrowthPercent] = useState(1.00)
  const [customGrowth, setCustomGrowth] = useState('')
  const [startMonth, setStartMonth] = useState(2) // February
  const [expenseBudget, setExpenseBudget] = useState<BudgetItem[]>(DEFAULT_EXPENSES)

  // ── Financials tab state ──
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    type: 'income',
    account: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<TabId>('contract')
  const [showProjections, setShowProjections] = useState(false)
  const [analyticsMode, setAnalyticsMode] = useState<'demo' | 'live'>('demo')

  // ── Projected revenue (Y1) ──
  const totalMonthlyRevenue = streams.reduce((sum, s) => sum + s.monthlyAmount, 0)
  const annualRevenue = totalMonthlyRevenue * 12

  // ── Fee rates ──
  const tierRates = useMemo(() => getTierRatesForBaseline(baseline), [baseline])

  // ── Expense Budget Calculations ──
  const totalMonthlyExpenses = expenseBudget.reduce((sum, e) => sum + e.monthlyAmount, 0)
  const annualExpenses = totalMonthlyExpenses * 12
  const projectedNetProfit = annualRevenue - annualExpenses

  // ── Multi-year projections ──
  const fullProjection = useMemo(() => {
    return projectScenario({
      baseline,
      growthPercent,
      startMonth,
      numYears: 5,
    })
  }, [baseline, growthPercent, startMonth])

  // ── Transaction handlers ──
  const handleAddTransaction = useCallback(() => {
    if (!newTransaction.account || newTransaction.amount <= 0) return
    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString()
    }
    setTransactions(prev => [...prev, transaction])
    setNewTransaction({
      type: 'income',
      account: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowAddTransaction(false)
  }, [newTransaction])

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Transaction summaries ──
  const transactionSummary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses }
  }, [transactions])

  // ── Marketing metrics ──
  const totalAdSpend = MOCK_AD_CHANNELS.reduce((sum, c) => sum + c.spend, 0)
  const marketingROAS = ((MOCK_FUNNEL.revenue - baseline) / totalAdSpend).toFixed(1)

  // ── Custom growth handler ──
  const handleCustomGrowth = useCallback(() => {
    const val = parseFloat(customGrowth)
    if (!isNaN(val) && val >= 0) {
      setGrowthPercent(val / 100)
      setCustomGrowth('')
    }
  }, [customGrowth])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MC Racing</h1>
            <p className="text-gray-500 mt-1">Partnership Performance Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Contract Start</p>
            <p className="font-semibold text-gray-900">{MONTH_NAMES[startMonth]} 2025</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'
                } ${tab.locked ? 'opacity-60' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.locked && <Lock className="h-3 w-3 ml-1" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Contract Overview */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'contract' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <p className="text-blue-100 text-sm font-medium">Monthly Baseline</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(baseline)}</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm font-medium">Growth Target</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{formatPercent(growthPercent)}</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm font-medium">Foundation Fee</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(tierRates.foundationFee)}</p>
              <p className="text-xs text-gray-400 mt-1">{formatPercent(tierRates.foundationFeePercent)} of baseline</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm font-medium">Growth Fee Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatPercent(tierRates.growthFeePercent)}</p>
              <p className="text-xs text-gray-400 mt-1">On revenue above baseline</p>
            </div>
          </div>

          {/* Revenue Streams */}
          <div className="card">
            <SectionHeader id="sec-streams" label="A" title="Revenue Streams" />
            <div className="p-6">
              <div className="space-y-3">
                {streams.map((stream, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{stream.name}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(stream.monthlyAmount)}/mo</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-700">Total Monthly Revenue</span>
                <span className="font-bold text-blue-700 text-lg">{formatCurrency(totalMonthlyRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Expense Budget */}
          <div className="card">
            <SectionHeader id="sec-expenses" label="B" title="Monthly Expense Budget" />
            <div className="p-6">
              <div className="space-y-3">
                {expenseBudget.map((expense, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{expense.name}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(expense.monthlyAmount)}/mo</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-700">Total Monthly Expenses</span>
                <span className="font-bold text-red-600 text-lg">{formatCurrency(totalMonthlyExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Growth Scenarios */}
          <div className="card">
            <SectionHeader id="sec-scenarios" label="C" title="Growth Scenario Selector" />
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.value}
                    onClick={() => setGrowthPercent(scenario.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      growthPercent === scenario.value
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customGrowth}
                  onChange={(e) => setCustomGrowth(e.target.value)}
                  placeholder="Custom %"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
                />
                <button
                  onClick={handleCustomGrowth}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Projections Toggle */}
          <button
            onClick={() => setShowProjections(!showProjections)}
            className="w-full card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-700">5-Year Revenue Projections</span>
            {showProjections ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>

          {showProjections && (
            <div className="card p-6">
              <RevenueChart
                monthlyData={fullProjection.months}
                yearSummaries={fullProjection.yearSummaries}
                baseline={baseline}
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Financials */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Total Income</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{formatCurrency(transactionSummary.totalIncome)}</p>
            </div>
            <div className="card p-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium">Total Expenses</span>
              </div>
              <p className="text-3xl font-bold text-red-700">{formatCurrency(transactionSummary.totalExpenses)}</p>
            </div>
            <div className="card p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">Net Profit</span>
              </div>
              <p className={`text-3xl font-bold ${transactionSummary.net >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatCurrency(transactionSummary.net)}
              </p>
            </div>
          </div>

          {/* Add Transaction */}
          <div className="card">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold">Transactions</h3>
              <button
                onClick={() => setShowAddTransaction(!showAddTransaction)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </button>
            </div>

            {showAddTransaction && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense', account: '' })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <select
                    value={newTransaction.account}
                    onChange={(e) => setNewTransaction({ ...newTransaction, account: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select Account</option>
                    {(newTransaction.type === 'income' ? INCOME_ACCOUNTS : EXPENSE_ACCOUNTS).map((acc) => (
                      <option key={acc.value} value={acc.value}>{acc.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAddTransaction}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Transaction List */}
            <div className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No transactions recorded yet. Add your first transaction above.
                </div>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.type === 'income' ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {[...INCOME_ACCOUNTS, ...EXPENSE_ACCOUNTS].find(a => a.value === t.account)?.label || t.account}
                        </p>
                        <p className="text-sm text-gray-500">{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Profitability */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profitability' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <p className="text-gray-500 text-sm">Annual Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(annualRevenue)}</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-500 text-sm">Annual Expenses</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(annualExpenses)}</p>
            </div>
            <div className="card p-6 bg-green-50">
              <p className="text-green-700 text-sm">Projected Net Profit</p>
              <p className={`text-3xl font-bold mt-1 ${projectedNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(projectedNetProfit)}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Profit Margin Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Gross Profit Margin</span>
                  <span className="text-sm font-semibold">{formatPercent(projectedNetProfit / annualRevenue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${projectedNetProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (projectedNetProfit / annualRevenue) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Market Intel */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'market-intel' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Marketing Funnel */}
          <div className="card">
            <SectionHeader id="sec-funnel" label="A" title="Marketing Funnel" />
            <div className="p-6">
              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{MOCK_FUNNEL.impressions.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Impressions</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{MOCK_FUNNEL.clicks.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Clicks</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{MOCK_FUNNEL.leads}</p>
                  <p className="text-sm text-gray-500">Leads</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{MOCK_FUNNEL.deals}</p>
                  <p className="text-sm text-gray-500">Customers</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(MOCK_FUNNEL.revenue)}</p>
                  <p className="text-sm text-blue-600">Revenue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ad Channel Performance */}
          <div className="card">
            <SectionHeader id="sec-channels" label="B" title="Ad Channel Performance" />
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">Channel</th>
                    <th className="text-right py-2 font-medium text-gray-600">Spend</th>
                    <th className="text-right py-2 font-medium text-gray-600">Leads</th>
                    <th className="text-right py-2 font-medium text-gray-600">CPL</th>
                    <th className="text-right py-2 font-medium text-gray-600">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AD_CHANNELS.map((ch) => (
                    <tr key={ch.channel} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{ch.channel}</td>
                      <td className="py-3 text-right">{formatCurrency(ch.spend)}</td>
                      <td className="py-3 text-right">{ch.leads}</td>
                      <td className="py-3 text-right">{formatCurrency(ch.cpl)}</td>
                      <td className="py-3 text-right font-semibold text-green-600">{ch.roas}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Marketing ROAS */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Marketing ROI Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Total Ad Spend</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAdSpend)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Marketing ROAS</p>
                <p className="text-xl font-bold text-green-600">{marketingROAS}x</p>
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
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">M</div>
                  <div>
                    <p className="font-semibold text-blue-900">Connect Metricool</p>
                    <p className="text-xs text-gray-500">Social media analytics & scheduling</p>
                    <span className="text-[10px] text-blue-500 font-medium">COMING SOON</span>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-xs">G</div>
                  <div>
                    <p className="font-semibold text-blue-900">Connect Google Analytics</p>
                    <p className="text-xs text-gray-500">Website traffic & conversion data</p>
                    <span className="text-[10px] text-blue-500 font-medium">COMING SOON</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {analyticsMode === 'demo' && (
            <div className="space-y-6">
              {/* Social Media */}
              <div className="card">
                <SectionHeader id="sec-social" label="A" title="Social Media Performance" />
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.social.followers.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Followers</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.social.engagementRate}%</p>
                    <p className="text-sm text-gray-500">Engagement Rate</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.social.postsPerMonth}</p>
                    <p className="text-sm text-gray-500">Posts/Month</p>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="card">
                <SectionHeader id="sec-seo" label="B" title="SEO Performance" />
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.seo.domainAuthority}</p>
                    <p className="text-sm text-gray-500">Domain Authority</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.seo.keywordsRanked}</p>
                    <p className="text-sm text-gray-500">Keywords Ranked</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.seo.organicTraffic}</p>
                    <p className="text-sm text-gray-500">Organic Traffic/mo</p>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="card">
                <SectionHeader id="sec-reviews" label="C" title="Online Reviews" />
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{MOCK_SOCIAL_SEO.reviews.googleRating}</p>
                    <p className="text-sm text-gray-500">Google Rating</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{MOCK_SOCIAL_SEO.reviews.reviewCount}</p>
                    <p className="text-sm text-gray-500">Total Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{MOCK_SOCIAL_SEO.reviews.responseRate}%</p>
                    <p className="text-sm text-gray-500">Response Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: How It Works */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'how-it-works' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">How Our Partnership Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Baseline Establishment</h3>
                  <p className="text-gray-600 mt-1">We establish your current monthly revenue baseline of {formatCurrency(baseline)}. This represents your business before our marketing efforts.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Foundation Fee</h3>
                  <p className="text-gray-600 mt-1">A monthly foundation fee of {formatCurrency(tierRates.foundationFee)} ({formatPercent(tierRates.foundationFeePercent)}) covers our core services and operational costs.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Growth Fee</h3>
                  <p className="text-gray-600 mt-1">For revenue generated above your baseline, we take a {formatPercent(tierRates.growthFeePercent)} growth fee. This aligns our incentives with your success.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">4</div>
                <div>
                  <h3 className="font-semibold">Transparent Reporting</h3>
                  <p className="text-gray-600 mt-1">This dashboard provides full visibility into your marketing performance, revenue growth, and fee calculations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Retention Brackets */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Retention Rate Structure</h3>
            <p className="text-gray-600 mb-4">As our partnership matures, your retention rate increases, meaning you keep more of the growth revenue:</p>
            <div className="grid grid-cols-4 gap-2">
              {RETENTION_BRACKETS.map((bracket, idx) => (
                <div key={idx} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Year {idx + 1}</p>
                  <p className="font-bold text-blue-700">{formatPercent(bracket.clientRetention)}</p>
                  <p className="text-xs text-gray-400">You Keep</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 7: Offer Refiner (Locked) */}
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
