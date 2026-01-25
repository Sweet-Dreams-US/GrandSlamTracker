export interface RevenueBySource {
  sweetDreams: number
  organic: number
  referral: number
  unknown: number
}

export interface AttributionResult {
  totalRevenue: number
  attributedRevenue: number
  organicRevenue: number
  referralRevenue: number
  unknownRevenue: number
  distributedUnknown: RevenueBySource
  finalAttribution: RevenueBySource
  attributionRate: number
  unknownRate: number
}

/**
 * Calculate revenue attribution with distribution of unknown sources
 */
export function calculateAttribution(
  revenueBySource: RevenueBySource,
  options: {
    unknownDistribution?: 'proportional' | 'sweetDreams' | 'organic' | 'split'
    splitRatio?: { sweetDreams: number; organic: number; referral: number }
  } = {}
): AttributionResult {
  const {
    unknownDistribution = 'proportional',
    splitRatio = { sweetDreams: 0.5, organic: 0.3, referral: 0.2 }
  } = options

  const { sweetDreams, organic, referral, unknown } = revenueBySource
  const totalRevenue = sweetDreams + organic + referral + unknown
  const knownRevenue = sweetDreams + organic + referral

  // Distribute unknown revenue
  let distributedUnknown: RevenueBySource = {
    sweetDreams: 0,
    organic: 0,
    referral: 0,
    unknown: 0,
  }

  if (unknown > 0) {
    switch (unknownDistribution) {
      case 'proportional':
        // Distribute proportionally based on known sources
        if (knownRevenue > 0) {
          distributedUnknown = {
            sweetDreams: unknown * (sweetDreams / knownRevenue),
            organic: unknown * (organic / knownRevenue),
            referral: unknown * (referral / knownRevenue),
            unknown: 0,
          }
        } else {
          // If no known sources, assume all unknown is organic
          distributedUnknown = { sweetDreams: 0, organic: unknown, referral: 0, unknown: 0 }
        }
        break

      case 'sweetDreams':
        // Assume all unknown is Sweet Dreams attributed
        distributedUnknown = { sweetDreams: unknown, organic: 0, referral: 0, unknown: 0 }
        break

      case 'organic':
        // Assume all unknown is organic
        distributedUnknown = { sweetDreams: 0, organic: unknown, referral: 0, unknown: 0 }
        break

      case 'split':
        // Use custom split ratio
        distributedUnknown = {
          sweetDreams: unknown * splitRatio.sweetDreams,
          organic: unknown * splitRatio.organic,
          referral: unknown * splitRatio.referral,
          unknown: 0,
        }
        break
    }
  }

  // Calculate final attribution
  const finalAttribution: RevenueBySource = {
    sweetDreams: sweetDreams + distributedUnknown.sweetDreams,
    organic: organic + distributedUnknown.organic,
    referral: referral + distributedUnknown.referral,
    unknown: 0,
  }

  // Calculate rates
  const attributionRate = totalRevenue > 0
    ? (finalAttribution.sweetDreams / totalRevenue) * 100
    : 0
  const unknownRate = totalRevenue > 0
    ? (unknown / totalRevenue) * 100
    : 0

  return {
    totalRevenue: round2(totalRevenue),
    attributedRevenue: round2(sweetDreams),
    organicRevenue: round2(organic),
    referralRevenue: round2(referral),
    unknownRevenue: round2(unknown),
    distributedUnknown: {
      sweetDreams: round2(distributedUnknown.sweetDreams),
      organic: round2(distributedUnknown.organic),
      referral: round2(distributedUnknown.referral),
      unknown: 0,
    },
    finalAttribution: {
      sweetDreams: round2(finalAttribution.sweetDreams),
      organic: round2(finalAttribution.organic),
      referral: round2(finalAttribution.referral),
      unknown: 0,
    },
    attributionRate: round2(attributionRate),
    unknownRate: round2(unknownRate),
  }
}

/**
 * Calculate attribution from lead data
 */
export interface LeadData {
  source: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
  value: number
  confidence: 'confirmed' | 'likely' | 'assumed' | 'unknown'
}

export function calculateAttributionFromLeads(leads: LeadData[]): RevenueBySource {
  // Weight by confidence level
  const confidenceWeights = {
    confirmed: 1.0,
    likely: 0.9,
    assumed: 0.7,
    unknown: 0.5,
  }

  const result: RevenueBySource = {
    sweetDreams: 0,
    organic: 0,
    referral: 0,
    unknown: 0,
  }

  for (const lead of leads) {
    const weight = confidenceWeights[lead.confidence]
    const weightedValue = lead.value * weight

    // If confidence is unknown, add to unknown bucket regardless of source
    if (lead.confidence === 'unknown') {
      result.unknown += lead.value
    } else {
      result[lead.source] += weightedValue
      // Add remainder to unknown
      result.unknown += lead.value * (1 - weight)
    }
  }

  return {
    sweetDreams: round2(result.sweetDreams),
    organic: round2(result.organic),
    referral: round2(result.referral),
    unknown: round2(result.unknown),
  }
}

/**
 * Get attribution health indicators
 */
export function getAttributionHealth(result: AttributionResult): {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
} {
  const issues: string[] = []

  if (result.unknownRate > 30) {
    issues.push('High unknown revenue (>30%) - improve tracking')
  }
  if (result.attributionRate < 20) {
    issues.push('Low Sweet Dreams attribution (<20%)')
  }
  if (result.attributedRevenue === 0 && result.totalRevenue > 0) {
    issues.push('No revenue attributed to Sweet Dreams')
  }

  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (issues.length > 0) status = 'warning'
  if (result.unknownRate > 50 || result.attributionRate < 10) status = 'critical'

  return { status, issues }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
