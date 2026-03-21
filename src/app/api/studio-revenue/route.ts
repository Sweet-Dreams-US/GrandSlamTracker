import { NextRequest, NextResponse } from 'next/server'
import { createStudioClient } from '@/lib/supabase/studioClient'
import { STUDIO_SPLITS } from '@/lib/constants/splitStructure'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params required' }, { status: 400 })
  }

  try {
    const studio = createStudioClient()

    // Fetch bookings (studio sessions) within date range
    // Only completed/confirmed sessions count as revenue
    const { data: bookings, error: bookingsErr } = await studio
      .from('bookings')
      .select('id, customer_name, artist_name, start_time, duration, total_amount, status, room, engineer_name')
      .gte('start_time', start)
      .lte('start_time', end)
      .in('status', ['completed', 'confirmed'])
      .order('start_time', { ascending: false })

    if (bookingsErr) {
      return NextResponse.json({ error: bookingsErr.message }, { status: 500 })
    }

    // Fetch media sales from studio engineers within date range
    const { data: mediaSales, error: mediaErr } = await studio
      .from('media_sales')
      .select('id, client_name, description, amount, sale_type, sold_by, filmed_by, edited_by, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })

    if (mediaErr) {
      return NextResponse.json({ error: mediaErr.message }, { status: 500 })
    }

    // Transform bookings into accounting-ready format
    // Amounts in the Music DB are stored in cents (e.g. 10000 = $100.00)
    const sessions = (bookings || []).map((b: any) => {
      const billed = Number(b.total_amount || 0) / 100
      const rate = b.duration > 0 ? billed / b.duration : 0
      const engineerPayout = billed * STUDIO_SPLITS.engineer
      const businessRetention = billed * STUDIO_SPLITS.business

      return {
        id: `music-${b.id}`,
        source: 'sweet_dreams_music',
        date: b.start_time,
        engineer: b.engineer_name || 'Unknown',
        artist: b.customer_name || b.artist_name || 'Walk-in',
        type: 'recording',
        hours: b.duration || 0,
        rate: Math.round(rate * 100) / 100,
        billed,
        engineer_payout: Math.round(engineerPayout * 100) / 100,
        business_retention: Math.round(businessRetention * 100) / 100,
        room: b.room || 'unknown',
        status: b.status,
      }
    })

    // Transform media sales (small content jobs sold through studio)
    const studioMediaSales = (mediaSales || []).map((m: any) => ({
      id: `music-media-${m.id}`,
      source: 'sweet_dreams_music',
      date: m.created_at,
      client: m.client_name || 'Unknown',
      description: m.description || '',
      amount: Number(m.amount || 0) / 100,
      sale_type: m.sale_type || 'content',
      sold_by: m.sold_by || '',
      filmed_by: m.filmed_by || '',
      edited_by: m.edited_by || '',
    }))

    // Summary stats
    const totalStudioRevenue = sessions.reduce((s, x) => s + x.billed, 0)
    const totalEngineerPayouts = sessions.reduce((s, x) => s + x.engineer_payout, 0)
    const totalBusinessRetention = sessions.reduce((s, x) => s + x.business_retention, 0)
    const totalMediaSales = studioMediaSales.reduce((s, x) => s + x.amount, 0)

    // Engineer breakdown
    const byEngineer: Record<string, { sessions: number; revenue: number; payout: number }> = {}
    sessions.forEach((s) => {
      if (!byEngineer[s.engineer]) {
        byEngineer[s.engineer] = { sessions: 0, revenue: 0, payout: 0 }
      }
      byEngineer[s.engineer].sessions++
      byEngineer[s.engineer].revenue += s.billed
      byEngineer[s.engineer].payout += s.engineer_payout
    })

    return NextResponse.json({
      sessions,
      studioMediaSales,
      summary: {
        totalStudioRevenue,
        totalEngineerPayouts,
        totalBusinessRetention,
        totalMediaSales,
        sessionCount: sessions.length,
      },
      byEngineer,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
