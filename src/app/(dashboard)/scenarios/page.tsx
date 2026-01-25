'use client'

import { useState } from 'react'
import { Save, Download, RefreshCw, Info, TrendingUp, Calendar, Layers } from 'lucide-react'
import { INDUSTRY_LABELS, getIndustryGrowthFactor } from '@/lib/constants/industries'
import { projectScenario } from '@/lib/calculations/scenarioProjector'
import { getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { RETENTION_RATES, type RetentionOption } from '@/lib/constants/feeStructure'
import RevenueChart from '@/components/charts/RevenueChart'

export default function ScenariosPage() {
  const [inputs, setInputs] = useState({
    businessName: '',
    industry: 'remodeling',
    monthlyRevenue: 50000,
    growthRate: 2, // monthly %
    projectionMonths: 12,
    isGrandSlam: true, // Free setup (no foundation fee Year 1)
    retentionOption: 'moderate' as RetentionOption,
  })

  // Get category and tier rates based on baseline
  const categoryInfo = getTierRatesForBaseline(inputs.monthlyRevenue)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Run projection using three-part fee model
  const projection = projectScenario({
    baselineRevenue: inputs.monthlyRevenue,
    industry: inputs.industry,
    monthlyGrowthRate: inputs.growthRate / 100,
    startMonth: currentMonth,
    startYear: currentYear,
    projectionMonths: inputs.projectionMonths,
    isGrandSlam: inputs.isGrandSlam,
    applySeasonality: true,
    retentionOption: inputs.retentionOption,
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

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
                <label className="label">Current Monthly Baseline</label>
                <input
                  type="number"
                  value={inputs.monthlyRevenue}
                  onChange={(e) => handleInputChange('monthlyRevenue', Number(e.target.value))}
                  className="input"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="label">Expected Monthly Growth (%)</label>
                <input
                  type="number"
                  value={inputs.growthRate}
                  onChange={(e) => handleInputChange('growthRate', Number(e.target.value))}
                  className="input"
                  min="0"
                  max="20"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label className="label">Projection Period</label>
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
                <label className="label">Baseline Retention (at reset)</label>
                <select
                  value={inputs.retentionOption}
                  onChange={(e) => handleInputChange('retentionOption', e.target.value)}
                  className="input"
                >
                  <option value="conservative">Conservative (25%)</option>
                  <option value="moderate">Moderate (35%) - Default</option>
                  <option value="aggressive">Aggressive (50%)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.isGrandSlam}
                    onChange={(e) => handleInputChange('isGrandSlam', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Grand Slam (No Foundation Fee Year 1)</span>
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
                <span className="text-blue-700">Industry Growth</span>
                <span className="font-medium text-blue-900">
                  {((getIndustryGrowthFactor(inputs.industry) - 1) * 100).toFixed(0)}%/yr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Foundation Fee Rate</span>
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
            <h3 className="section-title">Growth Fee Tiers</h3>
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Foundation</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(projection.summary.totalFoundationFees)}
                </p>
                <p className="text-xs text-gray-400">Annual commitment</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Sustaining</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(projection.summary.totalSustainingFees)}
                </p>
                <p className="text-xs text-gray-400">Income protection</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Growth</p>
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
              <p className="text-xs text-gray-500">Effective Rate</p>
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
    </div>
  )
}
