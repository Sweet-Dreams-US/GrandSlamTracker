// ─────────────────────────────────────────────────────────────
// Split structures for both Sweet Dreams entities
// ─────────────────────────────────────────────────────────────

// ── Sweet Dreams Music (Studio) ─────────────────────────────

/** Recording session revenue split */
export const STUDIO_SPLITS = {
  engineer: 0.60,
  business: 0.40,
} as const

/** Media work performed through the studio by an engineer */
export const STUDIO_MEDIA_SPLITS = {
  /** Engineer produces the content */
  production: { engineer: 0.65, business: 0.35 },
  /** Engineer upsells but does NOT produce — flat sales commission */
  salesCommission: 0.15,
} as const

/** Studio room rates */
export const STUDIO_RATES = {
  studio_a: {
    name: 'Studio A',
    daw: 'Pro Tools',
    hourly: 70,
    blockRate: 180,
    blockHours: 3,
  },
  studio_b: {
    name: 'Studio B',
    daw: 'Ableton',
    hourly: 50,
    blockRate: 120,
    blockHours: 3,
  },
} as const

export type StudioRoomId = keyof typeof STUDIO_RATES

/** Active studio engineers */
export const STUDIO_ENGINEERS = [
  'PRVRB',
  'Iszac Griner',
  'Zion Tinsley',
  'Jay Val Leo',
] as const

export type StudioEngineer = (typeof STUDIO_ENGINEERS)[number]

// ── Sweet Dreams US (Media Agency) ──────────────────────────

export interface MediaRevenueTier {
  label: string
  min: number
  /** null = no upper bound */
  max: number | null
  salesReward: number
  worker: number
  business: number
}

/**
 * Variable tiered splits for Sweet Dreams US media projects.
 * Percentages are expressed as decimals (0.15 = 15%).
 */
export const MEDIA_REVENUE_TIERS: MediaRevenueTier[] = [
  { label: '$0 – $5,000',       min: 0,      max: 5_000,   salesReward: 0.15, worker: 0.50, business: 0.35 },
  { label: '$5,001 – $15,000',  min: 5_001,  max: 15_000,  salesReward: 0.12, worker: 0.55, business: 0.33 },
  { label: '$15,001 – $30,000', min: 15_001, max: 30_000,  salesReward: 0.10, worker: 0.60, business: 0.30 },
  { label: '$30,001 – $70,000', min: 30_001, max: 70_000,  salesReward: 0.10, worker: 0.62, business: 0.28 },
  { label: '$70,001+',          min: 70_001, max: null,     salesReward: 0.10, worker: 0.65, business: 0.25 },
]

/**
 * Return the matching revenue tier for a given gross revenue amount.
 */
export function getMediaSplitTier(grossRevenue: number): MediaRevenueTier {
  for (const tier of MEDIA_REVENUE_TIERS) {
    if (tier.max === null || grossRevenue <= tier.max) {
      return tier
    }
  }
  // Fallback (should never happen — last tier has max=null)
  return MEDIA_REVENUE_TIERS[MEDIA_REVENUE_TIERS.length - 1]
}

export interface MediaSplitResult {
  tier: MediaRevenueTier
  salesAmount: number
  workerAmount: number
  businessAmount: number
}

/**
 * Calculate the dollar split for a media project.
 *
 * When there is no salesperson the sales reward is folded into the
 * business share (the business originated the deal).
 */
export function calculateMediaSplit(
  grossRevenue: number,
  hasSalesPerson: boolean = false,
): MediaSplitResult {
  const tier = getMediaSplitTier(grossRevenue)

  const salesAmount = hasSalesPerson
    ? Math.round(grossRevenue * tier.salesReward * 100) / 100
    : 0

  const workerAmount = Math.round(grossRevenue * tier.worker * 100) / 100

  // When no salesperson, business absorbs sales reward share
  const businessAmount = hasSalesPerson
    ? Math.round(grossRevenue * tier.business * 100) / 100
    : Math.round(grossRevenue * (tier.business + tier.salesReward) * 100) / 100

  return { tier, salesAmount, workerAmount, businessAmount }
}
