import { NextRequest, NextResponse } from 'next/server'
import { createMetricoolClient, getLastNDaysRange } from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/timeline?brandId=123&period=30d
 * Fetch timeline data for follower growth and engagement over time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandIdStr = searchParams.get('brandId')
    const period = searchParams.get('period') || '30d'

    if (!brandIdStr) {
      return NextResponse.json({ success: false, error: 'brandId is required' }, { status: 400 })
    }

    const brandId = parseInt(brandIdStr, 10)
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const { start, end } = getLastNDaysRange(days)

    const client = createMetricoolClient()

    // Fetch timeline data for key metrics across platforms
    const metrics = ['followers', 'reach', 'impressions', 'engagement']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timelines: Record<string, any> = {}

    const results = await Promise.allSettled(
      metrics.map(async (metric) => {
        const data = await client.getStatsTimeline(brandId, metric, start, end)
        return { metric, data }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data) {
        timelines[result.value.metric] = result.value.data
      }
    }

    return NextResponse.json({
      success: true,
      period: { startDate: start, endDate: end },
      timelines,
    })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}
