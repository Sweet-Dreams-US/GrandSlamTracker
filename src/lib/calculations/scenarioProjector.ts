/**
 * Scenario Projector - Three-Part Fee Model
 *
 * Projects revenue and fees with:
 * 1. Foundation Fee (Annual) - Minimum commitment
 * 2. Sustaining Fee (Year 2+) - Protects earned income
 * 3. Growth Fee (Monthly) - Tiered % on uplift
 */

import { getSeasonalIndex } from '../constants/seasonalIndices'
import {
  calculateFoundationFee,
  calculateSustainingFee,
  calculateGrowthFee,
  calculateMonthlyFee,
  getTierRatesForBaseline,
  type MonthlyFeeResult,
  type GrowthTierBreakdown,
} from './feeCalculator'
import {
  getBusinessSizeCategory,
  getTiersWithRates,
  calculateNewBaseline,
  type RetentionOption,
} from '../constants/feeStructure'

export interface ProjectionInput {
  baselineRevenue: number
  industry: string
  monthlyGrowthRate: number
  startMonth: number
  startYear: number
  projectionMonths: number
  applySeasonality?: boolean
  retentionOption?: RetentionOption
  isGrandSlam?: boolean // Year 1: no foundation fee upfront (deferred)
}

export interface MonthlyProjection {
  month: number
  year: number
  monthIndex: number
  monthLabel: string
  yearNumber: number // 1, 2, 3, etc.
  seasonalIndex: number

  // Baseline & Revenue
  currentBaseline: number
  projectedRevenue: number
  uplift: number
  growthPercentage: number

  // Three Fee Components
  foundationFee: number  // Monthly portion
  sustainingFee: number  // Year 2+ only
  growthFee: number

  // Totals
  totalMonthlyFee: number
  isBaselineReset: boolean
  isYearStart: boolean

  // Cumulative
  cumulativeRevenue: number
  cumulativeFoundationFees: number
  cumulativeSustainingFees: number
  cumulativeGrowthFees: number
  cumulativeTotalFees: number

  // Breakdown
  tierBreakdown: GrowthTierBreakdown[]
}

export interface YearSummary {
  yearNumber: number
  startBaseline: number
  endBaseline: number
  totalRevenue: number
  avgMonthlyRevenue: number
  avgGrowthPercent: number
  foundationFeeAnnual: number
  sustainingFeeTotal: number
  growthFeeTotal: number
  totalFees: number
  avgMonthlyFee: number
}

export interface BaselineReset {
  yearNumber: number
  monthLabel: string
  oldBaseline: number
  newBaseline: number
  lastYearAvgFee: number
  newSustainingFee: number
}

export interface ProjectionResult {
  projections: MonthlyProjection[]
  yearSummaries: YearSummary[]
  baselineResets: BaselineReset[]
  category: string
  categoryLabel: string
  tierRates: { tierNumber: number; label: string; feeRate: number }[]
  summary: {
    initialBaseline: number
    finalBaseline: number
    totalProjectedRevenue: number
    totalFoundationFees: number
    totalSustainingFees: number
    totalGrowthFees: number
    totalFees: number
    avgMonthlyFee: number
    avgEffectiveRate: number
    yearsProjected: number
  }
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function projectScenario(input: ProjectionInput): ProjectionResult {
  const {
    baselineRevenue,
    industry,
    monthlyGrowthRate,
    startMonth,
    startYear,
    projectionMonths,
    applySeasonality = true,
    isGrandSlam = true,
  } = input

  const projections: MonthlyProjection[] = []
  const yearSummaries: YearSummary[] = []
  const baselineResets: BaselineReset[] = []

  let currentBaseline = baselineRevenue
  let currentSustainingFee = 0
  let monthsSinceYearStart = 0
  let currentYearNumber = 1

  // Tracking for cumulative and year summaries
  let cumulativeRevenue = 0
  let cumulativeFoundationFees = 0
  let cumulativeSustainingFees = 0
  let cumulativeGrowthFees = 0

  // Year tracking
  let yearStartBaseline = baselineRevenue
  let yearRevenue = 0
  let yearFoundationFees = 0
  let yearSustainingFees = 0
  let yearGrowthFees = 0
  let yearGrowthSum = 0
  let yearUpliftSum = 0
  let monthsInYear = 0
  let lastYearAvgMonthlyFee = 0

  for (let i = 0; i < projectionMonths; i++) {
    const monthIndex = (startMonth - 1 + i) % 12
    const month = monthIndex + 1
    const year = startYear + Math.floor((startMonth - 1 + i) / 12)
    const isYearStart = i > 0 && monthsSinceYearStart === 12

    // Year boundary - process reset
    if (isYearStart) {
      // Calculate year summary for previous year
      const yearAvgMonthlyFee = (yearFoundationFees + yearSustainingFees + yearGrowthFees) / monthsInYear
      lastYearAvgMonthlyFee = yearAvgMonthlyFee

      yearSummaries.push({
        yearNumber: currentYearNumber,
        startBaseline: yearStartBaseline,
        endBaseline: currentBaseline,
        totalRevenue: yearRevenue,
        avgMonthlyRevenue: yearRevenue / monthsInYear,
        avgGrowthPercent: yearGrowthSum / monthsInYear,
        foundationFeeAnnual: yearFoundationFees,
        sustainingFeeTotal: yearSustainingFees,
        growthFeeTotal: yearGrowthFees,
        totalFees: yearFoundationFees + yearSustainingFees + yearGrowthFees,
        avgMonthlyFee: yearAvgMonthlyFee,
      })

      // Calculate new baseline for Year 2+ (simplified: no industry factor)
      const avgGrowthPercent = yearGrowthSum / monthsInYear
      const avgMonthlyUplift = yearUpliftSum / monthsInYear
      const newBaseline = calculateNewBaseline(
        currentBaseline,
        avgMonthlyUplift,
        avgGrowthPercent
      )

      // Calculate sustaining fee (protects last year's average)
      const newSustainingFee = calculateSustainingFee(
        lastYearAvgMonthlyFee,
        newBaseline,
        currentSustainingFee
      )

      baselineResets.push({
        yearNumber: currentYearNumber + 1,
        monthLabel: `${MONTH_NAMES[monthIndex]} ${year}`,
        oldBaseline: currentBaseline,
        newBaseline,
        lastYearAvgFee: lastYearAvgMonthlyFee,
        newSustainingFee,
      })

      currentBaseline = newBaseline
      currentSustainingFee = newSustainingFee
      currentYearNumber++
      monthsSinceYearStart = 0

      // Reset year tracking
      yearStartBaseline = newBaseline
      yearRevenue = 0
      yearFoundationFees = 0
      yearSustainingFees = 0
      yearGrowthFees = 0
      yearGrowthSum = 0
      yearUpliftSum = 0
      monthsInYear = 0
    }

    // Growth from current baseline
    const growthMultiplier = Math.pow(1 + monthlyGrowthRate, monthsSinceYearStart + 1)
    const seasonalIndex = applySeasonality ? getSeasonalIndex(industry, month) : 1
    const projectedRevenue = round2(currentBaseline * growthMultiplier * seasonalIndex)

    // Calculate fees
    const isYear1 = currentYearNumber === 1

    // Year 1: adjust baseline by seasonal factor before calculating growth fees
    // Year 2+: flat baseline (year-over-year), seasonality only affects projected revenue
    const feeBaseline = isYear1 && applySeasonality
      ? round2(currentBaseline * seasonalIndex)
      : currentBaseline

    const growth = calculateGrowthFee(feeBaseline, projectedRevenue, isYear1)

    // Foundation fee (monthly portion) - can be $0 for Grand Slam Year 1
    const foundation = calculateFoundationFee(currentBaseline)
    const foundationFee = (isGrandSlam && isYear1) ? 0 : foundation.foundationFeeMonthly

    // Sustaining fee (Year 2+ only)
    const sustainingFee = isYear1 ? 0 : currentSustainingFee

    // Total
    const totalMonthlyFee = foundationFee + sustainingFee + growth.growthFee

    // Update cumulative
    cumulativeRevenue += projectedRevenue
    cumulativeFoundationFees += foundationFee
    cumulativeSustainingFees += sustainingFee
    cumulativeGrowthFees += growth.growthFee

    // Update year tracking
    yearRevenue += projectedRevenue
    yearFoundationFees += foundationFee
    yearSustainingFees += sustainingFee
    yearGrowthFees += growth.growthFee
    yearGrowthSum += growth.growthPercentage
    yearUpliftSum += growth.upliftAmount
    monthsInYear++

    projections.push({
      month,
      year,
      monthIndex: i,
      monthLabel: `${MONTH_NAMES[monthIndex]} ${year}`,
      yearNumber: currentYearNumber,
      seasonalIndex: round2(seasonalIndex),
      currentBaseline: round2(currentBaseline),
      projectedRevenue,
      uplift: growth.upliftAmount,
      growthPercentage: growth.growthPercentage,
      foundationFee: round2(foundationFee),
      sustainingFee: round2(sustainingFee),
      growthFee: round2(growth.growthFee),
      totalMonthlyFee: round2(totalMonthlyFee),
      isBaselineReset: isYearStart,
      isYearStart,
      cumulativeRevenue: round2(cumulativeRevenue),
      cumulativeFoundationFees: round2(cumulativeFoundationFees),
      cumulativeSustainingFees: round2(cumulativeSustainingFees),
      cumulativeGrowthFees: round2(cumulativeGrowthFees),
      cumulativeTotalFees: round2(cumulativeFoundationFees + cumulativeSustainingFees + cumulativeGrowthFees),
      tierBreakdown: growth.tierBreakdown,
    })

    monthsSinceYearStart++
  }

  // Add final year summary if not at boundary
  if (monthsInYear > 0) {
    const yearAvgMonthlyFee = (yearFoundationFees + yearSustainingFees + yearGrowthFees) / monthsInYear
    yearSummaries.push({
      yearNumber: currentYearNumber,
      startBaseline: yearStartBaseline,
      endBaseline: currentBaseline,
      totalRevenue: yearRevenue,
      avgMonthlyRevenue: yearRevenue / monthsInYear,
      avgGrowthPercent: yearGrowthSum / monthsInYear,
      foundationFeeAnnual: yearFoundationFees,
      sustainingFeeTotal: yearSustainingFees,
      growthFeeTotal: yearGrowthFees,
      totalFees: yearFoundationFees + yearSustainingFees + yearGrowthFees,
      avgMonthlyFee: yearAvgMonthlyFee,
    })
  }

  // Get category info
  const initialCategory = getBusinessSizeCategory(baselineRevenue)
  const tiersWithRates = getTiersWithRates(initialCategory)

  const categoryLabels: Record<string, string> = {
    micro: 'Micro (<$10k)',
    small: 'Small ($10k-$30k)',
    medium: 'Medium ($30k-$75k)',
    large: 'Large ($75k-$150k)',
    major: 'Major ($150k-$300k)',
    enterprise: 'Enterprise ($300k-$500k)',
    elite: 'Elite (>$500k)',
  }

  const totalFees = cumulativeFoundationFees + cumulativeSustainingFees + cumulativeGrowthFees
  const totalUplift = projections.reduce((sum, p) => sum + p.uplift, 0)

  return {
    projections,
    yearSummaries,
    baselineResets,
    category: initialCategory,
    categoryLabel: categoryLabels[initialCategory] || initialCategory,
    tierRates: tiersWithRates.map(t => ({
      tierNumber: t.tierNumber,
      label: t.label,
      feeRate: t.feeRate,
    })),
    summary: {
      initialBaseline: baselineRevenue,
      finalBaseline: currentBaseline,
      totalProjectedRevenue: round2(cumulativeRevenue),
      totalFoundationFees: round2(cumulativeFoundationFees),
      totalSustainingFees: round2(cumulativeSustainingFees),
      totalGrowthFees: round2(cumulativeGrowthFees),
      totalFees: round2(totalFees),
      avgMonthlyFee: round2(totalFees / projectionMonths),
      avgEffectiveRate: totalUplift > 0 ? round2((totalFees / totalUplift) * 100) : 0,
      yearsProjected: Math.ceil(projectionMonths / 12),
    },
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
