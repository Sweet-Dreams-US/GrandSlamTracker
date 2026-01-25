export interface BuyoutInput {
  // Revenue history
  monthsOfSustainedGrowth: number // Consecutive months with positive uplift
  averageMonthlyFee: number
  totalFeesCollected: number

  // Contract details
  contractStartDate: Date
  hasCustomCode: boolean
  hasAISystems: boolean
  hasExclusiveContent: boolean

  // Performance metrics
  averageUpliftPercentage: number
  peakUpliftPercentage: number
}

export interface BuyoutCalculationResult {
  baseMultiplier: number
  longevityMultiplier: number
  performanceMultiplier: number
  assetPremium: number
  totalMultiplier: number
  baseFeeAmount: number
  buyoutAmount: number
  breakdown: {
    baseCalculation: string
    longevityBonus: number
    performanceBonus: number
    assetPremiums: { name: string; amount: number }[]
  }
  paymentOptions: {
    lumpSum: number
    threeMonth: { monthly: number; total: number }
    sixMonth: { monthly: number; total: number }
  }
}

/**
 * Calculate buyout/exit fee for a client
 * Based on sustained growth duration and value delivered
 */
export function calculateBuyout(input: BuyoutInput): BuyoutCalculationResult {
  const {
    monthsOfSustainedGrowth,
    averageMonthlyFee,
    totalFeesCollected,
    contractStartDate,
    hasCustomCode,
    hasAISystems,
    hasExclusiveContent,
    averageUpliftPercentage,
    peakUpliftPercentage,
  } = input

  // 1. Base multiplier (1x to 6x based on months of sustained growth)
  const baseMultiplier = calculateBaseMultiplier(monthsOfSustainedGrowth)

  // 2. Longevity multiplier (up to 2x for long-term clients)
  const monthsAsClient = getMonthsDifference(contractStartDate, new Date())
  const longevityMultiplier = calculateLongevityMultiplier(monthsAsClient)

  // 3. Performance multiplier (up to 1.5x for high performers)
  const performanceMultiplier = calculatePerformanceMultiplier(
    averageUpliftPercentage,
    peakUpliftPercentage
  )

  // 4. Asset premiums (fixed amounts for custom work)
  const assetPremiums: { name: string; amount: number }[] = []
  let assetPremiumTotal = 0

  if (hasCustomCode) {
    const premium = Math.max(5000, averageMonthlyFee * 2)
    assetPremiums.push({ name: 'Custom Code/Systems', amount: premium })
    assetPremiumTotal += premium
  }

  if (hasAISystems) {
    const premium = Math.max(10000, averageMonthlyFee * 4)
    assetPremiums.push({ name: 'AI/ML Systems', amount: premium })
    assetPremiumTotal += premium
  }

  if (hasExclusiveContent) {
    const premium = Math.max(2500, averageMonthlyFee)
    assetPremiums.push({ name: 'Exclusive Content Library', amount: premium })
    assetPremiumTotal += premium
  }

  // Calculate totals
  const totalMultiplier = baseMultiplier * longevityMultiplier * performanceMultiplier
  const baseFeeAmount = averageMonthlyFee * baseMultiplier
  const multipliedAmount = averageMonthlyFee * totalMultiplier
  const buyoutAmount = round2(multipliedAmount + assetPremiumTotal)

  // Payment options
  const threeMonthInterest = 1.05 // 5% interest
  const sixMonthInterest = 1.10 // 10% interest

  return {
    baseMultiplier,
    longevityMultiplier: round2(longevityMultiplier),
    performanceMultiplier: round2(performanceMultiplier),
    assetPremium: assetPremiumTotal,
    totalMultiplier: round2(totalMultiplier),
    baseFeeAmount: round2(baseFeeAmount),
    buyoutAmount,
    breakdown: {
      baseCalculation: `${averageMonthlyFee.toLocaleString()} × ${baseMultiplier}x`,
      longevityBonus: round2((longevityMultiplier - 1) * 100),
      performanceBonus: round2((performanceMultiplier - 1) * 100),
      assetPremiums,
    },
    paymentOptions: {
      lumpSum: buyoutAmount,
      threeMonth: {
        monthly: round2((buyoutAmount * threeMonthInterest) / 3),
        total: round2(buyoutAmount * threeMonthInterest),
      },
      sixMonth: {
        monthly: round2((buyoutAmount * sixMonthInterest) / 6),
        total: round2(buyoutAmount * sixMonthInterest),
      },
    },
  }
}

/**
 * Base multiplier based on months of sustained growth
 */
function calculateBaseMultiplier(monthsOfSustainedGrowth: number): number {
  if (monthsOfSustainedGrowth < 3) return 1
  if (monthsOfSustainedGrowth < 6) return 2
  if (monthsOfSustainedGrowth < 12) return 3
  if (monthsOfSustainedGrowth < 18) return 4
  if (monthsOfSustainedGrowth < 24) return 5
  return 6 // Max 6x for 2+ years
}

/**
 * Longevity multiplier based on total months as client
 */
function calculateLongevityMultiplier(monthsAsClient: number): number {
  if (monthsAsClient < 6) return 1.0
  if (monthsAsClient < 12) return 1.2
  if (monthsAsClient < 24) return 1.5
  if (monthsAsClient < 36) return 1.75
  return 2.0 // Max 2x for 3+ years
}

/**
 * Performance multiplier based on uplift metrics
 */
function calculatePerformanceMultiplier(
  averageUplift: number,
  peakUplift: number
): number {
  // Average contribution (up to 0.25)
  let avgBonus = 0
  if (averageUplift >= 50) avgBonus = 0.25
  else if (averageUplift >= 30) avgBonus = 0.15
  else if (averageUplift >= 15) avgBonus = 0.05

  // Peak contribution (up to 0.25)
  let peakBonus = 0
  if (peakUplift >= 100) peakBonus = 0.25
  else if (peakUplift >= 75) peakBonus = 0.15
  else if (peakUplift >= 50) peakBonus = 0.10

  return 1 + avgBonus + peakBonus // Max 1.5x
}

/**
 * Calculate months between two dates
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
  const years = endDate.getFullYear() - startDate.getFullYear()
  const months = endDate.getMonth() - startDate.getMonth()
  return years * 12 + months
}

/**
 * Estimate buyout based on simpler inputs (for prospects)
 */
export function estimateBuyout(
  monthlyFee: number,
  projectedMonths: number,
  hasCustomWork: boolean = false
): { lowEstimate: number; highEstimate: number; typical: number } {
  const baseMultiplier = calculateBaseMultiplier(projectedMonths)
  const lowMultiplier = baseMultiplier * 1.0
  const highMultiplier = baseMultiplier * 1.5 * 1.2 // Include potential bonuses

  const customPremium = hasCustomWork ? monthlyFee * 3 : 0

  return {
    lowEstimate: round2(monthlyFee * lowMultiplier + customPremium * 0.5),
    highEstimate: round2(monthlyFee * highMultiplier + customPremium),
    typical: round2(monthlyFee * baseMultiplier * 1.25 + customPremium * 0.75),
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
