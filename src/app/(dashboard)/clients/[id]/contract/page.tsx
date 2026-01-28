'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Info } from 'lucide-react'
import { calculateFee, getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { INDUSTRY_LABELS, getIndustryGrowthFactor } from '@/lib/constants/industries'
import { BUSINESS_SIZE_CATEGORIES } from '@/lib/constants/feeStructure'

export default function ContractConfigPage() {
  const params = useParams()
  const router = useRouter()

  const [config, setConfig] = useState({
    baselineMethod: 'trailing12' as 'trailing12' | 'trailing6' | 'custom',
    customBaseline: 50000,
    industryGrowthFactor: 0.12,
    maturityBuffer: 0.05,
    monthlyCap: null as number | null,
    annualCap: null as number | null,
    trialEndDate: '',
    isGrandSlam: true, // No foundation fee for Partnership offers
  })

  const [previewRevenue, setPreviewRevenue] = useState(75000)
  const [isLoading, setIsLoading] = useState(false)

  // Get the baseline for calculations
  const baseline = config.baselineMethod === 'custom' ? config.customBaseline : 50000

  // Get category and tier rates based on baseline
  const categoryInfo = getTierRatesForBaseline(baseline)

  // Calculate preview fee
  const previewFee = calculateFee(baseline, previewRevenue, {
    monthlyCap: config.monthlyCap,
    annualCap: config.annualCap,
    includeFoundationFee: !config.isGrandSlam,
    isBaselineRecalculation: false,
  })

  const handleConfigChange = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // TODO: Save to Supabase
      console.log('Saving contract config:', config)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push(`/clients/${params.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Contract Configuration</h1>
            <p className="text-sm text-gray-500">Configure baseline, caps, and fee structure</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isLoading} className="btn-primary">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Baseline Settings */}
      <div className="card p-6">
        <h3 className="section-title">Baseline Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Baseline Method</label>
            <select
              value={config.baselineMethod}
              onChange={(e) => handleConfigChange('baselineMethod', e.target.value)}
              className="input"
            >
              <option value="trailing12">Trailing 12 Months</option>
              <option value="trailing6">Trailing 6 Months</option>
              <option value="custom">Custom Amount</option>
            </select>
          </div>

          {config.baselineMethod === 'custom' && (
            <div className="form-group">
              <label className="label">Custom Baseline ($)</label>
              <input
                type="number"
                value={config.customBaseline}
                onChange={(e) => handleConfigChange('customBaseline', Number(e.target.value))}
                className="input"
                min="0"
              />
            </div>
          )}

          <div className="form-group">
            <label className="label">Industry Growth Factor (%)</label>
            <input
              type="number"
              value={(config.industryGrowthFactor * 100).toFixed(1)}
              onChange={(e) =>
                handleConfigChange('industryGrowthFactor', Number(e.target.value) / 100)
              }
              className="input"
              step="0.5"
              min="0"
              max="50"
            />
          </div>

          <div className="form-group">
            <label className="label">Maturity Buffer (%)</label>
            <input
              type="number"
              value={(config.maturityBuffer * 100).toFixed(1)}
              onChange={(e) =>
                handleConfigChange('maturityBuffer', Number(e.target.value) / 100)
              }
              className="input"
              step="0.5"
              min="0"
              max="30"
            />
          </div>
        </div>
      </div>

      {/* Business Category & Tier Rates */}
      <div className="card p-6">
        <div className="flex items-start gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">Automatic Fee Structure</h3>
            <p className="text-sm text-gray-500">
              Fee rates are determined automatically based on the business size category.
              The rates shown below apply to this client based on their baseline revenue.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-700 font-medium">Business Category</span>
            <span className="text-blue-900 font-bold">{categoryInfo.categoryLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-medium">Baseline Range</span>
            <span className="text-blue-900">
              {formatCurrency(BUSINESS_SIZE_CATEGORIES[categoryInfo.category].minBaseline)} -
              {BUSINESS_SIZE_CATEGORIES[categoryInfo.category].maxBaseline
                ? formatCurrency(BUSINESS_SIZE_CATEGORIES[categoryInfo.category].maxBaseline!)
                : 'No limit'}
            </span>
          </div>
        </div>

        <h4 className="text-sm font-medium text-gray-700 mb-3">Growth Tier Performance Rates</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoryInfo.tiers.map((tier) => (
            <div key={tier.tierNumber} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Tier {tier.tierNumber}</p>
              <p className="text-xs text-gray-600 mb-1">{tier.label}</p>
              <p className="text-lg font-bold text-primary-600">{formatPercent(tier.feeRate)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partnership Offer / Foundation Fee */}
      <div className="card p-6">
        <h3 className="section-title">Fee Type</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.isGrandSlam}
            onChange={(e) => handleConfigChange('isGrandSlam', e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 mt-0.5"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Partnership Offer (No Foundation Fee)
            </span>
            <p className="text-xs text-gray-500 mt-1">
              When enabled, only performance fees apply. Foundation fees ({formatPercent(categoryInfo.foundationFeeRate)})
              are waived. Uncheck if charging upfront setup fees.
            </p>
          </div>
        </label>
      </div>

      {/* Caps */}
      <div className="card p-6">
        <h3 className="section-title">Fee Caps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Monthly Cap ($)</label>
            <input
              type="number"
              value={config.monthlyCap || ''}
              onChange={(e) =>
                handleConfigChange(
                  'monthlyCap',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="input"
              placeholder="No monthly cap"
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="label">Annual Cap ($)</label>
            <input
              type="number"
              value={config.annualCap || ''}
              onChange={(e) =>
                handleConfigChange(
                  'annualCap',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="input"
              placeholder="No annual cap"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Trial */}
      <div className="card p-6">
        <h3 className="section-title">Trial Period</h3>
        <div className="form-group max-w-xs">
          <label className="label">Trial End Date</label>
          <input
            type="date"
            value={config.trialEndDate}
            onChange={(e) => handleConfigChange('trialEndDate', e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="card p-6 bg-primary-50 border-primary-200">
        <h3 className="section-title text-primary-900">Fee Calculator Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="form-group mb-0">
            <label className="label text-primary-700">Test Baseline</label>
            <input
              type="number"
              value={baseline}
              disabled={config.baselineMethod !== 'custom'}
              className="input w-full bg-white"
              min="0"
            />
          </div>
          <div className="form-group mb-0">
            <label className="label text-primary-700">Test Revenue</label>
            <input
              type="number"
              value={previewRevenue}
              onChange={(e) => setPreviewRevenue(Number(e.target.value))}
              className="input w-full"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-primary-700">Growth</p>
            <p className="text-xl font-bold text-primary-900">
              {formatGrowthPercentage(previewFee.growthPercentage)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Uplift</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(previewFee.upliftAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Performance Fee</p>
            <p className="text-xl font-bold text-primary-900">
              {formatCurrency(previewFee.performanceFee)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Effective Rate</p>
            <p className="text-xl font-bold text-primary-900">
              {previewFee.effectiveRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Tier breakdown */}
        {previewFee.tierBreakdown.length > 0 && (
          <div className="pt-4 border-t border-primary-200">
            <p className="text-sm font-medium text-primary-900 mb-3">Tier Breakdown:</p>
            <div className="space-y-2">
              {previewFee.tierBreakdown.map((tier) => (
                <div key={tier.tierNumber} className="flex justify-between text-sm text-primary-700">
                  <span>Tier {tier.tierNumber} ({tier.tierLabel})</span>
                  <span>
                    {formatCurrency(tier.upliftInTier)} × {formatPercent(tier.feeRate)} = {formatCurrency(tier.feeFromTier)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
