// Industry growth factors for baseline calculations
// These represent expected annual growth rates for each industry

export const INDUSTRY_GROWTH_FACTORS: Record<string, number> = {
  // Home Services
  remodeling: 0.12,
  hvac: 0.10,
  plumbing: 0.10,
  electrical: 0.11,
  roofing: 0.08,
  landscaping: 0.09,
  cleaning: 0.07,
  pest_control: 0.08,

  // Health & Fitness
  fitness: 0.15,
  gym: 0.14,
  personal_training: 0.16,
  yoga_studio: 0.12,
  martial_arts: 0.10,

  // Professional Services
  legal: 0.06,
  accounting: 0.05,
  consulting: 0.08,
  real_estate: 0.10,
  insurance: 0.05,
  financial_services: 0.07,

  // Retail & E-commerce
  retail: 0.08,
  ecommerce: 0.15,
  restaurant: 0.06,
  cafe: 0.07,

  // Healthcare
  dental: 0.08,
  medical_practice: 0.07,
  chiropractic: 0.09,
  veterinary: 0.10,
  mental_health: 0.12,

  // Creative & Tech
  marketing_agency: 0.12,
  web_development: 0.14,
  photography: 0.06,
  videography: 0.10,

  // Automotive
  auto_repair: 0.06,
  auto_detailing: 0.08,
  auto_dealership: 0.05,

  // Other
  education: 0.08,
  childcare: 0.07,
  pet_services: 0.12,
  beauty_salon: 0.07,
  spa: 0.09,
  other: 0.08,
}

export const INDUSTRY_LABELS: Record<string, string> = {
  remodeling: 'Home Remodeling',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  roofing: 'Roofing',
  landscaping: 'Landscaping',
  cleaning: 'Cleaning Services',
  pest_control: 'Pest Control',
  fitness: 'Fitness Center',
  gym: 'Gym',
  personal_training: 'Personal Training',
  yoga_studio: 'Yoga Studio',
  martial_arts: 'Martial Arts',
  legal: 'Legal Services',
  accounting: 'Accounting',
  consulting: 'Consulting',
  real_estate: 'Real Estate',
  insurance: 'Insurance',
  financial_services: 'Financial Services',
  retail: 'Retail',
  ecommerce: 'E-commerce',
  restaurant: 'Restaurant',
  cafe: 'Cafe/Coffee Shop',
  dental: 'Dental Practice',
  medical_practice: 'Medical Practice',
  chiropractic: 'Chiropractic',
  veterinary: 'Veterinary',
  mental_health: 'Mental Health',
  marketing_agency: 'Marketing Agency',
  web_development: 'Web Development',
  photography: 'Photography',
  videography: 'Videography',
  auto_repair: 'Auto Repair',
  auto_detailing: 'Auto Detailing',
  auto_dealership: 'Auto Dealership',
  education: 'Education',
  childcare: 'Childcare',
  pet_services: 'Pet Services',
  beauty_salon: 'Beauty Salon',
  spa: 'Spa',
  other: 'Other',
}

export function getIndustryGrowthFactor(industry: string): number {
  return INDUSTRY_GROWTH_FACTORS[industry] ?? INDUSTRY_GROWTH_FACTORS.other
}

export function getIndustryLabel(industry: string): string {
  return INDUSTRY_LABELS[industry] ?? industry
}
