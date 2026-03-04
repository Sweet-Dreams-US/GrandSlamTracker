/**
 * Deal Payout Calculator
 * Handles client fee calculation (Grand Slam growth tiers),
 * internal payout splits (progressive/marginal tiers by deal type + revenue),
 * and buyout calculations.
 *
 * IMPORTANT: Internal splits are PROGRESSIVE — like tax brackets.
 * Each tier's percentages apply only to the dollars that fall within that tier.
 */

import {
  DealType,
  CLIENT_FEE_FIRST_TIER_CAP,
  CLIENT_FEE_FIRST_TIER_RATE,
  CLIENT_FEE_GROWTH_TIERS,
  getPayoutTiers,
  getBuyoutMultiplier,
} from '../constants/dealTypes'
import { getBusinessSizeCategory } from '../constants/feeStructure'

// --- Types ---

export interface ClientFeeBreakdown {
  totalGrowth: number
  growthPercent: number
  firstTierAmount: number
  firstTierFee: number
  progressiveTiers: {
    label: string
    rate: number
    adjustedRate: number
    amountInTier: number
    fee: number
  }[]
  totalFee: number
  businessSizeCategory: string
  sizeAdjustmentFactor: number
}

export interface TierBreakdownLine {
  tierLabel: string
  amountInTier: number
  salesPercent: number
  workerPercent: number
  businessPercent: number
  salesAmount: number
  workerAmount: number
  businessAmount: number
}

export interface InternalSplit {
  tierBreakdown: TierBreakdownLine[]
  effectiveSalesPercent: number
  effectiveWorkerPercent: number
  effectiveBusinessPercent: number
  businessAmount: number
  salesAmount: number
  workerAmount: number
}

export interface DealPayoutResult {
  dealType: DealType
  totalRevenue: number
  clientFeeBreakdown: ClientFeeBreakdown | null
  buyoutDetails: BuyoutDetails | null
  internalSplit: InternalSplit
  isValid: boolean
}

export interface BuyoutDetails {
  avgMonthlyRevenue: number
  partnershipMonths: number
  multiplier: number
  buyoutAmount: number
}

// --- Size adjustment factors ---

const SIZE_ADJUSTMENT_FACTORS: Record<string, number> = {
  micro: 1.0,
  small: 0.95,
  medium: 0.85,
  large: 0.75,
  major: 0.65,
  enterprise: 0.55,
  elite: 0.45,
}

function getSizeAdjustmentFactor(baseline: number): number {
  const category = getBusinessSizeCategory(baseline)
  return SIZE_ADJUSTMENT_FACTORS[category] ?? 1.0
}

// --- Client Fee Calculation (Grand Slam Monthly) ---

export function calculateClientFee(
  baselineRevenue: number,
  currentRevenue: number
): ClientFeeBreakdown {
  const totalGrowth = Math.max(0, currentRevenue - baselineRevenue)
  const growthPercent = baselineRevenue > 0 ? totalGrowth / baselineRevenue : 0

  const category = getBusinessSizeCategory(baselineRevenue)
  const sizeFactor = getSizeAdjustmentFactor(baselineRevenue)

  const firstTierAmount = Math.min(totalGrowth, CLIENT_FEE_FIRST_TIER_CAP)
  const firstTierFee = round2(firstTierAmount * CLIENT_FEE_FIRST_TIER_RATE)

  const remainingGrowth = Math.max(0, totalGrowth - CLIENT_FEE_FIRST_TIER_CAP)
  const progressiveTiers: ClientFeeBreakdown['progressiveTiers'] = []

  if (remainingGrowth > 0) {
    for (const tier of CLIENT_FEE_GROWTH_TIERS) {
      if (
        growthPercent >= tier.minGrowthPercent &&
        (tier.maxGrowthPercent === null || growthPercent < tier.maxGrowthPercent)
      ) {
        const adjustedRate = round4(tier.rate * sizeFactor)
        const fee = round2(remainingGrowth * adjustedRate)
        progressiveTiers.push({
          label: tier.label,
          rate: tier.rate,
          adjustedRate,
          amountInTier: remainingGrowth,
          fee,
        })
        break
      }
    }

    if (progressiveTiers.length === 0) {
      const lastTier = CLIENT_FEE_GROWTH_TIERS[CLIENT_FEE_GROWTH_TIERS.length - 1]
      const adjustedRate = round4(lastTier.rate * sizeFactor)
      const fee = round2(remainingGrowth * adjustedRate)
      progressiveTiers.push({
        label: lastTier.label,
        rate: lastTier.rate,
        adjustedRate,
        amountInTier: remainingGrowth,
        fee,
      })
    }
  }

  const totalFee = round2(
    firstTierFee + progressiveTiers.reduce((sum, t) => sum + t.fee, 0)
  )

  return {
    totalGrowth,
    growthPercent,
    firstTierAmount,
    firstTierFee,
    progressiveTiers,
    totalFee,
    businessSizeCategory: category,
    sizeAdjustmentFactor: sizeFactor,
  }
}

// --- Progressive Internal Split Calculation ---

/**
 * Calculates payout splits progressively across tiers.
 * Each tier's rates apply only to the portion of revenue within that bracket.
 *
 * Example: $6,500 transactional with tiers $0-$5k (20% sales) and $5k-$15k (15% sales)
 *   → First $5,000: 20% sales = $1,000
 *   → Next $1,500:  15% sales = $225
 *   → Total sales = $1,225
 */
export function calculateInternalSplit(
  dealType: DealType,
  totalRevenue: number,
  options?: { excludeSales?: boolean }
): InternalSplit {
  const tiers = getPayoutTiers(dealType)
  const tierBreakdown: TierBreakdownLine[] = []
  const excludeSales = options?.excludeSales ?? false

  let remaining = totalRevenue

  for (const tier of tiers) {
    if (remaining <= 0) break

    const tierWidth = tier.maxRevenue !== null
      ? tier.maxRevenue - tier.minRevenue
      : Infinity

    const amountInTier = Math.min(remaining, tierWidth)

    const businessAmt = round2(amountInTier * tier.businessPercent)
    const salesAmt = excludeSales ? 0 : round2(amountInTier * tier.salesPercent)
    const workerAmt = round2(amountInTier - businessAmt - salesAmt)

    tierBreakdown.push({
      tierLabel: tier.label,
      amountInTier,
      salesPercent: excludeSales ? 0 : tier.salesPercent,
      workerPercent: excludeSales ? (1 - tier.businessPercent) : tier.workerPercent,
      businessPercent: tier.businessPercent,
      salesAmount: salesAmt,
      workerAmount: workerAmt,
      businessAmount: businessAmt,
    })

    remaining -= amountInTier
  }

  const businessAmount = round2(tierBreakdown.reduce((s, t) => s + t.businessAmount, 0))
  const salesAmount = round2(tierBreakdown.reduce((s, t) => s + t.salesAmount, 0))
  const workerAmount = round2(totalRevenue - businessAmount - salesAmount)

  const effectiveBusinessPercent = totalRevenue > 0 ? businessAmount / totalRevenue : 0
  const effectiveSalesPercent = totalRevenue > 0 ? salesAmount / totalRevenue : 0
  const effectiveWorkerPercent = totalRevenue > 0 ? workerAmount / totalRevenue : 0

  return {
    tierBreakdown,
    effectiveSalesPercent,
    effectiveWorkerPercent,
    effectiveBusinessPercent,
    businessAmount,
    salesAmount,
    workerAmount,
  }
}

// --- Buyout Calculation ---

export function calculateBuyout(
  last3MonthsRevenue: [number, number, number],
  partnershipMonths: number
): BuyoutDetails {
  const avgMonthlyRevenue = round2(
    (last3MonthsRevenue[0] + last3MonthsRevenue[1] + last3MonthsRevenue[2]) / 3
  )
  const multiplier = getBuyoutMultiplier(partnershipMonths)
  const buyoutAmount = round2(avgMonthlyRevenue * multiplier)

  return {
    avgMonthlyRevenue,
    partnershipMonths,
    multiplier,
    buyoutAmount,
  }
}

// --- Full Deal Payout Calculation ---

export interface GrandSlamMonthlyInput {
  dealType: 'grand_slam_monthly'
  clientName: string
  baselineRevenue: number
  currentRevenue: number
}

export interface GrandSlamUpfrontInput {
  dealType: 'grand_slam_upfront'
  clientName: string
  contractAmount: number
}

export interface TransactionalInput {
  dealType: 'transactional'
  clientName: string
  projectFee: number
}

export interface BuyoutInput {
  dealType: 'buyout'
  clientName: string
  last3MonthsRevenue: [number, number, number]
  partnershipMonths: number
}

export type DealInput =
  | GrandSlamMonthlyInput
  | GrandSlamUpfrontInput
  | TransactionalInput
  | BuyoutInput

export function calculateDealPayout(input: DealInput, options?: { excludeSales?: boolean }): DealPayoutResult {
  let totalRevenue: number
  let clientFeeBreakdown: ClientFeeBreakdown | null = null
  let buyoutDetails: BuyoutDetails | null = null

  switch (input.dealType) {
    case 'grand_slam_monthly': {
      const feeCalc = calculateClientFee(input.baselineRevenue, input.currentRevenue)
      clientFeeBreakdown = feeCalc
      totalRevenue = feeCalc.totalFee
      break
    }
    case 'grand_slam_upfront': {
      totalRevenue = input.contractAmount
      break
    }
    case 'transactional': {
      totalRevenue = input.projectFee
      break
    }
    case 'buyout': {
      const buyout = calculateBuyout(input.last3MonthsRevenue, input.partnershipMonths)
      buyoutDetails = buyout
      totalRevenue = buyout.buyoutAmount
      break
    }
  }

  const internalSplit = calculateInternalSplit(input.dealType, totalRevenue, options)

  const splitTotal = round2(
    internalSplit.businessAmount + internalSplit.salesAmount + internalSplit.workerAmount
  )
  const isValid = Math.abs(splitTotal - totalRevenue) < 0.02

  return {
    dealType: input.dealType,
    totalRevenue,
    clientFeeBreakdown,
    buyoutDetails,
    internalSplit,
    isValid,
  }
}

// --- Helpers ---

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000
}
