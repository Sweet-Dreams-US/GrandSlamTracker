'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calculator, DollarSign, BarChart3, BookOpen, TrendingUp, Target, Lock, Unlock, ChevronDown, ChevronUp, Wifi, WifiOff, Pencil, RotateCcw, Sliders } from 'lucide-react'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline, formatGrowthPercentage, calculateGrowthFee, calculateFoundationFee } from '@/lib/calculations/feeCalculator'
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
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-monster-100 text-monster-700 hover:bg-monster-200 transition-colors cursor-pointer"
    >
      {label}
    </button>
  )
}

function SectionHeader({ id, label, title }: { id: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-2 p-4 border-b border-gray-200">
      <span id={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-monster-600 text-white scroll-mt-24">
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
  materialCostPercent: number
}

interface BusinessCosts {
  crews: { count: number; costPerCrew: number }
  otherEmployees: number
  overheadCosts: number
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_STREAMS: Stream[] = [
  { name: 'Kitchen Remodels', monthlyAmount: 15000, materialCostPercent: 40 },
  { name: 'Bathroom Remodels', monthlyAmount: 10000, materialCostPercent: 30 },
  { name: 'Basement Finishing', monthlyAmount: 5000, materialCostPercent: 35 },
  { name: 'Additions', monthlyAmount: 4000, materialCostPercent: 45 },
]

const DEFAULT_BUSINESS_COSTS: BusinessCosts = {
  crews: { count: 4, costPerCrew: 8000 },
  otherEmployees: 5000,
  overheadCosts: 4000,
}

// ─── Fort Wayne Market Data ──────────────────────────────────────────────────
const FORT_WAYNE_MARKET = {
  // Total Addressable Market: 110,000 owner-occupied × $12,000 blended avg = $1.32B
  tam: 1_320_000_000,
  // Serviceable Available Market: TAM × 35% professional × 50% income-qualified = $231M
  sam: 231_000_000,
  ownerOccupiedHomes: 110_000,
  totalHousingUnits: 170_197,
  ownershipRate: 0.622,
  medianHouseholdIncome: 60_293,
  unemploymentRate: 0.04,
  populationAllenCounty: 400_000,
  gdpGrowth: 0.031,
  permitActivity2025: 3_750_000_000,
  housingStock: [
    { era: 'Pre-1940 (Historic Core)', pct: 20.1, locations: 'Wayne Township, West Central, Southwood Park', needs: 'Structural restoration, electrical/plumbing overhauls, basement waterproofing', complexity: 'High' },
    { era: '1940–1969 (Post-War Boom)', pct: 44.7, locations: 'North side, Washington & St. Joseph Townships', needs: 'Open floor plans, master suite additions, kitchen expansions, electrical upgrades', complexity: 'Medium — Sweet Spot' },
    { era: '1970–1999 (Suburban Expansion)', pct: 27.6, locations: 'Aboite, Pine Valley, Geist area', needs: 'Cosmetic modernization, window/siding replacement, deck additions', complexity: 'Low-Medium' },
    { era: '2000–Present (Modern)', pct: 7.6, locations: 'Northern/Western exurbs', needs: 'Basement finishing, outdoor living spaces', complexity: 'Low' },
  ],
  competitors: [
    { tier: 1, name: 'Commercial/Industrial Giants', examples: 'Hagerman Group, Weigand Construction', revenue: '$50M+', impact: 'Compete for skilled labor, set wage floor' },
    { tier: 2, name: 'Established Design-Build', examples: 'Serenity Kitchen & Bath, Michael Kinder & Sons, Choice Designs', revenue: '$3M–$10M', impact: 'Showrooms, designers, 6+ month backlogs, 40-50% margins' },
    { tier: 3, name: 'Mid-Market Generalist', examples: 'Lynn Delagrange, smaller firms', revenue: '$1M–$3M', impact: 'Family-run, small office, "safe choice" for middle class' },
    { tier: 4, name: 'Owner-Operator', examples: 'Independents, sole proprietors', revenue: '<$500K', impact: 'Low overhead, volatile cash flow, price competition from informal market' },
  ],
  growthScenarios: [
    { name: 'Optimization (Boutique)', targetRevenue: '$1.0M–$1.5M', strategy: 'High margin, low volume, niche focus', grossMargin: '40%', teamSize: '5-6', keyMove: 'Specialize in luxury kitchens or historic renovations in affluent townships' },
    { name: 'Volume Expansion (GC Model)', targetRevenue: '$3.0M–$4.0M', strategy: 'Moderate margin, high volume, subcontractor leverage', grossMargin: '28-32%', teamSize: '10-15', keyMove: 'Production-centric model for exterior replacements & standardized projects' },
    { name: 'Vertical Integration (Design-Build)', targetRevenue: '$5.0M+', strategy: 'Maximum margin, showroom, in-house design', grossMargin: '45%', teamSize: '25+', keyMove: 'Full-service with architectural capabilities, competing with Serenity/Kinder' },
  ],
  keyDemographics: {
    medianAge: 35,
    millennialAvgSpend: 14_199,
    genXAvgSpend: 12_956,
    boomerAvgSpend: 10_423,
    netMigration2024: 4_750,
  },
}

const PRESET_SCENARIOS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.50 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.00 },
  { label: '150%', value: 1.50 },
]

const TABS = [
  { id: 'calculator', label: 'Calculator', icon: Calculator, locked: false },
  { id: 'financials', label: 'Financials', icon: DollarSign, locked: false },
  { id: 'profitability', label: 'Profitability', icon: TrendingUp, locked: false },
  { id: 'market-intel', label: 'Market Intel', icon: Target, locked: false },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, locked: false },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen, locked: false },
  { id: 'offer-refiner', label: 'Offer Refiner', icon: Sliders, locked: true },
] as const

type TabId = typeof TABS[number]['id']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

// ─── Mock Marketing Data ────────────────────────────────────────────────────
const MOCK_FUNNEL = {
  impressions: 50000,
  clicks: 3000,
  leads: 150,
  deals: 30,
  revenue: 102000,
}

const MOCK_AD_CHANNELS = [
  { channel: 'Google Ads', spend: 4200, impressions: 28000, clicks: 1800, leads: 85, cpl: 49, roas: 8.2 },
  { channel: 'Facebook', spend: 2100, impressions: 15000, clicks: 800, leads: 42, cpl: 50, roas: 6.5 },
  { channel: 'Instagram', spend: 1200, impressions: 7000, clicks: 400, leads: 23, cpl: 52, roas: 5.1 },
]

const MOCK_SOCIAL_SEO = {
  social: { followers: 2840, engagementRate: 4.2, postsPerMonth: 16 },
  seo: { domainAuthority: 34, keywordsRanked: 142, organicTraffic: 3200 },
  reviews: { googleRating: 4.7, reviewCount: 186, responseRate: 92 },
}

// ─── Main Component ────────────────────────────────────────────────────────
interface MonsterScenarioProps {
  mode: 'admin' | 'client'
}

export default function MonsterScenario({ mode }: MonsterScenarioProps) {
  // ── Editable state ──
  const [baseline, setBaseline] = useState(34000)
  const [streams, setStreams] = useState<Stream[]>(DEFAULT_STREAMS)
  const [growthPercent, setGrowthPercent] = useState(0.50)
  const [customGrowth, setCustomGrowth] = useState('')
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1)
  const [startYear, setStartYear] = useState(new Date().getFullYear())
  const [projectionMonths, setProjectionMonths] = useState(12)
  const [contractLocked, setContractLocked] = useState(false)
  const [lockDate, setLockDate] = useState<string | null>(null)
  const [inputsPanelOpen, setInputsPanelOpen] = useState(true)
  const [businessCosts, setBusinessCosts] = useState<BusinessCosts>(DEFAULT_BUSINESS_COSTS)
  const [costsPanelOpen, setCostsPanelOpen] = useState(false)
  const [revenueEditMode, setRevenueEditMode] = useState(false)
  const [revenueOverrides, setRevenueOverrides] = useState<Record<number, number>>({})

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
  const updateStream = (index: number, field: 'name' | 'monthlyAmount' | 'materialCostPercent', value: string | number) => {
    if (contractLocked && field !== 'materialCostPercent') return
    const updated = [...streams]
    if (field === 'name') updated[index] = { ...updated[index], name: value as string }
    else if (field === 'materialCostPercent') updated[index] = { ...updated[index], materialCostPercent: Number(value) }
    else updated[index] = { ...updated[index], monthlyAmount: Number(value) }
    setStreams(updated)
    if (field === 'monthlyAmount' || field === 'name') {
      const sum = updated.reduce((acc, s) => acc + s.monthlyAmount, 0)
      setBaseline(sum)
    }
  }

  // ── Growth preset handler ──
  const selectPreset = (value: number) => {
    if (contractLocked) return
    setGrowthPercent(value)
    setCustomGrowth('')
  }

  const applyCustomGrowth = () => {
    if (contractLocked) return
    const val = parseFloat(customGrowth)
    if (!isNaN(val) && val > 0 && val <= 500) {
      setGrowthPercent(val / 100)
    }
  }

  // ── Derived calculations ──
  const monthlyGrowthRate = useMemo(() => Math.pow(1 + growthPercent, 1 / 12) - 1, [growthPercent])

  const categoryInfo = useMemo(() => getTierRatesForBaseline(baseline), [baseline])
  const y1CategoryInfo = useMemo(() => getTierRatesForBaseline(baseline, true), [baseline])
  const seasonalFactors = getSeasonalFactors('remodeling')

  const y1Projection = useMemo(() => projectScenario({
    baselineRevenue: baseline,
    industry: 'remodeling',
    monthlyGrowthRate,
    startMonth,
    startYear,
    projectionMonths,
    isGrandSlam: true,
    applySeasonality: true,
  }), [baseline, monthlyGrowthRate, startMonth, startYear, projectionMonths])

  const fullProjection = useMemo(() => projectScenario({
    baselineRevenue: baseline,
    industry: 'remodeling',
    monthlyGrowthRate,
    startMonth,
    startYear,
    projectionMonths: Math.max(projectionMonths, 24),
    isGrandSlam: true,
    applySeasonality: true,
  }), [baseline, monthlyGrowthRate, startMonth, startYear, projectionMonths])

  // Custom projection with manual revenue overrides
  const hasOverrides = Object.keys(revenueOverrides).length > 0
  const customProjection = useMemo(() => {
    if (!hasOverrides) return null
    // Recalculate each month using overridden revenue where provided
    const projections = y1Projection.projections.map((p, i) => {
      if (!(i in revenueOverrides)) return p
      const overriddenRevenue = revenueOverrides[i]
      const isYear1 = p.yearNumber === 1
      const isGrandSlam = true

      // Recalculate fees with overridden revenue
      const feeBaseline = p.currentBaseline * p.seasonalIndex
      const growth = calculateGrowthFee(feeBaseline, overriddenRevenue, isYear1)
      const foundation = calculateFoundationFee(p.currentBaseline)
      const foundationFee = (isGrandSlam && isYear1) ? 0 : foundation.foundationFeeMonthly
      const sustainingFee = p.sustainingFee // Keep sustaining from original projection
      const totalMonthlyFee = Math.round((foundationFee + sustainingFee + growth.growthFee) * 100) / 100

      return {
        ...p,
        projectedRevenue: overriddenRevenue,
        uplift: growth.upliftAmount,
        growthPercentage: growth.growthPercentage,
        growthFee: growth.growthFee,
        foundationFee,
        totalMonthlyFee,
      }
    })

    const totalProjectedRevenue = projections.reduce((s, p) => s + p.projectedRevenue, 0)
    const totalFees = projections.reduce((s, p) => s + p.totalMonthlyFee, 0)
    const totalGrowthFees = projections.reduce((s, p) => s + p.growthFee, 0)
    const totalFoundationFees = projections.reduce((s, p) => s + p.foundationFee, 0)
    const totalSustainingFees = projections.reduce((s, p) => s + p.sustainingFee, 0)

    return {
      projections,
      summary: {
        ...y1Projection.summary,
        totalProjectedRevenue: Math.round(totalProjectedRevenue * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalGrowthFees: Math.round(totalGrowthFees * 100) / 100,
        totalFoundationFees: Math.round(totalFoundationFees * 100) / 100,
        totalSustainingFees: Math.round(totalSustainingFees * 100) / 100,
        avgMonthlyFee: Math.round((totalFees / projections.length) * 100) / 100,
      },
    }
  }, [y1Projection, revenueOverrides, hasOverrides])

  // Use custom projection when overrides exist, otherwise use the standard one
  const activeProjection = customProjection ?? y1Projection

  const chartData = useMemo(() => activeProjection.projections.map((p) => ({
    month: p.monthLabel.split(' ')[0],
    revenue: p.projectedRevenue,
    baseline: p.currentBaseline,
    fee: p.totalMonthlyFee,
  })), [activeProjection])

  const scenarioComparisons = useMemo(() => PRESET_SCENARIOS.map((s) => {
    const mgr = Math.pow(1 + s.value, 1 / 12) - 1
    const proj = projectScenario({
      baselineRevenue: baseline,
      industry: 'remodeling',
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

  // ── Cost & Profitability calculations ──
  const costAnalysis = useMemo(() => {
    const crewCosts = businessCosts.crews.count * businessCosts.crews.costPerCrew
    const totalFixedCosts = crewCosts + businessCosts.otherEmployees + businessCosts.overheadCosts

    // Weighted average material cost %
    const totalStreamRevenue = streams.reduce((s, st) => s + st.monthlyAmount, 0)
    const weightedMaterialPct = totalStreamRevenue > 0
      ? streams.reduce((s, st) => s + (st.monthlyAmount / totalStreamRevenue) * st.materialCostPercent, 0)
      : 0

    const baselineMaterialCost = baseline * (weightedMaterialPct / 100)
    const totalMonthlyCosts = totalFixedCosts + baselineMaterialCost

    // Baseline P&L
    const baselineNetBeforeFees = baseline - totalMonthlyCosts

    // Growth scenario P&L
    const growthRevenue = baseline * (1 + growthPercent)
    const growthMaterialCost = growthRevenue * (weightedMaterialPct / 100)
    const growthTotalCosts = totalFixedCosts + growthMaterialCost
    const growthNetBeforeFees = growthRevenue - growthTotalCosts

    // Sweet Dreams fee at growth (approximate from Y1 projection avg)
    const avgMonthlyFee = y1Projection.summary.avgMonthlyFee
    const growthNetAfterFees = growthNetBeforeFees - avgMonthlyFee

    // Break-even: revenue needed where revenue - materials - fixed = 0
    // revenue - revenue*(matPct/100) - fixed = 0
    // revenue * (1 - matPct/100) = fixed
    const breakEvenRevenue = weightedMaterialPct < 100
      ? totalFixedCosts / (1 - weightedMaterialPct / 100)
      : Infinity
    const breakEvenGrowthPct = breakEvenRevenue > baseline
      ? ((breakEvenRevenue - baseline) / baseline) * 100
      : 0

    // Per-stream profitability
    const streamProfitability = streams.map((st) => {
      const materialCost = st.monthlyAmount * (st.materialCostPercent / 100)
      const grossAfterMaterials = st.monthlyAmount - materialCost
      const margin = st.monthlyAmount > 0 ? (grossAfterMaterials / st.monthlyAmount) * 100 : 0
      const pctOfTotal = totalStreamRevenue > 0 ? (st.monthlyAmount / totalStreamRevenue) * 100 : 0
      return { ...st, materialCost, grossAfterMaterials, margin, pctOfTotal }
    })

    return {
      crewCosts,
      totalFixedCosts,
      weightedMaterialPct,
      baselineMaterialCost,
      totalMonthlyCosts,
      baselineNetBeforeFees,
      growthRevenue,
      growthMaterialCost,
      growthTotalCosts,
      growthNetBeforeFees,
      avgMonthlyFee,
      growthNetAfterFees,
      breakEvenRevenue,
      breakEvenGrowthPct,
      streamProfitability,
      baselineMargin: baseline > 0 ? (baselineNetBeforeFees / baseline) * 100 : 0,
      growthMarginBeforeFees: growthRevenue > 0 ? (growthNetBeforeFees / growthRevenue) * 100 : 0,
      growthMarginAfterFees: growthRevenue > 0 ? (growthNetAfterFees / growthRevenue) * 100 : 0,
    }
  }, [baseline, streams, businessCosts, growthPercent, y1Projection])

  // ── Market share calculations ──
  const marketShare = useMemo(() => {
    const annualRevenue = baseline * 12
    const sam = FORT_WAYNE_MARKET.sam
    const currentShare = (annualRevenue / sam) * 100
    const atGrowth = ((annualRevenue * (1 + growthPercent)) / sam) * 100
    // Milestones
    const milestones = [
      { label: '$1.0M', revenue: 1_000_000 },
      { label: '$1.5M', revenue: 1_500_000 },
      { label: '$3.0M', revenue: 3_000_000 },
      { label: '$5.0M', revenue: 5_000_000 },
    ].map((m) => ({
      ...m,
      share: (m.revenue / sam) * 100,
      growthNeeded: m.revenue > annualRevenue ? ((m.revenue / annualRevenue) - 1) * 100 : 0,
    }))
    return { annualRevenue, currentShare, atGrowth, milestones }
  }, [baseline, growthPercent])

  // ── Marketing ROI calc ──
  const totalAdSpend = MOCK_AD_CHANNELS.reduce((s, c) => s + c.spend, 0)
  const marketingROAS = ((MOCK_FUNNEL.revenue - baseline) / totalAdSpend).toFixed(1)

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Header */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="card p-6 bg-gradient-to-r from-monster-700 to-monster-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Monster Remodeling</h1>
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
            <p className="text-monster-200">Indianapolis, IN &middot; Remodeling &middot; {categoryInfo.categoryLabel}</p>
            {lockDate && (
              <p className="text-xs text-monster-300 mt-1">Locked on {lockDate}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                Baseline: {formatCurrency(baseline)}/mo
              </span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                Annual: {formatCurrency(baseline * 12)}
              </span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded">
                Category: {categoryInfo.categoryLabel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-monster-200">Revenue Streams</p>
            {streams.map((s) => (
              <p key={s.name} className="text-sm">{s.name}: {formatCurrency(s.monthlyAmount)}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Customize Scenario Panel */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="card border border-monster-200">
        <button
          onClick={() => setInputsPanelOpen(!inputsPanelOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-monster-50 transition-colors"
        >
          <h3 className="font-semibold text-monster-900">Customize Scenario</h3>
          {inputsPanelOpen ? <ChevronUp className="h-5 w-5 text-monster-600" /> : <ChevronDown className="h-5 w-5 text-monster-600" />}
        </button>

        {inputsPanelOpen && (
          <div className="p-4 pt-0 space-y-4 border-t border-monster-100">
            {/* Baseline + Contract Lock */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Baseline</label>
                <input
                  type="number"
                  min={5000}
                  max={200000}
                  step={1000}
                  value={baseline}
                  disabled={contractLocked}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v >= 5000 && v <= 200000) setBaseline(v)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-40 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <button
                onClick={toggleLock}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contractLocked
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-monster-600 text-white hover:bg-monster-700'
                }`}
              >
                {contractLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {contractLocked ? 'Unlock Contract' : 'Lock Contract'}
              </button>
            </div>

            {/* Stream Editor */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Streams (auto-sums to baseline)</label>
              <div className="space-y-2">
                {streams.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
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
                      step={500}
                      onChange={(e) => updateStream(i, 'monthlyAmount', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={s.materialCostPercent}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(e) => updateStream(i, 'materialCostPercent', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-16"
                      />
                      <span className="text-xs text-gray-500">Mat%</span>
                    </div>
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
                        ? 'bg-monster-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-monster-50'
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
                    className="px-3 py-2 rounded-lg text-sm bg-monster-100 text-monster-700 hover:bg-monster-200 disabled:opacity-50"
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
      {/* Business Costs & Margins (NOT locked by contract) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="card border border-orange-200">
        <button
          onClick={() => setCostsPanelOpen(!costsPanelOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-orange-50 transition-colors"
        >
          <div>
            <h3 className="font-semibold text-orange-900">Business Costs &amp; Margins</h3>
            <p className="text-xs text-gray-500 mt-0.5">Internal cost structure — not affected by contract lock</p>
          </div>
          {costsPanelOpen ? <ChevronUp className="h-5 w-5 text-orange-600" /> : <ChevronDown className="h-5 w-5 text-orange-600" />}
        </button>

        {costsPanelOpen && (
          <div className="p-4 pt-0 space-y-4 border-t border-orange-100">
            {/* Crew Costs */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Crew Costs</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={businessCosts.crews.count}
                    min={0}
                    max={50}
                    onChange={(e) => setBusinessCosts({ ...businessCosts, crews: { ...businessCosts.crews, count: Number(e.target.value) } })}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-20 text-sm"
                  />
                  <span className="text-sm text-gray-600">crews</span>
                </div>
                <span className="text-gray-400">&times;</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    value={businessCosts.crews.costPerCrew}
                    min={0}
                    step={500}
                    onChange={(e) => setBusinessCosts({ ...businessCosts, crews: { ...businessCosts.crews, costPerCrew: Number(e.target.value) } })}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-28 text-sm"
                  />
                  <span className="text-sm text-gray-600">/crew/mo</span>
                </div>
                <span className="text-sm font-medium text-gray-700">= {formatCurrency(businessCosts.crews.count * businessCosts.crews.costPerCrew)}/mo</span>
              </div>
            </div>

            {/* Other Employees */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Other Employees (monthly)</label>
                <input
                  type="number"
                  value={businessCosts.otherEmployees}
                  min={0}
                  step={500}
                  onChange={(e) => setBusinessCosts({ ...businessCosts, otherEmployees: Number(e.target.value) })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-32 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Overhead (rent, insurance, etc.)</label>
                <input
                  type="number"
                  value={businessCosts.overheadCosts}
                  min={0}
                  step={500}
                  onChange={(e) => setBusinessCosts({ ...businessCosts, overheadCosts: Number(e.target.value) })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-32 text-sm"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">Monthly Cost Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Fixed Costs</p>
                  <p className="font-semibold">{formatCurrency(costAnalysis.totalFixedCosts)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Material Costs (avg {costAnalysis.weightedMaterialPct.toFixed(1)}%)</p>
                  <p className="font-semibold">{formatCurrency(costAnalysis.baselineMaterialCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Monthly Costs</p>
                  <p className="font-bold text-orange-700">{formatCurrency(costAnalysis.totalMonthlyCosts)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gross Margin</p>
                  <p className={`font-bold ${costAnalysis.baselineMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {costAnalysis.baselineMargin.toFixed(1)}%
                  </p>
                </div>
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
              onClick={() => !tab.locked && setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab.locked
                  ? 'border-transparent text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === tab.id
                    ? 'border-monster-600 text-monster-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.locked && <Lock className="h-3 w-3 ml-1" />}
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
            <p className="px-4 py-2 text-xs text-gray-500 bg-monster-50 border-b border-monster-100">
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
                    <tr key={s.label} className={s.growthPercent === growthPercent ? 'bg-monster-50' : ''}>
                      <td className="font-medium">{s.label}</td>
                      <td className="text-right">{formatCurrency(s.totalRevenue)}</td>
                      <td className="text-right text-monster-600">{formatCurrency(s.totalFees)}</td>
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
              <div className="text-center p-3 bg-monster-50 rounded-lg border border-monster-200">
                <p className="text-xs text-gray-500 uppercase">Sustaining</p>
                <p className="text-xl font-bold text-monster-600">
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

          {/* Growth Explainer */}
          <div className="card p-4 bg-monster-50 border-monster-200">
            <h4 className="font-semibold text-monster-900 text-sm mb-2">How {growthLabel} Annual Growth Compounds Monthly</h4>
            <p className="text-xs text-monster-800 mb-3">
              You selected <strong>{growthLabel} annual</strong> growth. This does NOT mean every month is at {Math.round(growthPercent * 100)}% above baseline.
              Instead, revenue <strong>ramps up gradually</strong> each month via compound growth, reaching the full {Math.round(growthPercent * 100)}% by Month 12.
            </p>
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="bg-white px-2 py-1 rounded border border-monster-200">
                Monthly Rate: {(monthlyGrowthRate * 100).toFixed(2)}%
              </span>
              <span className="text-monster-400">&rarr;</span>
              <span className="bg-white px-2 py-1 rounded border border-monster-200">
                Mo 1: +{((Math.pow(1 + monthlyGrowthRate, 1) - 1) * 100).toFixed(1)}%
              </span>
              <span className="text-monster-400">&rarr;</span>
              <span className="bg-white px-2 py-1 rounded border border-monster-200">
                Mo 6: +{((Math.pow(1 + monthlyGrowthRate, 6) - 1) * 100).toFixed(1)}%
              </span>
              <span className="text-monster-400">&rarr;</span>
              <span className="bg-monster-200 px-2 py-1 rounded border border-monster-300 font-semibold">
                Mo 12: +{((Math.pow(1 + monthlyGrowthRate, 12) - 1) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-monster-600 mt-2">
              The &ldquo;Growth %&rdquo; column below shows each month&apos;s revenue above baseline as a percentage.
              It starts small and compounds upward. {projectionMonths > 12 && (
                <>In <strong>Year 2+</strong>, the baseline resets higher (a portion of Year 1 growth is &ldquo;retained&rdquo;), so the Growth % drops &mdash;
                this is normal. The new baseline means you&apos;re growing from a higher floor.</>
              )}
            </p>
          </div>

          {/* Table 2A: Monthly Projection */}
          <div className="card">
            <div className="flex items-center justify-between">
              <SectionHeader id="table-2a" label="Table 2A" title={`Monthly Projection (${growthLabel})${hasOverrides ? ' — Custom Revenue' : ''}`} />
              <div className="flex items-center gap-2 pr-4">
                {revenueEditMode && hasOverrides && (
                  <button
                    onClick={() => { setRevenueOverrides({}); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                    title="Reset all overrides back to projected values"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset All
                  </button>
                )}
                <button
                  onClick={() => setRevenueEditMode(!revenueEditMode)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    revenueEditMode
                      ? 'bg-monster-600 text-white hover:bg-monster-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Pencil className="h-3 w-3" /> {revenueEditMode ? 'Done Editing' : 'Edit Revenue'}
                </button>
              </div>
            </div>
            {revenueEditMode && (
              <div className="px-4 py-2 bg-monster-50 border-b border-monster-200 text-xs text-monster-700">
                Click any revenue cell to enter a custom amount. Fees recalculate automatically. {hasOverrides && <span className="font-semibold">({Object.keys(revenueOverrides).length} month{Object.keys(revenueOverrides).length !== 1 ? 's' : ''} overridden)</span>}
              </div>
            )}
            <div className="table-container max-h-[400px] overflow-auto">
              <table className="table">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Seasonal</th>
                    <th className="text-right">Baseline</th>
                    <th className="text-right">{revenueEditMode ? 'Revenue (editable)' : 'Revenue'}</th>
                    <th className="text-right">Uplift</th>
                    <th className="text-right" title="(Revenue − Baseline) ÷ Baseline. Starts low and compounds monthly.">Growth %<span className="text-[9px] text-gray-400 block font-normal">(Rev−Base)÷Base</span></th>
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
                        <tr key={`yr-total-${yearNum}`} className="bg-monster-100 font-semibold border-t border-monster-300">
                          <td className="text-monster-800">Year {yearNum} Total</td>
                          <td></td><td></td>
                          <td className="text-right">{formatCurrency(yrRevenue)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(yrUplift)}</td>
                          <td></td>
                          <td className="text-right text-green-600">{formatCurrency(yrGrowth)}</td>
                          <td className="text-right text-amber-600">{formatCurrency(yrFoundation)}</td>
                          <td className="text-right text-monster-600">{formatCurrency(yrSustaining)}</td>
                          <td className="text-right font-bold text-monster-700">{formatCurrency(yrTotal)}</td>
                          <td className="text-right font-bold">{formatCurrency(yrTotal)}</td>
                        </tr>
                      )
                    }

                    activeProjection.projections.forEach((row, i) => {
                      if (row.isYearStart && i > 0) {
                        flushYear()
                        yearNum++
                        yearCumulFee = 0
                        yrRevenue = 0; yrUplift = 0; yrGrowth = 0; yrFoundation = 0; yrSustaining = 0; yrTotal = 0

                        // Baseline reset annotation row
                        const prevRow = activeProjection.projections[i - 1]
                        const oldBase = prevRow.currentBaseline
                        const newBase = row.currentBaseline
                        if (newBase !== oldBase) {
                          const resetInfo = fullProjection.baselineResets.find(r => r.yearNumber === row.yearNumber)
                          rows.push(
                            <tr key={`yr-reset-${yearNum}`} className="bg-blue-50 border-b border-blue-200">
                              <td colSpan={11} className="py-2 px-4 text-xs text-blue-800">
                                <strong>&#8593; Baseline Reset:</strong>{' '}
                                {formatCurrency(oldBase)} &rarr; {formatCurrency(newBase)}{' '}
                                <span className="text-blue-600">
                                  ({Math.round(((newBase - oldBase) / oldBase) * 100)}% of Year {yearNum - 1} growth retained as new floor)
                                </span>
                                {resetInfo && (
                                  <span className="ml-2 text-blue-500">
                                    | Sustaining fee: {formatCurrency(resetInfo.newSustainingFee)}/mo (locks in last year&apos;s avg earnings)
                                  </span>
                                )}
                                <br />
                                <span className="text-blue-500 italic">
                                  Growth % now measures uplift from the higher {formatCurrency(newBase)} baseline &mdash; so it starts lower even though revenue is higher.
                                </span>
                              </td>
                            </tr>
                          )
                        }
                      }
                      yearCumulFee += row.totalMonthlyFee
                      yrRevenue += row.projectedRevenue; yrUplift += row.uplift
                      yrGrowth += row.growthFee; yrFoundation += row.foundationFee
                      yrSustaining += row.sustainingFee; yrTotal += row.totalMonthlyFee
                      const isOverridden = i in revenueOverrides
                      rows.push(
                        <tr key={row.monthLabel} className={`${row.isYearStart ? 'bg-monster-50 border-t-2 border-monster-300' : ''} ${isOverridden ? 'bg-yellow-50' : ''}`}>
                          <td>{row.monthLabel}</td>
                          <td className="text-right text-gray-400 text-xs">{row.seasonalIndex.toFixed(2)}</td>
                          <td className="text-right text-gray-500">{formatCurrency(row.currentBaseline)}</td>
                          <td className="text-right">
                            {revenueEditMode ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={isOverridden ? revenueOverrides[i] : Math.round(row.projectedRevenue)}
                                  min={0}
                                  step={500}
                                  onChange={(e) => {
                                    const val = Number(e.target.value)
                                    const projected = Math.round(y1Projection.projections[i].projectedRevenue)
                                    if (val === projected) {
                                      // Remove override if set back to projected value
                                      const next = { ...revenueOverrides }
                                      delete next[i]
                                      setRevenueOverrides(next)
                                    } else {
                                      setRevenueOverrides({ ...revenueOverrides, [i]: val })
                                    }
                                  }}
                                  className={`border rounded px-2 py-0.5 text-sm w-28 text-right ${isOverridden ? 'border-yellow-400 bg-yellow-50 font-semibold' : 'border-gray-300'}`}
                                />
                                {isOverridden && (
                                  <button
                                    onClick={() => {
                                      const next = { ...revenueOverrides }
                                      delete next[i]
                                      setRevenueOverrides(next)
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Reset to projected"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className={isOverridden ? 'text-yellow-700 font-semibold' : ''}>{formatCurrency(row.projectedRevenue)}{isOverridden && ' *'}</span>
                            )}
                          </td>
                          <td className="text-right text-blue-600">{formatCurrency(row.uplift)}</td>
                          <td className="text-right text-blue-600">{formatGrowthPercentage(row.growthPercentage)}</td>
                          <td className="text-right text-green-600">{formatCurrency(row.growthFee)}</td>
                          <td className="text-right text-amber-600">{formatCurrency(row.foundationFee)}</td>
                          <td className="text-right text-monster-600">{formatCurrency(row.sustainingFee)}</td>
                          <td className="text-right font-medium text-monster-700">{formatCurrency(row.totalMonthlyFee)}</td>
                          <td className="text-right font-medium">{formatCurrency(yearCumulFee)}</td>
                        </tr>
                      )
                      if (i === activeProjection.projections.length - 1) flushYear()
                    })
                    return rows
                  })()}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                  <tr>
                    <td>GRAND TOTAL</td>
                    <td className="text-right"></td>
                    <td className="text-right"></td>
                    <td className="text-right">{formatCurrency(activeProjection.summary.totalProjectedRevenue)}</td>
                    <td className="text-right text-blue-600">{formatCurrency(activeProjection.projections.reduce((s, p) => s + p.uplift, 0))}</td>
                    <td className="text-right"></td>
                    <td className="text-right text-green-600">{formatCurrency(activeProjection.summary.totalGrowthFees)}</td>
                    <td className="text-right text-amber-600">{formatCurrency(activeProjection.summary.totalFoundationFees)}</td>
                    <td className="text-right text-monster-600">{formatCurrency(activeProjection.summary.totalSustainingFees)}</td>
                    <td className="text-right font-bold text-monster-700">{formatCurrency(activeProjection.summary.totalFees)}</td>
                    <td className="text-right font-bold">{formatCurrency(activeProjection.summary.totalFees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {hasOverrides && !revenueEditMode && (
              <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 text-xs text-yellow-700 flex items-center justify-between">
                <span>{Object.keys(revenueOverrides).length} month{Object.keys(revenueOverrides).length !== 1 ? 's' : ''} with custom revenue (marked with *). Fees recalculated accordingly.</span>
                <button
                  onClick={() => setRevenueOverrides({})}
                  className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  <RotateCcw className="h-3 w-3" /> Reset to projected
                </button>
              </div>
            )}
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
            <p className="px-4 py-2 text-xs text-gray-500 bg-monster-50 border-b border-monster-100">
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
                    <th className="text-right bg-monster-50">Growth Fee</th>
                    <th className="text-right bg-monster-50">Foundation</th>
                    <th className="text-right bg-monster-50">Sustaining</th>
                    <th className="text-right bg-monster-50 font-bold">Total Due</th>
                    <th className="text-right bg-green-50 font-bold">You Keep</th>
                    <th className="text-right bg-monster-50">Cumul. Fees</th>
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
                        <tr key={row.monthLabel} className={row.isYearStart ? 'bg-monster-50 border-t-2 border-monster-300' : ''}>
                          <td>{row.monthLabel}</td>
                          <td className="text-right">{formatCurrency(row.projectedRevenue)}</td>
                          <td className="text-right text-gray-500">{formatCurrency(row.currentBaseline)}</td>
                          <td className="text-right text-blue-600">{formatCurrency(row.uplift)}</td>
                          <td className="text-right text-monster-600">{formatCurrency(row.growthFee)}</td>
                          <td className="text-right text-amber-600">{formatCurrency(row.foundationFee)}</td>
                          <td className="text-right text-monster-600">{formatCurrency(row.sustainingFee)}</td>
                          <td className="text-right font-bold text-monster-700">{formatCurrency(row.totalMonthlyFee)}</td>
                          <td className="text-right font-bold text-green-600">{formatCurrency(youKeep)}</td>
                          <td className="text-right text-monster-600">{formatCurrency(cumulFees)}</td>
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
                    <td className="text-right text-monster-600">{formatCurrency(fullProjection.summary.totalGrowthFees)}</td>
                    <td className="text-right text-amber-600">{formatCurrency(fullProjection.summary.totalFoundationFees)}</td>
                    <td className="text-right text-monster-600">{formatCurrency(fullProjection.summary.totalSustainingFees)}</td>
                    <td className="text-right font-bold text-monster-700">{formatCurrency(fullProjection.summary.totalFees)}</td>
                    <td className="text-right font-bold text-green-600">{formatCurrency(fullProjection.summary.totalProjectedRevenue - fullProjection.summary.totalFees)}</td>
                    <td className="text-right text-monster-700">{formatCurrency(fullProjection.summary.totalFees)}</td>
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
                <h3 className="font-semibold text-monster-900 mb-1">
                  How We Both Win (Year {yr.yearNumber})
                  {isY1 && <span className="ml-2 text-xs bg-monster-200 text-monster-800 px-2 py-0.5 rounded-full">Grand Slam</span>}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Baseline: {formatCurrency(yr.startBaseline)}/mo &middot; {growthLabel}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What you pay us */}
                  <div className="bg-monster-50 rounded-lg p-5 border border-monster-200">
                    <h4 className="font-bold text-monster-800 mb-3">What You Pay Us</h4>
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
                          <span className="font-medium text-monster-600">{formatCurrency(yr.sustainingFeeTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Growth Fees</span>
                        <span className="font-medium text-green-600">{formatCurrency(yr.growthFeeTotal)}</span>
                      </div>
                      {isY1 && (
                        <p className="text-xs text-monster-500 italic">Year 1 Grand Slam: no Foundation or Sustaining fees</p>
                      )}
                      <hr className="border-monster-200" />
                      <div className="flex justify-between font-bold text-monster-800">
                        <span>Total Year {yr.yearNumber} Fees</span>
                        <span>{formatCurrency(feesPaid)}</span>
                      </div>
                      <div className="flex justify-between text-monster-600">
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
                        <span className="font-medium text-monster-600">({formatCurrency(feesPaid)})</span>
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
                  <div className="text-center p-3 bg-monster-50 rounded-lg border border-monster-200">
                    <p className="text-xs text-gray-500">Avg Monthly Fee</p>
                    <p className="text-lg font-bold text-monster-700">{formatCurrency(yr.avgMonthlyFee)}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-500">ROI Multiple</p>
                    <p className="text-lg font-bold text-green-700">{roiMultiple}x</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500">Cost per $1 of Growth</p>
                    <p className="text-lg font-bold text-blue-700">${costPerDollar}</p>
                  </div>
                </div>
                {isY1 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Formula:</p>
                    <p className="font-mono text-xs text-gray-600">ROI = (Revenue Gained - Fees Paid) / Fees Paid</p>
                    <p className="text-gray-500 mt-2">
                      Our fee structure is performance-based: we only earn more when Monster earns more. In Year 1 (Grand Slam),
                      there are no foundation or sustaining fees &mdash; Monster only pays growth fees on actual uplift. The tiered model
                      means our incentive is directly aligned with your growth. If growth slows, our earnings decrease proportionally.
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
                      <td className="text-right text-monster-600">
                        {year.sustainingFeeTotal > 0 ? formatCurrency(year.sustainingFeeTotal) : '-'}
                      </td>
                      <td className="text-right text-green-600">{formatCurrency(year.growthFeeTotal)}</td>
                      <td className="text-right font-semibold text-monster-700">{formatCurrency(year.totalFees)}</td>
                      <td className="text-right font-semibold text-green-600">{formatCurrency(year.totalRevenue - year.totalFees)}</td>
                      <td className="text-right text-monster-600">{formatCurrency(year.avgMonthlyFee)}</td>
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
              <p className="px-4 py-2 text-xs text-gray-500 bg-monster-50 border-b border-monster-100">
                Formula: New = Old + (AvgUplift &times; RetentionRate%) &rarr; <RefBadge id="table-3b" label="see Table 3B" />
              </p>
              <div className="p-4 space-y-3">
                {fullProjection.baselineResets.map((reset, i) => (
                  <div key={i} className="bg-monster-50 rounded-lg p-4 border border-monster-100">
                    <p className="font-semibold text-monster-900 mb-2">
                      Year {reset.yearNumber} Start ({reset.monthLabel})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-monster-600 text-xs">Previous Baseline</p>
                        <p className="font-medium">{formatCurrency(reset.oldBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-monster-600 text-xs">New Baseline</p>
                        <p className="font-medium text-monster-800">{formatCurrency(reset.newBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-monster-600 text-xs">Last Year Avg Fee</p>
                        <p className="font-medium">{formatCurrency(reset.lastYearAvgFee)}</p>
                      </div>
                      <div>
                        <p className="text-monster-600 text-xs">Sustaining Fee</p>
                        <p className="font-semibold text-monster-800">{formatCurrency(reset.newSustainingFee)}/mo</p>
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
      {/* TAB: Profitability */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          {/* Section 1: Per-Stream Profitability */}
          <div className="card">
            <SectionHeader id="profit-streams" label="P1" title="Per-Stream Profitability" />
            <div className="table-container">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Stream</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Material Cost</th>
                    <th className="text-right">Gross After Materials</th>
                    <th className="text-right">% of Total</th>
                    <th className="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {costAnalysis.streamProfitability.map((sp) => (
                    <tr key={sp.name}>
                      <td className="font-medium">{sp.name}</td>
                      <td className="text-right">{formatCurrency(sp.monthlyAmount)}</td>
                      <td className="text-right text-red-600">{formatCurrency(sp.materialCost)}</td>
                      <td className="text-right text-green-600">{formatCurrency(sp.grossAfterMaterials)}</td>
                      <td className="text-right">{sp.pctOfTotal.toFixed(1)}%</td>
                      <td className="text-right font-semibold">{sp.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold border-t">
                  <tr>
                    <td>Total</td>
                    <td className="text-right">{formatCurrency(baseline)}</td>
                    <td className="text-right text-red-600">{formatCurrency(costAnalysis.baselineMaterialCost)}</td>
                    <td className="text-right text-green-600">{formatCurrency(baseline - costAnalysis.baselineMaterialCost)}</td>
                    <td className="text-right">100%</td>
                    <td className="text-right">{((baseline - costAnalysis.baselineMaterialCost) / baseline * 100).toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 2: Monthly P&L at Baseline */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly P&amp;L at Baseline</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-semibold">{formatCurrency(baseline)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Materials ({costAnalysis.weightedMaterialPct.toFixed(1)}%):</span>
                <span>({formatCurrency(costAnalysis.baselineMaterialCost)})</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Crews ({businessCosts.crews.count}&times;{formatCurrency(businessCosts.crews.costPerCrew)}):</span>
                <span>({formatCurrency(costAnalysis.crewCosts)})</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Other Employees:</span>
                <span>({formatCurrency(businessCosts.otherEmployees)})</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Overhead:</span>
                <span>({formatCurrency(businessCosts.overheadCosts)})</span>
              </div>
              <hr className="border-gray-300" />
              <div className={`flex justify-between font-bold ${costAnalysis.baselineNetBeforeFees >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                <span>= Net Before Fees:</span>
                <span>{costAnalysis.baselineNetBeforeFees >= 0 ? '' : '('}{formatCurrency(Math.abs(costAnalysis.baselineNetBeforeFees))}{costAnalysis.baselineNetBeforeFees < 0 ? ')' : ''}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Margin: {costAnalysis.baselineMargin.toFixed(1)}% — {costAnalysis.baselineNetBeforeFees >= 0 ? 'Profitable at current baseline' : 'Operating at a loss at current baseline'}
              </p>
            </div>
          </div>

          {/* Section 3: Monthly P&L at Growth Scenario */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly P&amp;L at {growthLabel}</h3>
            <div className="bg-green-50 rounded-lg p-4 font-mono text-sm space-y-2 border border-green-200">
              <div className="flex justify-between">
                <span>Revenue at {growthLabel}:</span>
                <span className="font-semibold">{formatCurrency(costAnalysis.growthRevenue)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Materials ({costAnalysis.weightedMaterialPct.toFixed(1)}%):</span>
                <span>({formatCurrency(costAnalysis.growthMaterialCost)})</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Fixed Costs (crews + employees + overhead):</span>
                <span>({formatCurrency(costAnalysis.totalFixedCosts)})</span>
              </div>
              <hr className="border-green-300" />
              <div className={`flex justify-between font-bold ${costAnalysis.growthNetBeforeFees >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                <span>= Net Before Fees:</span>
                <span>{costAnalysis.growthNetBeforeFees >= 0 ? '' : '('}{formatCurrency(Math.abs(costAnalysis.growthNetBeforeFees))}{costAnalysis.growthNetBeforeFees < 0 ? ')' : ''}</span>
              </div>
              <div className="flex justify-between text-monster-600">
                <span>- Sweet Dreams Fee (avg):</span>
                <span>({formatCurrency(costAnalysis.avgMonthlyFee)})</span>
              </div>
              <hr className="border-green-300" />
              <div className={`flex justify-between font-bold text-lg ${costAnalysis.growthNetAfterFees >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                <span>= Net Profit:</span>
                <span>{costAnalysis.growthNetAfterFees >= 0 ? '' : '('}{formatCurrency(Math.abs(costAnalysis.growthNetAfterFees))}{costAnalysis.growthNetAfterFees < 0 ? ')' : ''}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Margin after fees: {costAnalysis.growthMarginAfterFees.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Section 4: Break-Even & Margin Analysis */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Break-Even &amp; Margin Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-monster-50 rounded-lg p-4 border border-monster-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Break-Even Revenue</p>
                <p className="text-2xl font-bold text-monster-700">{formatCurrency(costAnalysis.breakEvenRevenue)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Revenue needed to cover all fixed + material costs (before fees)
                </p>
              </div>
              <div className="bg-monster-50 rounded-lg p-4 border border-monster-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Growth Needed for Break-Even</p>
                <p className="text-2xl font-bold text-monster-700">
                  {costAnalysis.breakEvenGrowthPct > 0 ? `${costAnalysis.breakEvenGrowthPct.toFixed(1)}%` : 'Already profitable'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {costAnalysis.breakEvenRevenue > baseline
                    ? `Need ${formatCurrency(costAnalysis.breakEvenRevenue - baseline)} more revenue/mo`
                    : 'Current baseline covers costs'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500">Current Margin</p>
                <p className={`text-xl font-bold ${costAnalysis.baselineMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {costAnalysis.baselineMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">Before fees</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500">At {growthLabel}</p>
                <p className={`text-xl font-bold ${costAnalysis.growthMarginBeforeFees >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {costAnalysis.growthMarginBeforeFees.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">Before fees</p>
              </div>
              <div className="text-center p-3 bg-monster-50 rounded-lg border border-monster-200">
                <p className="text-xs text-gray-500">After Our Fees</p>
                <p className={`text-xl font-bold ${costAnalysis.growthMarginAfterFees >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {costAnalysis.growthMarginAfterFees.toFixed(1)}%
                </p>
                <p className="text-xs text-monster-500">The full picture</p>
              </div>
            </div>
          </div>

          {/* Section 5: Fair Scenario Card */}
          <div className="card p-6 bg-gradient-to-r from-monster-50 to-green-50 border-monster-200">
            <h3 className="font-semibold text-monster-900 mb-3">The Fair Deal: How Both Sides Benefit</h3>
            <div className="bg-white rounded-lg p-4 text-sm space-y-3 border border-gray-200">
              <p className="text-gray-700">
                At <strong>{growthLabel}</strong>, Monster Remodeling&apos;s monthly revenue grows from{' '}
                <strong>{formatCurrency(baseline)}</strong> to <strong>{formatCurrency(costAnalysis.growthRevenue)}</strong>.
              </p>
              <p className="text-gray-700">
                After all business costs ({formatCurrency(costAnalysis.growthTotalCosts)}/mo including materials, crews, employees, and overhead),
                Monster nets <strong className={costAnalysis.growthNetBeforeFees >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {formatCurrency(Math.abs(costAnalysis.growthNetBeforeFees))}/mo {costAnalysis.growthNetBeforeFees < 0 ? '(loss)' : 'before fees'}
                </strong>.
              </p>
              <p className="text-gray-700">
                Sweet Dreams&apos; average monthly fee is <strong className="text-monster-700">{formatCurrency(costAnalysis.avgMonthlyFee)}</strong>,
                leaving Monster with{' '}
                <strong className={costAnalysis.growthNetAfterFees >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {formatCurrency(Math.abs(costAnalysis.growthNetAfterFees))}/mo {costAnalysis.growthNetAfterFees < 0 ? '(net loss)' : 'net profit'}
                </strong>.
              </p>
              {costAnalysis.growthNetAfterFees >= 0 ? (
                <div className="bg-green-50 rounded p-3 border border-green-200">
                  <p className="text-green-800 font-medium">
                    Both parties benefit: Monster gains {formatCurrency(costAnalysis.growthRevenue - baseline)}/mo in new revenue,
                    keeps {formatCurrency(costAnalysis.growthNetAfterFees)}/mo after all costs and fees,
                    while Sweet Dreams earns {formatCurrency(costAnalysis.avgMonthlyFee)}/mo for delivering that growth.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                  <p className="text-yellow-800 font-medium">
                    At {growthLabel}, Monster&apos;s cost structure still results in a net loss after fees.
                    {costAnalysis.breakEvenGrowthPct > 0 && ` A growth rate of approximately ${costAnalysis.breakEvenGrowthPct.toFixed(0)}% is needed to reach break-even before fees.`}
                    {' '}Consider adjusting costs, raising prices, or focusing on higher-margin streams to improve profitability.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Market Intel */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'market-intel' && (
        <div className="space-y-6">
          {/* Hero: Market Position */}
          <div className="card p-6 bg-gradient-to-r from-monster-900 to-monster-700 text-white">
            <h2 className="text-xl font-bold mb-1">Fort Wayne Residential Remodeling Market</h2>
            <p className="text-monster-200 text-sm">Allen County, Indiana &middot; Strategic Market Research &middot; 2024&ndash;2026</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-monster-200">Total Addressable Market</p>
                <p className="text-2xl font-bold">{formatCurrency(FORT_WAYNE_MARKET.tam)}</p>
                <p className="text-xs text-monster-300">All home improvement spending</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-monster-200">Serviceable Available Market</p>
                <p className="text-2xl font-bold">{formatCurrency(FORT_WAYNE_MARKET.sam)}</p>
                <p className="text-xs text-monster-300">Professional projects $10K+</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-monster-200">Your Annual Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(marketShare.annualRevenue)}</p>
                <p className="text-xs text-monster-300">{formatCurrency(baseline)}/mo baseline</p>
              </div>
              <div className="bg-white/15 rounded-lg p-3 border border-white/20">
                <p className="text-xs text-monster-200">Current Market Share</p>
                <p className="text-2xl font-bold text-yellow-300">{marketShare.currentShare.toFixed(2)}%</p>
                <p className="text-xs text-monster-300">of SAM ({formatCurrency(FORT_WAYNE_MARKET.sam)})</p>
              </div>
            </div>
          </div>

          {/* Market Share Growth Trajectory */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Market Share at Growth Scenarios</h3>
            <p className="text-sm text-gray-500 mb-4">
              The Fort Wayne SAM of {formatCurrency(FORT_WAYNE_MARKET.sam)} is massive and fragmented.
              The constraint on growth is not market capacity &mdash; it&apos;s internal: operational capacity, sales systems, and labor acquisition.
            </p>
            <div className="overflow-x-auto">
              <table className="table text-sm w-full">
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th className="text-right">Annual Revenue</th>
                    <th className="text-right">Market Share</th>
                    <th className="text-right">Growth Needed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-monster-50">
                    <td className="font-medium">Current Baseline</td>
                    <td className="text-right">{formatCurrency(marketShare.annualRevenue)}</td>
                    <td className="text-right font-semibold text-monster-700">{marketShare.currentShare.toFixed(2)}%</td>
                    <td className="text-right text-gray-400">&mdash;</td>
                    <td><span className="text-xs bg-monster-100 text-monster-700 px-2 py-0.5 rounded-full">You are here</span></td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="font-medium">At {growthLabel}</td>
                    <td className="text-right">{formatCurrency(marketShare.annualRevenue * (1 + growthPercent))}</td>
                    <td className="text-right font-semibold text-green-700">{marketShare.atGrowth.toFixed(2)}%</td>
                    <td className="text-right">{(growthPercent * 100).toFixed(0)}%</td>
                    <td><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Selected scenario</span></td>
                  </tr>
                  {marketShare.milestones.map((m) => (
                    <tr key={m.label}>
                      <td className="font-medium">{m.label} Revenue</td>
                      <td className="text-right">{formatCurrency(m.revenue)}</td>
                      <td className="text-right font-semibold">{m.share.toFixed(2)}%</td>
                      <td className="text-right">{m.growthNeeded > 0 ? `${m.growthNeeded.toFixed(0)}%` : <span className="text-green-600">Achieved</span>}</td>
                      <td>
                        {m.revenue <= marketShare.annualRevenue ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Exceeded</span>
                        ) : m.revenue <= marketShare.annualRevenue * (1 + growthPercent) ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Within reach</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Future target</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Key insight:</strong> Even at $5M annual revenue, Monster would hold just {((5_000_000 / FORT_WAYNE_MARKET.sam) * 100).toFixed(1)}% of the
                serviceable market. There is room for dozens of $5M firms. The market will not constrain your growth &mdash; your systems will.
              </p>
            </div>
          </div>

          {/* Economic Landscape */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Fort Wayne Economic Landscape (2024&ndash;2026)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500 uppercase">Allen County Population</p>
                <p className="text-xl font-bold text-blue-700">~{(FORT_WAYNE_MARKET.populationAllenCounty / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500">+4,750 net migration (2024)</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500 uppercase">GDP Growth</p>
                <p className="text-xl font-bold text-blue-700">{(FORT_WAYNE_MARKET.gdpGrowth * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Above national average</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500 uppercase">Unemployment</p>
                <p className="text-xl font-bold text-blue-700">{(FORT_WAYNE_MARKET.unemploymentRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Near historic low</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 uppercase">Median Household Income</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(FORT_WAYNE_MARKET.medianHouseholdIncome)}</p>
                <p className="text-xs text-gray-500">High discretionary income (low COL)</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 uppercase">2025 Permit Activity</p>
                <p className="text-xl font-bold text-green-700">${(FORT_WAYNE_MARKET.permitActivity2025 / 1_000_000_000).toFixed(2)}B</p>
                <p className="text-xs text-gray-500">Allen County building permits</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 uppercase">Median Age</p>
                <p className="text-xl font-bold text-green-700">{FORT_WAYNE_MARKET.keyDemographics.medianAge}</p>
                <p className="text-xs text-gray-500">Peak household formation</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Why this matters:</strong> Fort Wayne has transitioned from a pure manufacturing hub to a diversified economy
              (defense, logistics, healthcare, insurance). 4% unemployment means confident consumers willing to finance $50K+
              renovations. Net migration of 4,750 residents in 2024 triggers immediate remodeling activity as new owners customize.
            </div>
          </div>

          {/* Demographic Spending Power */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Homeowner Spending by Generation</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-monster-50 rounded-lg border border-monster-200 text-center">
                <p className="text-xs text-gray-500 uppercase">Millennials (Dominant Cohort)</p>
                <p className="text-2xl font-bold text-monster-700">{formatCurrency(FORT_WAYNE_MARKET.keyDemographics.millennialAvgSpend)}</p>
                <p className="text-xs text-gray-500">avg annual home improvement spend</p>
                <div className="mt-2 bg-monster-200 rounded-full h-2">
                  <div className="bg-monster-600 rounded-full h-2" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-gray-500 uppercase">Gen X</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(FORT_WAYNE_MARKET.keyDemographics.genXAvgSpend)}</p>
                <p className="text-xs text-gray-500">avg annual home improvement spend</p>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 rounded-full h-2" style={{ width: `${(FORT_WAYNE_MARKET.keyDemographics.genXAvgSpend / FORT_WAYNE_MARKET.keyDemographics.millennialAvgSpend * 100)}%` }} />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-500 uppercase">Baby Boomers</p>
                <p className="text-2xl font-bold text-gray-700">{formatCurrency(FORT_WAYNE_MARKET.keyDemographics.boomerAvgSpend)}</p>
                <p className="text-xs text-gray-500">avg annual home improvement spend</p>
                <div className="mt-2 bg-gray-300 rounded-full h-2">
                  <div className="bg-gray-600 rounded-full h-2" style={{ width: `${(FORT_WAYNE_MARKET.keyDemographics.boomerAvgSpend / FORT_WAYNE_MARKET.keyDemographics.millennialAvgSpend * 100)}%` }} />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Fort Wayne&apos;s median age of 35 means the largest spending cohort (Millennials) is actively buying first/second homes and investing in property.
              Dual-income households in healthcare and defense sectors create pockets of significant affluence.
            </p>
          </div>

          {/* Housing Stock Analysis */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Allen County Housing Stock Analysis</h3>
            <p className="text-sm text-gray-500 mb-4">
              {FORT_WAYNE_MARKET.totalHousingUnits.toLocaleString()} total units &middot; {FORT_WAYNE_MARKET.ownerOccupiedHomes.toLocaleString()} owner-occupied ({(FORT_WAYNE_MARKET.ownershipRate * 100).toFixed(1)}%)
            </p>
            {/* Visual bar breakdown */}
            <div className="flex rounded-lg overflow-hidden h-10 mb-4">
              <div className="bg-amber-600 flex items-center justify-center text-white text-xs font-medium" style={{ width: '20.1%' }} title="Pre-1940">20.1%</div>
              <div className="bg-monster-600 flex items-center justify-center text-white text-xs font-medium" style={{ width: '44.7%' }} title="1940-1969">44.7%</div>
              <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: '27.6%' }} title="1970-1999">27.6%</div>
              <div className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium" style={{ width: '7.6%' }} title="2000+">7.6%</div>
            </div>
            <div className="space-y-3">
              {FORT_WAYNE_MARKET.housingStock.map((era) => (
                <div key={era.era} className={`p-3 rounded-lg border ${era.complexity === 'Medium — Sweet Spot' ? 'bg-monster-50 border-monster-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{era.era} <span className="text-gray-500">({era.pct}%)</span></p>
                      <p className="text-xs text-gray-500">{era.locations}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      era.complexity === 'Medium — Sweet Spot' ? 'bg-monster-200 text-monster-800 font-semibold' :
                      era.complexity === 'High' ? 'bg-amber-100 text-amber-700' :
                      era.complexity === 'Low' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{era.complexity}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1"><strong>Remodeling needs:</strong> {era.needs}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-monster-50 rounded-lg border border-monster-200">
              <p className="text-sm text-monster-800">
                <strong>Strategic recommendation:</strong> The path of least resistance to $1.5M is dominating the <strong>1940&ndash;1969</strong> and <strong>1970&ndash;1999</strong> segments
                (72.3% of all housing). These homes are owned by people with equity who are actively seeking to modernize.
                Pre-1940s require specialized skills and higher liability insurance that may distract from scaling.
              </p>
            </div>
          </div>

          {/* Competitive Landscape */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Competitive Landscape: Fort Wayne Remodeling</h3>
            <div className="space-y-3">
              {FORT_WAYNE_MARKET.competitors.map((tier) => (
                <div key={tier.tier} className={`p-4 rounded-lg border ${tier.tier === 4 ? 'bg-monster-50 border-monster-300 ring-2 ring-monster-400' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        Tier {tier.tier}: {tier.name}
                        {tier.tier === 4 && <span className="ml-2 text-xs bg-monster-600 text-white px-2 py-0.5 rounded-full">Monster is here</span>}
                      </p>
                      <p className="text-sm text-gray-600">{tier.examples}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-500">{tier.revenue}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{tier.impact}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 text-sm mb-1">Competitive Advantage: The Growth Wedge</p>
              <p className="text-sm text-green-800">
                To scale from Tier 4 to Tier 3, stop competing on <em>price</em> against the informal market.
                Start competing on <em>process</em> against Tier 2/3 firms. Target the <strong>$25K&ndash;$75K project range</strong> (kitchens, master baths)
                where established firms are too expensive or backlogged, but owner-operators are too risky.
              </p>
              <p className="text-sm text-green-700 mt-2 italic">
                &ldquo;We offer the professional communication and reliability of the big firms, with the personal touch and agility of a dedicated owner-led team.&rdquo;
              </p>
            </div>
          </div>

          {/* Growth Scenarios */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Strategic Growth Scenarios (3&ndash;5 Year Horizon)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FORT_WAYNE_MARKET.growthScenarios.map((scenario, idx) => (
                <div key={scenario.name} className={`p-4 rounded-lg border-2 ${idx === 0 ? 'border-green-400 bg-green-50' : idx === 1 ? 'border-blue-400 bg-blue-50' : 'border-monster-400 bg-monster-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-green-200 text-green-800' : idx === 1 ? 'bg-blue-200 text-blue-800' : 'bg-monster-200 text-monster-800'}`}>
                      Scenario {String.fromCharCode(65 + idx)}
                    </span>
                  </div>
                  <p className="font-bold text-lg">{scenario.name}</p>
                  <p className={`text-2xl font-bold mt-1 ${idx === 0 ? 'text-green-700' : idx === 1 ? 'text-blue-700' : 'text-monster-700'}`}>{scenario.targetRevenue}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Strategy:</span><span className="font-medium text-right">{scenario.strategy}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Target Margin:</span><span className="font-semibold">{scenario.grossMargin}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Team Size:</span><span className="font-medium">{scenario.teamSize}</span></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 border-t pt-2">
                    <strong>Key move:</strong> {scenario.keyMove}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SAM Methodology */}
          <div className="card p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Market Sizing Methodology</h3>
            <div className="bg-white rounded-lg p-4 font-mono text-sm space-y-2 border">
              <p><span className="text-gray-500">Total Housing Units:</span> {FORT_WAYNE_MARKET.totalHousingUnits.toLocaleString()}</p>
              <p><span className="text-gray-500">Owner-Occupied ({(FORT_WAYNE_MARKET.ownershipRate * 100).toFixed(1)}%):</span> {FORT_WAYNE_MARKET.ownerOccupiedHomes.toLocaleString()} households</p>
              <p><span className="text-gray-500">Blended Avg Spend:</span> $12,000/household/year</p>
              <hr className="border-gray-200" />
              <p><span className="text-gray-500">TAM:</span> {FORT_WAYNE_MARKET.ownerOccupiedHomes.toLocaleString()} &times; $12,000 = <strong>{formatCurrency(FORT_WAYNE_MARKET.tam)}</strong></p>
              <p><span className="text-gray-500">Professional Share (35%):</span> {formatCurrency(FORT_WAYNE_MARKET.tam * 0.35)}</p>
              <p><span className="text-gray-500">Income Qualified (50%):</span> {formatCurrency(FORT_WAYNE_MARKET.tam * 0.35 * 0.50)}</p>
              <hr className="border-gray-200" />
              <p className="font-bold"><span className="text-gray-500">SAM:</span> <span className="text-monster-700">{formatCurrency(FORT_WAYNE_MARKET.sam)}</span></p>
              <p className="mt-2 text-gray-500">Monster&apos;s current share: {formatCurrency(marketShare.annualRevenue)} / {formatCurrency(FORT_WAYNE_MARKET.sam)} = <strong className="text-monster-700">{marketShare.currentShare.toFixed(3)}%</strong></p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Sources: U.S. Census Bureau (American Community Survey), Harvard Joint Center for Housing Studies,
              National Association of Home Builders, Allen County Building Department, Bureau of Labor Statistics.
            </p>
          </div>

          {/* Valley of Death Warning */}
          <div className="card p-6 bg-amber-50 border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">The &ldquo;Valley of Death&rdquo; &mdash; Where Monster Is Today</h3>
            <p className="text-sm text-amber-800 mb-3">
              At {formatCurrency(marketShare.annualRevenue)}/year, Monster is at a critical inflection point: too big to be a hobby, too small to afford
              the overhead required to grow. This is why our partnership matters.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <p className="font-semibold text-amber-900 mb-2">The Problem</p>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>&bull; One crew capacity maxes out at ~$35&ndash;40K/mo</li>
                  <li>&bull; 30% gross margin leaves no room for key hires</li>
                  <li>&bull; Owner wears all hats (sales, PM, lead carpenter)</li>
                  <li>&bull; &lt;1% marketing spend = unpredictable referral pipeline</li>
                  <li>&bull; Can&apos;t afford second crew with only ~$2,400/mo net profit</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="font-semibold text-green-900 mb-2">The Sweet Dreams Solution</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>&bull; Professional marketing engine (lead gen, SEO, content)</li>
                  <li>&bull; Data-driven pricing to push margins from 30% to 35&ndash;40%</li>
                  <li>&bull; Systematic lead qualification and sales process</li>
                  <li>&bull; Performance-based fees mean we succeed only when you succeed</li>
                  <li>&bull; No upfront cost in Year 1 (Grand Slam) &mdash; zero risk to try</li>
                </ul>
              </div>
            </div>
          </div>
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
                analyticsMode === 'demo' ? 'bg-monster-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-monster-50'
              }`}
            >
              <WifiOff className="h-4 w-4" /> Demo Mode
            </button>
            <button
              onClick={() => setAnalyticsMode('live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                analyticsMode === 'live' ? 'bg-monster-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-monster-50'
              }`}
            >
              <Wifi className="h-4 w-4" /> Live Mode
            </button>
          </div>

          {analyticsMode === 'live' && (
            <div className="card p-6 bg-monster-50 border-monster-200">
              <h3 className="font-semibold text-monster-900 mb-4">Connect Real Data Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-monster-300 hover:border-monster-500 transition-colors text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-monster-100 rounded-lg flex items-center justify-center text-monster-600 font-bold text-xs">M</div>
                  <div>
                    <p className="font-semibold text-monster-900">Connect Metricool</p>
                    <p className="text-xs text-gray-500">Social media analytics &amp; scheduling</p>
                    <span className="text-[10px] text-monster-500 font-medium">COMING SOON</span>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-monster-300 hover:border-monster-500 transition-colors text-left opacity-75 cursor-not-allowed">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">Mo</div>
                  <div>
                    <p className="font-semibold text-monster-900">Connect Monday.com</p>
                    <p className="text-xs text-gray-500">Project management &amp; lead tracking</p>
                    <span className="text-[10px] text-monster-500 font-medium">COMING SOON</span>
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
                  { label: 'Impressions', value: MOCK_FUNNEL.impressions, color: 'bg-monster-100 text-monster-800', width: 'w-full' },
                  { label: 'Clicks', value: MOCK_FUNNEL.clicks, color: 'bg-monster-200 text-monster-900', width: 'w-5/6' },
                  { label: 'Leads', value: MOCK_FUNNEL.leads, color: 'bg-monster-400 text-white', width: 'w-3/5' },
                  { label: 'Closed Deals', value: MOCK_FUNNEL.deals, color: 'bg-monster-600 text-white', width: 'w-2/5' },
                  { label: 'Revenue', value: MOCK_FUNNEL.revenue, color: 'bg-monster-800 text-white', width: 'w-1/4' },
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
              <div className="bg-monster-50 rounded-lg p-4 border border-monster-100">
                <h4 className="font-semibold text-monster-900 text-sm mb-3">Social Media</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Followers</span><span className="font-medium">{MOCK_SOCIAL_SEO.social.followers.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Engagement Rate</span><span className="font-medium">{MOCK_SOCIAL_SEO.social.engagementRate}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Posts/Month</span><span className="font-medium">{MOCK_SOCIAL_SEO.social.postsPerMonth}</span></div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-900 text-sm mb-3">SEO</h4>
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
          <div className="card p-6 bg-gradient-to-r from-monster-50 to-green-50 border-monster-200">
            <h3 className="font-semibold text-monster-900 mb-4">Marketing &rarr; Revenue Connection</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Total Ad Spend/mo</p>
                <p className="text-xl font-bold text-monster-700">{formatCurrency(totalAdSpend)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Revenue Generated</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(MOCK_FUNNEL.revenue)}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">Fees Paid</p>
                <p className="text-xl font-bold text-monster-600">{formatCurrency(fullProjection.yearSummaries.length > 0 ? fullProjection.yearSummaries[0].avgMonthlyFee : 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-600">ROAS = (Revenue - Baseline) / Ad Spend = ({formatCurrency(MOCK_FUNNEL.revenue)} - {formatCurrency(baseline)}) / {formatCurrency(totalAdSpend)} = {marketingROAS}x</p>
              <p className="mt-2 text-gray-600 font-medium">
                For every $1 spent on marketing, Monster earned ${marketingROAS} in new revenue above baseline.
              </p>
            </div>
          </div>

          {/* Chart 2B: Seasonal Factors */}
          <div className="card p-6">
            <SectionHeader id="chart-2b" label="Chart 2B" title="Seasonal Factors: Remodeling Industry" />
            <div className="grid grid-cols-12 gap-1 items-end h-48 mt-4">
              {seasonalFactors.map((factor, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${factor >= 1.0 ? 'bg-monster-500' : 'bg-gray-300'}`}
                    style={{ height: `${(factor / 1.5) * 100}%` }}
                  />
                  <p className="text-xs mt-1 text-gray-500">{MONTH_NAMES[i]}</p>
                  <p className="text-xs font-medium">{factor.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Remodeling peaks spring-summer (May: 1.17), dips in winter (Feb: 0.79). Revenue projections apply these factors.
            </p>
          </div>

          {/* Table 3A: Tier Rates */}
          <div className="card">
            <SectionHeader id="table-3a" label="Table 3A" title={`Growth Fee Tier Rates (${categoryInfo.categoryLabel})`} />
            <div className="table-container">
              <table className="table text-sm">
                <thead>
                  <tr className="bg-monster-50">
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
                        <td className="text-center text-monster-600 font-semibold">{formatPercent(tier.feeRate)}</td>
                        <td className="text-center text-blue-600">{formatPercent(y2Tier.feeRate)}</td>
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
                <div key={b.label} className="flex justify-between text-sm p-2 bg-monster-50 rounded border border-monster-100">
                  <span className="text-gray-700">{b.label} growth</span>
                  <span className="font-medium text-monster-700">{(b.retentionRate * 100).toFixed(0)}% retained into new baseline</span>
                </div>
              ))}
            </div>
          </div>

          {/* Viability Assessment */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Client Viability Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-monster-50 rounded-lg border border-monster-200">
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-lg font-bold text-monster-700">{categoryInfo.categoryLabel}</p>
                <p className="text-xs text-gray-500">{formatCurrency(baseline)}/mo</p>
              </div>
              <div className="p-3 bg-monster-50 rounded-lg border border-monster-200">
                <p className="text-xs text-gray-500">Foundation Rate</p>
                <p className="text-lg font-bold text-monster-700">{formatPercent(categoryInfo.foundationFeeRate)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(categoryInfo.foundationFeeAnnual)}/yr</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500">Industry Growth</p>
                <p className="text-lg font-bold text-blue-700">12%/yr</p>
                <p className="text-xs text-gray-500">Above average</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500">Seasonality</p>
                <p className="text-lg font-bold text-green-700">Moderate</p>
                <p className="text-xs text-gray-500">Spring/Summer peak</p>
              </div>
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
            <h2 className="text-xl font-bold mb-6">How The Grand Slam Model Works for Monster Remodeling</h2>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Establish the Baseline</h3>
                  <p className="text-gray-600 mt-1">
                    Monster Remodeling&apos;s current monthly revenue is <strong>{formatCurrency(baseline)}/month</strong>.
                    This becomes the baseline &mdash; we only earn fees on revenue <em>above</em> this amount.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Classify the Business</h3>
                  <p className="text-gray-600 mt-1">
                    At {formatCurrency(baseline)}/mo, Monster falls in the <strong>{categoryInfo.categoryLabel}</strong> category
                    with a {formatPercent(categoryInfo.foundationFeeRate)} foundation rate.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 1: Grand Slam (No Upfront Cost)</h3>
                  <p className="text-gray-600 mt-1">
                    In Year 1, there&apos;s <strong>no Foundation Fee</strong> and <strong>no Sustaining Fee</strong>.
                    Monster only pays Growth Fees on actual revenue increase, using premium rates (higher than Year 2+).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Growth Ramps Monthly (Not Instant)</h3>
                  <p className="text-gray-600 mt-1">
                    A <strong>{growthLabel} annual</strong> target does NOT mean every month is {Math.round(growthPercent * 100)}% above baseline.
                    Revenue <strong>compounds monthly</strong> at {(monthlyGrowthRate * 100).toFixed(2)}% per month, building gradually:
                  </p>
                  <div className="mt-2 bg-blue-50 rounded-lg p-3 text-sm border border-blue-200">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Month 1</p>
                        <p className="font-bold text-blue-700">+{((Math.pow(1 + monthlyGrowthRate, 1) - 1) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Month 3</p>
                        <p className="font-bold text-blue-700">+{((Math.pow(1 + monthlyGrowthRate, 3) - 1) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Month 6</p>
                        <p className="font-bold text-blue-700">+{((Math.pow(1 + monthlyGrowthRate, 6) - 1) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Month 12</p>
                        <p className="font-bold text-blue-800">+{((Math.pow(1 + monthlyGrowthRate, 12) - 1) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      The &ldquo;Growth %&rdquo; column in Table 2A shows this per-month figure &mdash; it&apos;s (Revenue &minus; Baseline) &divide; Baseline.
                      It starts small in Month 1 and reaches the full target by Month 12.
                    </p>
                  </div>
                  <p className="text-gray-600 mt-3">
                    Growth fees are then calculated in <strong>tiers</strong> &mdash; higher growth unlocks different rate brackets.
                    At your selected <strong>{growthLabel} annual</strong> target, here&apos;s how a sample month looks:
                  </p>
                  <div className="mt-2 bg-monster-50 rounded-lg p-3 text-sm font-mono border border-monster-100">
                    <p>Baseline: {formatCurrency(baseline)}/mo</p>
                    <p>Revenue at {growthLabel}: {formatCurrency(baseline * (1 + growthPercent))}/mo (end-of-year)</p>
                    <p>Max Monthly Uplift: {formatCurrency(baseline * growthPercent)}</p>
                    {growthPercent <= 0.5 ? (
                      <>
                        <p className="mt-2">Tier 1 (0-50%): {formatCurrency(baseline * growthPercent)} &times; {formatPercent(y1CategoryInfo.tiers[0].feeRate)} = {formatCurrency(Math.round(baseline * growthPercent * y1CategoryInfo.tiers[0].feeRate))}</p>
                        <p className="font-bold text-monster-700">Growth Fee: {formatCurrency(Math.round(baseline * growthPercent * y1CategoryInfo.tiers[0].feeRate))}</p>
                      </>
                    ) : growthPercent <= 1.0 ? (
                      <>
                        <p className="mt-2">Tier 1 (0-50%): {formatCurrency(baseline * 0.5)} &times; {formatPercent(y1CategoryInfo.tiers[0].feeRate)} = {formatCurrency(Math.round(baseline * 0.5 * y1CategoryInfo.tiers[0].feeRate))}</p>
                        <p>Tier 2 (51-100%): {formatCurrency(baseline * (growthPercent - 0.5))} &times; {formatPercent(y1CategoryInfo.tiers[1].feeRate)} = {formatCurrency(Math.round(baseline * (growthPercent - 0.5) * y1CategoryInfo.tiers[1].feeRate))}</p>
                        <p className="font-bold text-monster-700">Growth Fee: {formatCurrency(Math.round(baseline * 0.5 * y1CategoryInfo.tiers[0].feeRate + baseline * (growthPercent - 0.5) * y1CategoryInfo.tiers[1].feeRate))}</p>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-600 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seasonal Adjustments</h3>
                  <p className="text-gray-600 mt-1">
                    Remodeling is seasonal &mdash; peak in May (1.17x) and dip in February (0.79x).
                    Revenue projections account for this natural cycle so fees reflect real business patterns.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-600 text-white flex items-center justify-center font-bold text-sm">6</div>
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
                        <div className="p-3 bg-monster-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Year 1 Fees (Growth only)</p>
                          <p className="font-bold text-monster-600">{formatCurrency(yr1.totalFees)}</p>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-700 text-white flex items-center justify-center font-bold text-sm">7</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2: Baseline Reset &amp; Why Growth % Drops</h3>
                  <p className="text-gray-600 mt-1">
                    At Year 2, the baseline is reset <strong>upward</strong>. A portion of Year 1&apos;s growth is &ldquo;retained&rdquo;
                    into the new baseline (20-60% retention depending on performance).
                  </p>
                  <div className="mt-2 bg-monster-50 rounded-lg p-3 text-sm font-mono border border-monster-100">
                    <p>New Baseline = Old + (AvgUplift &times; RetentionRate%)</p>
                  </div>
                  <div className="mt-3 bg-amber-50 rounded-lg p-3 text-sm border border-amber-200">
                    <p className="font-semibold text-amber-800 mb-1">Why does the Growth % column &ldquo;jump&rdquo; at Year 2?</p>
                    <p className="text-amber-700">
                      Growth % = (Revenue &minus; Baseline) &divide; Baseline. When the baseline goes <strong>up</strong>, the
                      denominator gets bigger, so Growth % appears to &ldquo;reset&rdquo; to a lower number even though
                      your revenue is still climbing. This is <strong>not</strong> lost growth &mdash; it means the retained
                      portion is now your permanent floor, and Growth % measures new uplift from that higher floor.
                    </p>
                    {fullProjection.baselineResets.length > 0 && (() => {
                      const r = fullProjection.baselineResets[0]
                      return (
                        <p className="text-amber-600 text-xs mt-2 font-mono">
                          Example: {formatCurrency(r.oldBaseline)} &rarr; {formatCurrency(r.newBaseline)} baseline.
                          Revenue of {formatCurrency(r.newBaseline * 1.05)} would be{' '}
                          {Math.round(((r.newBaseline * 1.05 - r.oldBaseline) / r.oldBaseline) * 100)}% vs old baseline but only{' '}
                          {Math.round(((r.newBaseline * 1.05 - r.newBaseline) / r.newBaseline) * 100)}% vs the new higher baseline.
                        </p>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Step 8 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-700 text-white flex items-center justify-center font-bold text-sm">8</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2: Foundation Fee Kicks In</h3>
                  <p className="text-gray-600 mt-1">
                    Starting Year 2, Monster pays a Foundation Fee of <strong>{formatPercent(categoryInfo.foundationFeeRate)}</strong> annually
                    ({formatCurrency(categoryInfo.foundationFeeMonthly)}/mo at current baseline).
                    This is the minimum commitment regardless of growth.
                  </p>
                </div>
              </div>

              {/* Step 9 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-monster-700 text-white flex items-center justify-center font-bold text-sm">9</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Year 2: Sustaining Fee (Income Protection)</h3>
                  <p className="text-gray-600 mt-1">
                    The Sustaining Fee ensures we never earn less than last year. It equals:
                    <br /><strong>Last Year Avg Monthly Fee - New Foundation Fee (monthly)</strong>.
                    This protects our earned income even if growth slows.
                  </p>
                  <div className="mt-2 bg-monster-50 rounded-lg p-3 text-sm font-mono border border-monster-100">
                    <p>Sustaining = LastYrAvgMonthlyFee - (Foundation / 12)</p>
                  </div>
                </div>
              </div>

              {/* Step 10 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">10</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Both Win: Fee Fairness</h3>
                  <p className="text-gray-600 mt-1">
                    From Year 2 onward, growth fee rates drop to standard levels (lower than Year 1 premium)
                    because the Foundation and Sustaining fees provide a guaranteed income floor.
                    The three-part model provides predictable, fair compensation.
                  </p>
                  <p className="text-gray-600 mt-2">
                    Review the invoice breakdown to see exactly what Monster pays vs. keeps each month. Our performance-based
                    model means we&apos;re incentivized to grow your revenue &mdash; we only earn more when you earn more.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* FULL REFERENCE: Equations, Rate Tables & Worked Examples */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="border-t-2 border-monster-300 pt-8">
            <h2 className="text-2xl font-bold mb-2">Complete Math Reference</h2>
            <p className="text-gray-600 mb-6">
              Every equation, rate table, and bracket used to calculate Monster Remodeling&apos;s fees.
            </p>
          </div>

          {/* ── Three-Part Fee Overview ── */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">The Three-Part Fee Model</h3>
            <div className="bg-monster-50 rounded-lg p-4 font-mono text-sm mb-4 border border-monster-200">
              <p className="text-gray-600 mb-2">Total Monthly Fee =</p>
              <p className="ml-4">
                <span className="text-amber-600 font-semibold">Foundation Fee</span>
                {' + '}
                <span className="text-monster-600 font-semibold">Sustaining Fee</span>
                {' + '}
                <span className="text-green-600 font-semibold">Growth Fee</span>
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-semibold text-amber-800">Foundation Fee</p>
                <p className="text-amber-700">Annual minimum based on business size. Guarantees baseline income.</p>
                <p className="mt-2 font-mono text-xs bg-white p-2 rounded border">= Baseline &times; 12 &times; Rate &divide; 12</p>
                <p className="text-xs text-amber-600 mt-1">Monster: {formatCurrency(baseline)} &times; 12 &times; {formatPercent(categoryInfo.foundationFeeRate)} = {formatCurrency(categoryInfo.foundationFeeAnnual)}/yr ({formatCurrency(categoryInfo.foundationFeeMonthly)}/mo)</p>
              </div>
              <div className="p-3 bg-monster-50 rounded-lg border border-monster-200">
                <p className="font-semibold text-monster-800">Sustaining Fee</p>
                <p className="text-monster-700">Year 2+ protection. Ensures we never earn less than last year.</p>
                <p className="mt-2 font-mono text-xs bg-white p-2 rounded border">= LastYrAvgFee - Foundation/12</p>
                <p className="text-xs text-monster-600 mt-1">If result is negative, Sustaining = $0</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800">Growth Fee</p>
                <p className="text-green-700">Performance fees on revenue above baseline. Tiered rates.</p>
                <p className="mt-2 font-mono text-xs bg-white p-2 rounded border">= &Sigma;(UpliftInTier &times; TierRate)</p>
                <p className="text-xs text-green-600 mt-1">Only charged on actual uplift above baseline</p>
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
                <p className="text-xs text-gray-500 mt-1">Monster example: {formatCurrency(baseline * 1.5)} - {formatCurrency(baseline)} = {formatCurrency(baseline * 0.5)} uplift</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Growth Percentage</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Growth % = (Uplift &divide; Baseline) &times; 100</p>
                <p className="text-xs text-gray-500 mt-1">Monster example: ({formatCurrency(baseline * 0.5)} &divide; {formatCurrency(baseline)}) &times; 100 = 50% growth</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Effective Rate</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Effective Rate = (Total Fees &divide; Total Uplift) &times; 100</p>
                <p className="text-xs text-gray-500 mt-1">Lower is better for client &mdash; shows overall cost of growth as a percentage</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Monthly &harr; Annual Growth Conversion</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">Annual % = ((1 + Monthly%)^12 - 1) &times; 100</p>
                <p className="text-xs text-gray-500 mt-1">Example: 2% monthly = ((1.02)^12 - 1) &times; 100 = 26.8% annual compound</p>
              </div>
            </div>
          </div>

          {/* ── Foundation Fee Rates by Business Size ── */}
          <div id="ref-foundation-rates" className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Foundation Fee Rates by Business Size</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-monster-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Monthly Baseline</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Annual Revenue</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Foundation Rate</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Example Annual Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: 'Micro', key: 'micro', range: '$0 - $10K', annual: '$0 - $120K', rate: '3.0%', ex: '$1,800 ($5K baseline)' },
                    { cat: 'Small', key: 'small', range: '$10K - $30K', annual: '$120K - $360K', rate: '2.5%', ex: '$6,000 ($20K baseline)' },
                    { cat: 'Medium', key: 'medium', range: '$30K - $75K', annual: '$360K - $900K', rate: '2.0%', ex: '$12,000 ($50K baseline)' },
                    { cat: 'Large', key: 'large', range: '$75K - $150K', annual: '$900K - $1.8M', rate: '1.5%', ex: '$18,000 ($100K baseline)' },
                    { cat: 'Major', key: 'major', range: '$150K - $300K', annual: '$1.8M - $3.6M', rate: '1.25%', ex: '$30,000 ($200K baseline)' },
                    { cat: 'Enterprise', key: 'enterprise', range: '$300K - $500K', annual: '$3.6M - $6M', rate: '1.0%', ex: '$48,000 ($400K baseline)' },
                    { cat: 'Elite', key: 'elite', range: '$500K+', annual: '$6M+', rate: '0.75%', ex: '$54,000 ($600K baseline)' },
                  ].map((row, i) => {
                    const isActive = row.key === categoryInfo.category
                    return (
                    <tr key={row.cat} className={isActive ? 'bg-monster-100 font-semibold' : i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-4 py-2">{row.cat} {isActive && <span className="text-monster-700">&larr; Monster</span>}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.range}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.annual}</td>
                      <td className="border border-gray-300 px-4 py-2 text-monster-700 font-semibold">{row.rate}</td>
                      <td className="border border-gray-300 px-4 py-2">{isActive ? `${formatCurrency(categoryInfo.foundationFeeAnnual)} (${formatCurrency(baseline)} baseline)` : row.ex}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Year 1 Premium Growth Fee Tiers ── */}
          {(() => {
            const catIdx = ['micro','small','medium','large','major','enterprise','elite'].indexOf(categoryInfo.category)
            const catHeaders = [
              { label: 'Micro', range: '$0-10K' },
              { label: 'Small', range: '$10-30K' },
              { label: 'Medium', range: '$30-75K' },
              { label: 'Large', range: '$75-150K' },
              { label: 'Major', range: '$150-300K' },
              { label: 'Enterprise', range: '$300-500K' },
              { label: 'Elite', range: '$500K+' },
            ]
            return (
          <div id="ref-y1-tiers" className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Year 1 Premium Growth Fee Tiers</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Year 1 rates are higher</strong> to compensate for no Foundation or Sustaining fees during Grand Slam. Monster&apos;s {catHeaders[catIdx]?.label} column is highlighted.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-monster-50">
                    <th className="border border-gray-300 px-2 py-2 text-left">Tier</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Growth %</th>
                    {catHeaders.map((h, hi) => (
                      <th key={h.label} className={`border border-gray-300 px-2 py-2 text-center ${hi === catIdx ? 'bg-monster-100' : ''}`}>{h.label}<br /><span className="text-xs font-normal">{h.range}</span></th>
                    ))}
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
                        <td key={j} className={`border border-gray-300 px-2 py-2 text-center ${j === catIdx ? 'bg-monster-100 text-monster-700 font-bold' : 'text-gray-600'}`}>
                          {rate}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-monster-50 rounded-lg border border-monster-200">
              <p className="text-sm text-monster-800">
                <strong>Tier 3 (101-200%) is the peak rate</strong> &mdash; after that, rates decrease as a volume
                discount to reward exceptional performance. Year 1 premium rates are ~5 points higher than Year 2+.
              </p>
            </div>
          </div>
            )
          })()}

          {/* ── Year 2+ Standard Growth Fee Tiers ── */}
          {(() => {
            const catIdx = ['micro','small','medium','large','major','enterprise','elite'].indexOf(categoryInfo.category)
            const catHeaders = [
              { label: 'Micro', range: '$0-10K' },
              { label: 'Small', range: '$10-30K' },
              { label: 'Medium', range: '$30-75K' },
              { label: 'Large', range: '$75-150K' },
              { label: 'Major', range: '$150-300K' },
              { label: 'Enterprise', range: '$300-500K' },
              { label: 'Elite', range: '$500K+' },
            ]
            return (
          <div id="ref-y2-tiers" className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Year 2+ Standard Growth Fee Tiers</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Standard rates</strong> apply from Year 2 onward when Foundation and Sustaining fees also apply.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 px-2 py-2 text-left">Tier</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Growth %</th>
                    {catHeaders.map((h, hi) => (
                      <th key={h.label} className={`border border-gray-300 px-2 py-2 text-center ${hi === catIdx ? 'bg-monster-100' : ''}`}>{h.label}<br /><span className="text-xs font-normal">{h.range}</span></th>
                    ))}
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
                        <td key={j} className={`border border-gray-300 px-2 py-2 text-center ${j === catIdx ? 'bg-monster-100 text-monster-700 font-bold' : 'text-gray-600'}`}>
                          {rate}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            )
          })()}

          {/* ── Growth Fee Worked Example ── */}
          <div id="ref-growth-example" className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Growth Fee Worked Example (Monster @ {growthLabel})</h3>
            {(() => {
              const gp = growthPercent
              const uplift = baseline * gp
              // Build tier breakdown dynamically
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
                      <strong>Scenario:</strong> Monster ({formatCurrency(baseline)}/mo baseline) at {growthLabel} annual growth — end-of-year month
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
                        <tr className="bg-monster-50">
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
                            <td className="border border-gray-300 px-4 py-2 text-right text-monster-600 font-semibold">{formatCurrency(row.fee)}</td>
                          </tr>
                        ))}
                        <tr className="bg-monster-100">
                          <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={4}>Total Growth Fee (peak month)</td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-monster-700 font-bold">
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

          {/* ── Baseline Reset & Retention Brackets ── */}
          <div id="ref-retention" className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Baseline Reset &amp; Retention Brackets</h3>
            <div className="bg-monster-50 rounded-lg p-4 mb-4 border border-monster-200">
              <p className="font-semibold text-monster-800 mb-2">New Baseline Formula</p>
              <p className="font-mono text-sm bg-white p-3 rounded border border-monster-200">
                New Baseline = Old Baseline + (Avg Monthly Uplift &times; Retention %)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-monster-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Growth Achieved</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Retention %</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Monster Example ({formatCurrency(baseline)} &rarr; {formatCurrency(baseline * 1.4)})</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">New Baseline</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION_BRACKETS.map((b, i) => {
                    const exUplift = baseline * 0.4
                    const retained = exUplift * b.retentionRate
                    return (
                      <tr key={b.label} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2">{b.label}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-monster-700">{(b.retentionRate * 100).toFixed(0)}%</td>
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
          <div id="ref-sustaining" className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Sustaining Fee Calculation</h3>
            <div className="bg-monster-50 rounded-lg p-4 mb-4 border border-monster-200">
              <p className="font-semibold text-monster-800 mb-2">Sustaining Fee Formula</p>
              <p className="font-mono text-sm bg-white p-3 rounded border border-monster-200">
                Sustaining Fee = Last Year Avg Monthly Fee - New Foundation Fee (monthly)
              </p>
              <p className="text-xs text-monster-600 mt-2">If result is negative, Sustaining Fee = $0. Can only increase, never decrease.</p>
            </div>
            <p className="font-semibold text-gray-700 mb-3">Monster Example Walkthrough ({growthLabel})</p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
              <p><span className="text-gray-500">Year 1 average fee:</span> {formatCurrency(fullProjection.yearSummaries.length > 0 ? fullProjection.yearSummaries[0].avgMonthlyFee : 0)}/month</p>
              <p><span className="text-gray-500">New baseline (Year 2):</span> {fullProjection.baselineResets.length > 0 ? formatCurrency(fullProjection.baselineResets[0].newBaseline) : 'TBD (depends on growth)'}</p>
              <p><span className="text-gray-500">Foundation rate:</span> {formatPercent(categoryInfo.foundationFeeRate)}</p>
              {fullProjection.baselineResets.length > 0 && (() => {
                const reset = fullProjection.baselineResets[0]
                const newFoundationMonthly = Math.round(reset.newBaseline * 12 * categoryInfo.foundationFeeRate / 12)
                return (
                  <>
                    <p><span className="text-gray-500">Annual foundation:</span> {formatCurrency(reset.newBaseline)} &times; 12 &times; {formatPercent(categoryInfo.foundationFeeRate)} = {formatCurrency(Math.round(reset.newBaseline * 12 * categoryInfo.foundationFeeRate))}</p>
                    <p><span className="text-gray-500">Monthly foundation:</span> <span className="text-amber-600 font-semibold">{formatCurrency(newFoundationMonthly)}</span></p>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <p><span className="text-gray-500">Sustaining fee:</span> {formatCurrency(Math.round(reset.lastYearAvgFee))} - {formatCurrency(newFoundationMonthly)} = <span className="text-monster-600 font-semibold">{formatCurrency(reset.newSustainingFee)}/month</span></p>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <p><span className="text-gray-500">Year 2 minimum:</span> {formatCurrency(newFoundationMonthly)} + {formatCurrency(reset.newSustainingFee)} = <span className="text-monster-700 font-bold">{formatCurrency(newFoundationMonthly + reset.newSustainingFee)}/month guaranteed</span></p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* ── Complete Y1→Y2 Transition Example ── */}
          <div id="ref-transition" className="card p-6 bg-gradient-to-r from-monster-50 to-green-50 border-monster-200">
            <h3 className="text-lg font-semibold mb-4">Monster: Year 1 &rarr; Year 2 Transition</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-monster-200">
                <p className="font-semibold text-monster-800 mb-3">YEAR 1 (Grand Slam)</p>
                {fullProjection.yearSummaries.length > 0 && (() => {
                  const yr1 = fullProjection.yearSummaries[0]
                  return (
                    <div className="font-mono text-sm space-y-1">
                      <p>Baseline: {formatCurrency(yr1.startBaseline)}/month</p>
                      <p>Growth: {growthLabel} annual</p>
                      <p>Total Revenue: {formatCurrency(yr1.totalRevenue)}</p>
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <p className="text-amber-600">Foundation: $0 (Grand Slam)</p>
                        <p className="text-monster-600">Sustaining: $0 (Year 1)</p>
                        <p className="text-green-600">Growth Fees: {formatCurrency(yr1.growthFeeTotal)} total</p>
                        <p className="font-bold text-monster-700 mt-1">Total: {formatCurrency(yr1.totalFees)}</p>
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
                        <p className="text-monster-600">Sustaining: {formatCurrency(reset.newSustainingFee)}/mo</p>
                        {y2Summary && (
                          <>
                            <p className="text-green-600">Growth Fees: {formatCurrency(y2Summary.growthFeeTotal)} total</p>
                            <p className="font-bold text-monster-700 mt-1">Total: {formatCurrency(y2Summary.totalFees)}</p>
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
                <strong>Key insight:</strong> Year 2 fees include Foundation and Sustaining components, but growth fee rates
                drop to standard levels. The baseline only moves up partially (retention %), so there&apos;s still room to generate
                growth fees. The three-part model ensures fair, predictable compensation for both parties.
              </p>
            </div>
          </div>

          {/* ── Seasonal Factors (inline) ── */}
          <div id="ref-seasonal" className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Seasonal Adjustment Factors: Remodeling</h3>
            <div className="grid grid-cols-12 gap-1 items-end h-48">
              {seasonalFactors.map((factor, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${factor >= 1.0 ? 'bg-monster-500' : 'bg-gray-300'}`}
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
                Peak: May (1.17) &middot; Trough: Feb (0.79) &middot; Revenue projections are adjusted monthly so fees reflect real business patterns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Offer Refiner (Locked) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'offer-refiner' && (
        <div className="card p-12 text-center">
          <Lock className="h-16 w-16 mx-auto text-monster-300 mb-4" />
          <h2 className="text-xl font-bold text-monster-900 mb-2">Offer Refiner</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Available after signing your agreement. The Offer Refiner lets you fine-tune deal terms collaboratively.
          </p>
        </div>
      )}
    </div>
  )
}
