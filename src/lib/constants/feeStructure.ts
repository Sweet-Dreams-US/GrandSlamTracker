/**
 * Sweet Dreams Fee Structure
 * Three-Part Model: Foundation + Sustaining + Growth
 */

// Business Size Categories (7 categories)
export type BusinessSizeCategory =
  | 'micro'
  | 'small'
  | 'medium'
  | 'large'
  | 'major'
  | 'enterprise'
  | 'elite'

export interface CategoryConfig {
  label: string
  minBaseline: number      // Monthly
  maxBaseline: number | null
  minAnnual: number        // Annual
  maxAnnual: number | null
  foundationFeeRate: number // Annual rate
}

export const BUSINESS_SIZE_CATEGORIES: Record<BusinessSizeCategory, CategoryConfig> = {
  micro: {
    label: 'Micro',
    minBaseline: 0,
    maxBaseline: 10000,
    minAnnual: 0,
    maxAnnual: 120000,
    foundationFeeRate: 0.030, // 3.0%
  },
  small: {
    label: 'Small',
    minBaseline: 10000,
    maxBaseline: 30000,
    minAnnual: 120000,
    maxAnnual: 360000,
    foundationFeeRate: 0.025, // 2.5%
  },
  medium: {
    label: 'Medium',
    minBaseline: 30000,
    maxBaseline: 75000,
    minAnnual: 360000,
    maxAnnual: 900000,
    foundationFeeRate: 0.020, // 2.0%
  },
  large: {
    label: 'Large',
    minBaseline: 75000,
    maxBaseline: 150000,
    minAnnual: 900000,
    maxAnnual: 1800000,
    foundationFeeRate: 0.015, // 1.5%
  },
  major: {
    label: 'Major',
    minBaseline: 150000,
    maxBaseline: 300000,
    minAnnual: 1800000,
    maxAnnual: 3600000,
    foundationFeeRate: 0.0125, // 1.25%
  },
  enterprise: {
    label: 'Enterprise',
    minBaseline: 300000,
    maxBaseline: 500000,
    minAnnual: 3600000,
    maxAnnual: 6000000,
    foundationFeeRate: 0.010, // 1.0%
  },
  elite: {
    label: 'Elite',
    minBaseline: 500000,
    maxBaseline: null,
    minAnnual: 6000000,
    maxAnnual: null,
    foundationFeeRate: 0.0075, // 0.75%
  },
}

// Growth Tiers (8 tiers) - Based on GROWTH PERCENTAGE
export interface GrowthTier {
  tierNumber: number
  growthFloor: number  // As decimal (0.50 = 50%)
  growthCeiling: number // As decimal (1.00 = 100%)
  label: string
}

export const GROWTH_TIERS: GrowthTier[] = [
  { tierNumber: 1, growthFloor: 0.00, growthCeiling: 0.50, label: '0-50%' },
  { tierNumber: 2, growthFloor: 0.50, growthCeiling: 1.00, label: '51-100%' },
  { tierNumber: 3, growthFloor: 1.00, growthCeiling: 2.00, label: '101-200%' },
  { tierNumber: 4, growthFloor: 2.00, growthCeiling: 3.00, label: '201-300%' },
  { tierNumber: 5, growthFloor: 3.00, growthCeiling: 5.00, label: '301-500%' },
  { tierNumber: 6, growthFloor: 5.00, growthCeiling: 7.50, label: '501-750%' },
  { tierNumber: 7, growthFloor: 7.50, growthCeiling: 10.00, label: '751-1000%' },
  { tierNumber: 8, growthFloor: 10.00, growthCeiling: 999.99, label: '1001%+' },
]

// Growth Fee Rates by Category and Tier
export const GROWTH_FEE_RATES: Record<BusinessSizeCategory, number[]> = {
  //           Tier1  Tier2  Tier3  Tier4  Tier5  Tier6  Tier7  Tier8
  micro:      [0.10,  0.15,  0.20,  0.18,  0.15,  0.12,  0.10,  0.08],
  small:      [0.08,  0.12,  0.16,  0.14,  0.12,  0.10,  0.08,  0.06],
  medium:     [0.06,  0.09,  0.12,  0.10,  0.08,  0.07,  0.06,  0.05],
  large:      [0.05,  0.07,  0.09,  0.08,  0.07,  0.06,  0.05,  0.04],
  major:      [0.04,  0.055, 0.07,  0.06,  0.05,  0.045, 0.04,  0.035],
  enterprise: [0.03,  0.04,  0.05,  0.045, 0.04,  0.035, 0.03,  0.025],
  elite:      [0.025, 0.03,  0.04,  0.035, 0.03,  0.025, 0.02,  0.015],
}

// Industry Growth Factors (for baseline reset calculation)
export const INDUSTRY_GROWTH_FACTORS: Record<string, number> = {
  remodeling: 1.12,
  homeServices: 1.10,
  healthcare: 1.08,
  legal: 1.06,
  realEstate: 1.08,
  retail: 1.04,
  restaurants: 1.05,
  entertainment: 1.10,
  professionalServices: 1.06,
  automotive: 1.05,
  beauty: 1.04,
  fitness: 1.08,
  default: 1.06,
}

// Baseline Retention Options (for baseline reset)
export type RetentionOption = 'conservative' | 'moderate' | 'aggressive'

export const RETENTION_RATES: Record<RetentionOption, number> = {
  conservative: 0.25, // Keep 25% of growth
  moderate: 0.35,     // Keep 35% of growth (default)
  aggressive: 0.50,   // Keep 50% of growth
}

// Client Tiers for eligibility
export type ClientTier = 'ideal' | 'development' | 'incubator' | 'pass'

export interface ClientTierConfig {
  label: string
  minBaseline: number
  maxBaseline: number | null
  minGrowth: number
  maxGrowth: number | null
  description: string
  action: string
}

export const CLIENT_TIERS: Record<ClientTier, ClientTierConfig> = {
  ideal: {
    label: 'IDEAL',
    minBaseline: 20000,
    maxBaseline: null,
    minGrowth: 0.50,
    maxGrowth: null,
    description: 'Strong baseline, good growth potential',
    action: 'Standard terms, full effort',
  },
  development: {
    label: 'DEVELOPMENT',
    minBaseline: 8000,
    maxBaseline: 20000,
    minGrowth: 0.50,
    maxGrowth: 1.00,
    description: 'Moderate baseline, needs growth',
    action: 'Add minimum fee, evaluate at renewal',
  },
  incubator: {
    label: 'INCUBATOR',
    minBaseline: 0,
    maxBaseline: 8000,
    minGrowth: 1.00,
    maxGrowth: null,
    description: 'Low baseline, requires high growth',
    action: 'Require minimums or retainer',
  },
  pass: {
    label: 'PASS',
    minBaseline: 0,
    maxBaseline: null,
    minGrowth: 0,
    maxGrowth: null,
    description: 'Does not meet criteria',
    action: 'Decline or special terms',
  },
}

// Minimum Fee Thresholds
export const MINIMUM_FEE_THRESHOLDS = {
  early: 1000,      // $1,000/month minimum (early stage)
  year2Plus: 2000,  // $2,000/month minimum (Year 2+)
  mature: 3000,     // $3,000/month minimum (mature)
}

/**
 * Determine business size category from monthly baseline
 */
export function getBusinessSizeCategory(monthlyBaseline: number): BusinessSizeCategory {
  if (monthlyBaseline < 10000) return 'micro'
  if (monthlyBaseline < 30000) return 'small'
  if (monthlyBaseline < 75000) return 'medium'
  if (monthlyBaseline < 150000) return 'large'
  if (monthlyBaseline < 300000) return 'major'
  if (monthlyBaseline < 500000) return 'enterprise'
  return 'elite'
}

/**
 * Get foundation fee rate for a category (annual rate)
 */
export function getFoundationFeeRate(category: BusinessSizeCategory): number {
  return BUSINESS_SIZE_CATEGORIES[category].foundationFeeRate
}

/**
 * Get growth fee rate for a category and tier
 */
export function getGrowthFeeRate(category: BusinessSizeCategory, tierNumber: number): number {
  const rates = GROWTH_FEE_RATES[category]
  return rates[tierNumber - 1] || 0
}

/**
 * Get industry growth factor
 */
export function getIndustryGrowthFactor(industry: string): number {
  return INDUSTRY_GROWTH_FACTORS[industry] || INDUSTRY_GROWTH_FACTORS.default
}

/**
 * Get retention rate
 */
export function getRetentionRate(option: RetentionOption): number {
  return RETENTION_RATES[option]
}

/**
 * Get all tier info with rates for a category
 */
export function getTiersWithRates(category: BusinessSizeCategory): (GrowthTier & { feeRate: number })[] {
  const rates = GROWTH_FEE_RATES[category]
  return GROWTH_TIERS.map((tier, index) => ({
    ...tier,
    feeRate: rates[index],
  }))
}

/**
 * Determine client tier based on baseline and expected growth
 */
export function getClientTier(monthlyBaseline: number, expectedGrowth: number): ClientTier {
  if (monthlyBaseline >= 20000 && expectedGrowth >= 0.50) return 'ideal'
  if (monthlyBaseline >= 8000 && monthlyBaseline < 20000 && expectedGrowth >= 0.50) return 'development'
  if (monthlyBaseline < 8000 && expectedGrowth >= 1.00) return 'incubator'
  return 'pass'
}

/**
 * Calculate new baseline after reset
 * Formula: New Baseline = Old × Industry Factor × (1 + Growth% × Retention%)
 */
export function calculateNewBaseline(
  oldBaseline: number,
  growthPercent: number,
  industry: string,
  retentionOption: RetentionOption = 'moderate'
): number {
  const industryFactor = getIndustryGrowthFactor(industry)
  const retentionRate = getRetentionRate(retentionOption)

  const newBaseline = oldBaseline * industryFactor * (1 + growthPercent * retentionRate)
  return Math.round(newBaseline)
}
