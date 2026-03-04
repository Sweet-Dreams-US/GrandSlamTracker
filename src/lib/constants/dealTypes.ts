/**
 * Deal Types & Payout Tier Charts
 * Used by the Payout Operations calculator
 */

export type DealType = 'grand_slam_monthly' | 'grand_slam_upfront' | 'transactional' | 'buyout'

export interface DealTypeConfig {
  label: string
  description: string
}

export const DEAL_TYPES: Record<DealType, DealTypeConfig> = {
  grand_slam_monthly: {
    label: 'Grand Slam Monthly',
    description: 'Recurring monthly performance-based fee',
  },
  grand_slam_upfront: {
    label: 'Grand Slam Upfront',
    description: 'One-time upfront contract payment',
  },
  transactional: {
    label: 'Transactional',
    description: 'One-off project or service fee',
  },
  buyout: {
    label: 'Buyout',
    description: 'Client buyout of SweetDreams partnership',
  },
}

// --- Client Fee Growth Tiers (Grand Slam Monthly) ---

export interface ClientGrowthTier {
  label: string
  description: string
  rate: number // percentage as decimal
}

/**
 * Progressive client fee tiers for Grand Slam Monthly.
 * First $5,000 of growth above baseline: flat 7%.
 * Remaining growth split by growth percentage tiers.
 */
export const CLIENT_FEE_FIRST_TIER_CAP = 5000 // $5,000
export const CLIENT_FEE_FIRST_TIER_RATE = 0.07 // 7%

export interface GrowthPercentageTier {
  label: string
  minGrowthPercent: number // decimal (0.00 = 0%)
  maxGrowthPercent: number | null // null = no ceiling
  rate: number // decimal
}

export const CLIENT_FEE_GROWTH_TIERS: GrowthPercentageTier[] = [
  { label: '0-50%', minGrowthPercent: 0, maxGrowthPercent: 0.50, rate: 0.25 },
  { label: '51-100%', minGrowthPercent: 0.50, maxGrowthPercent: 1.00, rate: 0.20 },
  { label: '101-200%', minGrowthPercent: 1.00, maxGrowthPercent: 2.00, rate: 0.15 },
  { label: '201%+', minGrowthPercent: 2.00, maxGrowthPercent: null, rate: 0.10 },
]

// --- Internal Payout Split Tiers ---

export interface PayoutTier {
  label: string
  minRevenue: number
  maxRevenue: number | null // null = no ceiling
  salesPercent: number
  workerPercent: number
  businessPercent: number
}

/**
 * Grand Slam Monthly payout chart
 * Business always 35%, sales 0-10%, worker 55-65%
 */
export const GRAND_SLAM_MONTHLY_TIERS: PayoutTier[] = [
  { label: '$0 - $2,500', minRevenue: 0, maxRevenue: 2500, salesPercent: 0, workerPercent: 0.65, businessPercent: 0.35 },
  { label: '$2,500 - $5,000', minRevenue: 2500, maxRevenue: 5000, salesPercent: 0.03, workerPercent: 0.62, businessPercent: 0.35 },
  { label: '$5,000 - $10,000', minRevenue: 5000, maxRevenue: 10000, salesPercent: 0.05, workerPercent: 0.60, businessPercent: 0.35 },
  { label: '$10,000 - $25,000', minRevenue: 10000, maxRevenue: 25000, salesPercent: 0.07, workerPercent: 0.58, businessPercent: 0.35 },
  { label: '$25,000 - $50,000', minRevenue: 25000, maxRevenue: 50000, salesPercent: 0.08, workerPercent: 0.57, businessPercent: 0.35 },
  { label: '$50,000 - $200,000', minRevenue: 50000, maxRevenue: 200000, salesPercent: 0.09, workerPercent: 0.56, businessPercent: 0.35 },
  { label: '$200,000+', minRevenue: 200000, maxRevenue: null, salesPercent: 0.10, workerPercent: 0.55, businessPercent: 0.35 },
]

/**
 * Grand Slam Upfront payout chart
 * Business 35%, sales 3-10%, worker 55-62%
 */
export const GRAND_SLAM_UPFRONT_TIERS: PayoutTier[] = [
  { label: '$0 - $5,000', minRevenue: 0, maxRevenue: 5000, salesPercent: 0.03, workerPercent: 0.62, businessPercent: 0.35 },
  { label: '$5,000 - $15,000', minRevenue: 5000, maxRevenue: 15000, salesPercent: 0.05, workerPercent: 0.60, businessPercent: 0.35 },
  { label: '$15,000 - $50,000', minRevenue: 15000, maxRevenue: 50000, salesPercent: 0.07, workerPercent: 0.58, businessPercent: 0.35 },
  { label: '$50,000 - $150,000', minRevenue: 50000, maxRevenue: 150000, salesPercent: 0.08, workerPercent: 0.57, businessPercent: 0.35 },
  { label: '$150,000+', minRevenue: 150000, maxRevenue: null, salesPercent: 0.10, workerPercent: 0.55, businessPercent: 0.35 },
]

/**
 * Transactional payout chart
 * Business 35%, sales 5-20%, worker 45-60%
 * Progressive: each revenue bracket applies only to the dollars within that bracket
 */
export const TRANSACTIONAL_TIERS: PayoutTier[] = [
  { label: '$0 - $5,000', minRevenue: 0, maxRevenue: 5000, salesPercent: 0.20, workerPercent: 0.45, businessPercent: 0.35 },
  { label: '$5,000 - $15,000', minRevenue: 5000, maxRevenue: 15000, salesPercent: 0.15, workerPercent: 0.50, businessPercent: 0.35 },
  { label: '$15,000 - $50,000', minRevenue: 15000, maxRevenue: 50000, salesPercent: 0.10, workerPercent: 0.55, businessPercent: 0.35 },
  { label: '$50,000+', minRevenue: 50000, maxRevenue: null, salesPercent: 0.05, workerPercent: 0.60, businessPercent: 0.35 },
]

/**
 * Buyout multipliers based on partnership duration
 */
export interface BuyoutMultiplier {
  label: string
  minMonths: number
  maxMonths: number | null
  multiplier: number
}

export const BUYOUT_MULTIPLIERS: BuyoutMultiplier[] = [
  { label: '3-6 months', minMonths: 3, maxMonths: 6, multiplier: 2 },
  { label: '6-12 months', minMonths: 6, maxMonths: 12, multiplier: 4 },
  { label: '12-24 months', minMonths: 12, maxMonths: 24, multiplier: 6 },
  { label: '24+ months', minMonths: 24, maxMonths: null, multiplier: 10 },
]

/**
 * Get the payout tiers for a given deal type.
 * Buyout uses Grand Slam Monthly tiers.
 */
export function getPayoutTiers(dealType: DealType): PayoutTier[] {
  switch (dealType) {
    case 'grand_slam_monthly':
    case 'buyout':
      return GRAND_SLAM_MONTHLY_TIERS
    case 'grand_slam_upfront':
      return GRAND_SLAM_UPFRONT_TIERS
    case 'transactional':
      return TRANSACTIONAL_TIERS
  }
}

/**
 * Get the payout tier for a given revenue amount and deal type.
 */
export function getPayoutTierForAmount(dealType: DealType, amount: number): PayoutTier {
  const tiers = getPayoutTiers(dealType)
  for (const tier of tiers) {
    if (tier.maxRevenue === null || amount <= tier.maxRevenue) {
      return tier
    }
  }
  return tiers[tiers.length - 1]
}

/**
 * Get buyout multiplier for a given partnership duration in months.
 */
export function getBuyoutMultiplier(partnershipMonths: number): number {
  for (const entry of BUYOUT_MULTIPLIERS) {
    if (entry.maxMonths === null || partnershipMonths <= entry.maxMonths) {
      return entry.multiplier
    }
  }
  return BUYOUT_MULTIPLIERS[BUYOUT_MULTIPLIERS.length - 1].multiplier
}
