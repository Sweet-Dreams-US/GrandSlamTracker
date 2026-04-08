import { NextRequest, NextResponse } from 'next/server'
import { getMusicBookings } from '@/lib/services/musicService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const bookings = await getMusicBookings(from, to)
    return NextResponse.json({
      success: true,
      bookings: bookings.slice(0, limit),
      total: bookings.length,
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
