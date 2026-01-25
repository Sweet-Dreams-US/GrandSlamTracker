'use client'

import { useState, useEffect } from 'react'
import { calculateFee, getTierRatesForBaseline, formatGrowthPercentage } from '@/lib/calculations/feeCalculator'
import { calculateBaseline, type TrailingRevenueData } from '@/lib/calculations/baselineCalculator'

interface RevenueEntryFormProps {
  clientId: string
  year: number
  month: number
  industry: string
  businessAgeYears: number | null
  trailingRevenue: TrailingRevenueData[]
  monthlyCap?: number | null
  annualCap?: number | null
  yearToDateFees?: number
  isGrandSlam?: boolean
  initialData?: {
    gross_revenue: number
    attributed_revenue: number
    organic_revenue: number
    referral_revenue: number
    unknown_revenue: number
    job_count?: number
    notes?: string
  }
  onSubmit: (data: {
    gross_revenue: number
    attributed_revenue: number
    organic_revenue: number
    referral_revenue: number
    unknown_revenue: number
    job_count: number | null
    calculated_baseline: number
    calculated_uplift: number
    calculated_fee: number
    growth_percentage: number
    fee_breakdown: object
    notes: string
    verified: boolean
  }) => Promise<void>
  isLoading?: boolean
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function RevenueEntryForm({
  clientId,
  year,
  month,
  industry,
  businessAgeYears,
  trailingRevenue,
  monthlyCap,
  annualCap,
  yearToDateFees = 0,
  isGrandSlam = true,
  initialData,
  onSubmit,
  isLoading,
}: RevenueEntryFormProps) {
  const [formData, setFormData] = useState({
    gross_revenue: initialData?.gross_revenue || 0,
    attributed_revenue: initialData?.attributed_revenue || 0,
    organic_revenue: initialData?.organic_revenue || 0,
    referral_revenue: initialData?.referral_revenue || 0,
    unknown_revenue: initialData?.unknown_revenue || 0,
    job_count: initialData?.job_count || 0,
    notes: initialData?.notes || '',
    verified: false,
  })

  const [calculations, setCalculations] = useState({
    baseline: 0,
    uplift: 0,
    growthPercentage: 0,
    fee: 0,
    feeBreakdown: {} as object,
    category: '',
    categoryLabel: '',
  })

  // Recalculate when form data changes
  useEffect(() => {
    const baselineResult = calculateBaseline(
      trailingRevenue,
      industry,
      month,
      businessAgeYears
    )

    // Use new fee calculation with growth percentage tiers
    const feeResult = calculateFee(baselineResult.finalBaseline, formData.gross_revenue, {
      monthlyCap,
      annualCap,
      yearToDateFees,
      includeFoundationFee: !isGrandSlam,
      isBaselineRecalculation: false,
    })

    setCalculations({
      baseline: baselineResult.finalBaseline,
      uplift: feeResult.upliftAmount,
      growthPercentage: feeResult.growthPercentage,
      fee: feeResult.finalFee,
      feeBreakdown: feeResult,
      category: feeResult.category,
      categoryLabel: feeResult.categoryLabel,
    })
  }, [formData.gross_revenue, trailingRevenue, industry, month, businessAgeYears, monthlyCap, annualCap, yearToDateFees, isGrandSlam])

  // Auto-calculate unknown revenue
  useEffect(() => {
    const known = formData.attributed_revenue + formData.organic_revenue + formData.referral_revenue
    const unknown = Math.max(0, formData.gross_revenue - known)
    if (unknown !== formData.unknown_revenue) {
      setFormData(prev => ({ ...prev, unknown_revenue: unknown }))
    }
  }, [formData.gross_revenue, formData.attributed_revenue, formData.organic_revenue, formData.referral_revenue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      gross_revenue: formData.gross_revenue,
      attributed_revenue: formData.attributed_revenue,
      organic_revenue: formData.organic_revenue,
      referral_revenue: formData.referral_revenue,
      unknown_revenue: formData.unknown_revenue,
      job_count: formData.job_count || null,
      calculated_baseline: calculations.baseline,
      calculated_uplift: calculations.uplift,
      calculated_fee: calculations.fee,
      growth_percentage: calculations.growthPercentage,
      fee_breakdown: calculations.feeBreakdown,
      notes: formData.notes,
      verified: formData.verified,
    })
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Period Header */}
      <div className="card p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold">
            {MONTHS[month - 1]} {year}
          </p>
          <span className="text-sm text-gray-500">
            Category: {calculations.categoryLabel}
          </span>
        </div>
      </div>

      {/* Revenue Input */}
      <div className="card p-6">
        <h3 className="section-title">Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="gross_revenue" className="label">
              Gross Revenue *
            </label>
            <input
              type="number"
              id="gross_revenue"
              name="gross_revenue"
              value={formData.gross_revenue}
              onChange={handleChange}
              className="input"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="job_count" className="label">
              Job Count
            </label>
            <input
              type="number"
              id="job_count"
              name="job_count"
              value={formData.job_count}
              onChange={handleChange}
              className="input"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Attribution Breakdown */}
      <div className="card p-6">
        <h3 className="section-title">Attribution Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label htmlFor="attributed_revenue" className="label">
              Sweet Dreams Attributed
            </label>
            <input
              type="number"
              id="attributed_revenue"
              name="attributed_revenue"
              value={formData.attributed_revenue}
              onChange={handleChange}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="organic_revenue" className="label">
              Organic
            </label>
            <input
              type="number"
              id="organic_revenue"
              name="organic_revenue"
              value={formData.organic_revenue}
              onChange={handleChange}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="referral_revenue" className="label">
              Referral
            </label>
            <input
              type="number"
              id="referral_revenue"
              name="referral_revenue"
              value={formData.referral_revenue}
              onChange={handleChange}
              className="input"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="unknown_revenue" className="label">
              Unknown (auto-calculated)
            </label>
            <input
              type="number"
              id="unknown_revenue"
              name="unknown_revenue"
              value={formData.unknown_revenue}
              className="input bg-gray-50"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Fee Calculation Preview */}
      <div className="card p-6 bg-primary-50 border-primary-200">
        <h3 className="section-title text-primary-900">Fee Calculation Preview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-primary-700">Baseline</p>
            <p className="text-xl font-semibold text-primary-900">
              {formatCurrency(calculations.baseline)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Gross Revenue</p>
            <p className="text-xl font-semibold text-primary-900">
              {formatCurrency(formData.gross_revenue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Growth</p>
            <p className="text-xl font-semibold text-blue-700">
              {formatGrowthPercentage(calculations.growthPercentage)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Uplift</p>
            <p className="text-xl font-semibold text-green-700">
              {formatCurrency(calculations.uplift)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Calculated Fee</p>
            <p className="text-2xl font-bold text-primary-900">
              {formatCurrency(calculations.fee)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <h3 className="section-title">Notes</h3>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="input min-h-[100px]"
          placeholder="Any notes about this month's revenue..."
        />
      </div>

      {/* Verification */}
      <div className="card p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="verified"
            checked={formData.verified}
            onChange={handleChange}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
          />
          <span className="text-sm font-medium text-gray-700">
            I verify that this revenue data is accurate
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : 'Save Revenue Entry'}
        </button>
      </div>
    </form>
  )
}
