import { createMusicClient } from '@/lib/supabase/musicClient'
import type {
  MusicBooking,
  MusicBeatPurchase,
  MusicMediaSale,
  MusicRevenueSummary,
  MusicEngineerStats,
} from '@/lib/supabase/musicTypes'

export async function getMusicBookings(from?: string, to?: string): Promise<MusicBooking[]> {
  const client = createMusicClient()
  let query = client
    .from('bookings')
    .select('*')
    .not('status', 'in', '("cancelled","rejected")')
    .order('start_time', { ascending: false })

  if (from) query = query.gte('start_time', from)
  if (to) query = query.lte('start_time', to)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as MusicBooking[]
}

export async function getMusicBeatSales(from?: string, to?: string): Promise<MusicBeatPurchase[]> {
  const client = createMusicClient()
  let query = client
    .from('beat_purchases')
    .select('*')
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as MusicBeatPurchase[]
}

export async function getMusicMediaSales(from?: string, to?: string): Promise<MusicMediaSale[]> {
  const client = createMusicClient()
  let query = client
    .from('media_sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as MusicMediaSale[]
}

export async function getMusicRevenueSummary(from?: string, to?: string): Promise<MusicRevenueSummary> {
  const [bookings, beatSales, mediaSales] = await Promise.all([
    getMusicBookings(from, to),
    getMusicBeatSales(from, to),
    getMusicMediaSales(from, to),
  ])

  const totalBookingRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const totalBeatRevenue = beatSales.reduce((sum, b) => sum + ((b.amount_paid || 0) / 100), 0)
  const totalMediaRevenue = mediaSales.reduce((sum, s) => sum + (s.sale_amount || s.amount || 0), 0)

  return {
    totalBookingRevenue,
    totalBeatRevenue,
    totalMediaRevenue,
    totalRevenue: totalBookingRevenue + totalBeatRevenue + totalMediaRevenue,
    bookingCount: bookings.length,
    beatSaleCount: beatSales.length,
    mediaSaleCount: mediaSales.length,
    avgBookingValue: bookings.length > 0 ? totalBookingRevenue / bookings.length : 0,
  }
}

export async function getMusicEngineerStats(from?: string, to?: string): Promise<MusicEngineerStats[]> {
  const bookings = await getMusicBookings(from, to)
  const map = new Map<string, { count: number; revenue: number }>()

  for (const b of bookings) {
    const name = b.engineer_name || 'Unassigned'
    const existing = map.get(name) || { count: 0, revenue: 0 }
    existing.count++
    existing.revenue += b.total_amount || 0
    map.set(name, existing)
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({
      name,
      sessionCount: stats.count,
      totalRevenue: stats.revenue,
      avgSessionValue: stats.count > 0 ? stats.revenue / stats.count : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}
