/**
 * Fee Calculator - Three-Part Model
 *
 * 1. Foundation Fee (Annual) - Minimum commitment based on baseline × rate
 * 2. Sustaining Fee (Monthly, Year 2+) - Protects earned income at reset
 * 3. Growth Fee (Monthly) - Tiered % on uplift above baseline
 */

import {
  BusinessSizeCategory,
  GROWTH_TIERS,
  getBusinessSizeCategory,
  getGrowthFeeRate,
  getFoundationFeeRate,
  getTiersWithRates,
} from '../constants/feeStructure'

export interface GrowthTierBreakdown {
  tierNumber: number
  tierLabel: string
  growthFloor: number
  growthCeiling: number
  growthInTier: number
  upliftInTier: number
  feeRate: number
  feeFromTier: number
}

export interface MonthlyFeeResult {
  // Input values
  baseline: number
  revenue: number
  category: BusinessSizeCategory
  categoryLabel: string

  // Growth calculations
  upliftAmount: number
  growthPercentage: number

  // Three fee components
  foundationFeeMonthly: number  // Annual foundation ÷ 12
  sustainingFee: number         // Year 2+ protection (0 in Year 1)
  growthFee: number             // Tiered growth fee

  // Totals
  grossMonthlyFee: number
  effectiveRate: number

  // Breakdown
  tierBreakdown: GrowthTierBreakdown[]
}

export interface AnnualFeeResult {
  annualBaseline: number
  category: BusinessSizeCategory
  foundationFeeAnnual: number
  foundationFeeMonthly: number
}

/**
 * Calculate annual foundation fee
 * This is the minimum commitment for the year
 */
export function calculateFoundationFee(monthlyBaseline: number): AnnualFeeResult {
  const annualBaseline = monthlyBaseline * 12
  const category = getBusinessSizeCategory(monthlyBaseline)
  const rate = getFoundationFeeRate(category)
  const foundationFeeAnnual = Math.round(annualBaseline * rate * 100) / 100
  const foundationFeeMonthly = Math.round(foundationFeeAnnual / 12 * 100) / 100

  return {
    annualBaseline,
    category,
    foundationFeeAnnual,
    foundationFeeMonthly,
  }
}

/**
 * Calculate sustaining fee (Year 2+ only)
 * Formula: Sustaining = Last Year Avg Monthly Fee - (New Foundation ÷ 12)
 * Rules:
 * - Only kicks in Year 2+
 * - Can only increase, never decrease
 * - Ensures we never earn less than last year
 */
export function calculateSustainingFee(
  lastYearAvgMonthlyFee: number,
  newMonthlyBaseline: number,
  previousSustainingFee: number = 0
): number {
  const newFoundation = calculateFoundationFee(newMonthlyBaseline)
  const calculatedSustaining = Math.max(0, lastYearAvgMonthlyFee - newFoundation.foundationFeeMonthly)

  // Can only increase, never decrease
  return Math.max(calculatedSustaining, previousSustainingFee)
}

/**
 * Calculate monthly growth fee using tiered system.
 * Year 1 uses premium rates, Year 2+ uses standard rates.
 */
export function calculateGrowthFee(
  baseline: number,
  revenue: number,
  isYear1: boolean = false
): { growthFee: number; tierBreakdown: GrowthTierBreakdown[]; upliftAmount: number; growthPercentage: number } {
  const category = getBusinessSizeCategory(baseline)
  const upliftAmount = Math.max(0, revenue - baseline)
  const growthPercentage = baseline > 0 ? upliftAmount / baseline : 0

  if (upliftAmount <= 0 || growthPercentage <= 0) {
    return {
      growthFee: 0,
      tierBreakdown: [],
      upliftAmount: 0,
      growthPercentage: 0,
    }
  }

  const tierBreakdown: GrowthTierBreakdown[] = []
  let growthFee = 0

  for (const tier of GROWTH_TIERS) {
    if (growthPercentage <= tier.growthFloor) break

    const effectiveCeiling = Math.min(growthPercentage, tier.growthCeiling)
    const growthInTier = effectiveCeiling - tier.growthFloor

    if (growthInTier > 0) {
      const upliftInTier = growthInTier * baseline
      const feeRate = getGrowthFeeRate(category, tier.tierNumber, isYear1)
      const feeFromTier = upliftInTier * feeRate

      growthFee += feeFromTier

      tierBreakdown.push({
        tierNumber: tier.tierNumber,
        tierLabel: tier.label,
        growthFloor: tier.growthFloor,
        growthCeiling: tier.growthCeiling,
        growthInTier: round2(growthInTier),
        upliftInTier: round2(upliftInTier),
        feeRate,
        feeFromTier: round2(feeFromTier),
      })
    }
  }

  return {
    growthFee: round2(growthFee),
    tierBreakdown,
    upliftAmount: round2(upliftAmount),
    growthPercentage: round2(growthPercentage),
  }
}

/**
 * Calculate complete monthly fee (all three components)
 */
export function calculateMonthlyFee(
  baseline: number,
  revenue: number,
  options: {
    sustainingFee?: number  // Carry forward from previous calculation
    isYear1?: boolean       // If Year 1, no sustaining fee
  } = {}
): MonthlyFeeResult {
  const { sustainingFee = 0, isYear1 = true } = options

  const category = getBusinessSizeCategory(baseline)
  const categoryLabel = getCategoryLabel(category)

  // Foundation fee (monthly portion)
  const foundation = calculateFoundationFee(baseline)
  const foundationFeeMonthly = foundation.foundationFeeMonthly

  // Sustaining fee (Year 2+ only)
  const activeSustainingFee = isYear1 ? 0 : sustainingFee

  // Growth fee (Year 1 uses premium rates)
  const growth = calculateGrowthFee(baseline, revenue, isYear1)

  // Total
  const grossMonthlyFee = foundationFeeMonthly + activeSustainingFee + growth.growthFee
  const effectiveRate = growth.upliftAmount > 0 ? (grossMonthlyFee / growth.upliftAmount) * 100 : 0

  return {
    baseline,
    revenue,
    category,
    categoryLabel,
    upliftAmount: growth.upliftAmount,
    growthPercentage: growth.growthPercentage,
    foundationFeeMonthly,
    sustainingFee: activeSustainingFee,
    growthFee: growth.growthFee,
    grossMonthlyFee: round2(grossMonthlyFee),
    effectiveRate: round2(effectiveRate),
    tierBreakdown: growth.tierBreakdown,
  }
}

/**
 * Get display label for a business category
 */
function getCategoryLabel(category: BusinessSizeCategory): string {
  const labels: Record<BusinessSizeCategory, string> = {
    micro: 'Micro (<$10k)',
    small: 'Small ($10k-$30k)',
    medium: 'Medium ($30k-$75k)',
    large: 'Large ($75k-$150k)',
    major: 'Major ($150k-$300k)',
    enterprise: 'Enterprise ($300k-$500k)',
    elite: 'Elite (>$500k)',
  }
  return labels[category]
}

/**
 * Format growth percentage for display
 */
export function formatGrowthPercentage(growth: number): string {
  return `${Math.round(growth * 100)}%`
}

/**
 * Get tier rates preview for a given baseline
 */
export function getTierRatesForBaseline(baseline: number, isYear1: boolean = false) {
  const category = getBusinessSizeCategory(baseline)
  const foundation = calculateFoundationFee(baseline)
  return {
    category,
    categoryLabel: getCategoryLabel(category),
    tiers: getTiersWithRates(category, isYear1),
    foundationFeeRate: getFoundationFeeRate(category),
    foundationFeeAnnual: foundation.foundationFeeAnnual,
    foundationFeeMonthly: foundation.foundationFeeMonthly,
  }
}

/**
 * Format fee breakdown for display
 */
export function formatFeeBreakdown(result: MonthlyFeeResult): string {
  const lines: string[] = []

  lines.push(`Business Category: ${result.categoryLabel}`)
  lines.push(`Baseline: $${result.baseline.toLocaleString()}`)
  lines.push(`Revenue: $${result.revenue.toLocaleString()}`)
  lines.push(`Uplift: $${result.upliftAmount.toLocaleString()}`)
  lines.push(`Growth: ${formatGrowthPercentage(result.growthPercentage)}`)
  lines.push('')
  lines.push('=== THREE-PART FEE ===')
  lines.push(`Foundation (monthly): $${result.foundationFeeMonthly.toLocaleString()}`)
  if (result.sustainingFee > 0) {
    lines.push(`Sustaining: $${result.sustainingFee.toLocaleString()}`)
  }
  lines.push(`Growth Fee: $${result.growthFee.toLocaleString()}`)
  lines.push('')

  if (result.tierBreakdown.length > 0) {
    lines.push('Growth Fee by Tier:')
    for (const tier of result.tierBreakdown) {
      lines.push(
        `  Tier ${tier.tierNumber} (${tier.tierLabel}): ` +
        `$${tier.upliftInTier.toLocaleString()} × ${(tier.feeRate * 100).toFixed(1)}% = ` +
        `$${tier.feeFromTier.toLocaleString()}`
      )
    }
    lines.push('')
  }

  lines.push(`TOTAL MONTHLY FEE: $${result.grossMonthlyFee.toLocaleString()}`)
  lines.push(`Effective Rate: ${result.effectiveRate.toFixed(2)}%`)

  return lines.join('\n')
}

// Legacy exports for backwards compatibility
export function calculateFee(
  baseline: number,
  revenue: number,
  options: {
    monthlyCap?: number | null
    annualCap?: number | null
    yearToDateFees?: number
    includeFoundationFee?: boolean
    isBaselineRecalculation?: boolean
  } = {}
) {
  const result = calculateMonthlyFee(baseline, revenue, { isYear1: true })

  return {
    baseline,
    revenue,
    category: result.category,
    categoryLabel: result.categoryLabel,
    upliftAmount: result.upliftAmount,
    growthPercentage: result.growthPercentage,
    foundationFee: options.includeFoundationFee ? result.foundationFeeMonthly : 0,
    performanceFee: result.growthFee,
    grossFee: result.grossMonthlyFee,
    monthlyCapApplied: false,
    annualCapApplied: false,
    feeBeforeCaps: result.grossMonthlyFee,
    monthlyCapReduction: 0,
    annualCapReduction: 0,
    finalFee: result.grossMonthlyFee,
    tierBreakdown: result.tierBreakdown,
    effectiveRate: result.effectiveRate,
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
