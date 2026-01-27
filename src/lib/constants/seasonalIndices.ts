// Seasonal adjustment indices by industry and month
// Index of 1.0 = average, >1.0 = above average, <1.0 = below average
// Months are 1-indexed (1 = January, 12 = December)
// Source: U.S. Census Bureau, trade association reports, and industry transaction data

// Per-industry monthly seasonal factors [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
export const INDUSTRY_SEASONAL_FACTORS: Record<string, number[]> = {
  // ── Home Services ──────────────────────────────────────────────────────────
  // Remodeling / Building Materials & Garden
  remodeling:     [0.80, 0.79, 0.95, 1.13, 1.17, 1.14, 1.11, 1.01, 1.01, 1.06, 0.91, 0.89],
  // HVAC (bimodal: summer AC peak + winter heating peak)
  hvac:           [1.10, 0.95, 0.80, 0.85, 1.05, 1.35, 1.45, 1.35, 0.95, 0.85, 0.90, 1.15],
  // Plumbing (holiday clogs + frozen pipes)
  plumbing:       [1.05, 1.00, 0.95, 0.95, 0.95, 1.00, 1.00, 1.00, 1.05, 1.00, 1.10, 1.15],
  // Electrical (follows remodeling/construction cycle)
  electrical:     [0.85, 0.85, 0.95, 1.05, 1.10, 1.15, 1.10, 1.05, 1.00, 1.00, 0.95, 0.90],
  // Roofing (weather-dependent, spring/fall optimal)
  roofing:        [0.70, 0.70, 0.90, 1.10, 1.20, 1.25, 1.20, 1.15, 1.10, 1.05, 0.85, 0.70],
  // Landscaping (bell-shaped, summer peak)
  landscaping:    [0.40, 0.45, 0.80, 1.20, 1.40, 1.50, 1.35, 1.30, 1.20, 1.00, 0.80, 0.50],
  // Cleaning Services (mild seasonality, spring cleaning bump)
  cleaning:       [0.90, 0.90, 1.05, 1.10, 1.10, 1.05, 1.00, 1.00, 1.00, 0.95, 0.95, 1.00],
  // Pest Control (warm weather peak)
  pest_control:   [0.70, 0.70, 0.90, 1.10, 1.25, 1.35, 1.30, 1.25, 1.10, 1.00, 0.85, 0.75],
  // Pool Service (summer peak)
  pool_service:   [0.50, 0.50, 0.70, 1.00, 1.40, 1.50, 1.50, 1.40, 1.20, 0.80, 0.60, 0.50],

  // ── Health & Fitness ───────────────────────────────────────────────────────
  // Gym Signups (New Year's Resolution effect)
  fitness:        [1.60, 1.30, 1.10, 0.90, 0.90, 0.90, 0.85, 0.90, 1.10, 0.90, 0.80, 0.75],
  gym:            [1.60, 1.30, 1.10, 0.90, 0.90, 0.90, 0.85, 0.90, 1.10, 0.90, 0.80, 0.75],
  // Personal Training (follows gym pattern slightly smoothed)
  personal_training: [1.40, 1.20, 1.10, 0.95, 0.95, 0.90, 0.85, 0.90, 1.10, 0.95, 0.85, 0.80],
  // Yoga Studio (resolution bump + mild seasonality)
  yoga_studio:    [1.30, 1.15, 1.05, 1.00, 1.00, 0.95, 0.85, 0.90, 1.05, 0.95, 0.90, 0.85],
  // Martial Arts (school-year driven)
  martial_arts:   [1.15, 1.05, 1.00, 1.00, 0.95, 0.85, 0.85, 1.10, 1.15, 1.00, 0.95, 0.90],

  // ── Professional Services ──────────────────────────────────────────────────
  // Legal (divorce filing pattern + general practice)
  legal:          [1.10, 1.05, 1.10, 1.00, 0.95, 0.95, 0.95, 1.05, 1.00, 1.00, 0.90, 0.85],
  // Accounting / Tax Prep (extreme Q1 peak)
  accounting:     [1.50, 2.00, 2.50, 2.50, 0.40, 0.30, 0.30, 0.30, 0.40, 0.60, 0.30, 0.40],
  // Consulting (budget-cycle driven)
  consulting:     [1.10, 1.05, 1.05, 1.00, 1.00, 0.90, 0.85, 0.90, 1.10, 1.05, 1.00, 0.90],
  // Real Estate Closings (summer peak, school calendar)
  real_estate:    [0.75, 0.78, 0.90, 0.95, 1.10, 1.25, 1.20, 1.15, 1.00, 0.95, 0.85, 0.85],
  // Insurance (relatively flat)
  insurance:      [1.05, 1.00, 1.00, 1.00, 1.00, 0.95, 0.95, 1.00, 1.00, 1.05, 1.00, 1.00],
  // Financial Services (budget/tax cycle)
  financial_services: [1.10, 1.05, 1.05, 1.05, 1.00, 0.95, 0.90, 0.90, 1.00, 1.00, 1.00, 1.00],
  // Recruitment / Hiring (budget cycle, summer dip)
  recruitment:    [1.30, 1.25, 1.10, 1.00, 1.00, 0.85, 0.80, 0.90, 1.20, 1.15, 0.90, 0.60],
  // Architecture (follows construction cycle)
  architecture:   [0.85, 0.85, 0.95, 1.05, 1.10, 1.15, 1.10, 1.05, 1.00, 1.00, 0.95, 0.90],
  // Tax Preparation (extreme Q1 peak, same as accounting)
  tax_preparation: [1.50, 2.00, 2.50, 2.50, 0.40, 0.30, 0.30, 0.30, 0.40, 0.60, 0.30, 0.40],

  // ── Marketing & Tech ──────────────────────────────────────────────────────
  // Marketing Agency (follows ad spend cycle)
  marketing_agency: [0.75, 0.80, 0.90, 0.95, 1.00, 1.00, 0.95, 0.95, 1.05, 1.10, 1.25, 1.30],
  // Ad Spend (Q4 peak, Q1 recession)
  advertising:    [0.75, 0.80, 0.90, 0.95, 1.00, 1.00, 0.95, 0.95, 1.05, 1.10, 1.25, 1.30],
  // Web Development (budget cycle, Q1 new projects)
  web_development: [1.10, 1.05, 1.05, 1.00, 1.00, 0.95, 0.85, 0.85, 1.05, 1.05, 1.00, 1.00],
  // B2B Software Sales (Q4 budget flush + Q2 mid-year)
  software:       [0.70, 0.80, 1.10, 0.90, 0.90, 1.20, 0.80, 0.80, 1.10, 1.00, 1.10, 1.60],

  // ── Creative ──────────────────────────────────────────────────────────────
  // Photography (wedding/event driven)
  photography:    [0.50, 0.50, 0.70, 0.85, 1.10, 1.30, 1.15, 1.15, 1.35, 1.40, 0.85, 0.65],
  // Videography (wedding/event driven, similar to photography)
  videography:    [0.55, 0.55, 0.70, 0.85, 1.10, 1.25, 1.15, 1.10, 1.30, 1.35, 0.85, 0.70],

  // ── Retail & E-commerce ────────────────────────────────────────────────────
  // General Retail (holiday peak)
  retail:         [0.92, 0.88, 1.00, 1.00, 1.05, 0.99, 1.02, 1.02, 0.97, 1.02, 1.01, 1.13],
  // E-commerce (stronger holiday peak)
  ecommerce:      [0.92, 0.88, 0.95, 0.95, 1.00, 0.95, 1.00, 1.00, 0.95, 1.05, 1.20, 1.29],
  // Restaurant (mild holiday peak + summer)
  restaurant:     [0.90, 0.90, 0.95, 1.00, 1.05, 1.05, 1.05, 1.05, 1.00, 1.00, 1.00, 1.05],
  // Cafe/Coffee Shop (similar to restaurant, winter warm drinks)
  cafe:           [1.00, 0.95, 0.95, 0.95, 1.00, 1.05, 1.05, 1.00, 1.00, 1.00, 1.00, 1.05],
  // Furniture & Home Furnishings (moving season + holiday)
  furniture:      [0.92, 0.91, 0.97, 0.93, 1.01, 0.97, 1.03, 1.05, 0.99, 1.00, 1.06, 1.09],
  // Jewelry (extreme holiday + Valentine's + Mother's Day)
  jewelry:        [0.77, 1.20, 0.85, 0.90, 1.10, 0.90, 0.92, 0.95, 0.85, 0.90, 1.05, 2.21],
  // Clothing / Apparel (holiday + back-to-school)
  clothing:       [0.76, 0.86, 0.96, 0.98, 1.02, 0.95, 0.93, 1.02, 0.91, 0.97, 1.08, 1.55],
  // Florists (Valentine's + Mother's Day spikes)
  florist:        [0.80, 1.40, 0.90, 0.95, 1.45, 0.95, 0.80, 0.80, 0.85, 0.90, 0.95, 1.15],
  // Motor Vehicle Dealer (spring tax refund + summer)
  motor_vehicle:  [0.90, 0.95, 1.08, 1.06, 1.07, 1.05, 1.10, 1.08, 0.99, 0.95, 0.85, 1.01],
  // Department Store (holiday heavy)
  department_store: [0.85, 0.82, 0.90, 0.95, 1.00, 0.95, 0.95, 1.05, 0.95, 1.00, 1.10, 1.50],
  // Electronics Store (holiday + back-to-school)
  electronics:    [0.85, 0.80, 0.90, 0.95, 1.00, 0.95, 1.00, 1.10, 0.95, 1.00, 1.15, 1.40],
  // Grocery Store (very flat, mild holiday bump)
  grocery:        [0.98, 0.95, 1.00, 1.00, 1.00, 1.00, 1.02, 1.00, 1.00, 1.00, 1.02, 1.05],
  // Liquor Store (holiday peak + summer)
  liquor_store:   [0.95, 0.90, 0.95, 0.95, 1.00, 1.05, 1.10, 1.05, 1.00, 1.00, 1.05, 1.20],
  // Office Supplies (back-to-school + Q1 budgets)
  office_supplies: [1.15, 1.05, 1.00, 0.95, 0.95, 0.90, 0.90, 1.15, 1.10, 0.95, 0.95, 0.95],
  // Toy Store (extreme holiday peak)
  toy_store:      [0.60, 0.55, 0.70, 0.75, 0.80, 0.80, 0.85, 0.90, 0.85, 0.95, 1.40, 2.80],
  // Sporting Goods (spring + back-to-school)
  sporting_goods: [0.85, 0.85, 1.00, 1.10, 1.15, 1.10, 1.05, 1.10, 0.95, 0.90, 0.95, 1.00],

  // ── Healthcare & Wellness ──────────────────────────────────────────────────
  // Dental (back-to-school + end-of-year insurance)
  dental:         [1.05, 0.95, 1.00, 0.95, 0.90, 1.00, 1.00, 1.15, 0.90, 1.00, 1.00, 1.20],
  // Medical Practice (winter illness peak)
  medical_practice: [1.10, 1.05, 1.05, 1.00, 0.95, 0.95, 0.90, 0.95, 1.00, 1.00, 1.00, 1.05],
  // Chiropractic (mild seasonality)
  chiropractic:   [1.05, 1.00, 1.00, 1.00, 1.00, 0.95, 0.95, 1.00, 1.00, 1.00, 1.00, 1.05],
  // Veterinary (summer outdoor risks peak)
  veterinary:     [0.90, 0.90, 1.00, 1.05, 1.10, 1.15, 1.15, 1.10, 1.00, 0.95, 0.90, 0.90],
  // Mental Health (post-holiday + fall peak)
  mental_health:  [1.15, 1.10, 1.05, 1.00, 0.95, 0.90, 0.85, 0.90, 1.05, 1.05, 1.00, 1.00],
  // Plastic Surgery (winter recovery, summer touch-ups)
  plastic_surgery: [1.15, 1.10, 1.10, 1.05, 1.00, 0.85, 0.80, 0.85, 0.95, 1.00, 1.10, 1.20],
  // Tanning Salons (spring prep peak)
  tanning:        [1.00, 1.20, 1.40, 1.30, 1.20, 1.00, 0.80, 0.70, 0.70, 0.80, 0.90, 1.00],

  // ── Automotive ─────────────────────────────────────────────────────────────
  // Auto Repair (steady with mild seasonal variation)
  auto_repair:    [0.95, 0.90, 1.00, 1.05, 1.05, 1.05, 1.05, 1.05, 1.00, 1.00, 0.95, 0.95],
  // Auto Detailing (summer peak)
  auto_detailing: [0.70, 0.75, 0.90, 1.05, 1.20, 1.25, 1.30, 1.20, 1.05, 0.90, 0.80, 0.75],
  // Auto Dealership (spring tax-refund peak + summer)
  auto_dealership: [0.90, 0.95, 1.08, 1.06, 1.07, 1.05, 1.10, 1.08, 0.99, 0.95, 0.85, 1.01],
  // Boat Dealer (spring/summer peak)
  boat_dealer:    [0.50, 0.55, 0.80, 1.10, 1.35, 1.40, 1.40, 1.25, 1.00, 0.80, 0.60, 0.50],

  // ── Entertainment & Gaming ─────────────────────────────────────────────────
  // Sim Racing (indoor activity, winter league peak + year-round events)
  sim_racing:     [1.20, 1.15, 1.00, 0.90, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.10, 1.15],
  // Esports (indoor, tournament + league-season driven)
  esports:        [1.15, 1.10, 1.05, 0.95, 0.90, 0.95, 1.00, 1.05, 1.05, 1.10, 1.05, 1.10],
  // Gaming Center (indoor entertainment, bowling-like pattern)
  gaming_center:  [1.30, 1.30, 1.25, 1.10, 0.90, 0.80, 0.75, 0.80, 0.90, 1.00, 1.10, 1.20],
  // General Entertainment (theme parks + events, summer peak)
  entertainment:  [0.60, 0.70, 1.00, 1.00, 1.10, 1.40, 1.50, 1.30, 0.80, 1.10, 0.90, 1.20],
  // Events & Festivals (wedding/event calendar)
  events:         [0.40, 0.40, 0.60, 0.80, 1.10, 1.30, 1.10, 1.10, 1.40, 1.50, 0.80, 0.60],
  // Movie Theater (summer blockbusters + holiday releases)
  movie_theater:  [0.80, 0.75, 0.85, 0.85, 1.05, 1.30, 1.40, 1.20, 0.90, 0.85, 1.00, 1.20],
  // Bowling (winter indoor activity peak)
  bowling:        [1.30, 1.25, 1.15, 1.00, 0.85, 0.75, 0.70, 0.80, 0.95, 1.05, 1.15, 1.25],
  // Theme Park (summer peak)
  theme_park:     [0.50, 0.55, 0.80, 0.95, 1.10, 1.40, 1.50, 1.40, 1.00, 0.90, 0.70, 0.60],
  // Ski Resort (winter peak)
  ski_resort:     [1.50, 1.40, 1.30, 0.80, 0.40, 0.30, 0.40, 0.40, 0.50, 0.70, 1.10, 1.50],
  // Golf Course (spring/summer/fall)
  golf_course:    [0.40, 0.50, 0.80, 1.15, 1.35, 1.40, 1.40, 1.30, 1.15, 0.95, 0.60, 0.40],
  // Ice Cream Shop (summer peak)
  ice_cream:      [0.40, 0.45, 0.65, 0.90, 1.25, 1.50, 1.60, 1.50, 1.10, 0.75, 0.50, 0.40],

  // ── Travel & Hospitality ───────────────────────────────────────────────────
  // Hotels (summer leisure + fall conference)
  hotel:          [0.80, 0.85, 0.95, 1.00, 1.05, 1.15, 1.20, 1.15, 1.05, 1.05, 0.90, 0.85],
  // Cruise Line (winter escape + summer family)
  cruise:         [1.15, 1.10, 1.10, 0.90, 0.85, 1.10, 1.15, 1.05, 0.85, 0.80, 0.90, 1.05],
  // Weddings (Oct peak, summer sustained)
  wedding:        [0.40, 0.40, 0.60, 0.80, 1.10, 1.30, 1.10, 1.10, 1.40, 1.50, 0.80, 0.60],

  // ── Logistics & Storage ────────────────────────────────────────────────────
  // Moving Company (summer peak, school-driven)
  moving_company: [0.60, 0.65, 0.80, 0.90, 1.15, 1.35, 1.40, 1.30, 1.10, 0.90, 0.70, 0.60],
  // Self Storage (summer moving season)
  self_storage:   [0.85, 0.85, 0.90, 0.95, 1.10, 1.20, 1.20, 1.15, 1.05, 0.95, 0.90, 0.85],
  // Truck Rental (summer moving peak)
  truck_rental:   [0.65, 0.65, 0.80, 0.90, 1.15, 1.35, 1.40, 1.30, 1.10, 0.90, 0.70, 0.60],

  // ── Life Services ──────────────────────────────────────────────────────────
  // Funeral Homes (winter mortality peak)
  funeral:        [1.20, 1.10, 1.05, 0.95, 0.90, 0.85, 0.85, 0.85, 0.90, 0.95, 1.00, 1.15],
  // Mortgage / Lending (follows real estate cycle)
  mortgage:       [0.80, 0.85, 0.95, 1.00, 1.10, 1.15, 1.15, 1.10, 1.00, 0.95, 0.90, 0.85],

  // ── Other ──────────────────────────────────────────────────────────────────
  // Education (school year enrollment cycle)
  education:      [1.05, 1.00, 1.00, 1.00, 0.95, 0.80, 0.80, 1.15, 1.20, 1.05, 1.00, 0.95],
  // Childcare (enrollment cycle, summer drop)
  childcare:      [1.05, 1.00, 1.00, 1.00, 1.00, 0.90, 0.85, 1.10, 1.15, 1.00, 1.00, 0.95],
  // Pet Services / Pet Boarding (travel correlation)
  pet_services:   [0.70, 0.75, 1.10, 0.90, 1.00, 1.30, 1.40, 1.30, 0.90, 0.85, 1.15, 1.35],
  // Beauty Salon / Hair Salon (holiday + back-to-school)
  beauty_salon:   [0.85, 0.90, 1.00, 1.05, 1.10, 1.05, 1.00, 1.15, 0.95, 1.00, 1.05, 1.20],
  // Spa (gift-driven holidays + spring prep)
  spa:            [0.85, 0.95, 1.05, 1.10, 1.10, 1.05, 1.00, 1.00, 0.95, 0.95, 1.00, 1.15],

  // Fallback
  other:          [0.95, 0.95, 1.00, 1.00, 1.02, 1.02, 1.02, 1.00, 1.00, 1.00, 1.00, 1.02],
}

// Legacy profile types (kept for backward compatibility)
export type SeasonalProfile = 'standard' | 'summer_peak' | 'winter_peak' | 'spring_fall' | 'holiday' | 'flat'

export const SEASONAL_PROFILES: Record<SeasonalProfile, number[]> = {
  standard:    [0.95, 0.95, 1.00, 1.00, 1.02, 1.02, 1.02, 1.00, 1.00, 1.00, 1.00, 1.02],
  summer_peak: [0.70, 0.70, 0.90, 1.10, 1.25, 1.35, 1.30, 1.25, 1.10, 1.00, 0.85, 0.75],
  winter_peak: [1.20, 1.25, 1.15, 0.95, 0.80, 0.75, 0.70, 0.75, 0.85, 0.95, 1.15, 1.20],
  spring_fall: [0.75, 0.78, 0.90, 0.95, 1.10, 1.25, 1.20, 1.15, 1.00, 0.95, 0.85, 0.85],
  holiday:     [0.92, 0.88, 1.00, 1.00, 1.05, 0.99, 1.02, 1.02, 0.97, 1.02, 1.01, 1.13],
  flat:        [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
}

/**
 * Get seasonal index for a specific industry and month.
 * Uses per-industry factors when available, falls back to 'other' profile.
 */
export function getSeasonalIndex(industry: string, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }

  const factors = INDUSTRY_SEASONAL_FACTORS[industry] ?? INDUSTRY_SEASONAL_FACTORS.other
  return factors[month - 1]
}

/**
 * Get the full 12-month seasonal factor array for an industry.
 */
export function getSeasonalFactors(industry: string): number[] {
  return INDUSTRY_SEASONAL_FACTORS[industry] ?? INDUSTRY_SEASONAL_FACTORS.other
}

// Legacy helpers
export function getSeasonalProfile(industry: string): SeasonalProfile {
  // Map to closest legacy profile for backward compat
  const factors = INDUSTRY_SEASONAL_FACTORS[industry]
  if (!factors) return 'standard'

  // Simple heuristic: check where the peak is
  const maxIdx = factors.indexOf(Math.max(...factors))
  if (maxIdx >= 5 && maxIdx <= 7) return 'summer_peak'
  if (maxIdx === 0 || maxIdx === 1 || maxIdx === 11) return 'winter_peak'
  if (maxIdx >= 9 && maxIdx <= 10) return 'holiday'
  if (maxIdx >= 3 && maxIdx <= 4) return 'spring_fall'
  return 'standard'
}

export function getSeasonalProfileData(profile: SeasonalProfile): number[] {
  return SEASONAL_PROFILES[profile]
}
