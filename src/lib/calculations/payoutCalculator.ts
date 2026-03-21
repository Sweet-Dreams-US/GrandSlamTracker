import {
  PayoutSplit,
  getSplitForAmount,
} from '../constants/payoutSplits'

export interface PayoutCalculationResult {
  totalFee: number
  businessAmount: number
  salesAmount: number
  workerAmount: number
  splitUsed: PayoutSplit
  breakdown: {
    businessPercentage: number
    salesPercentage: number
    workerPercentage: number
  }
}

/**
 * Calculate internal payout splits for a fee
 */
export function calculatePayout(
  totalFee: number,
  options: {
    contractType?: string
    useAmountTiers?: boolean
    customSplit?: PayoutSplit
  } = {}
): PayoutCalculationResult {
  const { contractType: _contractType = 'standard', useAmountTiers = true, customSplit } = options

  // Determine which split to use — always use tiered amounts by default
  let split: PayoutSplit

  if (customSplit) {
    split = customSplit
  } else {
    split = getSplitForAmount(totalFee)
  }

  // Validate split adds up to 1
  const totalSplit = split.business + split.sales + split.worker
  if (Math.abs(totalSplit - 1) > 0.001) {
    // Normalize if needed
    split = {
      business: split.business / totalSplit,
      sales: split.sales / totalSplit,
      worker: split.worker / totalSplit,
    }
  }

  // Calculate amounts
  const businessAmount = round2(totalFee * split.business)
  const salesAmount = round2(totalFee * split.sales)
  // Worker gets remainder to avoid rounding issues
  const workerAmount = round2(totalFee - businessAmount - salesAmount)

  return {
    totalFee,
    businessAmount,
    salesAmount,
    workerAmount,
    splitUsed: split,
    breakdown: {
      businessPercentage: round2(split.business * 100),
      salesPercentage: round2(split.sales * 100),
      workerPercentage: round2(split.worker * 100),
    },
  }
}

/**
 * Calculate aggregate payouts for multiple fees
 */
export interface FeeForPayout {
  feeAmount: number
  contractType?: string
}

export interface AggregatePayoutResult {
  totalFees: number
  totalBusiness: number
  totalSales: number
  totalWorker: number
  feeBreakdowns: PayoutCalculationResult[]
}

export function calculateAggregatePayouts(
  fees: FeeForPayout[],
  options: { useAmountTiers?: boolean } = {}
): AggregatePayoutResult {
  const { useAmountTiers = false } = options

  const feeBreakdowns: PayoutCalculationResult[] = fees.map((fee) =>
    calculatePayout(fee.feeAmount, {
      contractType: fee.contractType,
      useAmountTiers,
    })
  )

  const totalFees = feeBreakdowns.reduce((sum, p) => sum + p.totalFee, 0)
  const totalBusiness = feeBreakdowns.reduce((sum, p) => sum + p.businessAmount, 0)
  const totalSales = feeBreakdowns.reduce((sum, p) => sum + p.salesAmount, 0)
  const totalWorker = feeBreakdowns.reduce((sum, p) => sum + p.workerAmount, 0)

  return {
    totalFees: round2(totalFees),
    totalBusiness: round2(totalBusiness),
    totalSales: round2(totalSales),
    totalWorker: round2(totalWorker),
    feeBreakdowns,
  }
}

/**
 * Calculate payout after deductions (taxes, expenses)
 */
export interface PayoutWithDeductions {
  grossPayout: number
  deductions: { name: string; amount: number }[]
  netPayout: number
}

export function calculatePayoutWithDeductions(
  grossPayout: number,
  deductions: { name: string; percentage?: number; fixed?: number }[]
): PayoutWithDeductions {
  const appliedDeductions: { name: string; amount: number }[] = []
  let remainingAmount = grossPayout

  for (const deduction of deductions) {
    let amount = 0
    if (deduction.fixed !== undefined) {
      amount = deduction.fixed
    } else if (deduction.percentage !== undefined) {
      amount = grossPayout * (deduction.percentage / 100)
    }
    appliedDeductions.push({ name: deduction.name, amount: round2(amount) })
    remainingAmount -= amount
  }

  return {
    grossPayout,
    deductions: appliedDeductions,
    netPayout: round2(Math.max(0, remainingAmount)),
  }
}

/**
 * Format payout for display
 */
export function formatPayoutSummary(result: PayoutCalculationResult): string {
  const lines = [
    `Total Fee: $${result.totalFee.toLocaleString()}`,
    '',
    'Payout Split:',
    `  Business (${result.breakdown.businessPercentage}%): $${result.businessAmount.toLocaleString()}`,
    `  Sales (${result.breakdown.salesPercentage}%): $${result.salesAmount.toLocaleString()}`,
    `  Worker (${result.breakdown.workerPercentage}%): $${result.workerAmount.toLocaleString()}`,
  ]
  return lines.join('\n')
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
