'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts'
import { getRevenueEntries, getMonthlyExpenses } from '@/lib/services/mcRacingService'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { calculateMonthlyFee } from '@/lib/calculations/feeCalculator'
import { DEAL_TERMS, DEFAULT_MONTHLY_BUDGET } from '@/lib/constants/mcRacingPricing'

interface PnLTabProps {
  selectedYear: number
  selectedMonth: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PnLTab({ selectedYear, selectedMonth }: PnLTabProps) {
  const [actualRevenue, setActualRevenue] = useState(0)
  const [actualExpenses, setActualExpenses] = useState(0)
  const [loading, setLoading] = useState(true)

  // Get projected data from scenarioProjector
  const projections = useMemo(() => {
    return projectScenario({
      baselineRevenue: DEAL_TERMS.baseline,
      industry: DEAL_TERMS.industry,
      monthlyGrowthRate: DEAL_TERMS.monthlyGrowthRate,
      startMonth: DEAL_TERMS.startMonth,
      startYear: DEAL_TERMS.startYear,
      projectionMonths: DEAL_TERMS.projectionMonths,
      applySeasonality: true,
      isGrandSlam: true,
    })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [entries, expenses] = await Promise.all([
        getRevenueEntries(selectedYear, selectedMonth),
        getMonthlyExpenses(selectedYear, selectedMonth),
      ])
      setActualRevenue(entries.reduce((sum, e) => sum + Number(e.amount), 0))
      setActualExpenses(expenses.reduce((sum, e) => sum + Number(e.amount), 0))
      setLoading(false)
    }
    load()
  }, [selectedYear, selectedMonth])

  // Find current month's projection
  const currentProjection = projections.projections.find(
    p => p.month === selectedMonth && p.year === selectedYear
  )
  const projectedRevenue = currentProjection?.projectedRevenue || 0
  const projectedFee = currentProjection?.totalMonthlyFee || 0

  // Calculate actual Grand Slam fees on actual revenue
  const actualFeeResult = calculateMonthlyFee(DEAL_TERMS.baseline, actualRevenue, { isYear1: true })
  const actualFee = actualFeeResult.grossMonthlyFee

  const actualNet = actualRevenue - actualExpenses - actualFee
  const projectedNet = projectedRevenue - DEFAULT_MONTHLY_BUDGET - projectedFee

  // Build YTD data
  const ytdMonths = projections.projections
    .filter(p => p.year === selectedYear && p.month <= selectedMonth)
    .map(p => ({
      month: MONTH_NAMES[p.month - 1],
      projected: Math.round(p.projectedRevenue),
      projectedExpenses: DEFAULT_MONTHLY_BUDGET,
      projectedFee: Math.round(p.totalMonthlyFee),
    }))

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
      {/* Actual vs Projected Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            P&L Summary — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Line Item</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Projected</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <PnLRow label="Revenue" actual={actualRevenue} projected={projectedRevenue} isPositiveGood />
              <PnLRow label="Operating Expenses" actual={-actualExpenses} projected={-DEFAULT_MONTHLY_BUDGET} isPositiveGood={false} />
              <PnLRow label="Grand Slam Fee" actual={-actualFee} projected={-projectedFee} isPositiveGood={false} />
              <tr className="bg-gray-50 font-bold">
                <td className="px-6 py-3 text-gray-900">Net Income</td>
                <td className={`px-6 py-3 text-right ${actualNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(actualNet)}
                </td>
                <td className={`px-6 py-3 text-right ${projectedNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(projectedNet)}
                </td>
                <td className={`px-6 py-3 text-right ${(actualNet - projectedNet) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(actualNet - projectedNet)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Grand Slam Fee Breakdown (on Actual Revenue)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Baseline</div>
            <div className="text-lg font-bold text-gray-900">${DEAL_TERMS.baseline.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Foundation Fee</div>
            <div className="text-lg font-bold text-gray-900">${actualFeeResult.foundationFeeMonthly.toLocaleString()}</div>
            <div className="text-xs text-gray-400">$0 in Year 1 (Grand Slam)</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Growth Fee</div>
            <div className="text-lg font-bold text-gray-900">${actualFeeResult.growthFee.toLocaleString()}</div>
            <div className="text-xs text-gray-400">
              {actualFeeResult.upliftAmount > 0
                ? `On $${actualFeeResult.upliftAmount.toLocaleString()} uplift`
                : 'No uplift yet'}
            </div>
          </div>
          <div className="bg-mcracing-50 rounded-lg p-4 border border-mcracing-200">
            <div className="text-xs text-mcracing-600 mb-1">Total Fee</div>
            <div className="text-lg font-bold text-mcracing-900">${actualFee.toLocaleString()}</div>
            <div className="text-xs text-mcracing-500">
              {actualRevenue > 0 ? `${((actualFee / actualRevenue) * 100).toFixed(1)}% of revenue` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* YTD Projection Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Year-to-Date Projections</h3>
        {ytdMonths.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={ytdMonths}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
              <Legend />
              <Bar name="Projected Revenue" dataKey="projected" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar name="Expenses (Budget)" dataKey="projectedExpenses" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Line name="Grand Slam Fee" dataKey="projectedFee" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">No projection data available</div>
        )}
      </div>

      {/* Baseline Context */}
      <div className="bg-mcracing-50 rounded-xl border border-mcracing-200 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-mcracing-100 rounded-lg">
            {actualRevenue >= DEAL_TERMS.baseline ? <TrendingUp className="h-5 w-5 text-mcracing-700" /> : <TrendingDown className="h-5 w-5 text-orange-600" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-mcracing-900">
              {actualRevenue >= DEAL_TERMS.baseline
                ? `Above baseline by ${fmt(actualRevenue - DEAL_TERMS.baseline)}`
                : `Below baseline by ${fmt(DEAL_TERMS.baseline - actualRevenue)}`}
            </h4>
            <p className="text-xs text-mcracing-600 mt-1">
              Monthly baseline: ${DEAL_TERMS.baseline.toLocaleString()}. Growth fees only apply on revenue above this threshold.
              {actualRevenue < DEAL_TERMS.baseline && ' No growth fees are charged until you exceed the baseline.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PnLRow({ label, actual, projected, isPositiveGood }: {
  label: string
  actual: number
  projected: number
  isPositiveGood: boolean
}) {
  const variance = actual - projected
  const isGood = isPositiveGood ? variance >= 0 : variance <= 0
  const fmt = (n: number) => {
    const abs = Math.abs(n)
    return n < 0 ? `-$${abs.toLocaleString()}` : `$${abs.toLocaleString()}`
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-3 text-gray-900 font-medium">{label}</td>
      <td className="px-6 py-3 text-right text-gray-900">{fmt(actual)}</td>
      <td className="px-6 py-3 text-right text-gray-500">{fmt(projected)}</td>
      <td className={`px-6 py-3 text-right font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {variance !== 0 ? fmt(variance) : '—'}
      </td>
    </tr>
  )
}
