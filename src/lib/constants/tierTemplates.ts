// Default tier structures based on revenue category
// These are recommendations that can be customized per client

export interface TierTemplate {
  minAmount: number
  maxAmount: number | null
  percentage: number
}

export interface CategoryConfig {
  label: string
  minRevenue: number
  maxRevenue: number | null
  tiers: TierTemplate[]
  suggestedMonthlyCap: number | null
  suggestedAnnualCap: number | null
}

// Revenue categories with default tier structures
export const REVENUE_CATEGORIES: Record<string, CategoryConfig> = {
  micro: {
    label: 'Micro',
    minRevenue: 0,
    maxRevenue: 10000,
    tiers: [
      { minAmount: 0, maxAmount: 3000, percentage: 15 },
      { minAmount: 3000, maxAmount: 6000, percentage: 12 },
      { minAmount: 6000, maxAmount: null, percentage: 10 },
    ],
    suggestedMonthlyCap: 1500,
    suggestedAnnualCap: 15000,
  },
  small: {
    label: 'Small',
    minRevenue: 10000,
    maxRevenue: 30000,
    tiers: [
      { minAmount: 0, maxAmount: 5000, percentage: 12 },
      { minAmount: 5000, maxAmount: 15000, percentage: 10 },
      { minAmount: 15000, maxAmount: null, percentage: 8 },
    ],
    suggestedMonthlyCap: 3000,
    suggestedAnnualCap: 30000,
  },
  medium: {
    label: 'Medium',
    minRevenue: 30000,
    maxRevenue: 100000,
    tiers: [
      { minAmount: 0, maxAmount: 10000, percentage: 10 },
      { minAmount: 10000, maxAmount: 30000, percentage: 8 },
      { minAmount: 30000, maxAmount: 60000, percentage: 6 },
      { minAmount: 60000, maxAmount: null, percentage: 5 },
    ],
    suggestedMonthlyCap: 6000,
    suggestedAnnualCap: 60000,
  },
  large: {
    label: 'Large',
    minRevenue: 100000,
    maxRevenue: 300000,
    tiers: [
      { minAmount: 0, maxAmount: 25000, percentage: 8 },
      { minAmount: 25000, maxAmount: 75000, percentage: 6 },
      { minAmount: 75000, maxAmount: 150000, percentage: 5 },
      { minAmount: 150000, maxAmount: null, percentage: 4 },
    ],
    suggestedMonthlyCap: 12000,
    suggestedAnnualCap: 120000,
  },
  enterprise: {
    label: 'Enterprise',
    minRevenue: 300000,
    maxRevenue: null,
    tiers: [
      { minAmount: 0, maxAmount: 50000, percentage: 6 },
      { minAmount: 50000, maxAmount: 150000, percentage: 5 },
      { minAmount: 150000, maxAmount: 300000, percentage: 4 },
      { minAmount: 300000, maxAmount: null, percentage: 3 },
    ],
    suggestedMonthlyCap: 25000,
    suggestedAnnualCap: 250000,
  },
}

export function getRevenueCategory(monthlyRevenue: number): string {
  if (monthlyRevenue < 10000) return 'micro'
  if (monthlyRevenue < 30000) return 'small'
  if (monthlyRevenue < 100000) return 'medium'
  if (monthlyRevenue < 300000) return 'large'
  return 'enterprise'
}

export function getCategoryConfig(category: string): CategoryConfig {
  return REVENUE_CATEGORIES[category] ?? REVENUE_CATEGORIES.medium
}

export function getTierTemplateForRevenue(monthlyRevenue: number): CategoryConfig {
  const category = getRevenueCategory(monthlyRevenue)
  return getCategoryConfig(category)
}
