'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts'
import {
  Leaf, TrendingUp, Scissors, DollarSign, Sun, BookOpen,
  ChevronDown, ChevronUp, Calculator, Wrench, MapPin, Target,
  Lock, Unlock, RotateCcw, Zap, Users, Building2, BarChart3,
} from 'lucide-react'
import { calculateGrowthFee, getTierRatesForBaseline } from '@/lib/calculations/feeCalculator'

// ─── Constants ──────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SEED_BASELINE = 500

interface ServiceLine {
  name: string
  shortName: string
  pricePerUnit: number
  unit: string
  frequencyPerMonth: number
  activeMonths: number[]
  customerRamp: number[] // 12 months, moderate scenario
  chartColor: string
  bgColor: string
}

const DEFAULT_SERVICE_LINES: ServiceLine[] = [
  {
    name: 'Weekly Mowing',
    shortName: 'Mowing',
    pricePerUnit: 45,
    unit: 'visit',
    frequencyPerMonth: 4.33,
    activeMonths: [3, 4, 5, 6, 7, 8, 9],
    customerRamp: [0, 0, 0, 10, 18, 25, 30, 30, 24, 14, 0, 0],
    chartColor: '#3d8b5a',
    bgColor: 'bg-green-500',
  },
  {
    name: 'Weed Control',
    shortName: 'Weed',
    pricePerUnit: 75,
    unit: 'treatment',
    frequencyPerMonth: 1,
    activeMonths: [3, 4, 5, 6, 7, 8],
    customerRamp: [0, 0, 0, 5, 10, 15, 18, 18, 12, 0, 0, 0],
    chartColor: '#d97706',
    bgColor: 'bg-amber-500',
  },
  {
    name: 'Mulching',
    shortName: 'Mulch',
    pricePerUnit: 350,
    unit: 'job',
    frequencyPerMonth: 1,
    activeMonths: [3, 4, 5],
    customerRamp: [0, 0, 0, 4, 8, 4, 0, 0, 0, 0, 0, 0],
    chartColor: '#ea580c',
    bgColor: 'bg-orange-500',
  },
  {
    name: 'Spring/Fall Cleanup',
    shortName: 'Cleanup',
    pricePerUnit: 225,
    unit: 'job',
    frequencyPerMonth: 1,
    activeMonths: [2, 3, 9, 10],
    customerRamp: [0, 0, 6, 10, 0, 0, 0, 0, 0, 12, 6, 0],
    chartColor: '#2563eb',
    bgColor: 'bg-blue-500',
  },
]

// Seasonality index for landscaping (1.0 = average)
const SEASONAL_INDEX = [0.0, 0.0, 0.3, 0.7, 1.2, 1.4, 1.5, 1.5, 1.1, 0.8, 0.3, 0.0]

const MULTIPLIER_PRESETS = [
  { label: '0.5x', value: 0.5, desc: 'Very Conservative' },
  { label: '0.75x', value: 0.75, desc: 'Conservative' },
  { label: '1.0x', value: 1.0, desc: 'Moderate' },
  { label: '1.25x', value: 1.25, desc: 'Optimistic' },
  { label: '1.5x', value: 1.5, desc: 'Aggressive' },
  { label: '2.0x', value: 2.0, desc: 'Maximum' },
]

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: Leaf },
  { id: 'business-builder', label: 'Business Builder', icon: Wrench },
  { id: 'projections', label: 'Projections', icon: TrendingUp },
  { id: 'profitability', label: 'Profitability', icon: BarChart3 },
  { id: 'market-intel', label: 'Market Intel', icon: MapPin },
  { id: 'fee-structure', label: 'Fee Structure', icon: DollarSign },
  { id: 'seasonality', label: 'Seasonality', icon: Sun },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
]

type TabId = 'overview' | 'business-builder' | 'projections' | 'profitability' | 'market-intel' | 'fee-structure' | 'seasonality' | 'services' | 'how-it-works'

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)

const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : fmt(v)

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MillerContent() {
  // Editable service data
  const [servicePrices, setServicePrices] = useState(DEFAULT_SERVICE_LINES.map(s => s.pricePerUnit))
  const [serviceFrequencies, setServiceFrequencies] = useState(DEFAULT_SERVICE_LINES.map(s => s.frequencyPerMonth))
  const [serviceCustomerRamps, setServiceCustomerRamps] = useState(DEFAULT_SERVICE_LINES.map(s => [...s.customerRamp]))

  // Scenario controls
  const [multiplier, setMultiplier] = useState(1.0)
  const [contractLocked, setContractLocked] = useState(false)
  const [revenueTarget, setRevenueTarget] = useState('')
  const [customMultiplier, setCustomMultiplier] = useState('')

  // Cost model (all editable)
  const [crewSize, setCrewSize] = useState(2)
  const [crewRate, setCrewRate] = useState(20)
  const [laborHours, setLaborHours] = useState({ mowing: 1.5, weed: 1.0, mulch: 4.0, cleanup: 3.0 })
  const [travelHours, setTravelHours] = useState(0.25)
  const [fixedCosts, setFixedCosts] = useState({
    fuel: 400, equipment: 650, insurance: 250, truck: 600,
    marketing: 150, phone: 75, software: 50, misc: 100,
  })
  const [materialCosts, setMaterialCosts] = useState({ mowing: 5, weed: 15, mulch: 120, cleanup: 25 })

  // Fee calculator input
  const [feeCalcRevenue, setFeeCalcRevenue] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showCostEditor, setShowCostEditor] = useState(false)
  const [expandedService, setExpandedService] = useState<string | null>(null)

  // Build effective service lines from editable state
  const serviceLines = useMemo(() => DEFAULT_SERVICE_LINES.map((s, i) => ({
    ...s,
    pricePerUnit: servicePrices[i],
    frequencyPerMonth: serviceFrequencies[i],
    customerRamp: serviceCustomerRamps[i],
  })), [servicePrices, serviceFrequencies, serviceCustomerRamps])

  // ─── Calculation helpers ────────────────────────────────────────────────

  const calcServiceMonthlyRevenue = useCallback((service: ServiceLine, month: number, mult: number) => {
    const customers = Math.round(service.customerRamp[month] * mult)
    return customers * service.pricePerUnit * service.frequencyPerMonth
  }, [])

  const calcMonthlyTotal = useCallback((month: number, mult: number) => {
    return serviceLines.reduce((sum, s) => sum + calcServiceMonthlyRevenue(s, month, mult), 0)
  }, [serviceLines, calcServiceMonthlyRevenue])

  const calcAnnualTotal = useCallback((mult: number) => {
    let total = 0
    for (let m = 0; m < 12; m++) total += calcMonthlyTotal(m, mult)
    return total
  }, [calcMonthlyTotal])

  const calcServiceAnnualTotal = useCallback((service: ServiceLine, mult: number) => {
    let total = 0
    for (let m = 0; m < 12; m++) total += calcServiceMonthlyRevenue(service, m, mult)
    return total
  }, [calcServiceMonthlyRevenue])

  // Revenue target solver
  const solveForRevenue = useCallback((target: number): number => {
    let lo = 0.1, hi = 5.0
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2
      const annual = calcAnnualTotal(mid)
      if (annual < target) lo = mid
      else hi = mid
    }
    return Math.round((lo + hi) / 2 * 100) / 100
  }, [calcAnnualTotal])

  // ─── Derived data ──────────────────────────────────────────────────────

  const currentAnnual = useMemo(() => Math.round(calcAnnualTotal(multiplier)), [calcAnnualTotal, multiplier])

  const laborHoursMap: Record<string, number> = useMemo(() => ({
    'Weekly Mowing': laborHours.mowing,
    'Weed Control': laborHours.weed,
    'Mulching': laborHours.mulch,
    'Spring/Fall Cleanup': laborHours.cleanup,
  }), [laborHours])

  const materialCostsMap: Record<string, number> = useMemo(() => ({
    'Weekly Mowing': materialCosts.mowing,
    'Weed Control': materialCosts.weed,
    'Mulching': materialCosts.mulch,
    'Spring/Fall Cleanup': materialCosts.cleanup,
  }), [materialCosts])

  // Cost analysis
  const costAnalysis = useMemo(() => {
    const totalFixed = Object.values(fixedCosts).reduce((a, b) => a + b, 0)
    let totalLabor = 0
    let totalMaterials = 0
    let totalFees = 0
    let totalRevenue = 0

    const monthly: Array<{
      month: string
      revenue: number
      labor: number
      materials: number
      fixed: number
      fee: number
      profit: number
    }> = []

    for (let m = 0; m < 12; m++) {
      let monthLabor = 0
      let monthMaterials = 0
      let monthRevenue = 0

      for (const s of serviceLines) {
        const customers = Math.round(s.customerRamp[m] * multiplier)
        const jobs = customers * s.frequencyPerMonth
        const sLaborHours = laborHoursMap[s.name] || 1.5
        const sMaterialCost = materialCostsMap[s.name] || 10
        const jobLabor = jobs * sLaborHours * crewSize * crewRate
        const travelLabor = jobs > 0 ? jobs * travelHours * crewSize * crewRate : 0
        monthLabor += jobLabor + travelLabor
        monthMaterials += jobs * sMaterialCost
        monthRevenue += calcServiceMonthlyRevenue(s, m, multiplier)
      }

      const isOffSeason = m === 0 || m === 1 || m === 11
      const monthFixed = isOffSeason ? totalFixed * 0.5 : totalFixed
      const feeResult = calculateGrowthFee(SEED_BASELINE, monthRevenue, true)
      const monthFee = feeResult.growthFee
      const monthProfit = monthRevenue - monthLabor - monthMaterials - monthFixed - monthFee

      totalLabor += monthLabor
      totalMaterials += monthMaterials
      totalFees += monthFee
      totalRevenue += monthRevenue

      monthly.push({
        month: MONTHS[m],
        revenue: Math.round(monthRevenue),
        labor: Math.round(monthLabor),
        materials: Math.round(monthMaterials),
        fixed: Math.round(monthFixed),
        fee: Math.round(monthFee),
        profit: Math.round(monthProfit),
      })
    }

    const totalCosts = totalLabor + totalMaterials + (totalFixed * 9 + totalFixed * 0.5 * 3)
    const netProfit = totalRevenue - totalCosts - totalFees

    return {
      monthly,
      totalLabor: Math.round(totalLabor),
      totalMaterials: Math.round(totalMaterials),
      totalFixed: Math.round(totalFixed * 9 + totalFixed * 0.5 * 3),
      totalFees: Math.round(totalFees),
      totalRevenue: Math.round(totalRevenue),
      totalCosts: Math.round(totalCosts),
      netProfit: Math.round(netProfit),
    }
  }, [serviceLines, multiplier, fixedCosts, crewSize, crewRate, laborHoursMap, materialCostsMap, travelHours, calcServiceMonthlyRevenue])

  // Chart data for projections
  const chartData = useMemo(() => {
    return MONTHS.map((month, i) => {
      const row: Record<string, string | number> = { month }
      for (const s of serviceLines) {
        row[s.shortName] = Math.round(calcServiceMonthlyRevenue(s, i, multiplier))
      }
      row.total = Math.round(calcMonthlyTotal(i, multiplier))
      return row
    })
  }, [serviceLines, multiplier, calcServiceMonthlyRevenue, calcMonthlyTotal])

  // Comparison data
  const comparisonData = useMemo(() => {
    const lowMult = Math.max(0.1, multiplier * 0.75)
    const highMult = multiplier * 1.5
    return MONTHS.map((month, i) => ({
      month,
      conservative: Math.round(calcMonthlyTotal(i, lowMult)),
      current: Math.round(calcMonthlyTotal(i, multiplier)),
      aggressive: Math.round(calcMonthlyTotal(i, highMult)),
    }))
  }, [multiplier, calcMonthlyTotal])

  // Fee data
  const feeData = useMemo(() => {
    const scenarios = [
      { label: 'Conservative', mult: 0.75 },
      { label: 'Current', mult: multiplier },
      { label: 'Aggressive', mult: 1.5 },
    ]
    return scenarios.map(sc => {
      const annual = calcAnnualTotal(sc.mult)
      const avgMonthly = annual / 12
      const result = calculateGrowthFee(SEED_BASELINE, avgMonthly, true)
      return {
        scenario: sc.label,
        annual: Math.round(annual),
        avgMonthly: Math.round(avgMonthly),
        growthFee: Math.round(result.growthFee),
        annualFee: Math.round(result.growthFee * 12),
        effectiveRate: annual > 0 ? ((result.growthFee * 12) / annual * 100) : 0,
        netToClient: Math.round(annual - (result.growthFee * 12)),
      }
    })
  }, [multiplier, calcAnnualTotal])

  // Tier rates
  const tierRates = useMemo(() => getTierRatesForBaseline(SEED_BASELINE, true), [])

  // Peak month revenue
  const peakMonthRevenue = useMemo(() => {
    return Math.max(...MONTHS.map((_, i) => calcMonthlyTotal(i, multiplier)))
  }, [multiplier, calcMonthlyTotal])

  // Per-service profitability
  const serviceProfitability = useMemo(() => {
    return serviceLines.map(s => {
      let annualRevenue = 0
      let annualLabor = 0
      let annualMaterial = 0
      const sLaborHours = laborHoursMap[s.name] || 1.5
      const sMaterialCost = materialCostsMap[s.name] || 10

      for (let m = 0; m < 12; m++) {
        const customers = Math.round(s.customerRamp[m] * multiplier)
        const jobs = customers * s.frequencyPerMonth
        const rev = calcServiceMonthlyRevenue(s, m, multiplier)
        annualRevenue += rev
        annualLabor += jobs * sLaborHours * crewSize * crewRate + (jobs > 0 ? jobs * travelHours * crewSize * crewRate : 0)
        annualMaterial += jobs * sMaterialCost
      }

      const grossMargin = annualRevenue - annualLabor - annualMaterial
      const marginPct = annualRevenue > 0 ? (grossMargin / annualRevenue) * 100 : 0

      return {
        name: s.name,
        shortName: s.shortName,
        chartColor: s.chartColor,
        bgColor: s.bgColor,
        annualRevenue: Math.round(annualRevenue),
        annualLabor: Math.round(annualLabor),
        annualMaterial: Math.round(annualMaterial),
        grossMargin: Math.round(grossMargin),
        marginPct: Math.round(marginPct * 10) / 10,
      }
    })
  }, [serviceLines, multiplier, crewSize, crewRate, travelHours, laborHoursMap, materialCostsMap, calcServiceMonthlyRevenue])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setServicePrices(DEFAULT_SERVICE_LINES.map(s => s.pricePerUnit))
    setServiceFrequencies(DEFAULT_SERVICE_LINES.map(s => s.frequencyPerMonth))
    setServiceCustomerRamps(DEFAULT_SERVICE_LINES.map(s => [...s.customerRamp]))
    setMultiplier(1.0)
    setContractLocked(false)
    setRevenueTarget('')
    setCustomMultiplier('')
  }, [])

  // Multiplier description
  const multiplierDesc = useMemo(() => {
    const preset = MULTIPLIER_PRESETS.find(p => p.value === multiplier)
    return preset ? preset.desc : `Custom (${multiplier}x)`
  }, [multiplier])

  // Interactive fee calculator result
  const feeCalcResult = useMemo(() => {
    const rev = parseFloat(feeCalcRevenue)
    if (!rev || rev <= 0) return null
    const result = calculateGrowthFee(SEED_BASELINE, rev, true)
    const effectiveRate = rev > 0 && result.growthFee > 0 ? (result.growthFee / rev * 100) : 0
    const millerKeeps = rev - result.growthFee
    const ratio = result.growthFee > 0 ? (millerKeeps / result.growthFee) : 0
    return { ...result, effectiveRate, millerKeeps, ratio, revenue: rev }
  }, [feeCalcRevenue])

  // Break-even calcs
  const breakEven = useMemo(() => {
    const totalFixedVal = Object.values(fixedCosts).reduce((a, b) => a + b, 0)
    const monthlyBreakEven = totalFixedVal + (totalFixedVal * 0.1) // rough estimate with some variable
    const annualBreakEven = monthlyBreakEven * 12
    // Avg revenue per customer across all services in peak
    const avgRevenuePerCustomerMonth = serviceLines.reduce((sum, s) => {
      const peakCustomers = Math.max(...s.customerRamp)
      if (peakCustomers === 0) return sum
      return sum + (s.pricePerUnit * s.frequencyPerMonth)
    }, 0) / serviceLines.filter(s => Math.max(...s.customerRamp) > 0).length
    const customersNeeded = avgRevenuePerCustomerMonth > 0 ? Math.ceil(monthlyBreakEven / avgRevenuePerCustomerMonth) : 0
    return { monthlyBreakEven: Math.round(monthlyBreakEven), annualBreakEven: Math.round(annualBreakEven), customersNeeded }
  }, [fixedCosts, serviceLines])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="card p-6 bg-gradient-to-r from-miller-700 to-emerald-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Miller Scaping Solutions</h1>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/20 text-xs font-bold">
                  <Leaf className="h-3 w-3" /> GRAND SLAM
                </span>
              </div>
              <p className="text-miller-200">Fort Wayne, IN &middot; Landscaping / Lawn Care &middot; New Startup</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-sm bg-white/20 px-2 py-1 rounded">Baseline: $0/mo (startup)</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">Deal Type: Standard Grand Slam</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">Category: Micro</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">Multiplier: {multiplier}x ({multiplierDesc})</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-miller-200">Year 1 Projection ({multiplierDesc})</p>
              <p className="text-3xl font-bold">{fmt(currentAnnual)}</p>
              <p className="text-sm text-miller-200">across 4 service lines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6 border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-miller-700 text-miller-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════ TAB 1: Overview (Enhanced) ═══════ */}
      {activeTab === 'overview' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Year 1 Revenue</p>
              <p className="text-2xl font-bold text-miller-700">{fmt(currentAnnual)}</p>
              <p className="text-xs text-gray-500">{multiplierDesc} scenario</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Annual Profit</p>
              <p className={`text-2xl font-bold ${costAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(costAnalysis.netProfit)}
              </p>
              <p className="text-xs text-gray-500">after all costs &amp; fees</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Peak Month</p>
              <p className="text-2xl font-bold text-miller-700">{fmt(Math.round(peakMonthRevenue))}</p>
              <p className="text-xs text-gray-500">Jul/Aug</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Active Season</p>
              <p className="text-2xl font-bold text-miller-700">Mar-Nov</p>
              <p className="text-xs text-gray-500">9 months</p>
            </div>
          </div>

          {/* Service Lines Overview */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Services</span>
              <h3 className="font-semibold">Service Line Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Service</th>
                    <th className="text-right px-4 py-3">Price/Unit</th>
                    <th className="text-center px-4 py-3">Frequency</th>
                    <th className="text-center px-4 py-3">Season</th>
                    <th className="text-right px-4 py-3">Peak Customers</th>
                    <th className="text-right px-4 py-3">Year 1 Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviceLines.map(s => {
                    const annual = Math.round(calcServiceAnnualTotal(s, multiplier))
                    const peakCustomers = Math.round(Math.max(...s.customerRamp) * multiplier)
                    const startMonth = MONTHS[s.activeMonths[0]]
                    const endMonth = MONTHS[s.activeMonths[s.activeMonths.length - 1]]
                    return (
                      <tr key={s.name}>
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${s.bgColor}`} />
                          {s.name}
                        </td>
                        <td className="px-4 py-3 text-right">{fmt(s.pricePerUnit)}/{s.unit}</td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {s.frequencyPerMonth === 4.33 ? '4.33x/mo' : s.frequencyPerMonth === 1 ? '1x/mo' : `${s.frequencyPerMonth}x/mo`}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{startMonth}-{endMonth}</td>
                        <td className="px-4 py-3 text-right font-medium">{peakCustomers}</td>
                        <td className="px-4 py-3 text-right font-bold text-miller-700">{fmt(annual)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-miller-50 font-bold">
                  <tr>
                    <td className="px-4 py-3" colSpan={5}>Total Year 1</td>
                    <td className="px-4 py-3 text-right text-miller-700">{fmt(currentAnnual)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-miller-600" />
              Annual Cost Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                <p className="text-xs text-gray-500">Total Labor</p>
                <p className="text-lg font-bold text-red-700">{fmt(costAnalysis.totalLabor)}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                <p className="text-xs text-gray-500">Total Materials</p>
                <p className="text-lg font-bold text-orange-700">{fmt(costAnalysis.totalMaterials)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-gray-500">Fixed Costs</p>
                <p className="text-lg font-bold text-blue-700">{fmt(costAnalysis.totalFixed)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                <p className="text-xs text-gray-500">SD Fees</p>
                <p className="text-lg font-bold text-purple-700">{fmt(costAnalysis.totalFees)}</p>
              </div>
              <div className={`p-3 rounded-lg border text-center ${costAnalysis.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-xs text-gray-500">Net Profit</p>
                <p className={`text-lg font-bold ${costAnalysis.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(costAnalysis.netProfit)}</p>
              </div>
            </div>
          </div>

          {/* Scenario Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Conservative', mult: 0.75, color: 'bg-gray-500' },
              { label: 'Current', mult: multiplier, color: 'bg-miller-600' },
              { label: 'Aggressive', mult: 1.5, color: 'bg-blue-500' },
            ].map(sc => {
              const annual = Math.round(calcAnnualTotal(sc.mult))
              const feeResult = calculateGrowthFee(SEED_BASELINE, annual / 12, true)
              const annualFee = Math.round(feeResult.growthFee * 12)
              return (
                <div key={sc.label} className={`card p-4 ${sc.label === 'Current' ? 'ring-2 ring-miller-500 bg-miller-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${sc.color}`} />
                    <span className="font-semibold text-sm">{sc.label} ({sc.mult}x)</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(annual)}</p>
                  <p className="text-xs text-gray-500">Year 1 Gross Revenue</p>
                  <p className="text-sm font-medium mt-1 text-miller-600">
                    Net: {fmt(annual - annualFee)} after fees
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════ TAB 2: Business Builder (NEW) ═══════ */}
      {activeTab === 'business-builder' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Contract Lock + Reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setContractLocked(!contractLocked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contractLocked
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-miller-100 text-miller-700 border border-miller-300'
                }`}
              >
                {contractLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {contractLocked ? 'Locked' : 'Unlocked'}
              </button>
              <button
                onClick={resetToDefaults}
                disabled={contractLocked}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Annual Projection</p>
              <p className="text-2xl font-bold text-miller-700">{fmt(currentAnnual)}</p>
            </div>
          </div>

          {/* Multiplier Presets */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-miller-600" />
              Growth Multiplier
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              {MULTIPLIER_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => { if (!contractLocked) setMultiplier(p.value) }}
                  disabled={contractLocked}
                  className={`p-3 rounded-lg text-center border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    multiplier === p.value
                      ? 'bg-miller-700 text-white border-miller-700'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-miller-50 hover:border-miller-300'
                  }`}
                >
                  <p className="font-bold text-lg">{p.label}</p>
                  <p className="text-xs opacity-80">{p.desc}</p>
                </button>
              ))}
            </div>

            {/* Custom Multiplier */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600">Custom:</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5.0"
                value={customMultiplier}
                onChange={e => setCustomMultiplier(e.target.value)}
                disabled={contractLocked}
                placeholder="e.g. 1.15"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500 disabled:opacity-50"
              />
              <button
                onClick={() => {
                  const val = parseFloat(customMultiplier)
                  if (val >= 0.1 && val <= 5.0) setMultiplier(val)
                }}
                disabled={contractLocked || !customMultiplier}
                className="px-4 py-2 bg-miller-600 text-white rounded-lg text-sm font-medium hover:bg-miller-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Revenue Target Solver */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Revenue Target Solver
            </h3>
            <p className="text-sm text-gray-500 mb-3">Enter a target annual revenue and we will find the multiplier needed to reach it.</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                step="1000"
                min="0"
                value={revenueTarget}
                onChange={e => setRevenueTarget(e.target.value)}
                disabled={contractLocked}
                placeholder="e.g. 100000"
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500 disabled:opacity-50"
              />
              <button
                onClick={() => {
                  const target = parseFloat(revenueTarget)
                  if (target > 0) {
                    const solved = solveForRevenue(target)
                    setMultiplier(solved)
                    setCustomMultiplier(String(solved))
                  }
                }}
                disabled={contractLocked || !revenueTarget}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Solve
              </button>
              {revenueTarget && parseFloat(revenueTarget) > 0 && (
                <span className="text-sm text-gray-600">
                  Need ~{solveForRevenue(parseFloat(revenueTarget))}x multiplier for {fmt(parseFloat(revenueTarget))}
                </span>
              )}
            </div>
          </div>

          {/* Service Line Editor */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Editor</span>
              <h3 className="font-semibold">Service Line Editor</h3>
              {contractLocked && <span className="ml-2 text-xs text-red-600 flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 w-28">Service</th>
                    <th className="text-center px-2 py-2 w-20">Price</th>
                    <th className="text-center px-2 py-2 w-16">Freq</th>
                    {MONTHS.map(m => (
                      <th key={m} className="text-center px-1 py-2 text-xs w-12">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviceLines.map((s, si) => (
                    <tr key={s.name}>
                      <td className="px-3 py-2 font-medium text-xs">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${s.bgColor}`} />
                          {s.shortName}
                        </div>
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={servicePrices[si]}
                          onChange={e => {
                            const newPrices = [...servicePrices]
                            newPrices[si] = parseFloat(e.target.value) || 0
                            setServicePrices(newPrices)
                          }}
                          disabled={contractLocked}
                          className="w-full px-1 py-1 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-miller-500 disabled:opacity-50 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={serviceFrequencies[si]}
                          onChange={e => {
                            const newFreqs = [...serviceFrequencies]
                            newFreqs[si] = parseFloat(e.target.value) || 0
                            setServiceFrequencies(newFreqs)
                          }}
                          disabled={contractLocked}
                          className="w-full px-1 py-1 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-miller-500 disabled:opacity-50 disabled:bg-gray-100"
                        />
                      </td>
                      {MONTHS.map((m, mi) => (
                        <td key={m} className="px-0.5 py-1">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={serviceCustomerRamps[si][mi]}
                            onChange={e => {
                              const newRamps = serviceCustomerRamps.map(r => [...r])
                              newRamps[si][mi] = parseInt(e.target.value) || 0
                              setServiceCustomerRamps(newRamps)
                            }}
                            disabled={contractLocked}
                            className={`w-full px-0.5 py-1 border rounded text-xs text-center focus:ring-1 focus:ring-miller-500 disabled:opacity-50 disabled:bg-gray-100 ${
                              serviceCustomerRamps[si][mi] > 0 ? 'border-miller-300 bg-miller-50' : 'border-gray-200'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* What-If Quick Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                if (contractLocked) return
                const newRamps = serviceCustomerRamps.map(r => [...r])
                // Set mowing (index 0) peak to 40: scale proportionally
                const currentPeak = Math.max(...DEFAULT_SERVICE_LINES[0].customerRamp)
                const scale = 40 / currentPeak
                newRamps[0] = DEFAULT_SERVICE_LINES[0].customerRamp.map(v => Math.round(v * scale))
                setServiceCustomerRamps(newRamps)
              }}
              disabled={contractLocked}
              className="card p-4 text-left hover:bg-miller-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-miller-600" />
                <span className="font-semibold text-sm">40 Mowing Customers</span>
              </div>
              <p className="text-xs text-gray-500">Scale mowing ramp to peak at 40 customers instead of 30</p>
              <p className="text-sm font-bold text-miller-700 mt-2">
                +{fmt(Math.round(calcAnnualTotal(multiplier) * 0.33))} estimated
              </p>
            </button>

            <button
              onClick={() => {
                if (contractLocked) return
                const newPrices = [...servicePrices]
                newPrices[0] = 55
                setServicePrices(newPrices)
              }}
              disabled={contractLocked}
              className="card p-4 text-left hover:bg-miller-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-sm">Raise Mowing to $55</span>
              </div>
              <p className="text-xs text-gray-500">Increase per-visit mowing price from current to $55</p>
              <p className="text-sm font-bold text-green-600 mt-2">
                +{fmt(Math.round((55 - servicePrices[0]) * 4.33 * 30 * 7))} estimated
              </p>
            </button>

            <button
              onClick={() => alert('Snow removal is not yet modeled as a service line. Coming soon!')}
              className="card p-4 text-left hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm">Add Snow Removal</span>
              </div>
              <p className="text-xs text-gray-500">Add winter snow removal service to fill the off-season gap</p>
              <p className="text-sm font-bold text-blue-600 mt-2">Coming Soon</p>
            </button>
          </div>
        </div>
      )}

      {/* ═══════ TAB 3: Projections (Enhanced) ═══════ */}
      {activeTab === 'projections' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stacked Bar Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Monthly Revenue by Service Line ({multiplierDesc}, {multiplier}x)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmtK(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [fmt(Number(value)), '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  {serviceLines.map(s => (
                    <Bar key={s.shortName} dataKey={s.shortName} stackId="a" fill={s.chartColor} name={s.name} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Line Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Scenario Comparison &mdash; Monthly Revenue</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmtK(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [fmt(Number(value)), '']} />
                  <Legend />
                  <Line type="monotone" dataKey="conservative" stroke="#6b7280" strokeWidth={2} name={`Conservative (${(multiplier * 0.75).toFixed(2)}x)`} dot={false} />
                  <Line type="monotone" dataKey="current" stroke="#3d8b5a" strokeWidth={2} name={`Current (${multiplier}x)`} dot={false} />
                  <Line type="monotone" dataKey="aggressive" stroke="#2563eb" strokeWidth={2} name={`Aggressive (${(multiplier * 1.5).toFixed(2)}x)`} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: `Conservative (${(multiplier * 0.75).toFixed(2)}x)`, mult: multiplier * 0.75, color: '#6b7280' },
                { label: `Current (${multiplier}x)`, mult: multiplier, color: '#3d8b5a' },
                { label: `Aggressive (${(multiplier * 1.5).toFixed(2)}x)`, mult: multiplier * 1.5, color: '#2563eb' },
              ].map(sc => (
                <div key={sc.label} className="text-center p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs text-gray-500">{sc.label}</p>
                  <p className="text-lg font-bold" style={{ color: sc.color }}>{fmt(Math.round(calcAnnualTotal(sc.mult)))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Detail</span>
              <h3 className="font-semibold">Monthly Breakdown ({multiplierDesc})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Month</th>
                    {serviceLines.map(s => (
                      <th key={s.shortName} className="text-right px-3 py-2">{s.shortName}</th>
                    ))}
                    <th className="text-right px-3 py-2 bg-miller-50 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MONTHS.map((month, i) => {
                    const total = Math.round(calcMonthlyTotal(i, multiplier))
                    if (total === 0) return null
                    return (
                      <tr key={month}>
                        <td className="px-3 py-2 font-medium">{month}</td>
                        {serviceLines.map(s => (
                          <td key={s.shortName} className="px-3 py-2 text-right text-gray-600">
                            {Math.round(calcServiceMonthlyRevenue(s, i, multiplier)) > 0
                              ? fmt(Math.round(calcServiceMonthlyRevenue(s, i, multiplier)))
                              : '\u2014'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-bold text-miller-700 bg-miller-50">{fmt(total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-miller-50 font-bold border-t-2 border-miller-200">
                  <tr>
                    <td className="px-3 py-3">Year 1 Total</td>
                    {serviceLines.map(s => (
                      <td key={s.shortName} className="px-3 py-3 text-right">
                        {fmt(Math.round(calcServiceAnnualTotal(s, multiplier)))}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right text-miller-700 bg-miller-100">{fmt(currentAnnual)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB 4: Profitability (NEW) ═══════ */}
      {activeTab === 'profitability' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Per-Service Profitability */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Margins</span>
              <h3 className="font-semibold">Per-Service Profitability</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Service</th>
                    <th className="text-right px-4 py-3">Annual Revenue</th>
                    <th className="text-right px-4 py-3">Labor Cost</th>
                    <th className="text-right px-4 py-3">Material Cost</th>
                    <th className="text-right px-4 py-3 bg-green-50">Gross Margin</th>
                    <th className="text-right px-4 py-3 bg-green-50">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviceProfitability.map(sp => (
                    <tr key={sp.name}>
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${sp.bgColor}`} />
                        {sp.name}
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(sp.annualRevenue)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(sp.annualLabor)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{fmt(sp.annualMaterial)}</td>
                      <td className={`px-4 py-3 text-right font-bold bg-green-50 ${sp.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(sp.grossMargin)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold bg-green-50 ${sp.marginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sp.marginPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-miller-50 font-bold border-t-2 border-miller-200">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{fmt(serviceProfitability.reduce((s, p) => s + p.annualRevenue, 0))}</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmt(serviceProfitability.reduce((s, p) => s + p.annualLabor, 0))}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{fmt(serviceProfitability.reduce((s, p) => s + p.annualMaterial, 0))}</td>
                    <td className="px-4 py-3 text-right text-green-600 bg-green-50">{fmt(serviceProfitability.reduce((s, p) => s + p.grossMargin, 0))}</td>
                    <td className="px-4 py-3 text-right text-green-600 bg-green-50">
                      {(() => {
                        const totalRev = serviceProfitability.reduce((s, p) => s + p.annualRevenue, 0)
                        const totalMargin = serviceProfitability.reduce((s, p) => s + p.grossMargin, 0)
                        return totalRev > 0 ? (totalMargin / totalRev * 100).toFixed(1) : '0.0'
                      })()}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Annual P&L Statement */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-miller-600" />
              Annual Profit &amp; Loss Statement
            </h3>
            <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm leading-relaxed">
              <pre className="whitespace-pre">{`Revenue                    ${fmt(costAnalysis.totalRevenue).padStart(10)}
  Less: Labor              (${fmt(costAnalysis.totalLabor).padStart(9)})
  Less: Materials          (${fmt(costAnalysis.totalMaterials).padStart(9)})
  Less: Fixed Costs        (${fmt(costAnalysis.totalFixed).padStart(9)})
  Less: Sweet Dreams Fee   (${fmt(costAnalysis.totalFees).padStart(9)})
                           ${'─'.repeat(10)}
Net Profit                 ${fmt(costAnalysis.netProfit).padStart(10)}
Profit Margin              ${(costAnalysis.totalRevenue > 0 ? (costAnalysis.netProfit / costAnalysis.totalRevenue * 100).toFixed(1) : '0.0').padStart(9)}%`}</pre>
            </div>
          </div>

          {/* Break-Even Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Monthly Break-Even</p>
              <p className="text-2xl font-bold text-amber-600">{fmt(breakEven.monthlyBreakEven)}</p>
              <p className="text-xs text-gray-500">revenue needed to cover fixed costs</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Annual Break-Even</p>
              <p className="text-2xl font-bold text-amber-600">{fmt(breakEven.annualBreakEven)}</p>
              <p className="text-xs text-gray-500">annual revenue target</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">Customers Needed</p>
              <p className="text-2xl font-bold text-amber-600">{breakEven.customersNeeded}</p>
              <p className="text-xs text-gray-500">avg customers per service/month</p>
            </div>
          </div>

          {/* Annual Profit Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Monthly Revenue vs Costs vs Profit</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costAnalysis.monthly} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmtK(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [fmt(Number(value)), '']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3d8b5a" name="Revenue" />
                  <Bar dataKey="labor" fill="#ef4444" name="Labor" />
                  <Bar dataKey="materials" fill="#f97316" name="Materials" />
                  <Bar dataKey="fixed" fill="#3b82f6" name="Fixed Costs" />
                  <Bar dataKey="fee" fill="#8b5cf6" name="SD Fee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Line Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Monthly Net Profit Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costAnalysis.monthly} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmtK(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [fmt(Number(value)), '']} />
                  <Area type="monotone" dataKey="profit" stroke="#3d8b5a" fill="#3d8b5a" fillOpacity={0.3} name="Net Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collapsible Cost Editor */}
          <div className="card">
            <button
              onClick={() => setShowCostEditor(!showCostEditor)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Cost Model Editor
              </span>
              {showCostEditor ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            {showCostEditor && (
              <div className="p-4 border-t border-gray-200 space-y-6">
                {/* Crew Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Crew Settings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Crew Size</label>
                      <input type="number" min="1" max="10" step="1" value={crewSize}
                        onChange={e => setCrewSize(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Hourly Rate ($/hr)</label>
                      <input type="number" min="10" max="50" step="1" value={crewRate}
                        onChange={e => setCrewRate(parseInt(e.target.value) || 10)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Travel Hours/Job</label>
                      <input type="number" min="0" max="2" step="0.05" value={travelHours}
                        onChange={e => setTravelHours(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Labor Hours per Job */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Labor Hours per Job</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(laborHours).map(([key, val]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 capitalize">{key}</label>
                        <input type="number" min="0.5" max="12" step="0.5" value={val}
                          onChange={e => setLaborHours(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0.5 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Material Costs per Job */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Material Cost per Job ($)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(materialCosts).map(([key, val]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 capitalize">{key}</label>
                        <input type="number" min="0" max="500" step="5" value={val}
                          onChange={e => setMaterialCosts(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed Monthly Costs */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Fixed Monthly Costs ($)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(fixedCosts).map(([key, val]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 capitalize">{key}</label>
                        <input type="number" min="0" max="5000" step="25" value={val}
                          onChange={e => setFixedCosts(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Total: {fmt(Object.values(fixedCosts).reduce((a, b) => a + b, 0))}/mo (halved in off-season: Jan, Feb, Dec)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ TAB 5: Market Intel (NEW) ═══════ */}
      {activeTab === 'market-intel' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* TAM / SAM */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-miller-600" />
              Total Addressable Market (TAM/SAM)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-miller-50 rounded-lg border border-miller-200 text-center">
                <p className="text-xs text-gray-500 uppercase">TAM</p>
                <p className="text-2xl font-bold text-miller-700">$94.5M</p>
                <p className="text-xs text-gray-500 mt-1">175K households x 30% using pro x $1,800 avg</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-gray-500 uppercase">SAM</p>
                <p className="text-2xl font-bold text-blue-700">$63M</p>
                <p className="text-xs text-gray-500 mt-1">$94.5M x 67% maintenance focus</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-xs text-gray-500 uppercase">Miller&apos;s Target</p>
                <p className="text-2xl font-bold text-green-700">{fmt(currentAnnual)}</p>
                <p className="text-xs text-gray-500 mt-1">{(currentAnnual / 63000000 * 100).toFixed(4)}% of SAM</p>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-miller-600" />
              Fort Wayne Metro Demographics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Metro Population', value: '440K', icon: Users },
                { label: 'Median Income', value: '$60K', icon: DollarSign },
                { label: 'Homeownership', value: '62%', icon: Building2 },
                { label: 'Dual-Income HH', value: '58%', icon: Users },
                { label: 'Net Migration/yr', value: '+4,750', icon: TrendingUp },
                { label: 'Median Home Age', value: '45 yrs', icon: Building2 },
              ].map(d => (
                <div key={d.label} className="p-3 bg-gray-50 rounded-lg border text-center">
                  <d.icon className="h-4 w-4 mx-auto mb-1 text-miller-600" />
                  <p className="text-lg font-bold text-gray-800">{d.value}</p>
                  <p className="text-xs text-gray-500">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Spending Breakdown */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Lawn &amp; Landscape Spending Breakdown</h3>
            <div className="space-y-3">
              {[
                { category: 'Mowing & Maintenance', pct: 45, color: '#3d8b5a' },
                { category: 'Landscaping / Design', pct: 20, color: '#2563eb' },
                { category: 'Tree Care', pct: 15, color: '#d97706' },
                { category: 'Weed / Pest Control', pct: 10, color: '#ea580c' },
                { category: 'Seasonal Cleanup', pct: 10, color: '#8b5cf6' },
              ].map(item => (
                <div key={item.category} className="flex items-center gap-3">
                  <div className="w-40 text-sm text-gray-600 text-right shrink-0">{item.category}</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    >
                      <span className="text-xs font-bold text-white">{item.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Tiers */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-miller-600" />
              Competitor Landscape
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-1">National Chains</h4>
                <p className="text-xs text-gray-600 mb-2">TruGreen, Lawn Doctor, etc.</p>
                <p className="text-sm text-red-700 font-medium">$2M+ revenue</p>
                <p className="text-xs text-gray-500 mt-1">Brand power, but impersonal. Premium pricing.</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-1">Established Locals</h4>
                <p className="text-xs text-gray-600 mb-2">Multi-crew operations</p>
                <p className="text-sm text-orange-700 font-medium">$500K - $2M</p>
                <p className="text-xs text-gray-500 mt-1">Strong referral networks. Slow to adopt digital.</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-1">Growing Operators</h4>
                <p className="text-xs text-gray-600 mb-2">1-3 crew teams</p>
                <p className="text-sm text-amber-700 font-medium">$100K - $500K</p>
                <p className="text-xs text-gray-500 mt-1">Miller&apos;s direct competitors. Differentiate on service.</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                <h4 className="font-semibold text-gray-800 mb-1">Solo Operators</h4>
                <p className="text-xs text-gray-600 mb-2">One-person crews</p>
                <p className="text-sm text-gray-700 font-medium">&lt; $50K</p>
                <p className="text-xs text-gray-500 mt-1">Low prices, inconsistent quality. High turnover.</p>
              </div>
            </div>
          </div>

          {/* Growth Paths */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-miller-600" />
              Growth Paths
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-miller-50 rounded-lg border border-miller-200">
                <h4 className="font-semibold text-miller-800 mb-1">Neighborhood Specialist</h4>
                <p className="text-2xl font-bold text-miller-700">$75K - $120K</p>
                <p className="text-xs text-gray-600 mt-2">Dominate 3-5 neighborhoods. Dense routes. Strong word-of-mouth. 1 crew.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-1">Multi-Crew Operation</h4>
                <p className="text-2xl font-bold text-blue-700">$200K - $400K</p>
                <p className="text-xs text-gray-600 mt-2">2-3 crews. Broader service area. Need foremen. Equipment investment.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-1">Full-Service Provider</h4>
                <p className="text-2xl font-bold text-purple-700">$500K - $1M+</p>
                <p className="text-xs text-gray-600 mt-2">Landscape design, hardscaping, irrigation. Commercial contracts. 5+ crews.</p>
              </div>
            </div>
          </div>

          {/* Growth Drivers */}
          <div className="card p-6 bg-gradient-to-r from-miller-50 to-emerald-50 border-miller-200">
            <h3 className="font-semibold text-miller-900 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-miller-600" />
              Fort Wayne Growth Drivers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { driver: 'Housing Boom', detail: '+12% building permits YoY. New subdivisions = new lawns.' },
                { driver: 'Aging Homeowners', detail: 'Growing 55+ demographic increasingly outsourcing lawn care.' },
                { driver: 'Dual-Income Households', detail: '58% of households. Time-poor, willing to pay for convenience.' },
                { driver: 'Net Migration', detail: '+4,750/year moving to Fort Wayne metro. Growing customer base.' },
                { driver: '9-Month Growing Season', detail: 'March through November active season. Longer than northern markets.' },
              ].map(item => (
                <div key={item.driver} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-miller-100">
                  <div className="w-2 h-2 rounded-full bg-miller-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-miller-800">{item.driver}</p>
                    <p className="text-xs text-gray-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB 6: Fee Structure (Enhanced) ═══════ */}
      {activeTab === 'fee-structure' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Interactive Fee Calculator */}
          <div className="card p-6 bg-gradient-to-r from-miller-50 to-emerald-50 border-miller-200">
            <h3 className="font-semibold text-miller-900 mb-3 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-miller-600" />
              Interactive Fee Calculator
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700">Enter monthly revenue:</label>
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                step="100"
                min="0"
                value={feeCalcRevenue}
                onChange={e => setFeeCalcRevenue(e.target.value)}
                placeholder="e.g. 5000"
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
              />
            </div>
            {feeCalcResult && (
              <div className="bg-white rounded-lg border border-miller-200 p-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-lg font-bold text-gray-800">{fmt(feeCalcResult.revenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Uplift</p>
                    <p className="text-lg font-bold text-miller-700">{fmt(feeCalcResult.upliftAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Growth %</p>
                    <p className="text-lg font-bold text-miller-700">{(feeCalcResult.growthPercentage * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Growth Fee</p>
                    <p className="text-lg font-bold text-purple-700">{fmt(feeCalcResult.growthFee)}</p>
                  </div>
                </div>
                {feeCalcResult.tierBreakdown.length > 0 && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Tier Breakdown:</p>
                    {feeCalcResult.tierBreakdown.map(tb => (
                      <div key={tb.tierNumber} className="flex justify-between text-xs py-1">
                        <span className="text-gray-600">Tier {tb.tierNumber} ({tb.tierLabel}): {fmt(tb.upliftInTier)} x {(tb.feeRate * 100).toFixed(0)}%</span>
                        <span className="font-medium">{fmt(tb.feeFromTier)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Effective Rate: <span className="font-bold text-miller-700">{feeCalcResult.effectiveRate.toFixed(1)}%</span></p>
                    <p className="text-sm text-gray-600">Miller Keeps: <span className="font-bold text-green-600">{fmt(feeCalcResult.millerKeeps)}</span></p>
                  </div>
                  <div className="text-right p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-500">For every $1 Sweet Dreams earns</p>
                    <p className="text-xl font-bold text-green-700">Miller keeps ${feeCalcResult.ratio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grand Slam Explanation */}
          <div className="card p-6 bg-gradient-to-r from-miller-50 to-emerald-50 border-miller-200">
            <h3 className="font-semibold text-miller-900 mb-3 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-miller-600" />
              How Grand Slam Fees Work for Miller Scaping
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>Since Miller Scaping is a <strong>brand-new startup with $0 existing revenue</strong>, we use a <strong>$500 seed baseline</strong> to make the fee model work.</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Year 1 Foundation Fee: $0</strong> &mdash; waived for new startups</li>
                <li><strong>Growth fees</strong> apply on monthly revenue above the $500 seed baseline</li>
                <li>Uses <strong>Year 1 premium rates</strong> (micro category) since all revenue is new growth</li>
                <li>Fees are a percentage of uplift, so Miller only pays when revenue is earned</li>
              </ul>
            </div>
          </div>

          {/* Tier Rates */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Tiers</span>
              <h3 className="font-semibold">Growth Fee Tiers (Micro Category, Year 1 Premium)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Tier</th>
                    <th className="text-left px-4 py-3">Growth Range</th>
                    <th className="text-center px-4 py-3">Fee Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tierRates.tiers.slice(0, 5).map(tier => (
                    <tr key={tier.tierNumber} className={tier.tierNumber <= 2 ? 'bg-miller-50' : ''}>
                      <td className="px-4 py-3 font-bold text-miller-700">Tier {tier.tierNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{tier.label} growth</td>
                      <td className="px-4 py-3 text-center font-semibold text-miller-700">{(tier.feeRate * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
              Growth is measured as % above the $500 seed baseline. Higher tiers only apply to revenue in that growth range.
            </div>
          </div>

          {/* Scenario Fee Comparison */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Compare</span>
              <h3 className="font-semibold">Fee Comparison by Scenario</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Scenario</th>
                    <th className="text-right px-4 py-3">Year 1 Revenue</th>
                    <th className="text-right px-4 py-3">Avg Monthly</th>
                    <th className="text-right px-4 py-3 bg-miller-50">Monthly Fee</th>
                    <th className="text-right px-4 py-3 bg-miller-50">Annual Fee</th>
                    <th className="text-right px-4 py-3">Effective Rate</th>
                    <th className="text-right px-4 py-3 bg-green-50">Net to Miller</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feeData.map(d => (
                    <tr key={d.scenario}>
                      <td className="px-4 py-3 font-medium">{d.scenario}</td>
                      <td className="px-4 py-3 text-right">{fmt(d.annual)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(d.avgMonthly)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-miller-700 bg-miller-50">{fmt(d.growthFee)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-miller-700 bg-miller-50">{fmt(d.annualFee)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{d.effectiveRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">{fmt(d.netToClient)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROI Analysis */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">ROI Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feeData.map(d => {
                const roi = d.annualFee > 0 ? ((d.netToClient / d.annualFee) * 100) : 0
                return (
                  <div key={d.scenario} className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{d.scenario}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Revenue</span>
                        <span className="font-medium">{fmt(d.annual)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sweet Dreams Fees</span>
                        <span className="font-medium text-miller-700">{fmt(d.annualFee)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-500">Net to Miller</span>
                        <span className="font-bold text-green-600">{fmt(d.netToClient)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ROI</span>
                        <span className="font-bold text-blue-600">{roi.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB 7: Seasonality (Unchanged) ═══════ */}
      {activeTab === 'seasonality' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Seasonal Index Chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Landscaping Seasonal Index</h3>
            <p className="text-sm text-gray-500 mb-4">Relative business activity by month (1.0 = average)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MONTHS.map((m, i) => ({ month: m, index: SEASONAL_INDEX[i] }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 2]} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(1), 'Index']} />
                  <Bar dataKey="index" fill="#3d8b5a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Availability Heatmap */}
          <div className="card">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-miller-700 text-white">Heatmap</span>
              <h3 className="font-semibold">Service Availability &amp; Customer Volume</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-2 w-36">Service</th>
                    {MONTHS.map(m => (
                      <th key={m} className="text-center px-1 py-2 text-xs">{m.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {serviceLines.map(s => {
                    const maxC = Math.max(...s.customerRamp) * multiplier
                    return (
                      <tr key={s.name}>
                        <td className="px-2 py-2 font-medium flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.bgColor}`} />
                          {s.shortName}
                        </td>
                        {MONTHS.map((m, i) => {
                          const customers = Math.round(s.customerRamp[i] * multiplier)
                          const intensity = maxC > 0 ? customers / maxC : 0
                          return (
                            <td key={m} className="text-center px-1 py-2">
                              <div
                                className="w-full h-8 rounded flex items-center justify-center text-xs font-medium"
                                style={{
                                  backgroundColor: customers > 0
                                    ? `rgba(61, 139, 90, ${0.15 + intensity * 0.75})`
                                    : '#f3f4f6',
                                  color: intensity > 0.5 ? 'white' : intensity > 0 ? '#245a38' : '#9ca3af',
                                }}
                              >
                                {customers > 0 ? customers : ''}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Overlay by Month */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Revenue vs Seasonal Index ({multiplierDesc})</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={MONTHS.map((m, i) => ({
                    month: m,
                    revenue: Math.round(calcMonthlyTotal(i, multiplier)),
                    index: SEASONAL_INDEX[i] * 5000,
                  }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmtK(Number(v))} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, name) => [name === 'revenue' ? fmt(Number(v)) : (Number(v) / 5000).toFixed(1), name === 'revenue' ? 'Revenue' : 'Seasonal Index']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3d8b5a" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="index" stroke="#d97706" strokeWidth={2} strokeDasharray="5 5" name="Seasonal Index (scaled)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Off-season Note */}
          <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">Off-Season Strategy (Dec-Feb)</h3>
            <div className="text-sm text-amber-800 space-y-1">
              <p>Landscaping is inherently seasonal. During the off-season:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>No Grand Slam growth fees are incurred (no revenue = no fee)</li>
                <li>Focus on marketing prep, equipment maintenance, and booking spring clients</li>
                <li>Snow removal could be a future service line to generate winter revenue</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB 8: Services (Uses editable serviceLines) ═══════ */}
      {activeTab === 'services' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {serviceLines.map(service => {
            const isExpanded = expandedService === service.name
            const annual = Math.round(calcServiceAnnualTotal(service, multiplier))
            const pctOfTotal = currentAnnual > 0 ? ((annual / currentAnnual) * 100).toFixed(1) : '0'
            const peakCustomers = Math.round(Math.max(...service.customerRamp) * multiplier)
            const peakMonth = MONTHS[service.customerRamp.indexOf(Math.max(...service.customerRamp))]
            const revenuePerCustomer = service.pricePerUnit * service.frequencyPerMonth

            return (
              <div key={service.name} className="card">
                <button
                  onClick={() => setExpandedService(isExpanded ? null : service.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full ${service.bgColor}`} />
                    <div className="text-left">
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-xs text-gray-500">{fmt(service.pricePerUnit)}/{service.unit} &middot; {service.frequencyPerMonth === 4.33 ? 'Weekly' : 'Monthly/Seasonal'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-miller-700">{fmt(annual)}/yr</p>
                      <p className="text-xs text-gray-500">{pctOfTotal}% of total</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-miller-50 rounded-lg border border-miller-200 text-center">
                        <p className="text-xs text-gray-500">Revenue/Customer/Mo</p>
                        <p className="text-lg font-bold text-miller-700">{fmt(Math.round(revenuePerCustomer))}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        <p className="text-xs text-gray-500">Peak Customers</p>
                        <p className="text-lg font-bold text-blue-700">{peakCustomers}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                        <p className="text-xs text-gray-500">Peak Month</p>
                        <p className="text-lg font-bold text-amber-700">{peakMonth}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border text-center">
                        <p className="text-xs text-gray-500">Active Months</p>
                        <p className="text-lg font-bold text-gray-700">{service.activeMonths.length}</p>
                      </div>
                    </div>

                    {/* Seasonal Availability */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Seasonal Availability</p>
                      <div className="flex gap-1">
                        {MONTHS.map((m, i) => (
                          <div
                            key={m}
                            className={`flex-1 text-center py-2 rounded text-xs font-medium ${
                              service.activeMonths.includes(i)
                                ? 'bg-miller-500 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {m.slice(0, 1)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Customer Ramp */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Customer Ramp ({multiplierDesc})</p>
                      <div className="flex items-end gap-1 h-24">
                        {MONTHS.map((m, i) => {
                          const customers = Math.round(service.customerRamp[i] * multiplier)
                          const maxC = Math.round(Math.max(...service.customerRamp) * multiplier)
                          const heightPct = maxC > 0 ? (customers / maxC) * 100 : 0
                          return (
                            <div key={m} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full relative" style={{ height: '80px' }}>
                                <div
                                  className="absolute bottom-0 left-0 right-0 rounded-t"
                                  style={{
                                    height: `${heightPct}%`,
                                    backgroundColor: service.chartColor,
                                    opacity: customers > 0 ? 1 : 0.1,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500">{m.slice(0, 1)}</span>
                              {customers > 0 && (
                                <span className="text-[10px] font-medium text-gray-700">{customers}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Revenue Contribution Comparison */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Revenue Contribution ({multiplierDesc})</h3>
            <div className="space-y-3">
              {serviceLines.map(s => {
                const annual = Math.round(calcServiceAnnualTotal(s, multiplier))
                const pct = currentAnnual > 0 ? (annual / currentAnnual) * 100 : 0
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-600 text-right shrink-0">{s.shortName}</div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: s.chartColor }}
                      >
                        <span className="text-xs font-bold text-white">{fmt(annual)}</span>
                      </div>
                    </div>
                    <div className="w-14 text-sm font-medium text-gray-600 text-right">{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB 9: How It Works (Unchanged) ═══════ */}
      {activeTab === 'how-it-works' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">How the Grand Slam Works for Miller Scaping</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miller-700 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900">We Set a Seed Baseline</h3>
                  <p className="text-gray-600 mt-1">Since Miller Scaping is a new startup with <strong>$0 current revenue</strong>, we use a <strong>$500/month seed baseline</strong>. This is the starting point for calculating growth fees. Everything above $500/month is considered &ldquo;uplift&rdquo; that triggers growth fees.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miller-700 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 1: No Foundation Fee</h3>
                  <p className="text-gray-600 mt-1">For new startups, the <strong>Foundation Fee is waived in Year 1</strong>. You pay nothing until revenue starts flowing. This makes it zero-risk for Miller to get started.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miller-700 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Growth Fees on Uplift</h3>
                  <p className="text-gray-600 mt-1">When monthly revenue exceeds $500, growth fees kick in using tiered rates. The more you grow, the more you pay &mdash; but also the more you keep. Sweet Dreams&apos; incentives are perfectly aligned with Miller&apos;s success.</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {tierRates.tiers.slice(0, 4).map(tier => (
                      <div key={tier.tierNumber} className="text-center p-2 bg-miller-50 rounded-lg border border-miller-200 text-xs">
                        <p className="font-bold text-miller-700">Tier {tier.tierNumber}</p>
                        <p className="text-gray-600">{tier.label}</p>
                        <p className="font-semibold text-miller-700">{(tier.feeRate * 100).toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miller-700 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Build the Customer Base</h3>
                  <p className="text-gray-600 mt-1">Sweet Dreams handles <strong>marketing, lead generation, brand strategy, and digital presence</strong>. Miller Scaping delivers excellent landscaping work. As the customer base grows through spring and summer, revenue compounds across all 4 service lines.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-miller-700 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seasonal Peak = Maximum Revenue</h3>
                  <p className="text-gray-600 mt-1">July and August are peak months. With 30 mowing customers plus weed control and other services, monthly revenue can reach <strong>{fmt(Math.round(calcMonthlyTotal(6, multiplier)))}/month</strong> in the {multiplierDesc.toLowerCase()} scenario. Off-season months have no fees since there&apos;s no revenue.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">6</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2: Baseline Resets Higher</h3>
                  <p className="text-gray-600 mt-1">After Year 1, the baseline resets based on actual performance. This means the growth fee window narrows &mdash; Miller keeps more of each dollar. Year 2 also uses standard (lower) fee rates instead of Year 1 premium rates.</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Year 1 Baseline</p>
                      <p className="font-bold text-gray-700">$500/mo (seed)</p>
                    </div>
                    <div className="p-3 bg-miller-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Year 1 Revenue ({multiplierDesc})</p>
                      <p className="font-bold text-miller-700">{fmt(currentAnnual)}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Year 2 Benefit</p>
                      <p className="font-bold text-green-600">Higher baseline = lower fees</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Slam vs. Retainer */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Grand Slam vs. Traditional Retainer</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Aspect</th>
                    <th className="text-left px-4 py-3">Traditional Marketing Retainer</th>
                    <th className="text-left px-4 py-3 bg-miller-50">Grand Slam (Miller)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { aspect: 'Monthly Cost', traditional: '$1,500-$3,000/mo flat', miller: '$0 in off-months, fee only on growth' },
                    { aspect: 'Upfront Risk', traditional: 'You pay whether it works or not', miller: 'Zero risk \u2014 no revenue, no fee' },
                    { aspect: 'Alignment', traditional: 'Agency gets paid regardless of results', miller: 'Sweet Dreams only earns when you earn' },
                    { aspect: 'Off-Season', traditional: 'Still paying full retainer', miller: 'No fees during off-season months' },
                    { aspect: 'Year 1 Cost', traditional: '$18,000-$36,000', miller: fmt(feeData.find(d => d.scenario === 'Current')?.annualFee || 0) },
                    { aspect: 'Scalability', traditional: 'Need to renegotiate as you grow', miller: 'Automatic \u2014 tiers handle growth' },
                  ].map(row => (
                    <tr key={row.aspect}>
                      <td className="px-4 py-3 font-medium">{row.aspect}</td>
                      <td className="px-4 py-3 text-gray-600">{row.traditional}</td>
                      <td className="px-4 py-3 text-miller-700 font-medium bg-miller-50">{row.miller}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="card p-6 bg-gradient-to-r from-miller-700 to-emerald-600 text-white">
            <h3 className="text-lg font-bold mb-3">The Bottom Line</h3>
            <p className="text-miller-100 text-sm leading-relaxed">
              Miller Scaping is a new business with huge potential. The Grand Slam model means Sweet Dreams is
              investing in Miller&apos;s success &mdash; we only get paid when the business grows. With 4 service lines,
              strong seasonal demand, and a growing Fort Wayne market, the {multiplierDesc.toLowerCase()} projection
              of <strong>{fmt(currentAnnual)}</strong> in Year 1 is achievable. And every year, the deal gets better
              for Miller as the baseline resets higher.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
