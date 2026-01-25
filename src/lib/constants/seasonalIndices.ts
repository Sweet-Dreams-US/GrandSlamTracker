// Seasonal adjustment indices by industry and month
// Index of 1.0 = average, >1.0 = above average, <1.0 = below average
// Months are 1-indexed (1 = January, 12 = December)

export type SeasonalProfile = 'standard' | 'summer_peak' | 'winter_peak' | 'spring_fall' | 'holiday' | 'flat'

export const SEASONAL_PROFILES: Record<SeasonalProfile, number[]> = {
  // Standard seasonal pattern (mild variation)
  standard: [0.92, 0.94, 0.98, 1.02, 1.05, 1.06, 1.04, 1.02, 1.00, 0.99, 0.98, 1.00],

  // Summer peak (HVAC, landscaping, pools)
  summer_peak: [0.70, 0.75, 0.85, 0.95, 1.10, 1.25, 1.30, 1.25, 1.05, 0.85, 0.70, 0.65],

  // Winter peak (heating, snow removal, tax prep)
  winter_peak: [1.20, 1.25, 1.15, 0.95, 0.80, 0.75, 0.70, 0.75, 0.85, 0.95, 1.15, 1.20],

  // Spring/Fall peak (remodeling, real estate, weddings)
  spring_fall: [0.85, 0.90, 1.05, 1.15, 1.20, 1.05, 0.90, 0.85, 1.00, 1.15, 1.00, 0.90],

  // Holiday peak (retail, e-commerce)
  holiday: [0.80, 0.75, 0.80, 0.85, 0.90, 0.95, 0.90, 0.95, 1.00, 1.10, 1.30, 1.40],

  // Flat (consistent year-round: medical, legal, etc.)
  flat: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
}

// Map industries to their typical seasonal profile
export const INDUSTRY_SEASONAL_PROFILES: Record<string, SeasonalProfile> = {
  // Summer peak
  hvac: 'summer_peak',
  landscaping: 'summer_peak',
  pest_control: 'summer_peak',
  auto_detailing: 'summer_peak',

  // Winter peak
  accounting: 'winter_peak',

  // Spring/Fall peak
  remodeling: 'spring_fall',
  roofing: 'spring_fall',
  real_estate: 'spring_fall',
  photography: 'spring_fall',
  videography: 'spring_fall',

  // Holiday peak
  retail: 'holiday',
  ecommerce: 'holiday',
  restaurant: 'holiday',
  cafe: 'holiday',
  beauty_salon: 'holiday',
  spa: 'holiday',

  // Flat
  legal: 'flat',
  dental: 'flat',
  medical_practice: 'flat',
  chiropractic: 'flat',
  veterinary: 'flat',
  mental_health: 'flat',
  insurance: 'flat',
  financial_services: 'flat',

  // Standard
  plumbing: 'standard',
  electrical: 'standard',
  cleaning: 'standard',
  fitness: 'standard',
  gym: 'standard',
  personal_training: 'standard',
  yoga_studio: 'standard',
  martial_arts: 'standard',
  consulting: 'standard',
  marketing_agency: 'standard',
  web_development: 'standard',
  auto_repair: 'standard',
  auto_dealership: 'standard',
  education: 'standard',
  childcare: 'standard',
  pet_services: 'standard',
  other: 'standard',
}

export function getSeasonalIndex(industry: string, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }

  const profile = INDUSTRY_SEASONAL_PROFILES[industry] ?? 'standard'
  return SEASONAL_PROFILES[profile][month - 1]
}

export function getSeasonalProfile(industry: string): SeasonalProfile {
  return INDUSTRY_SEASONAL_PROFILES[industry] ?? 'standard'
}

export function getSeasonalProfileData(profile: SeasonalProfile): number[] {
  return SEASONAL_PROFILES[profile]
}
