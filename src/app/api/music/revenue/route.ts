import { NextRequest, NextResponse } from 'next/server'
import { getMusicRevenueSummary } from '@/lib/services/musicService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const summary = await getMusicRevenueSummary(from, to)
    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    console.error('Error fetching music revenue:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch music revenue' },
      { status: 500 }
    )
  }
}
