import {
  REVENUE_CATEGORIES,
  getRevenueCategory,
  getCategoryConfig,
  type TierTemplate,
  type CategoryConfig
} from '../constants/tierTemplates'

export interface GeneratedTier {
  tierOrder: number
  minAmount: number
  maxAmount: number | null
  percentage: number
  label: string
}

export interface TierGenerationResult {
  category: string
  categoryLabel: string
  tiers: GeneratedTier[]
  suggestedMonthlyCap: number | null
  suggestedAnnualCap: number | null
  baselineRevenue: number
}

/**
 * Generate recommended fee tiers based on baseline revenue
 */
export function generateRecommendedTiers(
  baselineRevenue: number,
  options: {
    customCategory?: string
    adjustPercentages?: number // Factor to adjust all percentages (e.g., 0.9 for 10% reduction)
    minimumPercentage?: number
    maximumPercentage?: number
  } = {}
): TierGenerationResult {
  const {
    customCategory,
    adjustPercentages = 1,
    minimumPercentage = 3,
    maximumPercentage = 20
  } = options

  // Determine category
  const category = customCategory ?? getRevenueCategory(baselineRevenue)
  const config = getCategoryConfig(category)

  // Generate tiers with applied adjustments
  const tiers: GeneratedTier[] = config.tiers.map((template, index) => {
    let adjustedPercentage = template.percentage * adjustPercentages
    adjustedPercentage = Math.max(minimumPercentage, Math.min(maximumPercentage, adjustedPercentage))
    adjustedPercentage = Math.round(adjustedPercentage * 10) / 10 // Round to 1 decimal

    return {
      tierOrder: index + 1,
      minAmount: template.minAmount,
      maxAmount: template.maxAmount,
      percentage: adjustedPercentage,
      label: getTierLabel(index + 1, template.minAmount, template.maxAmount),
    }
  })

  return {
    category,
    categoryLabel: config.label,
    tiers,
    suggestedMonthlyCap: config.suggestedMonthlyCap,
    suggestedAnnualCap: config.suggestedAnnualCap,
    baselineRevenue,
  }
}

/**
 * Generate a human-readable label for a tier
 */
function getTierLabel(order: number, min: number, max: number | null): string {
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`
    }
    return `$${amount}`
  }

  if (min === 0 && max !== null) {
    return `First ${formatAmount(max)}`
  }
  if (max === null) {
    return `Above ${formatAmount(min)}`
  }
  return `${formatAmount(min)} - ${formatAmount(max)}`
}

/**
 * Validate tier structure (no gaps, no overlaps, ascending order)
 */
export function validateTiers(tiers: GeneratedTier[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (tiers.length === 0) {
    errors.push('At least one tier is required')
    return { valid: false, errors }
  }

  // Sort by tier order
  const sorted = [...tiers].sort((a, b) => a.tierOrder - b.tierOrder)

  // Check first tier starts at 0
  if (sorted[0].minAmount !== 0) {
    errors.push('First tier must start at $0')
  }

  // Check for gaps and overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    if (current.maxAmount === null) {
      errors.push(`Tier ${current.tierOrder} has no max but is not the last tier`)
    } else if (current.maxAmount !== next.minAmount) {
      errors.push(`Gap or overlap between tier ${current.tierOrder} and ${next.tierOrder}`)
    }
  }

  // Check last tier has no max (unbounded)
  const lastTier = sorted[sorted.length - 1]
  if (lastTier.maxAmount !== null) {
    errors.push('Last tier should have no maximum (unbounded)')
  }

  // Check percentages are reasonable
  for (const tier of tiers) {
    if (tier.percentage < 0 || tier.percentage > 100) {
      errors.push(`Tier ${tier.tierOrder} has invalid percentage: ${tier.percentage}%`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Create custom tiers from simple inputs
 */
export function createCustomTiers(
  brackets: { upTo: number | null; percentage: number }[]
): GeneratedTier[] {
  const tiers: GeneratedTier[] = []
  let currentMin = 0

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]
    tiers.push({
      tierOrder: i + 1,
      minAmount: currentMin,
      maxAmount: bracket.upTo,
      percentage: bracket.percentage,
      label: getTierLabel(i + 1, currentMin, bracket.upTo),
    })
    currentMin = bracket.upTo ?? currentMin
  }

  return tiers
}

/**
 * Get all available revenue categories
 */
export function getAvailableCategories(): { key: string; label: string; range: string }[] {
  return Object.entries(REVENUE_CATEGORIES).map(([key, config]) => ({
    key,
    label: config.label,
    range: config.maxRevenue === null
      ? `$${(config.minRevenue / 1000).toFixed(0)}k+`
      : `$${(config.minRevenue / 1000).toFixed(0)}k - $${(config.maxRevenue / 1000).toFixed(0)}k`,
  }))
}
