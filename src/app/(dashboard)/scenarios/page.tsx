'use client'

import { useState } from 'react'
import { Save, Download, RefreshCw, Info, TrendingUp, Calendar, Layers } from 'lucide-react'
import { INDUSTRY_LABELS, getIndustryGrowthFactor } from '@/lib/constants/industries'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { RETENTION_BRACKETS } from '@/lib/constants/feeStructure'
import RevenueChart from '@/components/charts/RevenueChart'
import Tooltip, { TOOLTIPS } from '@/components/ui/Tooltip'

// Helper functions - defined outside component to avoid hoisting issues
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

export default function ScenariosPage() {
  const [inputs, setInputs] = useState({
    businessName: '',
    industry: 'remodeling',
    monthlyRevenue: 50000,
    growthRate: 2, // monthly %
    growthRateType: 'monthly' as 'monthly' | 'annual',
    projectionMonths: 12,
    isGrandSlam: true, // Free setup (no foundation fee Year 1)
  })

  // Convert annual to monthly if needed
  const effectiveMonthlyGrowth = inputs.growthRateType === 'annual'
    ? (Math.pow(1 + inputs.growthRate / 100, 1 / 12) - 1) * 100  // Convert annual to monthly compound rate
    : inputs.growthRate

  // Get category and tier rates based on baseline
  const categoryInfo = getTierRatesForBaseline(inputs.monthlyRevenue)

  // Generate descriptive scenario title
  const getScenarioTitle = () => {
    const size = inputs.monthlyRevenue < 10000 ? 'Micro'
      : inputs.monthlyRevenue < 30000 ? 'Small'
      : inputs.monthlyRevenue < 75000 ? 'Medium'
      : inputs.monthlyRevenue < 150000 ? 'Large'
      : 'Enterprise'

    const dealType = inputs.isGrandSlam ? 'Partnership Offer' : 'Standard'
    const trialInfo = inputs.isGrandSlam ? '(No Y1 Foundation)' : '(Y1 Foundation Fee)'

    return {
      main: `${dealType}: ${size} Business`,
      sub: trialInfo,
      details: [
        `${formatCurrency(inputs.monthlyRevenue)}/mo baseline`,
        `${inputs.growthRateType === 'annual' ? inputs.growthRate + '% annual' : inputs.growthRate + '% monthly'} growth`,
        `${inputs.projectionMonths} month projection`,
      ]
    }
  }

  const scenarioTitle = getScenarioTitle()

  // Scenario type presets
  const SCENARIO_PRESETS: { name: string; desc: string; settings: Partial<typeof inputs> }[] = [
    {
      name: 'Partnership: Starter Trial',
      desc: '$0 upfront, small business, needs growth',
      settings: { monthlyRevenue: 8000, isGrandSlam: true, growthRate: 3, projectionMonths: 12, }
    },
    {
      name: 'Partnership: Growth Partner',
      desc: '$0 upfront, medium business with potential',
      settings: { monthlyRevenue: 35000, isGrandSlam: true, growthRate: 2, projectionMonths: 24, }
    },
    {
      name: 'Partnership: Enterprise',
      desc: 'Large business, performance-based, conservative reset',
      settings: { monthlyRevenue: 125000, isGrandSlam: true, growthRate: 1.5, projectionMonths: 36, }
    },
    {
      name: 'Standard: Foundation + Growth',
      desc: 'Year 1 Foundation Fee, balanced terms',
      settings: { monthlyRevenue: 50000, isGrandSlam: false, growthRate: 2, projectionMonths: 24, }
    },
    {
      name: 'Incubator: High Risk/Reward',
      desc: 'Low baseline, aggressive growth needed',
      settings: { monthlyRevenue: 5000, isGrandSlam: true, growthRate: 5, projectionMonths: 12 }
    },
  ]

  const applyPreset = (preset: typeof SCENARIO_PRESETS[0]) => {
    setInputs(prev => ({
      ...prev,
      ...preset.settings,
      growthRateType: 'monthly',
    }))
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Run projection using three-part fee model
  const projection = projectScenario({
    baselineRevenue: inputs.monthlyRevenue,
    industry: inputs.industry,
    monthlyGrowthRate: effectiveMonthlyGrowth / 100,
    startMonth: currentMonth,
    startYear: currentYear,
    projectionMonths: inputs.projectionMonths,
    isGrandSlam: inputs.isGrandSlam,
    applySeasonality: true,
  })

  // Chart data
  const chartData = projection.projections.map((p) => ({
    month: p.monthLabel.split(' ')[0],
    revenue: p.projectedRevenue,
    baseline: p.currentBaseline,
    fee: p.totalMonthlyFee,
  }))

  // Get key months for fee calculation examples
  const getExampleMonths = () => {
    const examples = []

    // First month with growth
    const firstWithGrowth = projection.projections.find(p => p.growthPercentage > 0)
    if (firstWithGrowth) {
      examples.push({ ...firstWithGrowth, label: 'First Month' })
    }

    // Reset months (Year 2+ starts)
    projection.projections
      .filter(p => p.isBaselineReset)
      .forEach(p => {
        examples.push({ ...p, label: `Year ${p.yearNumber} Start` })
      })

    // Final month (if different from above)
    const finalMonth = projection.projections[projection.projections.length - 1]
    if (finalMonth && !examples.find(e => e.monthIndex === finalMonth.monthIndex)) {
      examples.push({ ...finalMonth, label: 'Final Month' })
    }

    return examples.slice(0, 4) // Limit to 4 examples
  }

  const exampleMonths = getExampleMonths()

  const handleInputChange = (field: string, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="page-header">
          <h1 className="page-title">Scenario Modeling</h1>
          <p className="page-description">
            Three-Part Fee Model: Foundation + Sustaining + Growth
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button className="btn-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Scenario
          </button>
        </div>
      </div>

      {/* Scenario Title Banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-blue-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{scenarioTitle.main}</h2>
            <p className="text-primary-100">{scenarioTitle.sub}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {scenarioTitle.details.map((detail, i) => (
                <span key={i} className="text-sm bg-white/20 px-2 py-1 rounded">
                  {detail}
                </span>
              ))}
            </div>
          </div>
          {inputs.businessName && (
            <div className="text-right">
              <p className="text-sm text-primary-100">Prospect</p>
              <p className="text-xl font-semibold">{inputs.businessName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-gray-700">Quick Presets</span>
          <span className="text-sm text-gray-500">- Click to load a scenario template</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className="text-left p-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <p className="font-medium text-sm text-gray-900">{preset.name}</p>
              <p className="text-xs text-gray-500">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="section-title">Business Information</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="label">Business Name</label>
                <input
                  type="text"
                  value={inputs.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="input"
                  placeholder="Prospect name"
                />
              </div>
              <div className="form-group">
                <label className="label">Industry</label>
                <select
                  value={inputs.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="input"
                >
                  {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label flex items-center gap-1">
                  Current Monthly Baseline
                  <Tooltip content={TOOLTIPS.baseline} />
                </label>
                <input
                  type="number"
                  value={inputs.monthlyRevenue}
                  onChange={(e) => handleInputChange('monthlyRevenue', Number(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="label">Expected Growth Rate (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inputs.growthRate}
                    onChange={(e) => handleInputChange('growthRate', Number(e.target.value))}
                    className="input flex-1"
                    min="0"
                    max={inputs.growthRateType === 'annual' ? 100 : 20}
                    step="0.5"
                  />
                  <select
                    value={inputs.growthRateType}
                    onChange={(e) => handleInputChange('growthRateType', e.target.value)}
                    className="input w-auto"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                {inputs.growthRateType === 'annual' && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {effectiveMonthlyGrowth.toFixed(2)}% monthly compound
                  </p>
                )}
                {inputs.growthRateType === 'monthly' && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {((Math.pow(1 + inputs.growthRate / 100, 12) - 1) * 100).toFixed(1)}% annual compound
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="label flex items-center gap-1">
                  Projection Period
                  <Tooltip content={TOOLTIPS.projectionMonths} />
                </label>
                <select
                  value={inputs.projectionMonths}
                  onChange={(e) => handleInputChange('projectionMonths', Number(e.target.value))}
                  className="input"
                >
                  <option value="6">6 months</option>
                  <option value="12">1 year</option>
                  <option value="18">18 months</option>
                  <option value="24">2 years</option>
                  <option value="36">3 years</option>
                  <option value="48">4 years</option>
                  <option value="60">5 years</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label flex items-center gap-1">
                  Baseline Retention (at reset)
                  <Tooltip content={TOOLTIPS.baselineRetention} />
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-gray-700">Growth-based brackets:</p>
                  {RETENTION_BRACKETS.map((b) => (
                    <div key={b.label} className="flex justify-between text-gray-600">
                      <span>{b.label} growth</span>
                      <span className="font-medium">{(b.retentionRate * 100).toFixed(0)}% retained</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.isGrandSlam}
                    onChange={(e) => handleInputChange('isGrandSlam', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm flex items-center gap-1">
                    Partnership Offer (No Foundation Fee Year 1)
                    <Tooltip content={TOOLTIPS.grandSlam} />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Business Category Info */}
          <div className="card p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <h3 className="font-semibold text-blue-900">Business Category</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Category</span>
                <span className="font-medium text-blue-900">{categoryInfo.categoryLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 flex items-center gap-1">
                  Industry Growth
                  <Tooltip content={TOOLTIPS.industryGrowth} position="right" />
                </span>
                <span className="font-medium text-blue-900">
                  {(getIndustryGrowthFactor(inputs.industry) * 100).toFixed(0)}%/yr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 flex items-center gap-1">
                  Foundation Fee Rate
                  <Tooltip content={TOOLTIPS.foundationFee} position="right" />
                </span>
                <span className="font-medium text-blue-900">
                  {formatPercent(categoryInfo.foundationFeeRate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Annual Foundation</span>
                <span className="font-medium text-blue-900">
                  {formatCurrency(categoryInfo.foundationFeeAnnual)}
                </span>
              </div>
            </div>
          </div>

          {/* Growth Tier Structure */}
          <div className="card p-6">
            <h3 className="section-title flex items-center gap-1">
              Growth Fee Tiers
              <Tooltip content={TOOLTIPS.growthTiers} />
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Fees on growth % above baseline
            </p>
            <div className="space-y-2">
              {categoryInfo.tiers.map((tier) => (
                <div key={tier.tierNumber} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tier {tier.tierNumber}: {tier.label}
                  </span>
                  <span className="font-medium">{formatPercent(tier.feeRate)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Three-Part Fee Summary */}
          <div className="card p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-primary-900">Three-Part Fee Structure</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center justify-center gap-1">
                  Foundation
                  <Tooltip content={TOOLTIPS.foundationFee} position="bottom" />
                </p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(projection.summary.totalFoundationFees)}
                </p>
                <p className="text-xs text-gray-400">Annual commitment</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center justify-center gap-1">
                  Sustaining
                  <Tooltip content={TOOLTIPS.sustainingFee} position="bottom" />
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(projection.summary.totalSustainingFees)}
                </p>
                <p className="text-xs text-gray-400">Income protection</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center justify-center gap-1">
                  Growth
                  <Tooltip content={TOOLTIPS.growthFee} position="bottom" />
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(projection.summary.totalGrowthFees)}
                </p>
                <p className="text-xs text-gray-400">Performance fees</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold">
                {formatCurrency(projection.summary.totalProjectedRevenue)}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500">Total Fees</p>
              <p className="text-lg font-bold text-primary-700">
                {formatCurrency(projection.summary.totalFees)}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500">Avg Monthly</p>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(projection.summary.avgMonthlyFee)}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                Effective Rate
                <Tooltip content={TOOLTIPS.effectiveRate} position="bottom" />
              </p>
              <p className="text-lg font-bold">
                {projection.summary.avgEffectiveRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Year Summaries */}
          {projection.yearSummaries.length > 0 && (
            <div className="card">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold">Year-by-Year Summary</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th className="text-right">Baseline</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Foundation</th>
                      <th className="text-right">Sustaining</th>
                      <th className="text-right">Growth</th>
                      <th className="text-right">Total Fees</th>
                      <th className="text-right">Avg/Mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.yearSummaries.map((year) => (
                      <tr key={year.yearNumber}>
                        <td className="font-medium">Year {year.yearNumber}</td>
                        <td className="text-right text-gray-500">
                          {formatCurrency(year.startBaseline)}
                        </td>
                        <td className="text-right">
                          {formatCurrency(year.totalRevenue)}
                        </td>
                        <td className="text-right text-amber-600">
                          {formatCurrency(year.foundationFeeAnnual)}
                        </td>
                        <td className="text-right text-purple-600">
                          {year.sustainingFeeTotal > 0 ? formatCurrency(year.sustainingFeeTotal) : '-'}
                        </td>
                        <td className="text-right text-green-600">
                          {formatCurrency(year.growthFeeTotal)}
                        </td>
                        <td className="text-right font-semibold">
                          {formatCurrency(year.totalFees)}
                        </td>
                        <td className="text-right text-primary-600">
                          {formatCurrency(year.avgMonthlyFee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Baseline Resets */}
          {projection.baselineResets.length > 0 && (
            <div className="card p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">
                  Baseline Resets & Sustaining Fees
                </h3>
              </div>
              <div className="space-y-3">
                {projection.baselineResets.map((reset, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-purple-900">
                        Year {reset.yearNumber} Start
                      </span>
                      <span className="text-xs text-purple-600">({reset.monthLabel})</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-purple-600 text-xs">Previous Baseline</p>
                        <p className="font-medium">{formatCurrency(reset.oldBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">New Baseline</p>
                        <p className="font-medium text-purple-800">{formatCurrency(reset.newBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Last Year Avg Fee</p>
                        <p className="font-medium">{formatCurrency(reset.lastYearAvgFee)}</p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Sustaining Fee</p>
                        <p className="font-semibold text-purple-800">
                          {formatCurrency(reset.newSustainingFee)}/mo
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-600 mt-3">
                Sustaining Fee = Last Year Avg Fee - New Foundation (monthly). Ensures you never earn less than last year.
              </p>
            </div>
          )}

          {/* Baseline Journey */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Starting Baseline</p>
                <p className="text-xl font-bold">{formatCurrency(projection.summary.initialBaseline)}</p>
              </div>
              <div className="text-center px-4">
                <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{inputs.projectionMonths} months</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ending Baseline</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(projection.summary.finalBaseline)}</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card p-6">
            <h3 className="section-title">Revenue Projection</h3>
            <RevenueChart data={chartData} showBaseline showFee />
          </div>

          {/* Projection Table */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Monthly Breakdown</h3>
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
                    <th className="text-right">Cumul.</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.projections.map((row) => (
                    <tr
                      key={row.monthLabel}
                      className={row.isBaselineReset ? 'bg-purple-50' : row.yearNumber % 2 === 0 ? 'bg-gray-25' : ''}
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
                        {formatGrowthPercentage(row.growthPercentage)}
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
                      <td className="text-right text-primary-600 font-medium">
                        {formatCurrency(row.cumulativeTotalFees)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Calculation Examples */}
          {exampleMonths.length > 0 && (
            <div className="card p-6">
              <h3 className="section-title">Fee Calculation Examples</h3>
              <div className="space-y-6">
                {exampleMonths.map((example, idx) => (
                  <div key={idx} className={`${idx > 0 ? 'pt-6 border-t border-gray-200' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-900">{example.label}</span>
                      <span className="text-sm text-gray-500">({example.monthLabel})</span>
                      {example.yearNumber > 1 && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Year {example.yearNumber}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Baseline</p>
                        <p className="font-medium">{formatCurrency(example.currentBaseline)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-medium">{formatCurrency(example.projectedRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Uplift</p>
                        <p className="font-medium text-green-600">{formatCurrency(example.uplift)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Growth</p>
                        <p className="font-medium text-blue-600">{formatGrowthPercentage(example.growthPercentage)}</p>
                      </div>
                    </div>

                    {example.tierBreakdown.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">GROWTH FEE BY TIER</p>
                        <div className="space-y-1">
                          {example.tierBreakdown.map((tier) => (
                            <div key={tier.tierNumber} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Tier {tier.tierNumber} ({tier.tierLabel})
                              </span>
                              <span>
                                {formatCurrency(tier.upliftInTier)} × {formatPercent(tier.feeRate)} =
                                <span className="font-medium ml-1">{formatCurrency(tier.feeFromTier)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                          {example.foundationFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-amber-700">Foundation Fee (monthly)</span>
                              <span className="font-medium text-amber-600">
                                {formatCurrency(example.foundationFee)}
                              </span>
                            </div>
                          )}
                          {example.sustainingFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-700">Sustaining Fee</span>
                              <span className="font-medium text-purple-600">
                                {formatCurrency(example.sustainingFee)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700">Growth Fee</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(example.growthFee)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-300">
                          <span className="font-bold">Total Monthly Fee</span>
                          <span className="font-bold text-primary-700">
                            {formatCurrency(example.totalMonthlyFee)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reference Section - All Equations & Charts */}
      <div className="mt-12 space-y-8">
        <div className="border-t border-gray-300 pt-8">
          <h2 className="text-2xl font-bold mb-6">How The Math Works</h2>
          <p className="text-gray-600 mb-8">
            Complete reference for the Three-Part Fee Model equations and lookup tables.
          </p>
        </div>

        {/* Three-Part Fee Overview */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">The Three-Part Fee Model</h3>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm mb-4">
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
              <p className="text-amber-700">Annual minimum based on business size. Guarantees baseline income.</p>
              <p className="mt-2 font-mono text-xs">= Baseline × Rate ÷ 12</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-800">Sustaining Fee</p>
              <p className="text-purple-700">Year 2+ protection. Ensures you never earn less than last year.</p>
              <p className="mt-2 font-mono text-xs">= Last Year Avg - Foundation</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-800">Growth Fee</p>
              <p className="text-green-700">Performance fees on revenue above baseline. Tiered rates.</p>
              <p className="mt-2 font-mono text-xs">= Σ(Uplift × Tier Rate)</p>
            </div>
          </div>
        </div>

        {/* Core Equations */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Core Equations</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">Uplift (Growth Amount)</p>
              <p className="font-mono text-sm bg-white p-2 rounded border">
                Uplift = Current Revenue - Baseline
              </p>
              <p className="text-xs text-gray-500 mt-1">Example: $70,000 - $50,000 = $20,000 uplift</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">Growth Percentage</p>
              <p className="font-mono text-sm bg-white p-2 rounded border">
                Growth % = (Uplift ÷ Baseline) × 100
              </p>
              <p className="text-xs text-gray-500 mt-1">Example: ($20,000 ÷ $50,000) × 100 = 40% growth</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">Effective Rate</p>
              <p className="font-mono text-sm bg-white p-2 rounded border">
                Effective Rate = (Total Fees ÷ Total Revenue) × 100
              </p>
              <p className="text-xs text-gray-500 mt-1">Example: ($36,000 ÷ $840,000) × 100 = 4.3% effective rate</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">Monthly to Annual Growth Conversion</p>
              <p className="font-mono text-sm bg-white p-2 rounded border">
                Annual % = ((1 + Monthly%)^12 - 1) × 100
              </p>
              <p className="text-xs text-gray-500 mt-1">Example: 2% monthly = ((1.02)^12 - 1) × 100 = 26.8% annual</p>
            </div>
          </div>
        </div>

        {/* Baseline Reset & Retention */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Baseline Reset (Year 2+)</h3>
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <p className="font-semibold text-purple-800 mb-2">New Baseline Formula</p>
            <p className="font-mono text-sm bg-white p-3 rounded border border-purple-200">
              New Baseline = Old Baseline + (Growth × Retention %)
            </p>
          </div>

          <p className="font-semibold text-gray-700 mb-3">Retention Brackets (Based on Performance)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Growth Achieved</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Retention %</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Example ($50K→$70K)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">New Baseline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">0-25%</td>
                  <td className="border border-gray-300 px-4 py-2">20%</td>
                  <td className="border border-gray-300 px-4 py-2">$20K × 20% = $4K</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">$54,000</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">26-50%</td>
                  <td className="border border-gray-300 px-4 py-2">30%</td>
                  <td className="border border-gray-300 px-4 py-2">$20K × 30% = $6K</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">$56,000</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">51-75%</td>
                  <td className="border border-gray-300 px-4 py-2">40%</td>
                  <td className="border border-gray-300 px-4 py-2">$20K × 40% = $8K</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">$58,000</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">76-100%</td>
                  <td className="border border-gray-300 px-4 py-2">50%</td>
                  <td className="border border-gray-300 px-4 py-2">$20K × 50% = $10K</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">$60,000</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">100%+</td>
                  <td className="border border-gray-300 px-4 py-2">60%</td>
                  <td className="border border-gray-300 px-4 py-2">$20K × 60% = $12K</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">$62,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sustaining Fee */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Sustaining Fee Calculation</h3>
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <p className="font-semibold text-purple-800 mb-2">Sustaining Fee Formula</p>
            <p className="font-mono text-sm bg-white p-3 rounded border border-purple-200">
              Sustaining Fee = Last Year Avg Monthly Fee - New Foundation Fee (monthly)
            </p>
            <p className="text-xs text-purple-600 mt-2">If result is negative, Sustaining Fee = $0</p>
          </div>

          <p className="font-semibold text-gray-700 mb-3">Example Walkthrough</p>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
            <p><span className="text-gray-500">Year 1 average fee:</span> $3,000/month</p>
            <p><span className="text-gray-500">New baseline (Year 2):</span> $57,000</p>
            <p><span className="text-gray-500">Foundation rate:</span> 2.5%</p>
            <p><span className="text-gray-500">Annual foundation:</span> $57,000 × 12 × 2.5% = $17,100</p>
            <p><span className="text-gray-500">Monthly foundation:</span> $17,100 ÷ 12 = <span className="text-amber-600 font-semibold">$1,425</span></p>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <p><span className="text-gray-500">Sustaining fee:</span> $3,000 - $1,425 = <span className="text-purple-600 font-semibold">$1,575/month</span></p>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <p><span className="text-gray-500">Year 2 minimum:</span> $1,425 + $1,575 = <span className="text-primary-600 font-bold">$3,000/month guaranteed</span></p>
            </div>
          </div>
        </div>

        {/* Foundation Fee Rates */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Foundation Fee Rates by Business Size</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-amber-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Monthly Baseline</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Annual Revenue</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Foundation Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Example Annual Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Micro</td>
                  <td className="border border-gray-300 px-4 py-2">$0 - $10K</td>
                  <td className="border border-gray-300 px-4 py-2">$0 - $120K</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">3.0%</td>
                  <td className="border border-gray-300 px-4 py-2">$3,600 ($5K baseline)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Small</td>
                  <td className="border border-gray-300 px-4 py-2">$10K - $30K</td>
                  <td className="border border-gray-300 px-4 py-2">$120K - $360K</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">2.5%</td>
                  <td className="border border-gray-300 px-4 py-2">$6,000 ($20K baseline)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Medium</td>
                  <td className="border border-gray-300 px-4 py-2">$30K - $75K</td>
                  <td className="border border-gray-300 px-4 py-2">$360K - $900K</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">2.0%</td>
                  <td className="border border-gray-300 px-4 py-2">$12,000 ($50K baseline)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Large</td>
                  <td className="border border-gray-300 px-4 py-2">$75K - $150K</td>
                  <td className="border border-gray-300 px-4 py-2">$900K - $1.8M</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">1.5%</td>
                  <td className="border border-gray-300 px-4 py-2">$18,000 ($100K baseline)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Major</td>
                  <td className="border border-gray-300 px-4 py-2">$150K - $300K</td>
                  <td className="border border-gray-300 px-4 py-2">$1.8M - $3.6M</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">1.25%</td>
                  <td className="border border-gray-300 px-4 py-2">$30,000 ($200K baseline)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Enterprise</td>
                  <td className="border border-gray-300 px-4 py-2">$300K - $500K</td>
                  <td className="border border-gray-300 px-4 py-2">$3.6M - $6M</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">1.0%</td>
                  <td className="border border-gray-300 px-4 py-2">$48,000 ($400K baseline)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">Elite</td>
                  <td className="border border-gray-300 px-4 py-2">$500K+</td>
                  <td className="border border-gray-300 px-4 py-2">$6M+</td>
                  <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">0.75%</td>
                  <td className="border border-gray-300 px-4 py-2">$54,000 ($600K baseline)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Fee Tiers - Year 1 Premium Rates */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Year 1 Premium Growth Fee Tiers</h3>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Year 1 rates are higher</strong> to compensate for no Foundation or Sustaining fees in the Partnership Offer.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-amber-50">
                  <th className="border border-gray-300 px-2 py-2 text-left">Tier</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Growth %</th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-red-50">Micro<br/><span className="text-xs font-normal">$0-10K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-orange-50">Small<br/><span className="text-xs font-normal">$10-30K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-yellow-50">Medium<br/><span className="text-xs font-normal">$30-75K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Large<br/><span className="text-xs font-normal">$75-150K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Major<br/><span className="text-xs font-normal">$150-300K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Enterprise<br/><span className="text-xs font-normal">$300-500K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-blue-50">Elite<br/><span className="text-xs font-normal">$500K+</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold">1</td>
                  <td className="border border-gray-300 px-2 py-2">0-50%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-semibold">25%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600 font-semibold">20%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700 font-semibold">15%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">12%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">9%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">6%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">5%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 font-semibold">2</td>
                  <td className="border border-gray-300 px-2 py-2">51-100%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-semibold">30%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600 font-semibold">25%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700 font-semibold">19%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">15%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">12%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">8%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">6%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold bg-amber-100">3</td>
                  <td className="border border-gray-300 px-2 py-2 bg-amber-100">101-200%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-700 font-bold bg-red-100">35%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-700 font-bold bg-orange-100">30%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-800 font-bold bg-yellow-100">23%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-700 font-semibold bg-green-100">18%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-700 font-semibold bg-green-100">14%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-700 font-semibold bg-green-100">10%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-700 font-semibold bg-blue-100">7%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 font-semibold">4</td>
                  <td className="border border-gray-300 px-2 py-2">201-300%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-semibold">33%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600 font-semibold">27%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700">21%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">16%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">12%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">9%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">6.5%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold">5-8</td>
                  <td className="border border-gray-300 px-2 py-2">301%+</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-500" colSpan={7}>Rates decrease progressively (volume discount)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Year 1 premium rates</strong> are ~5 percentage points higher than Year 2+ to compensate for
              no Foundation or Sustaining fees during the Partnership Offer introductory year.
            </p>
          </div>
        </div>

        {/* Growth Fee Tiers - Year 2+ Standard Rates */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Year 2+ Standard Growth Fee Tiers</h3>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Standard rates</strong> apply from Year 2 onward when Foundation and Sustaining fees also apply.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="border border-gray-300 px-2 py-2 text-left">Tier</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Growth %</th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-red-50">Micro<br/><span className="text-xs font-normal">$0-10K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-orange-50">Small<br/><span className="text-xs font-normal">$10-30K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-yellow-50">Medium<br/><span className="text-xs font-normal">$30-75K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Large<br/><span className="text-xs font-normal">$75-150K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Major<br/><span className="text-xs font-normal">$150-300K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Enterprise<br/><span className="text-xs font-normal">$300-500K</span></th>
                  <th className="border border-gray-300 px-2 py-2 text-center bg-blue-50">Elite<br/><span className="text-xs font-normal">$500K+</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold">1</td>
                  <td className="border border-gray-300 px-2 py-2">0-50%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-semibold">20%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600 font-semibold">15%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700 font-semibold">10%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">8%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">6%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">4%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">3%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 font-semibold">2</td>
                  <td className="border border-gray-300 px-2 py-2">51-100%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-semibold">25%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600 font-semibold">20%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700 font-semibold">14%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">11%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">8%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">5.5%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">4%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold bg-green-100">3</td>
                  <td className="border border-gray-300 px-2 py-2 bg-green-100">101-200%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-700 font-bold bg-red-100">30%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-700 font-bold bg-orange-100">25%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-800 font-bold bg-yellow-100">18%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-700 font-semibold bg-green-100">14%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-700 font-semibold bg-green-100">10%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-700 font-semibold bg-green-100">7%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-700 font-semibold bg-blue-100">5%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 font-semibold">4</td>
                  <td className="border border-gray-300 px-2 py-2">201-300%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-semibold">28%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600 font-semibold">22%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700">16%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">12%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">9%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">6%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">4.5%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold">5</td>
                  <td className="border border-gray-300 px-2 py-2">301-500%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600">25%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600">20%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700">14%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">10%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">8%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">5%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">4%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 font-semibold">6</td>
                  <td className="border border-gray-300 px-2 py-2">501-750%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600">22%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600">18%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700">12%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">9%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">7%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">4.5%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">3.5%</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2 font-semibold">7</td>
                  <td className="border border-gray-300 px-2 py-2">751-1000%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600">20%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600">15%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700">10%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">8%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">6%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">4%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">3%</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 font-semibold">8</td>
                  <td className="border border-gray-300 px-2 py-2">1001%+</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600">18%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-orange-600">12%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-700">8%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">7%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">5%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-600">3.5%</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-600">2.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Tier 3 (101-200% growth) is the PEAK rate</strong> - this is where we make the most per dollar of growth.
              After that, rates decrease as a volume discount to reward exceptional performance.
            </p>
          </div>
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Why Micro/Small pay more:</strong> A $5K micro business growing 50% = $2.5K uplift.
              At 20% = $500/mo fee. At 10% = only $250/mo - not enough to cover a year of marketing work.
              Higher rates on small accounts ensure profitability.
            </p>
          </div>
        </div>

        {/* Growth Fee Calculation Example */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Growth Fee Calculation Example</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Scenario:</strong> Medium business ($50K baseline) with 75% growth
            </p>
            <div className="font-mono text-sm space-y-2">
              <p><span className="text-gray-500">Baseline:</span> $50,000</p>
              <p><span className="text-gray-500">Current Revenue:</span> $87,500</p>
              <p><span className="text-gray-500">Uplift:</span> $37,500 (75% growth)</p>
            </div>
          </div>

          <p className="font-semibold text-gray-700 mb-3">Step-by-Step Tier Calculation</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Tier</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Growth Range</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">$ in Tier</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Tier 1</td>
                  <td className="border border-gray-300 px-4 py-2">0-50% ($0-$25K)</td>
                  <td className="border border-gray-300 px-4 py-2">$25,000</td>
                  <td className="border border-gray-300 px-4 py-2">10%</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">$2,500</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Tier 2</td>
                  <td className="border border-gray-300 px-4 py-2">51-75% ($25K-$37.5K)</td>
                  <td className="border border-gray-300 px-4 py-2">$12,500</td>
                  <td className="border border-gray-300 px-4 py-2">14%</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">$1,750</td>
                </tr>
                <tr className="bg-green-100">
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={4}>Total Growth Fee</td>
                  <td className="border border-gray-300 px-4 py-2 text-green-700 font-bold">$4,250</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Industry Growth Factors */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Industry Growth Factors</h3>
          <p className="text-sm text-gray-600 mb-4">
            Used for baseline adjustments. Higher growth industries may see faster baseline increases.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-2">High Growth (15%+)</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Esports: 20%</li>
                <li>• Sim Racing: 18%</li>
                <li>• Personal Training: 16%</li>
                <li>• E-commerce: 15%</li>
                <li>• Gaming Center: 15%</li>
                <li>• Fitness: 15%</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Medium Growth (10-14%)</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Web Development: 14%</li>
                <li>• Gym: 14%</li>
                <li>• Remodeling: 12%</li>
                <li>• Marketing Agency: 12%</li>
                <li>• Mental Health: 12%</li>
                <li>• Pet Services: 12%</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Stable Growth (5-9%)</p>
              <ul className="space-y-1 text-gray-600">
                <li>• HVAC: 10%</li>
                <li>• Real Estate: 10%</li>
                <li>• Landscaping: 9%</li>
                <li>• Retail: 8%</li>
                <li>• Restaurant: 6%</li>
                <li>• Legal: 6%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Complete Year 1 → Year 2 Example */}
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">Complete Example: Year 1 → Year 2 Transition</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="font-semibold text-blue-800 mb-3">YEAR 1 (Partnership Offer)</p>
              <div className="font-mono text-sm space-y-1">
                <p>Baseline: $50,000/month</p>
                <p>Avg Revenue: $65,000/month</p>
                <p>Avg Uplift: $15,000 (30% growth)</p>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <p className="text-amber-600">Foundation: $0 (Partnership Offer)</p>
                  <p className="text-purple-600">Sustaining: $0 (Year 1)</p>
                  <p className="text-green-600">Growth Fee: ~$900/mo</p>
                  <p className="font-bold text-primary-700 mt-1">Total: ~$900/month</p>
                  <p className="text-gray-500">Annual: ~$10,800</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="font-semibold text-purple-800 mb-3">YEAR 2 (After Reset)</p>
              <div className="font-mono text-sm space-y-1">
                <p>Old Baseline: $50,000</p>
                <p>Growth: 30% → 30% retention</p>
                <p>New Baseline: $50K + ($15K × 30%) = <span className="font-bold">$54,500</span></p>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <p className="text-amber-600">Foundation: $1,090/mo (2% annual)</p>
                  <p className="text-purple-600">Sustaining: $0 (Foundation {'>'} Y1 avg)</p>
                  <p className="text-green-600">Growth Fee: ~$630/mo</p>
                  <p className="font-bold text-primary-700 mt-1">Total: ~$1,720/month</p>
                  <p className="text-gray-500">Annual: ~$20,640</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Key insight:</strong> Year 2 fees are higher due to Foundation Fee kicking in,
              but the client's baseline only increased $4,500 (not the full $15K growth),
              so they still have room to generate growth fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
