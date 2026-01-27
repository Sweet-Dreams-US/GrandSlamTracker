import { NextRequest, NextResponse } from 'next/server'
import { createMetricoolClient, getLastNDaysRange } from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/posts?brandId=123&period=30d&network=instagram
 * Fetch posts for a specific brand
 *
 * Query params:
 * - brandId: Metricool brand ID (required)
 * - period: '7d', '30d', '90d' (default: '30d')
 * - network: 'instagram', 'facebook', etc. (optional)
 * - limit: number of posts (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandIdStr = searchParams.get('brandId')
    const period = searchParams.get('period') || '30d'
    const network = searchParams.get('network') || undefined
    const limitStr = searchParams.get('limit')

    if (!brandIdStr) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
        { status: 400 }
      )
    }

    const brandId = parseInt(brandIdStr, 10)
    const limit = limitStr ? parseInt(limitStr, 10) : 50

    // Determine date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const { start, end } = getLastNDaysRange(days)

    const client = createMetricoolClient()
    const posts = await client.getPosts(brandId, start, end, network, limit)

    return NextResponse.json({
      success: true,
      period: { startDate: start, endDate: end },
      count: posts.length,
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
