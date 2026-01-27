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
  pool_service: 0.09,

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
  recruitment: 0.08,
  architecture: 0.07,
  tax_preparation: 0.05,

  // Marketing & Tech
  marketing_agency: 0.12,
  advertising: 0.10,
  web_development: 0.14,
  software: 0.16,

  // Creative
  photography: 0.06,
  videography: 0.10,

  // Retail & E-commerce
  retail: 0.08,
  ecommerce: 0.15,
  restaurant: 0.06,
  cafe: 0.07,
  furniture: 0.06,
  jewelry: 0.05,
  clothing: 0.07,
  florist: 0.05,
  motor_vehicle: 0.05,
  department_store: 0.04,
  electronics: 0.08,
  grocery: 0.03,
  liquor_store: 0.04,
  office_supplies: 0.03,
  toy_store: 0.06,
  sporting_goods: 0.07,

  // Healthcare & Wellness
  dental: 0.08,
  medical_practice: 0.07,
  chiropractic: 0.09,
  veterinary: 0.10,
  mental_health: 0.12,
  plastic_surgery: 0.10,
  tanning: 0.06,

  // Automotive
  auto_repair: 0.06,
  auto_detailing: 0.08,
  auto_dealership: 0.05,
  boat_dealer: 0.05,

  // Entertainment & Gaming
  sim_racing: 0.18,
  esports: 0.20,
  gaming_center: 0.15,
  entertainment: 0.12,
  events: 0.10,
  movie_theater: 0.04,
  bowling: 0.05,
  theme_park: 0.08,
  ski_resort: 0.06,
  golf_course: 0.05,
  ice_cream: 0.06,

  // Travel & Hospitality
  hotel: 0.08,
  cruise: 0.07,
  wedding: 0.08,

  // Logistics & Storage
  moving_company: 0.07,
  self_storage: 0.08,
  truck_rental: 0.06,

  // Life Services
  funeral: 0.03,
  mortgage: 0.06,

  // Other
  education: 0.08,
  childcare: 0.07,
  pet_services: 0.12,
  beauty_salon: 0.07,
  spa: 0.09,
  other: 0.08,
}

export const INDUSTRY_LABELS: Record<string, string> = {
  // Home Services
  remodeling: 'Home Remodeling',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  roofing: 'Roofing',
  landscaping: 'Landscaping',
  cleaning: 'Cleaning Services',
  pest_control: 'Pest Control',
  pool_service: 'Pool Service',

  // Health & Fitness
  fitness: 'Fitness Center',
  gym: 'Gym',
  personal_training: 'Personal Training',
  yoga_studio: 'Yoga Studio',
  martial_arts: 'Martial Arts',

  // Professional Services
  legal: 'Legal Services',
  accounting: 'Accounting',
  consulting: 'Consulting',
  real_estate: 'Real Estate',
  insurance: 'Insurance',
  financial_services: 'Financial Services',
  recruitment: 'Recruitment / Staffing',
  architecture: 'Architecture',
  tax_preparation: 'Tax Preparation',

  // Marketing & Tech
  marketing_agency: 'Marketing Agency',
  advertising: 'Advertising Agency',
  web_development: 'Web Development',
  software: 'Software / SaaS',

  // Creative
  photography: 'Photography',
  videography: 'Videography',

  // Retail & E-commerce
  retail: 'Retail',
  ecommerce: 'E-commerce',
  restaurant: 'Restaurant',
  cafe: 'Cafe / Coffee Shop',
  furniture: 'Furniture & Home Furnishings',
  jewelry: 'Jewelry Store',
  clothing: 'Clothing / Apparel',
  florist: 'Florist',
  motor_vehicle: 'Motor Vehicle Dealer',
  department_store: 'Department Store',
  electronics: 'Electronics Store',
  grocery: 'Grocery Store',
  liquor_store: 'Liquor Store',
  office_supplies: 'Office Supplies',
  toy_store: 'Toy Store',
  sporting_goods: 'Sporting Goods',

  // Healthcare & Wellness
  dental: 'Dental Practice',
  medical_practice: 'Medical Practice',
  chiropractic: 'Chiropractic',
  veterinary: 'Veterinary',
  mental_health: 'Mental Health',
  plastic_surgery: 'Plastic Surgery',
  tanning: 'Tanning Salon',

  // Automotive
  auto_repair: 'Auto Repair',
  auto_detailing: 'Auto Detailing',
  auto_dealership: 'Auto Dealership',
  boat_dealer: 'Boat Dealer',

  // Entertainment & Gaming
  sim_racing: 'Sim Racing',
  esports: 'Esports',
  gaming_center: 'Gaming Center',
  entertainment: 'Entertainment',
  events: 'Events & Festivals',
  movie_theater: 'Movie Theater',
  bowling: 'Bowling Alley',
  theme_park: 'Theme Park',
  ski_resort: 'Ski Resort',
  golf_course: 'Golf Course',
  ice_cream: 'Ice Cream Shop',

  // Travel & Hospitality
  hotel: 'Hotel / Lodging',
  cruise: 'Cruise Line',
  wedding: 'Wedding Services',

  // Logistics & Storage
  moving_company: 'Moving Company',
  self_storage: 'Self Storage',
  truck_rental: 'Truck Rental',

  // Life Services
  funeral: 'Funeral Home',
  mortgage: 'Mortgage / Lending',

  // Other
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
