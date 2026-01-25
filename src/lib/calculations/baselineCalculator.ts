import { getIndustryGrowthFactor } from '../constants/industries'
import { getSeasonalIndex } from '../constants/seasonalIndices'

export interface TrailingRevenueData {
  year: number
  month: number
  revenue: number
}

export interface BaselineCalculationResult {
  rawAverage: number
  growthAdjusted: number
  seasonallyAdjusted: number
  maturityBuffered: number
  finalBaseline: number
  breakdown: {
    trailingMonths: number
    industryGrowthFactor: number
    seasonalIndex: number
    maturityBuffer: number
  }
}

/**
 * Calculate the expected baseline revenue for a given month
 * This is used to determine the "expected" revenue before Sweet Dreams' impact
 */
export function calculateBaseline(
  trailingRevenue: TrailingRevenueData[],
  industry: string,
  targetMonth: number,
  businessAgeYears: number | null,
  options: {
    method?: 'trailing12' | 'trailing6' | 'custom'
    customBaseline?: number
    customGrowthFactor?: number
    customMaturityBuffer?: number
  } = {}
): BaselineCalculationResult {
  const {
    method = 'trailing12',
    customBaseline,
    customGrowthFactor,
    customMaturityBuffer,
  } = options

  // If using custom baseline, skip calculation
  if (method === 'custom' && customBaseline !== undefined) {
    const seasonalIndex = getSeasonalIndex(industry, targetMonth)
    const seasonallyAdjusted = customBaseline * seasonalIndex

    return {
      rawAverage: customBaseline,
      growthAdjusted: customBaseline,
      seasonallyAdjusted,
      maturityBuffered: seasonallyAdjusted,
      finalBaseline: Math.round(seasonallyAdjusted * 100) / 100,
      breakdown: {
        trailingMonths: 0,
        industryGrowthFactor: 0,
        seasonalIndex,
        maturityBuffer: 0,
      },
    }
  }

  // Determine how many months to use
  const monthsToUse = method === 'trailing6' ? 6 : 12

  // Sort trailing revenue by date (most recent first) and take required months
  const sortedRevenue = [...trailingRevenue].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  const relevantRevenue = sortedRevenue.slice(0, monthsToUse)

  if (relevantRevenue.length === 0) {
    return {
      rawAverage: 0,
      growthAdjusted: 0,
      seasonallyAdjusted: 0,
      maturityBuffered: 0,
      finalBaseline: 0,
      breakdown: {
        trailingMonths: 0,
        industryGrowthFactor: 0,
        seasonalIndex: 1,
        maturityBuffer: 0,
      },
    }
  }

  // Calculate raw average
  const totalRevenue = relevantRevenue.reduce((sum, r) => sum + r.revenue, 0)
  const rawAverage = totalRevenue / relevantRevenue.length

  // Apply industry growth factor (annualized, so divide by 12 for monthly)
  const industryGrowthFactor = customGrowthFactor ?? getIndustryGrowthFactor(industry)
  const monthlyGrowthRate = industryGrowthFactor / 12
  const growthAdjusted = rawAverage * (1 + monthlyGrowthRate)

  // Apply seasonal adjustment for target month
  const seasonalIndex = getSeasonalIndex(industry, targetMonth)
  const seasonallyAdjusted = growthAdjusted * seasonalIndex

  // Apply maturity buffer based on business age
  const maturityBuffer = customMaturityBuffer ?? calculateMaturityBuffer(businessAgeYears)
  const maturityBuffered = seasonallyAdjusted * (1 + maturityBuffer)

  return {
    rawAverage: Math.round(rawAverage * 100) / 100,
    growthAdjusted: Math.round(growthAdjusted * 100) / 100,
    seasonallyAdjusted: Math.round(seasonallyAdjusted * 100) / 100,
    maturityBuffered: Math.round(maturityBuffered * 100) / 100,
    finalBaseline: Math.round(maturityBuffered * 100) / 100,
    breakdown: {
      trailingMonths: relevantRevenue.length,
      industryGrowthFactor,
      seasonalIndex,
      maturityBuffer,
    },
  }
}

/**
 * Calculate maturity buffer based on business age
 * Younger businesses get higher buffers to account for natural growth
 */
export function calculateMaturityBuffer(businessAgeYears: number | null): number {
  if (businessAgeYears === null) {
    return 0.10 // Default 10% buffer if unknown
  }

  if (businessAgeYears < 1) return 0.20 // 20% for very new businesses
  if (businessAgeYears < 2) return 0.15 // 15% for 1-2 years
  if (businessAgeYears < 3) return 0.10 // 10% for 2-3 years
  if (businessAgeYears < 5) return 0.05 // 5% for 3-5 years
  return 0 // No buffer for established businesses (5+ years)
}

/**
 * Calculate uplift amount (actual revenue above baseline)
 */
export function calculateUplift(actualRevenue: number, baseline: number): number {
  return Math.max(0, actualRevenue - baseline)
}

/**
 * Calculate uplift percentage
 */
export function calculateUpliftPercentage(actualRevenue: number, baseline: number): number {
  if (baseline === 0) return 0
  return ((actualRevenue - baseline) / baseline) * 100
}
