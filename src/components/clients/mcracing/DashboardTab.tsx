'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getRevenueEntries, getMonthlyExpenses } from '@/lib/services/mcRacingService'
import { REVENUE_CATEGORIES, DEAL_TERMS, MONTHLY_TARGETS, CURRENT_REVENUE } from '@/lib/constants/mcRacingPricing'
import type { RevenueEntry, MonthlyExpense } from '@/lib/supabase/types'

interface DashboardTabProps {
  selectedYear: number
  selectedMonth: number
  onNavigate: (tab: string) => void
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DashboardTab({ selectedYear, selectedMonth, onNavigate }: DashboardTabProps) {
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [expenseList, setExpenseList] = useState<MonthlyExpense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [revEntries, expData] = await Promise.all([
        getRevenueEntries(selectedYear, selectedMonth),
        getMonthlyExpenses(selectedYear, selectedMonth),
      ])
      setEntries(revEntries)
      setExpenseList(expData)
      setRevenue(revEntries.reduce((sum, e) => sum + Number(e.amount), 0))
      setExpenses(expData.reduce((sum, e) => sum + Number(e.amount), 0))
      setLoading(false)
    }
    load()
  }, [selectedYear, selectedMonth])

  const netIncome = revenue - expenses
  const vsBaseline = revenue - DEAL_TERMS.baseline

  // Find the growth plan target for this month
  const currentTarget = MONTHLY_TARGETS.find(
    t => t.calMonth === selectedMonth && t.calYear === selectedYear
  )

  // Revenue by category for charts
  const categoryData = REVENUE_CATEGORIES.map(cat => {
    const total = entries
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    return { name: cat.label, value: total, color: cat.color }
  }).filter(d => d.value > 0)

  const fmt = (n: number) => n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcracing-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Growth Plan Target Banner */}
      {currentTarget && (
        <div className="bg-mcracing-50 rounded-xl border border-mcracing-200 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-mcracing-100 rounded-lg shrink-0">
              <Target className="h-4 w-4 text-mcracing-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-mcracing-900">
                  Month {currentTarget.month} Target: {fmt(currentTarget.revenue)}
                </h3>
                {revenue > 0 && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    revenue >= currentTarget.revenue
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {revenue >= currentTarget.revenue ? 'On Track' : `${fmt(currentTarget.revenue - revenue)} to go`}
                  </span>
                )}
              </div>
              <p className="text-xs text-mcracing-600 mt-1">{currentTarget.milestone}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-mcracing-500">
                <span>{currentTarget.parties} parties</span>
                <span>{currentTarget.members} members</span>
                <span>{currentTarget.leagueRacers} league racers</span>
                <span>{currentTarget.recurringPct}% recurring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Revenue"
          value={fmt(revenue)}
          icon={<DollarSign className="h-5 w-5" />}
          color="text-green-600 bg-green-50"
          subtitle={entries.length > 0 ? `${entries.length} entries` : 'No entries yet'}
        />
        <KPICard
          label="Total Expenses"
          value={fmt(expenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="text-red-600 bg-red-50"
          subtitle={expenseList.length > 0 ? `${expenseList.length} line items` : 'Not set'}
        />
        <KPICard
          label="Net Income"
          value={fmt(netIncome)}
          icon={netIncome >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          color={netIncome >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}
          subtitle="Revenue - Expenses"
        />
        <KPICard
          label="vs Baseline"
          value={fmt(vsBaseline)}
          icon={<BarChart3 className="h-5 w-5" />}
          color={vsBaseline >= 0 ? 'text-mcracing-600 bg-mcracing-50' : 'text-orange-600 bg-orange-50'}
          subtitle={`Baseline: $${DEAL_TERMS.baseline.toLocaleString()}/mo`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-sm">
              <p className="text-gray-400 mb-2">No revenue data yet for {MONTH_NAMES[selectedMonth - 1]}.</p>
              <button onClick={() => onNavigate('revenue')} className="text-mcracing-600 hover:underline font-medium">
                Log your first entry
              </button>
            </div>
          )}
        </div>

        {/* Revenue Mix Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Mix</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-sm">
              <p className="text-gray-400 mb-3">Revenue mix appears here as data is logged</p>
              <div className="text-xs text-gray-400">
                <p className="font-medium text-gray-500 mb-1">Current mix (starting point):</p>
                <p>Sessions {CURRENT_REVENUE.soloSessions.pct + CURRENT_REVENUE.groupSessions.pct}% | Parties {CURRENT_REVENUE.birthdayParties.pct}%</p>
                <p className="mt-1 text-mcracing-500">Goal: Shift toward parties + memberships + leagues</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('revenue')}
            className="flex items-center gap-2 px-4 py-2 bg-mcracing-600 text-white rounded-lg text-sm font-medium hover:bg-mcracing-700 transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            Log Revenue
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
            Update Expenses
          </button>
          <button
            onClick={() => onNavigate('pnl')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            View P&L
          </button>
          <button
            onClick={() => onNavigate('refiner')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Target className="h-4 w-4" />
            Offer Refiner
          </button>
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, color, subtitle }: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  subtitle: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  )
}
