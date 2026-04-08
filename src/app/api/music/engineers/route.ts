import { NextRequest, NextResponse } from 'next/server'
import { getMusicEngineerStats } from '@/lib/services/musicService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const engineers = await getMusicEngineerStats(from, to)
    return NextResponse.json({ success: true, engineers })
  } catch (error) {
    console.error('Error fetching engineer stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch engineer stats' },
      { status: 500 }
    )
  }
}
