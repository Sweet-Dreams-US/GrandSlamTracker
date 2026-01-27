'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Repeat,
  Target,
  Zap,
  BookOpen,
} from 'lucide-react'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline } from '@/lib/calculations/feeCalculator'
import RevenueChart from '@/components/charts/RevenueChart'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

function calculateMonthlyRateFromTarget(
  target: number,
  baseline: number,
  months: number,
): number {
  if (target <= baseline || months <= 0) return 0
  return Math.pow(target / baseline, 1 / months) - 1
}

// ─── Data Architecture ─────────────────────────────────────────────────────

interface RevenueStream {
  name: string
  currentMonthly: number
  pricingTiers: string[]
  maxCapacity: number
  isRecurring: boolean
}

interface GrowthScenario {
  label: string
  key: string
  growthPct: number // e.g. 0.5 = 50%
  targetRevenue: number
  streams: {
    sessions: number
    parties: number
    memberships: number
    leagues: number
  }
}

interface WorkspaceData {
  businessName: string
  displayName: string
  industry: string
  industryLabel: string
  location: string
  uniquePosition: string
  hoursPerWeek: number
  schedule: string
  closedDays: string
  currentRevenue: { low: number; high: number; baseline: number }
  revenueMix: { sessions: number; parties: number; recurring: number }
  streams: RevenueStream[]
  scenarios: GrowthScenario[]
}

// ─── MC Racing Data ─────────────────────────────────────────────────────────

const MC_RACING: WorkspaceData = {
  businessName: 'MC Racing',
  displayName: 'MC Racing',
  industry: 'sim_racing',
  industryLabel: 'Sim Racing',
  location: 'Fort Wayne, IN',
  uniquePosition: 'Only sim racing facility in Fort Wayne',
  hoursPerWeek: 84,
  schedule: 'Noon-2am, Tue-Sun',
  closedDays: 'Mondays',
  currentRevenue: { low: 3500, high: 5000, baseline: 4000 },
  revenueMix: { sessions: 87, parties: 13, recurring: 0 },
  streams: [
    {
      name: 'Open Sessions',
      currentMonthly: 3480,
      pricingTiers: ['$25/30min', '$40/1hr', '$100/3hr'],
      maxCapacity: 8000,
      isRecurring: false,
    },
    {
      name: 'Parties & Events',
      currentMonthly: 520,
      pricingTiers: ['$200 basic (2hr/4ppl)', '$350 premium (3hr/8ppl)', '$500 VIP (4hr/12ppl)'],
      maxCapacity: 6000,
      isRecurring: false,
    },
    {
      name: 'Memberships',
      currentMonthly: 0,
      pricingTiers: ['$49/mo Solo', '$79/mo Duo', '$129/mo Family'],
      maxCapacity: 5000,
      isRecurring: true,
    },
    {
      name: 'Leagues',
      currentMonthly: 0,
      pricingTiers: ['$15/week per racer', '$20/week premium', 'Thur+Sat nights'],
      maxCapacity: 3000,
      isRecurring: true,
    },
  ],
  scenarios: [
    {
      label: 'A: 50% Growth',
      key: 'A',
      growthPct: 0.5,
      targetRevenue: 6000,
      streams: { sessions: 3800, parties: 1200, memberships: 600, leagues: 400 },
    },
    {
      label: 'B: 100% Growth',
      key: 'B',
      growthPct: 1.0,
      targetRevenue: 8000,
      streams: { sessions: 4200, parties: 1800, memberships: 1200, leagues: 800 },
    },
    {
      label: 'C: 200% Growth',
      key: 'C',
      growthPct: 2.0,
      targetRevenue: 12000,
      streams: { sessions: 4800, parties: 3000, memberships: 2400, leagues: 1800 },
    },
    {
      label: 'D: 300% Growth',
      key: 'D',
      growthPct: 3.0,
      targetRevenue: 16000,
      streams: { sessions: 5200, parties: 4000, memberships: 3600, leagues: 3200 },
    },
    {
      label: 'E: 400% Growth',
      key: 'E',
      growthPct: 4.0,
      targetRevenue: 20000,
      streams: { sessions: 5800, parties: 5200, memberships: 4800, leagues: 4200 },
    },
    {
      label: 'F: Ceiling',
      key: 'F',
      growthPct: 5.5,
      targetRevenue: 26000,
      streams: { sessions: 8000, parties: 6000, memberships: 5000, leagues: 3000 },
    },
  ],
}

// ─── Viability thresholds ───────────────────────────────────────────────────

const SWEET_DREAMS_MIN_MONTHLY = 500

function getViability(avgMonthly: number): 'red' | 'yellow' | 'green' {
  if (avgMonthly < SWEET_DREAMS_MIN_MONTHLY) return 'red'
  if (avgMonthly < 800) return 'yellow'
  return 'green'
}

const VIABILITY_CONFIG = {
  red: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: XCircle, label: 'Not Viable' },
  yellow: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: AlertTriangle, label: 'Borderline' },
  green: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: CheckCircle, label: 'Viable' },
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const params = useParams()
  const data = MC_RACING

  const [activeScenario, setActiveScenario] = useState('D')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['scenarios', 'fees', 'viability']),
  )

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Compute projections for all 6 scenarios (24 months for Y1+Y2)
  const projections = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    return Object.fromEntries(
      data.scenarios.map((s) => {
        const monthlyRate = calculateMonthlyRateFromTarget(
          s.targetRevenue,
          data.currentRevenue.baseline,
          12,
        )
        const proj = projectScenario({
          baselineRevenue: data.currentRevenue.baseline,
          industry: data.industry,
          monthlyGrowthRate: monthlyRate,
          startMonth: currentMonth,
          startYear: currentYear,
          projectionMonths: 24,
          isGrandSlam: true,
          applySeasonality: false,
          retentionOption: 'moderate',
        })
        return [s.key, proj]
      }),
    )
  }, [data])

  const activeProj = projections[activeScenario]
  const activeScenarioDef = data.scenarios.find((s) => s.key === activeScenario)!

  const categoryInfo = getTierRatesForBaseline(data.currentRevenue.baseline)

  // Chart data from active projection
  const chartData = activeProj.projections.map((p) => ({
    month: p.monthLabel.split(' ')[0],
    revenue: p.projectedRevenue,
    baseline: p.currentBaseline,
    fee: p.totalMonthlyFee,
  }))

  // Y1/Y2 splits
  const y1Months = activeProj.projections.filter((p) => p.yearNumber === 1)
  const y2Months = activeProj.projections.filter((p) => p.yearNumber === 2)

  const y1Summary = activeProj.yearSummaries.find((y) => y.yearNumber === 1)
  const y2Summary = activeProj.yearSummaries.find((y) => y.yearNumber === 2)

  // ── Section header helper ──
  const SectionHeader = ({
    id,
    title,
    icon: Icon,
  }: {
    id: string
    title: string
    icon: typeof TrendingUp
  }) => {
    const open = expandedSections.has(id)
    return (
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between py-3 px-1 text-left group"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {data.displayName} &mdash; Contract Workspace
          </h1>
        </div>
        <button className="btn-secondary">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* ── 2. Business Profile Banner ────────────────────────────────── */}
      <div className="card p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{data.businessName}</h2>
            <p className="text-indigo-200">
              {data.industryLabel} &bull; {data.location}
            </p>
            <p className="text-sm text-indigo-100 mt-1 italic">
              &ldquo;{data.uniquePosition}&rdquo;
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="text-sm bg-white/20 px-3 py-1 rounded">
              {data.hoursPerWeek} hrs/week
            </span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded">
              {data.schedule}
            </span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded">
              Closed {data.closedDays}
            </span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded">
              {formatCurrency(data.currentRevenue.low)}-{formatCurrency(data.currentRevenue.high)}/mo
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Current State Analysis ─────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="current" title="Current State Analysis" icon={Target} />
        {expandedSections.has('current') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Baseline Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.currentRevenue.baseline)}/mo
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Revenue Mix</p>
                <div className="flex justify-center gap-4 mt-1">
                  <span className="text-sm">
                    <span className="font-semibold">{data.revenueMix.sessions}%</span> Sessions
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{data.revenueMix.parties}%</span> Parties
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{data.revenueMix.recurring}%</span> Recurring
                  </span>
                </div>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Business Category</p>
                <p className="text-lg font-bold">{categoryInfo.categoryLabel}</p>
                <p className="text-xs text-gray-400">{data.industryLabel} (18% growth factor)</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">
                  0% recurring revenue &mdash; dependent on walk-ins
                </p>
                <p className="text-sm text-amber-700">
                  All revenue comes from one-time sessions and occasional parties. No memberships or
                  leagues yet. Building recurring streams is the primary growth lever.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Revenue Streams & Pricing ──────────────────────────────── */}
      <div className="card">
        <SectionHeader id="streams" title="Revenue Streams & Pricing" icon={Zap} />
        {expandedSections.has('streams') && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.streams.map((stream) => (
                <div
                  key={stream.name}
                  className={`card p-4 border ${
                    stream.isRecurring
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{stream.name}</h4>
                    {stream.isRecurring && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Recurring
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-gray-500">Current Monthly</span>
                    <span className="font-medium">
                      {formatCurrency(stream.currentMonthly)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-gray-500">Max Capacity</span>
                    <span className="font-medium">
                      {formatCurrency(stream.maxCapacity)}/mo
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pricing</p>
                    {stream.pricingTiers.map((tier) => (
                      <p key={tier} className="text-sm text-gray-700">
                        {tier}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Growth Scenarios ────────────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="scenarios" title="Growth Scenarios" icon={TrendingUp} />
        {expandedSections.has('scenarios') && (
          <div className="px-6 pb-6 space-y-4">
            {/* Scenario selector buttons */}
            <div className="flex flex-wrap gap-2">
              {data.scenarios.map((s) => {
                const proj = projections[s.key]
                const viability = getViability(proj.summary.avgMonthlyFee)
                const vCfg = VIABILITY_CONFIG[viability]
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveScenario(s.key)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      activeScenario === s.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : `${vCfg.bg} ${vCfg.text} hover:opacity-80`
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>

            {/* Active scenario revenue by stream */}
            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                {activeScenarioDef.label} &mdash; Revenue by Stream
              </h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Stream</th>
                      <th className="text-right">Current</th>
                      <th className="text-right">Target</th>
                      <th className="text-right">Change</th>
                      <th className="text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(activeScenarioDef.streams).map(([key, val]) => {
                      const current =
                        data.streams.find(
                          (s) => s.name.toLowerCase().includes(key),
                        )?.currentMonthly ?? 0
                      return (
                        <tr key={key}>
                          <td className="capitalize">{key}</td>
                          <td className="text-right">{formatCurrency(current)}</td>
                          <td className="text-right font-medium">{formatCurrency(val)}</td>
                          <td className="text-right text-green-600">
                            +{formatCurrency(val - current)}
                          </td>
                          <td className="text-right">
                            {((val / activeScenarioDef.targetRevenue) * 100).toFixed(0)}%
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="font-semibold bg-gray-50">
                      <td>Total</td>
                      <td className="text-right">
                        {formatCurrency(data.currentRevenue.baseline)}
                      </td>
                      <td className="text-right">
                        {formatCurrency(activeScenarioDef.targetRevenue)}
                      </td>
                      <td className="text-right text-green-600">
                        +{formatCurrency(activeScenarioDef.targetRevenue - data.currentRevenue.baseline)}
                      </td>
                      <td className="text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Recurring % */}
              {(() => {
                const recurringTotal =
                  activeScenarioDef.streams.memberships + activeScenarioDef.streams.leagues
                const recurringPct =
                  (recurringTotal / activeScenarioDef.targetRevenue) * 100
                return (
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Recurring Revenue:{' '}
                      <span className="font-semibold text-green-700">
                        {recurringPct.toFixed(0)}%
                      </span>{' '}
                      ({formatCurrency(recurringTotal)}/mo)
                    </span>
                    <span className="text-gray-400">vs current 0%</span>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── 6. Fee Projections ─────────────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="fees" title="Fee Projections" icon={TrendingUp} />
        {expandedSections.has('fees') && (
          <div className="px-6 pb-6 space-y-4">
            {/* Three-Part Fee */}
            <div className="card p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3">
                Three-Part Fee &mdash; {activeScenarioDef.label}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Foundation</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(activeProj.summary.totalFoundationFees)}
                  </p>
                  <p className="text-xs text-gray-400">Annual commitment</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Sustaining</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(activeProj.summary.totalSustainingFees)}
                  </p>
                  <p className="text-xs text-gray-400">Income protection</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Growth</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(activeProj.summary.totalGrowthFees)}
                  </p>
                  <p className="text-xs text-gray-400">Performance fees</p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold">
                  {formatCurrency(activeProj.summary.totalProjectedRevenue)}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Total Fees (24mo)</p>
                <p className="text-lg font-bold text-indigo-700">
                  {formatCurrency(activeProj.summary.totalFees)}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Avg Monthly Fee</p>
                <p className="text-lg font-bold text-indigo-600">
                  {formatCurrency(activeProj.summary.avgMonthlyFee)}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">Effective Rate</p>
                <p className="text-lg font-bold">
                  {activeProj.summary.avgEffectiveRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Revenue chart */}
            <div className="card p-6">
              <h4 className="font-semibold mb-2">24-Month Revenue Projection</h4>
              <RevenueChart data={chartData} showBaseline showFee />
            </div>

            {/* Monthly breakdown table */}
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-semibold">Monthly Breakdown</h4>
              </div>
              <div className="table-container max-h-[400px] overflow-auto">
                <table className="table">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th>Month</th>
                      <th className="text-right">Baseline</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Growth</th>
                      <th className="text-right">Found.</th>
                      <th className="text-right">Sust.</th>
                      <th className="text-right">Growth Fee</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProj.projections.map((row) => (
                      <tr
                        key={row.monthLabel}
                        className={
                          row.isBaselineReset
                            ? 'bg-purple-50'
                            : row.yearNumber % 2 === 0
                              ? 'bg-gray-25'
                              : ''
                        }
                      >
                        <td>
                          {row.monthLabel}
                          {row.isBaselineReset && (
                            <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">
                              Y{row.yearNumber}
                            </span>
                          )}
                        </td>
                        <td className="text-right text-gray-500">
                          {formatCurrency(row.currentBaseline)}
                        </td>
                        <td className="text-right">
                          {formatCurrency(row.projectedRevenue)}
                        </td>
                        <td className="text-right text-blue-600">
                          {(row.growthPercentage * 100).toFixed(0)}%
                        </td>
                        <td className="text-right text-amber-600">
                          {row.foundationFee > 0 ? formatCurrency(row.foundationFee) : '-'}
                        </td>
                        <td className="text-right text-purple-600">
                          {row.sustainingFee > 0 ? formatCurrency(row.sustainingFee) : '-'}
                        </td>
                        <td className="text-right text-green-600">
                          {formatCurrency(row.growthFee)}
                        </td>
                        <td className="text-right font-medium">
                          {formatCurrency(row.totalMonthlyFee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. All Scenarios Comparison ────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="comparison" title="All Scenarios Comparison" icon={Target} />
        {expandedSections.has('comparison') && (
          <div className="px-6 pb-6">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th className="text-right">Growth %</th>
                    <th className="text-right">Target Rev</th>
                    <th className="text-right">Recurring %</th>
                    <th className="text-right">Y1 Avg Fee</th>
                    <th className="text-right">Y2 Avg Fee</th>
                    <th className="text-center">Viable?</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scenarios.map((s) => {
                    const proj = projections[s.key]
                    const y1 = proj.yearSummaries.find((y) => y.yearNumber === 1)
                    const y2 = proj.yearSummaries.find((y) => y.yearNumber === 2)
                    const recurringPct =
                      ((s.streams.memberships + s.streams.leagues) / s.targetRevenue) * 100
                    const viability = getViability(proj.summary.avgMonthlyFee)
                    const vCfg = VIABILITY_CONFIG[viability]
                    const VIcon = vCfg.icon
                    return (
                      <tr
                        key={s.key}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          activeScenario === s.key ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => setActiveScenario(s.key)}
                      >
                        <td className="font-medium">{s.label}</td>
                        <td className="text-right">{(s.growthPct * 100).toFixed(0)}%</td>
                        <td className="text-right">{formatCurrency(s.targetRevenue)}</td>
                        <td className="text-right">{recurringPct.toFixed(0)}%</td>
                        <td className="text-right">
                          {y1 ? formatCurrency(y1.avgMonthlyFee) : '-'}
                        </td>
                        <td className="text-right">
                          {y2 ? formatCurrency(y2.avgMonthlyFee) : '-'}
                        </td>
                        <td className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${vCfg.bg} ${vCfg.text}`}
                          >
                            <VIcon className="h-3 w-3" />
                            {vCfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── 8. Year 1 -> Year 2 Transition ────────────────────────────── */}
      <div className="card">
        <SectionHeader id="transition" title="Year 1 → Year 2 Transition" icon={Repeat} />
        {expandedSections.has('transition') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year 1 */}
              <div className="card p-5 border-blue-200 bg-blue-50/50">
                <h4 className="font-semibold text-blue-800 mb-3">Year 1 (Grand Slam)</h4>
                {y1Summary && (
                  <div className="space-y-2 text-sm font-mono">
                    <p>
                      <span className="text-gray-500">Baseline:</span>{' '}
                      {formatCurrency(y1Summary.startBaseline)}/mo
                    </p>
                    <p>
                      <span className="text-gray-500">Avg Revenue:</span>{' '}
                      {formatCurrency(y1Summary.totalRevenue / 12)}/mo
                    </p>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <p className="text-amber-600">
                        Foundation: $0 (Grand Slam)
                      </p>
                      <p className="text-purple-600">
                        Sustaining: $0 (Year 1)
                      </p>
                      <p className="text-green-600">
                        Growth Fee: {formatCurrency(y1Summary.growthFeeTotal)} total
                      </p>
                      <p className="font-bold text-indigo-700 mt-1">
                        Avg: {formatCurrency(y1Summary.avgMonthlyFee)}/mo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Year 2 */}
              <div className="card p-5 border-purple-200 bg-purple-50/50">
                <h4 className="font-semibold text-purple-800 mb-3">Year 2 (After Reset)</h4>
                {y2Summary && activeProj.baselineResets.length > 0 && (
                  <div className="space-y-2 text-sm font-mono">
                    <p>
                      <span className="text-gray-500">Old Baseline:</span>{' '}
                      {formatCurrency(activeProj.baselineResets[0].oldBaseline)}
                    </p>
                    <p>
                      <span className="text-gray-500">New Baseline:</span>{' '}
                      <span className="font-bold">
                        {formatCurrency(activeProj.baselineResets[0].newBaseline)}
                      </span>
                    </p>
                    <div className="border-t border-purple-200 pt-2 mt-2">
                      <p className="text-amber-600">
                        Foundation: {formatCurrency(y2Summary.foundationFeeAnnual / 12)}/mo
                      </p>
                      <p className="text-purple-600">
                        Sustaining:{' '}
                        {y2Summary.sustainingFeeTotal > 0
                          ? `${formatCurrency(y2Summary.sustainingFeeTotal / 12)}/mo`
                          : '$0'}
                      </p>
                      <p className="text-green-600">
                        Growth Fee: {formatCurrency(y2Summary.growthFeeTotal)} total
                      </p>
                      <p className="font-bold text-indigo-700 mt-1">
                        Avg: {formatCurrency(y2Summary.avgMonthlyFee)}/mo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sustaining fee walkthrough */}
            {activeProj.baselineResets.length > 0 && y1Summary && (
              <div className="card p-4 bg-purple-50 border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">
                  Sustaining Fee Calculation
                </h4>
                <div className="text-sm font-mono space-y-1">
                  <p>
                    <span className="text-gray-500">Y1 Avg Monthly Fee:</span>{' '}
                    {formatCurrency(activeProj.baselineResets[0].lastYearAvgFee)}
                  </p>
                  <p>
                    <span className="text-gray-500">New Foundation (monthly):</span>{' '}
                    {formatCurrency(
                      (activeProj.baselineResets[0].newBaseline * 12 * categoryInfo.foundationFeeRate) / 12,
                    )}
                  </p>
                  <p className="font-semibold text-purple-800">
                    Sustaining Fee: {formatCurrency(activeProj.baselineResets[0].newSustainingFee)}/mo
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 9. Viability Dashboard ────────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="viability" title="Viability Dashboard" icon={CheckCircle} />
        {expandedSections.has('viability') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.scenarios.map((s) => {
                const proj = projections[s.key]
                const viability = getViability(proj.summary.avgMonthlyFee)
                const vCfg = VIABILITY_CONFIG[viability]
                const VIcon = vCfg.icon
                return (
                  <div
                    key={s.key}
                    className={`card p-4 border ${vCfg.bg} cursor-pointer ${
                      activeScenario === s.key ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => setActiveScenario(s.key)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <VIcon className={`h-5 w-5 ${vCfg.text}`} />
                      <span className={`font-semibold ${vCfg.text}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Avg Fee: {formatCurrency(proj.summary.avgMonthlyFee)}/mo
                    </p>
                    <p className="text-sm text-gray-600">
                      Target: {formatCurrency(s.targetRevenue)}/mo
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Minimum threshold line */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-full">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Sweet Dreams Minimum Threshold</span>
                  <span className="font-semibold">{formatCurrency(SWEET_DREAMS_MIN_MONTHLY)}/mo</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (activeProj.summary.avgMonthlyFee / 1500) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span className="text-red-500">${SWEET_DREAMS_MIN_MONTHLY} min</span>
                  <span>$1,500</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 10. Revenue Mix Evolution ─────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="mix" title="Revenue Mix Evolution" icon={TrendingUp} />
        {expandedSections.has('mix') && (
          <div className="px-6 pb-6">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th className="text-right">Sessions</th>
                    <th className="text-right">Parties</th>
                    <th className="text-right">Memberships</th>
                    <th className="text-right">Leagues</th>
                    <th className="text-right">Recurring %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="font-medium">Current</td>
                    <td className="text-right">87%</td>
                    <td className="text-right">13%</td>
                    <td className="text-right">0%</td>
                    <td className="text-right">0%</td>
                    <td className="text-right font-semibold text-red-600">0%</td>
                  </tr>
                  {data.scenarios.map((s) => {
                    const total = s.targetRevenue
                    const recurPct =
                      ((s.streams.memberships + s.streams.leagues) / total) * 100
                    return (
                      <tr
                        key={s.key}
                        className={activeScenario === s.key ? 'bg-indigo-50' : ''}
                      >
                        <td className="font-medium">{s.label}</td>
                        <td className="text-right">
                          {((s.streams.sessions / total) * 100).toFixed(0)}%
                        </td>
                        <td className="text-right">
                          {((s.streams.parties / total) * 100).toFixed(0)}%
                        </td>
                        <td className="text-right">
                          {((s.streams.memberships / total) * 100).toFixed(0)}%
                        </td>
                        <td className="text-right">
                          {((s.streams.leagues / total) * 100).toFixed(0)}%
                        </td>
                        <td className="text-right font-semibold text-green-600">
                          {recurPct.toFixed(0)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── 11. Growth Playbook ────────────────────────────────────────── */}
      <div className="card">
        <SectionHeader id="playbook" title="Growth Playbook" icon={Clock} />
        {expandedSections.has('playbook') && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  phase: 'Phase 1',
                  months: 'Months 1-2',
                  color: 'border-blue-300 bg-blue-50',
                  title: 'Foundation',
                  items: [
                    'Launch membership program (Solo, Duo, Family tiers)',
                    'Start Tuesday & Saturday night leagues',
                    'Party marketing push (social + local)',
                    'Set up Metricool tracking & analytics',
                  ],
                },
                {
                  phase: 'Phase 2',
                  months: 'Months 3-4',
                  color: 'border-green-300 bg-green-50',
                  title: 'Acceleration',
                  items: [
                    'Add Thursday night league',
                    'Referral program for members',
                    'Market Duo memberships to couples/friends',
                    'Corporate event outreach',
                  ],
                },
                {
                  phase: 'Phase 3',
                  months: 'Months 5-8',
                  color: 'border-amber-300 bg-amber-50',
                  title: 'Optimization',
                  items: [
                    'Raise session prices if demand supports',
                    'Corporate team-building packages',
                    'Party add-ons (food, trophies, photos)',
                    'Birthday party partnerships with venues',
                  ],
                },
                {
                  phase: 'Phase 4',
                  months: 'Months 9-12',
                  color: 'border-purple-300 bg-purple-50',
                  title: 'Scale',
                  items: [
                    'Premium pricing for peak hours',
                    'Full capacity league nights',
                    'Optimize membership retention',
                    'Evaluate expansion / additional rigs',
                  ],
                },
              ].map((phase) => (
                <div
                  key={phase.phase}
                  className={`card p-4 border-2 ${phase.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{phase.phase}: {phase.title}</span>
                    <span className="text-xs text-gray-500">{phase.months}</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item) => (
                      <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">&#8226;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 12. Contract Recommendation ───────────────────────────────── */}
      <div className="card">
        <SectionHeader id="recommendation" title="Contract Recommendation" icon={CheckCircle} />
        {expandedSections.has('recommendation') && (
          <div className="px-6 pb-6 space-y-4">
            <div className="card p-6 bg-green-50 border-2 border-green-300">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-green-900">
                    Grand Slam Deal Recommended
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-500">Category:</span>{' '}
                        <span className="font-semibold">
                          {categoryInfo.categoryLabel} ($0-10K)
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Industry:</span>{' '}
                        <span className="font-semibold">Sim Racing (18% growth factor)</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Target:</span>{' '}
                        <span className="font-semibold">300%+ growth ($16K+/mo)</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-500">Min Fee Floor:</span>{' '}
                        <span className="font-semibold">{formatCurrency(SWEET_DREAMS_MIN_MONTHLY)}/mo</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Foundation Rate:</span>{' '}
                        <span className="font-semibold">{formatPercent(categoryInfo.foundationFeeRate)}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Deal Type:</span>{' '}
                        <span className="font-semibold">Grand Slam (No Y1 Foundation)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risks & Mitigations */}
            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Key Risks & Mitigations</h4>
              <div className="space-y-3">
                {[
                  {
                    risk: 'Low baseline ($4K) means small absolute fee amounts',
                    mitigation:
                      'Micro category rates (20-30%) compensate; $500/mo floor protects downside',
                  },
                  {
                    risk: 'Zero recurring revenue currently',
                    mitigation:
                      'Memberships + leagues are untapped; sim racing audience is loyal and habit-forming',
                  },
                  {
                    risk: 'Single location in mid-size market',
                    mitigation:
                      'Only sim racing in Fort Wayne = monopoly position; no direct competition',
                  },
                  {
                    risk: 'High hours (84/week) may limit owner bandwidth for marketing',
                    mitigation:
                      'Sweet Dreams handles marketing execution; owner focuses on operations',
                  },
                ].map((item) => (
                  <div key={item.risk} className="flex gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-800">
                        <span className="font-medium">Risk:</span> {item.risk}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium text-green-700">Mitigation:</span>{' '}
                        {item.mitigation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 13. How The Model Works (Teaching Guide) ──────────────────── */}
      <div className="card">
        <SectionHeader id="teaching-guide" title="How The Model Works" icon={BookOpen} />
        {expandedSections.has('teaching-guide') && (
          <div className="px-6 pb-6 space-y-6">
            <p className="text-sm text-gray-600">
              Step-by-step walkthrough of the Grand Slam fee model using MC Racing as the example.
            </p>

            {/* Step 1 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">1. Your Baseline ($4,000/mo)</h4>
              <p className="text-sm text-gray-700">
                The baseline is what MC Racing is already earning <em>before</em> Sweet Dreams starts.
                We verify this with bank statements or POS reports. It represents the &ldquo;before&rdquo;
                picture &mdash; everything above this number is growth we helped create.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border">
                Baseline = $4,000/month (verified average of last 3-6 months)
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">2. Month 1 &mdash; Growth Fee Only (Grand Slam Year 1)</h4>
              <p className="text-sm text-gray-700">
                In a Grand Slam deal, Year 1 has <strong>no Foundation Fee</strong> and <strong>no Sustaining Fee</strong>.
                The only fee is the Growth Fee &mdash; a percentage of revenue above the baseline.
                Year 1 uses <strong>premium growth rates</strong> (higher than Year 2+) to compensate.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p>Month 1 Revenue: $5,200</p>
                <p>Baseline: $4,000</p>
                <p>Uplift: $5,200 - $4,000 = <span className="text-green-600 font-semibold">$1,200</span></p>
                <p>Growth: 30% (falls in Tier 1: 0-50%)</p>
                <p>Year 1 Micro Tier 1 Rate: <span className="text-blue-600 font-semibold">25%</span></p>
                <p>Growth Fee: $1,200 x 25% = <span className="text-green-600 font-semibold">$300</span></p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">3. How Growth Tiers Work &mdash; Progressive Rates</h4>
              <p className="text-sm text-gray-700">
                Growth fees use a progressive tier system (like tax brackets). Each slice of growth
                above the baseline is charged at a different rate. Year 1 rates are higher than Year 2+.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p className="text-gray-500">Example: MC Racing at $10,000/mo (150% growth)</p>
                <p>Tier 1 (0-50%): $2,000 x 25% = $500</p>
                <p>Tier 2 (51-100%): $2,000 x 30% = $600</p>
                <p>Tier 3 (101-150%): $2,000 x 35% = $700</p>
                <p className="font-semibold border-t pt-1">Total Growth Fee: <span className="text-green-600">$1,800</span></p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Year 2+ uses standard (lower) rates since Foundation and Sustaining fees also apply.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">4. Seasonal Baseline Adjustments (Year 1)</h4>
              <p className="text-sm text-gray-700">
                In Year 1, the baseline is adjusted by a seasonal index before calculating growth fees.
                This prevents penalizing the client during slow months or giving us windfall fees in peak months.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p className="text-gray-500">January (slow month, seasonal index = 0.85):</p>
                <p>Seasonal Baseline = $4,000 x 0.85 = $3,400</p>
                <p>Revenue: $4,500 &rarr; Uplift = $4,500 - $3,400 = $1,100</p>
                <p className="text-gray-500 mt-2">July (peak month, seasonal index = 1.15):</p>
                <p>Seasonal Baseline = $4,000 x 1.15 = $4,600</p>
                <p>Revenue: $6,200 &rarr; Uplift = $6,200 - $4,600 = $1,600</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Year 2+ uses a flat baseline (year-over-year). Seasonality still affects projected revenue.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">5. Monthly Fee Calculation Example</h4>
              <p className="text-sm text-gray-700">
                Putting it all together for a typical Month 6.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p>Month 6 Revenue: $8,000</p>
                <p>Baseline: $4,000 (seasonal adjusted for Y1)</p>
                <p>Uplift: $4,000 (100% growth)</p>
                <p className="border-t pt-1 mt-1">Tier 1 (0-50%): $2,000 x 25% = $500</p>
                <p>Tier 2 (51-100%): $2,000 x 30% = $600</p>
                <p className="border-t pt-1 mt-1 text-amber-600">Foundation: $0 (Grand Slam Y1)</p>
                <p className="text-purple-600">Sustaining: $0 (Year 1)</p>
                <p className="text-green-600">Growth Fee: $1,100</p>
                <p className="font-bold text-indigo-700 border-t pt-1 mt-1">Total Fee: $1,100</p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">6. Year 1 Summary &mdash; What the Client Paid vs Kept</h4>
              <p className="text-sm text-gray-700">
                At the end of Year 1, look at the total picture.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p>Baseline Revenue (12 months): $48,000</p>
                <p>Actual Revenue (12 months): $96,000</p>
                <p>Total Uplift Created: <span className="text-green-600 font-semibold">$48,000</span></p>
                <p className="border-t pt-1 mt-1">Total Fees Paid (Year 1): ~$10,800</p>
                <p>Client Kept: $96,000 - $10,800 = <span className="font-semibold">$85,200</span></p>
                <p>Effective Rate: ~11.3% of total revenue</p>
                <p className="text-green-700 font-semibold mt-1">
                  Client got $48,000 in new revenue, paid $10,800 &mdash; kept 77.5% of growth
                </p>
              </div>
            </div>

            {/* Step 7 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">7. Year 2 Reset &mdash; Growth-Based Retention Brackets</h4>
              <p className="text-sm text-blue-800">
                At the start of Year 2, the baseline resets upward. How much depends on average growth achieved.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p className="text-gray-500 font-semibold">New Baseline = Old + (Avg Monthly Uplift x Retention%)</p>
                <p className="mt-2">Old Baseline: $4,000</p>
                <p>Avg Monthly Uplift: $4,000</p>
                <p>Avg Growth: 100% &rarr; Retention Bracket: 76-100% &rarr; <span className="text-blue-600 font-semibold">50%</span></p>
                <p className="border-t pt-1 mt-1 font-semibold">
                  New Baseline = $4,000 + ($4,000 x 50%) = <span className="text-blue-700">$6,000/mo</span>
                </p>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-blue-200 px-3 py-1.5 text-left">Growth Achieved</th>
                      <th className="border border-blue-200 px-3 py-1.5 text-left">Retention %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-blue-200 px-3 py-1">0-25%</td><td className="border border-blue-200 px-3 py-1">20%</td></tr>
                    <tr className="bg-blue-50"><td className="border border-blue-200 px-3 py-1">26-50%</td><td className="border border-blue-200 px-3 py-1">30%</td></tr>
                    <tr><td className="border border-blue-200 px-3 py-1">51-75%</td><td className="border border-blue-200 px-3 py-1">40%</td></tr>
                    <tr className="bg-blue-50"><td className="border border-blue-200 px-3 py-1">76-100%</td><td className="border border-blue-200 px-3 py-1">50%</td></tr>
                    <tr><td className="border border-blue-200 px-3 py-1">101%+</td><td className="border border-blue-200 px-3 py-1">60%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 8 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">8. Foundation + Sustaining Fees (Year 2+)</h4>
              <p className="text-sm text-gray-700">
                Year 2 introduces two additional fee components on top of Growth Fees.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p className="text-amber-700 font-semibold">Foundation Fee (Annual Minimum)</p>
                <p>New Baseline: $6,000/mo x 12 = $72,000/yr</p>
                <p>Micro Rate: 3.0%</p>
                <p>Annual Foundation: $72,000 x 3% = $2,160/yr = <span className="text-amber-600 font-semibold">$180/mo</span></p>
                <p className="mt-2 text-purple-700 font-semibold">Sustaining Fee (Income Protection)</p>
                <p>Y1 Avg Monthly Fee: $900</p>
                <p>New Foundation (monthly): $180</p>
                <p>Sustaining = $900 - $180 = <span className="text-purple-600 font-semibold">$720/mo</span></p>
                <p className="text-xs text-gray-500 mt-1">Ensures we never earn less than last year</p>
              </div>
            </div>

            {/* Step 9 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">9. Year 2 Guaranteed Floor</h4>
              <p className="text-sm text-gray-700">
                Even in a month with zero growth above the new baseline, we still earn Foundation + Sustaining.
              </p>
              <div className="mt-2 font-mono text-sm bg-white p-2 rounded border space-y-1">
                <p className="text-gray-500">Worst case Month 13 (no growth):</p>
                <p className="text-amber-600">Foundation: $180/mo</p>
                <p className="text-purple-600">Sustaining: $720/mo</p>
                <p className="text-green-600">Growth Fee: $0</p>
                <p className="font-bold text-indigo-700 border-t pt-1 mt-1">
                  Floor: $900/mo (= Year 1 average)
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This is the power of the three-part model: Foundation + Sustaining guarantees
                we never earn less than last year, while Growth Fees reward continued performance.
              </p>
            </div>

            {/* Step 10 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">10. Why This Beats a Retainer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="font-semibold text-red-800 mb-2">Traditional Retainer</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>- Client pays $2,000/mo regardless</li>
                    <li>- No incentive for agency to perform</li>
                    <li>- Client pays even if revenue drops</li>
                    <li>- Agency earns same if they grow 10% or 300%</li>
                    <li>- Conflict: agency wants easy clients</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="font-semibold text-green-800 mb-2">Grand Slam Model</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>+ Client pays $0 upfront in Year 1</li>
                    <li>+ We only earn when client grows</li>
                    <li>+ Fee scales with actual results</li>
                    <li>+ Higher growth = higher earnings for both</li>
                    <li>+ Alignment: we succeed together</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>MC Racing example:</strong> A $2,000/mo retainer means the client pays
                  $24,000/year no matter what. With Grand Slam, they paid ~$10,800 in Year 1 and
                  got $48,000 in new revenue. The fee was <em>earned</em>, not demanded.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
