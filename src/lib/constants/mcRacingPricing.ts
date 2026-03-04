/**
 * MC Racing Pricing Constants & Growth Plan Data
 * Sim racing facility in Fort Wayne, IN
 * 3 rigs, open Tue-Sun (closed Mon), Noon-2am (14 hrs/day, 84 hrs/week)
 * Source: Growth Plan, mcracingfortwayne.com, Market Research
 */

// ─── Session Pricing (from live website + growth plan) ──────────────────────

export interface SessionRate {
  name: string
  duration: string
  hours: number
  solo: number       // 1 driver
  group: number      // 3 drivers (full capacity)
  perPersonGroup: number  // group / 3
}

export const SESSION_RATES: SessionRate[] = [
  { name: 'Sprint', duration: '1 Hour', hours: 1, solo: 55, group: 135, perPersonGroup: 45 },
  { name: 'Grand Prix', duration: '2 Hours', hours: 2, solo: 99, group: 245, perPersonGroup: 82 },
  { name: 'Endurance', duration: '3 Hours', hours: 3, solo: 135, group: 325, perPersonGroup: 108 },
]

// ─── Birthday Party Packages ────────────────────────────────────────────────

export interface PartyPackage {
  name: string
  maxKids: number
  durationHrs: number
  description: string
  price: number
  includes: string[]
}

export const PARTY_PACKAGES: PartyPackage[] = [
  {
    name: 'Standard',
    maxKids: 9,
    durationHrs: 2.5,
    description: 'Great starter party',
    price: 500,
    includes: ['Up to 9 kids', '2.5 hours', 'Racing tournament', 'Podium ceremony'],
  },
  {
    name: 'Premium',
    maxKids: 9,
    durationHrs: 3,
    description: 'Most popular',
    price: 650,
    includes: ['Up to 9 kids', '3 hours', 'Racing tournament', 'Pizza included', 'Podium ceremony'],
  },
  {
    name: 'Ultimate',
    maxKids: 9,
    durationHrs: 3.5,
    description: 'The full experience',
    price: 800,
    includes: ['Up to 9 kids', '3.5 hours', 'Racing tournament', 'Pizza + drinks', 'Trophy for winner', 'Podium ceremony'],
  },
]

// ─── Membership Tiers ───────────────────────────────────────────────────────

export interface MembershipTier {
  name: string
  monthlyPrice: number
  hoursPerMonth: number | null
  discount: number
  description: string
  includes: string[]
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    name: 'Solo',
    monthlyPrice: 150,
    hoursPerMonth: 4,
    discount: 10,
    description: 'Casual racer',
    includes: ['4 hrs/month', '10% off additional hours', 'Member pricing on events'],
  },
  {
    name: 'Duo',
    monthlyPrice: 225,
    hoursPerMonth: 6,
    discount: 15,
    description: 'Parent + child or couples',
    includes: ['6 hrs shared between 2', '15% off additional hours', 'Member pricing on events'],
  },
  {
    name: 'Pro',
    monthlyPrice: 250,
    hoursPerMonth: 8,
    discount: 15,
    description: 'Serious racer',
    includes: ['8 hrs/month', '15% off additional hours', 'Free league entry', 'Priority booking'],
  },
]

// ─── League Pricing ─────────────────────────────────────────────────────────

export interface LeagueInfo {
  name: string
  night: string
  dropInPrice: number
  seasonPassPrice: number
  seasonWeeks: number
  savings: number
  description: string
}

export const LEAGUES: LeagueInfo[] = [
  {
    name: 'GT Championship',
    night: 'Tuesday',
    dropInPrice: 30,
    seasonPassPrice: 200,
    seasonWeeks: 8,
    savings: 40,
    description: 'Competitive GT racing series — serious racers',
  },
  {
    name: 'Fun Series',
    night: 'Thursday',
    dropInPrice: 30,
    seasonPassPrice: 200,
    seasonWeeks: 8,
    savings: 40,
    description: 'Casual racing — all skill levels welcome',
  },
]

// ─── Revenue Categories ─────────────────────────────────────────────────────

export type RevenueCategory =
  | 'session_solo'
  | 'session_group'
  | 'birthday_party'
  | 'membership'
  | 'league'
  | 'corporate'
  | 'rc_track'
  | 'merchandise'
  | 'other'

export const REVENUE_CATEGORIES: { value: RevenueCategory; label: string; color: string }[] = [
  { value: 'session_solo', label: 'Solo Sessions', color: '#6366f1' },
  { value: 'session_group', label: 'Group Sessions', color: '#818cf8' },
  { value: 'birthday_party', label: 'Birthday Parties', color: '#ec4899' },
  { value: 'membership', label: 'Memberships', color: '#22c55e' },
  { value: 'league', label: 'Leagues', color: '#f59e0b' },
  { value: 'corporate', label: 'Corporate Events', color: '#3b82f6' },
  { value: 'rc_track', label: 'RC Track', color: '#8b5cf6' },
  { value: 'merchandise', label: 'Merchandise', color: '#14b8a6' },
  { value: 'other', label: 'Other', color: '#6b7280' },
]

// ─── Default Monthly Expenses (est. $4,750/mo) ─────────────────────────────

export interface DefaultExpense {
  category: string
  label: string
  amount: number
  is_recurring: boolean
}

export const DEFAULT_MONTHLY_EXPENSES: DefaultExpense[] = [
  { category: 'rent', label: 'Rent', amount: 2000, is_recurring: true },
  { category: 'utilities', label: 'Utilities', amount: 400, is_recurring: true },
  { category: 'internet', label: 'Internet / Network', amount: 200, is_recurring: true },
  { category: 'insurance', label: 'Insurance', amount: 300, is_recurring: true },
  { category: 'software', label: 'Software & Subscriptions', amount: 250, is_recurring: true },
  { category: 'equipment', label: 'Equipment Maintenance', amount: 400, is_recurring: true },
  { category: 'marketing', label: 'Marketing (Grand Slam Fee)', amount: 500, is_recurring: true },
  { category: 'supplies', label: 'Supplies & Consumables', amount: 200, is_recurring: true },
  { category: 'misc', label: 'Miscellaneous', amount: 500, is_recurring: true },
]

export const DEFAULT_MONTHLY_BUDGET = DEFAULT_MONTHLY_EXPENSES.reduce((sum, e) => sum + e.amount, 0) // $4,750

// ─── Facility Constants ─────────────────────────────────────────────────────

export const FACILITY = {
  rigs: 3,
  daysPerWeek: 6,         // closed Monday
  hoursPerDay: 14,        // Noon-2am
  weeklyHours: 84,        // 14 * 6
  monthlyHours: 336,      // ~84 * 4
  maxConcurrentSessions: 3,
  weekdayDays: 4,         // Tue-Fri
  weekendDays: 2,         // Sat-Sun
  leagueNights: ['Tuesday', 'Thursday'],
  partyPeakDays: ['Friday', 'Saturday', 'Sunday'],
  closedDay: 'Monday',
}

// ─── Grand Slam Deal Terms ──────────────────────────────────────────────────

export const DEAL_TERMS = {
  baseline: 4000,
  industry: 'sim_racing',
  startMonth: 3, // March 2026
  startYear: 2026,
  projectionMonths: 36,
  monthlyGrowthRate: 0.08,
  contractLength: 12, // months
}

// ─── Current Revenue Breakdown (starting point) ────────────────────────────

export const CURRENT_REVENUE = {
  total: 4000,
  soloSessions: { amount: 2200, pct: 55 },
  groupSessions: { amount: 1300, pct: 32.5 },
  birthdayParties: { amount: 500, pct: 12.5 },
  memberships: { amount: 0, pct: 0 },
  leagues: { amount: 0, pct: 0 },
  recurring: 0, // 0%
}

// ─── Growth Scenarios (from Growth Plan) ────────────────────────────────────

export interface GrowthScenario {
  name: string
  label: string
  growthPct: number
  targetRevenue: number
  parties: number
  members: number
  leagueRacers: number
  recurringPct: number
  breakdown: {
    parties: number
    memberships: number
    leagues: number
    sessions: number
  }
}

export const GROWTH_SCENARIOS: GrowthScenario[] = [
  {
    name: 'conservative',
    label: 'Conservative (+50%)',
    growthPct: 50,
    targetRevenue: 6000,
    parties: 3,
    members: 4,
    leagueRacers: 4,
    recurringPct: 28,
    breakdown: { parties: 1500, memberships: 700, leagues: 480, sessions: 3320 },
  },
  {
    name: 'moderate',
    label: 'Moderate (+100%)',
    growthPct: 100,
    targetRevenue: 8000,
    parties: 6,
    members: 8,
    leagueRacers: 8,
    recurringPct: 34,
    breakdown: { parties: 3000, memberships: 1500, leagues: 1200, sessions: 2300 },
  },
  {
    name: 'target',
    label: 'Target (+200%)',
    growthPct: 200,
    targetRevenue: 12000,
    parties: 10,
    members: 14,
    leagueRacers: 10,
    recurringPct: 39,
    breakdown: { parties: 5500, memberships: 2600, leagues: 2100, sessions: 1800 },
  },
  {
    name: 'stretch',
    label: 'Stretch (+300%)',
    growthPct: 300,
    targetRevenue: 16000,
    parties: 13,
    members: 20,
    leagueRacers: 12,
    recurringPct: 44,
    breakdown: { parties: 7800, memberships: 3900, leagues: 3200, sessions: 1100 },
  },
  {
    name: 'capacity_max',
    label: 'Capacity Max (+400%)',
    growthPct: 400,
    targetRevenue: 20000,
    parties: 16,
    members: 26,
    leagueRacers: 12,
    recurringPct: 46,
    breakdown: { parties: 10000, memberships: 5200, leagues: 3200, sessions: 1600 },
  },
]

// ─── Monthly Playbook Targets (Year 1) ──────────────────────────────────────

export interface MonthlyTarget {
  month: number     // 1-12 of the contract
  calMonth: number  // calendar month (3=Mar, 4=Apr, etc.)
  calYear: number
  revenue: number
  parties: number
  members: number
  leagueRacers: number
  recurringPct: number
  igFollowers: number
  reviews: number
  milestone: string
}

export const MONTHLY_TARGETS: MonthlyTarget[] = [
  { month: 1,  calMonth: 3,  calYear: 2026, revenue: 4500,  parties: 2,  members: 2,  leagueRacers: 4,  recurringPct: 15, igFollowers: 100,  reviews: 5,  milestone: 'Foundation — profiles, memberships, leagues launched' },
  { month: 2,  calMonth: 4,  calYear: 2026, revenue: 5500,  parties: 3,  members: 5,  leagueRacers: 6,  recurringPct: 20, igFollowers: 250,  reviews: 10, milestone: 'Launch — founding member promo, party content' },
  { month: 3,  calMonth: 5,  calYear: 2026, revenue: 7000,  parties: 5,  members: 8,  leagueRacers: 16, recurringPct: 25, igFollowers: 500,  reviews: 18, milestone: 'Momentum — 2nd league night, referral cards' },
  { month: 4,  calMonth: 6,  calYear: 2026, revenue: 8500,  parties: 6,  members: 10, leagueRacers: 10, recurringPct: 28, igFollowers: 750,  reviews: 22, milestone: 'Consistency — corporate outreach begins' },
  { month: 5,  calMonth: 7,  calYear: 2026, revenue: 10000, parties: 8,  members: 12, leagueRacers: 10, recurringPct: 30, igFollowers: 1000, reviews: 28, milestone: 'Scale — price testing, hiring considered' },
  { month: 6,  calMonth: 8,  calYear: 2026, revenue: 11000, parties: 9,  members: 14, leagueRacers: 10, recurringPct: 35, igFollowers: 1100, reviews: 30, milestone: 'Halfway review — double down on winners' },
  { month: 7,  calMonth: 9,  calYear: 2026, revenue: 11500, parties: 10, members: 15, leagueRacers: 12, recurringPct: 37, igFollowers: 1200, reviews: 33, milestone: 'Push to $12K — Sunday parties, referral bonus' },
  { month: 8,  calMonth: 10, calYear: 2026, revenue: 12500, parties: 11, members: 16, leagueRacers: 12, recurringPct: 40, igFollowers: 1250, reviews: 35, milestone: 'First hire zone — part-time floor help' },
  { month: 9,  calMonth: 11, calYear: 2026, revenue: 13500, parties: 11, members: 17, leagueRacers: 12, recurringPct: 42, igFollowers: 1300, reviews: 37, milestone: 'Premium positioning — first price increases' },
  { month: 10, calMonth: 12, calYear: 2026, revenue: 14000, parties: 12, members: 18, leagueRacers: 12, recurringPct: 42, igFollowers: 1400, reviews: 38, milestone: 'Holiday push — gift cards, party surge' },
  { month: 11, calMonth: 1,  calYear: 2027, revenue: 15000, parties: 12, members: 19, leagueRacers: 12, recurringPct: 44, igFollowers: 1450, reviews: 39, milestone: 'Capacity ceiling — plan expansion' },
  { month: 12, calMonth: 2,  calYear: 2027, revenue: 16000, parties: 13, members: 20, leagueRacers: 12, recurringPct: 45, igFollowers: 1500, reviews: 40, milestone: 'Year 1 goal — $16K, 45% recurring, expansion ready' },
]

// ─── Employee Roadmap ───────────────────────────────────────────────────────

export const EMPLOYEE_TRIGGERS = [
  { revenueThreshold: 8000,  action: 'Consider part-time weekend help' },
  { revenueThreshold: 10000, action: 'Hire part-time floor person (weekends) ~$1,200-1,400/mo' },
  { revenueThreshold: 12000, action: 'Part-time → Full-time floor person' },
  { revenueThreshold: 14000, action: 'Hire dedicated party host ($15-17/hr)' },
  { revenueThreshold: 16000, action: 'Hire Operations Manager ($40-50K salary)' },
]

// ─── Market Research Data ───────────────────────────────────────────────────

export const MARKET_DATA = {
  fortWayne: {
    population: 277607,
    populationGrowth: 0.008, // 0.8% annually
    medianAge: 35,
    households: 112191,
    householdsHighIncome: 0.29, // 29% earn $100K-$200K+
    under18Pct: 0.243, // 24.3%
    under18Population: 65000,
  },
  birthdayMarket: {
    householdsWithChildren: 41500, // 37% of 112K
    externalVenueRate: 0.25, // 25% use external venues
    avgSpend: 450,
    tam: 4668750, // Total Addressable Market
    competitorAvgParty: { laserTag: 400, trampolinePark: 385, simRacing: 525 },
    competitorMargins: { laserTag: '25-40%', trampolinePark: '20-40%', simRacing: '20-35%' },
  },
  industry: {
    globalSimMarket2033: 4_200_000_000, // $4.2B
    globalSimCAGR: 0.12, // 12%
    fecUSMarket: 28_200_000_000, // $28.2B
    fecCAGR: 0.105, // 10.5%
    proSimRetailCost: { min: 25000, max: 50000 },
    commercialOperatingMargin: { year1: '20-25%', mature: '35%' },
  },
  localCompetition: 'Zero direct sim racing competition in Fort Wayne',
  corporateMarket: {
    minBooking: 2500,
    topEmployers: [
      { name: 'Parkview Health', employees: 8986 },
      { name: 'General Motors', employees: 4320 },
    ],
  },
  totalMarketCap: 5_190_000, // $5.19M annual for racing entertainment in FW
}

// ─── Expansion Plan (Year 2+) ───────────────────────────────────────────────

export const EXPANSION_PLAN = [
  { year: 1, locations: 1, sims: 3,  monthlyRevenue: 16000,  city: 'Fort Wayne' },
  { year: 2, locations: 1, sims: 9,  monthlyRevenue: 40000,  city: 'Fort Wayne (expanded)' },
  { year: 3, locations: 2, sims: 21, monthlyRevenue: 120000, city: '+ Indianapolis' },
  { year: 4, locations: 3, sims: 30, monthlyRevenue: 180000, city: '+ Detroit or South Bend' },
  { year: 5, locations: 5, sims: 50, monthlyRevenue: 250000, city: 'Regional expansion' },
]

// ─── Local Competitor Pricing (Fort Wayne Market Research) ───────────────

export interface CompetitorPricing {
  name: string
  activity: string
  partyPrice: string
  includes: string
  category: 'active_hightech' | 'arts_creative' | 'traditional_sports' | 'specialty'
}

export const LOCAL_COMPETITORS: CompetitorPricing[] = [
  // Active & High-Tech
  { name: 'Power Up Action Park', activity: 'Multi-Attraction', partyPrice: '$299 - $799', includes: '6-12 guests; VIP options', category: 'active_hightech' },
  { name: 'Combat Ops', activity: 'Laser/Nerf/Arcade', partyPrice: '$229 - $320', includes: '7 players; party room + arcade', category: 'active_hightech' },
  { name: 'Sky Zone', activity: 'Trampolines', partyPrice: '$320 - $400', includes: '10 jumpers; 120 min + party room', category: 'active_hightech' },
  { name: 'Lazer X', activity: 'Laser Tag', partyPrice: '$17.95/person', includes: '2 games, tokens, drinks; ages 10+', category: 'active_hightech' },
  { name: 'Crazy Pinz', activity: 'Bowling/Karts', partyPrice: '$11.95 - $14.95/guest', includes: 'Multi-attraction center', category: 'active_hightech' },
  { name: 'Generations Plex', activity: 'High-Tech Sports', partyPrice: '$276 - $430', includes: '10 participants; laser tag/climbing', category: 'active_hightech' },
  // Arts & Creative
  { name: 'Science Central', activity: 'S.T.E.M.', partyPrice: '$250 - $450', includes: '15-30 guests; nitrogen ice cream', category: 'arts_creative' },
  { name: 'Painting with a Twist', activity: 'Art Studio', partyPrice: '$29 - $35/child', includes: '1.5-2 hours; ages 5-17', category: 'arts_creative' },
  // Traditional Sports
  { name: 'SportONE Icehouse', activity: 'Ice Skating', partyPrice: '$300', includes: '10 skaters; food & room', category: 'traditional_sports' },
  { name: 'Features Fieldhouse', activity: 'Court Sports', partyPrice: '$140 - $375', includes: '15 people; 3 games', category: 'traditional_sports' },
  { name: 'Fort Wayne TinCaps', activity: 'Baseball', partyPrice: '$175+', includes: '10 tickets, food vouchers', category: 'traditional_sports' },
  // Specialty
  { name: 'Pinball Land', activity: 'Arcade', partyPrice: '$300', includes: '2-hr private rental; 10-40 ppl', category: 'specialty' },
  { name: 'Room to Escape', activity: 'Escape Room', partyPrice: '$89.85 (min)', includes: '3 people; $29.95 each add\'l', category: 'specialty' },
  { name: "Deadeye Dick's", activity: 'Axe Throwing', partyPrice: '$30/person', includes: '1-hour session; 12+', category: 'specialty' },
]

export const CORPORATE_BENCHMARKS = [
  { venue: 'Combat Ops Buyouts', pricing: '$1,700 - $2,700/hr', notes: 'Non-peak to peak facility buyout' },
  { venue: 'FW Museum of Art', pricing: '$175/hr', notes: 'Professional space rental' },
  { venue: 'Parkview Field (TinCaps)', pricing: '$300 - $3,000', notes: 'Event center to concourse rental' },
  { venue: 'Sweetwater Studios', pricing: '$150/hr or $1,000/day', notes: 'Studio B/C' },
  { venue: 'The Mirro Center', pricing: '$1,050 - $2,000/day', notes: 'Large halls for profit entities' },
]

// 9-sim expansion economics
export const NINE_SIM_UPGRADE = {
  investmentRange: { min: 60000, max: 90000 },
  newRigs: 6,
  totalRigs: 9,
  monthlyRevenueTarget: 40000,
  partyCapacityMultiplier: 3,   // 3x faster party throughput
  partiesPerWeekend: { current: 5, expanded: 12 },
  peakHourRevenue: { current: 135, expanded: 405 },
  monthlyCeiling: { current: 20000, expanded: 50000 },
}
