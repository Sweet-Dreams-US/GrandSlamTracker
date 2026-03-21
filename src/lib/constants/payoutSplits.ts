// ─────────────────────────────────────────────────────────────
// Payout split configurations for Sweet Dreams US (Media Agency)
//
// Variable tiered splits — see splitStructure.ts for the
// canonical tier definitions and calculation helpers.
// ─────────────────────────────────────────────────────────────

import {
  type MediaRevenueTier,
  MEDIA_REVENUE_TIERS,
  getMediaSplitTier,
  calculateMediaSplit,
} from './splitStructure'

export interface PayoutSplit {
  business: number
  sales: number
  worker: number
}

// ── Convenience re-exports ──────────────────────────────────
export { MEDIA_REVENUE_TIERS, getMediaSplitTier, calculateMediaSplit }
export type { MediaRevenueTier }

// ── Legacy helpers (kept for backward compatibility) ────────

/**
 * @deprecated Use `getMediaSplitTier()` from splitStructure.ts instead.
 * Returns a PayoutSplit for a given project revenue amount using the
 * tiered structure.
 */
export function getSplitForAmount(amount: number): PayoutSplit {
  const tier = getMediaSplitTier(amount)
  return {
    business: tier.business,
    sales: tier.salesReward,
    worker: tier.worker,
  }
}

/**
 * @deprecated Use `calculateMediaSplit()` from splitStructure.ts instead.
 */
export function calculatePayout(
  totalFee: number,
  _contractType: string = 'standard',
  _useAmountTiers: boolean = true,
): { business: number; sales: number; worker: number } {
  const split = calculateMediaSplit(totalFee, false)
  const tier = getMediaSplitTier(totalFee)
  return {
    business: split.businessAmount,
    sales: split.salesAmount,
    worker: split.workerAmount,
  }
}
