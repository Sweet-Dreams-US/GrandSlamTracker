// Internal payout split configurations
// Business always gets 30%, remaining 70% split between sales and worker

export interface PayoutSplit {
  business: number
  sales: number
  worker: number
}

// Default split for standard contracts
export const DEFAULT_SPLIT: PayoutSplit = {
  business: 0.30,
  sales: 0.35,
  worker: 0.35,
}

// Split when there's no dedicated salesperson (owner referred)
export const NO_SALES_SPLIT: PayoutSplit = {
  business: 0.30,
  sales: 0.00,
  worker: 0.70,
}

// Split for self-generated leads
export const SELF_GENERATED_SPLIT: PayoutSplit = {
  business: 0.30,
  sales: 0.20,
  worker: 0.50,
}

// Contract type splits
export const CONTRACT_TYPE_SPLITS: Record<string, PayoutSplit> = {
  standard: DEFAULT_SPLIT,
  referral: {
    business: 0.30,
    sales: 0.40,
    worker: 0.30,
  },
  partnership: {
    business: 0.40,
    sales: 0.30,
    worker: 0.30,
  },
  owner_direct: NO_SALES_SPLIT,
  self_generated: SELF_GENERATED_SPLIT,
}

// Tiered splits based on fee amount (larger fees = adjusted percentages)
export interface TieredSplit {
  maxAmount: number | null
  split: PayoutSplit
}

export const AMOUNT_TIERED_SPLITS: TieredSplit[] = [
  {
    maxAmount: 1000,
    split: { business: 0.30, sales: 0.35, worker: 0.35 },
  },
  {
    maxAmount: 3000,
    split: { business: 0.30, sales: 0.33, worker: 0.37 },
  },
  {
    maxAmount: 5000,
    split: { business: 0.30, sales: 0.30, worker: 0.40 },
  },
  {
    maxAmount: null, // No limit
    split: { business: 0.30, sales: 0.28, worker: 0.42 },
  },
]

export function getSplitForContractType(contractType: string): PayoutSplit {
  return CONTRACT_TYPE_SPLITS[contractType] ?? DEFAULT_SPLIT
}

export function getSplitForAmount(amount: number): PayoutSplit {
  for (const tier of AMOUNT_TIERED_SPLITS) {
    if (tier.maxAmount === null || amount <= tier.maxAmount) {
      return tier.split
    }
  }
  return DEFAULT_SPLIT
}

export function calculatePayout(
  totalFee: number,
  contractType: string = 'standard',
  useAmountTiers: boolean = false
): { business: number; sales: number; worker: number } {
  const split = useAmountTiers
    ? getSplitForAmount(totalFee)
    : getSplitForContractType(contractType)

  return {
    business: Math.round(totalFee * split.business * 100) / 100,
    sales: Math.round(totalFee * split.sales * 100) / 100,
    worker: Math.round(totalFee * split.worker * 100) / 100,
  }
}
