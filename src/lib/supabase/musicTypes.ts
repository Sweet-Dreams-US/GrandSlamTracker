export interface MusicBooking {
  id: string
  customer_name: string | null
  artist_name: string | null
  customer_email: string | null
  start_time: string
  end_time: string
  duration: number | null
  total_amount: number | null
  deposit_amount: number | null
  remainder_amount: number | null
  status: string | null
  engineer_name: string | null
  room: string | null
  created_at: string
  same_day_fee_amount: number | null
  after_hours_fee_amount: number | null
  night_fees_amount: number | null
  media_addons: unknown | null
}

export interface MusicBeatPurchase {
  id: string
  buyer_email: string | null
  buyer_name: string | null
  license_type: string | null
  amount_paid: number | null
  created_at: string
  beat_id: string | null
}

export interface MusicMediaSale {
  id: string
  engineer_name: string | null
  description: string | null
  amount: number | null
  sale_amount: number | null
  client_name: string | null
  sale_type: string | null
  sold_by: string | null
  filmed_by: string | null
  edited_by: string | null
  created_at: string
}

export interface MusicRevenueSummary {
  totalBookingRevenue: number
  totalBeatRevenue: number
  totalMediaRevenue: number
  totalRevenue: number
  bookingCount: number
  beatSaleCount: number
  mediaSaleCount: number
  avgBookingValue: number
}

export interface MusicEngineerStats {
  name: string
  sessionCount: number
  totalRevenue: number
  avgSessionValue: number
}
