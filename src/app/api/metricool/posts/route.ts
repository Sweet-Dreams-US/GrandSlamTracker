import { NextRequest, NextResponse } from 'next/server'
import { createMetricoolClient, getLastNDaysRange } from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/posts?brandId=123&period=30d&network=instagram
 * Fetch posts for a specific brand
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandIdStr = searchParams.get('brandId')
    const period = searchParams.get('period') || '30d'
    const network = searchParams.get('network') || 'instagram'

    if (!brandIdStr) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
        { status: 400 }
      )
    }

    const brandId = parseInt(brandIdStr, 10)
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const { start, end } = getLastNDaysRange(days)

    const client = createMetricoolClient()

    // Use the platform-specific posts endpoint
    const posts = await client.getInstagramAnalytics(brandId, start, end)

    return NextResponse.json({
      success: true,
      period: { startDate: start, endDate: end },
      network,
      posts,
    })
  } catch (error) {
    console.error('Error fetching Metricool posts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      },
      { status: 500 }
    )
  }
}
