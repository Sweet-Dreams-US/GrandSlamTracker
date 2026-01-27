import { NextRequest, NextResponse } from 'next/server'
import {
  createMetricoolClient,
  getLastNDaysRange,
  getCurrentMonthRange,
} from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/analytics?brandId=123&period=30d
 * Fetch analytics for a specific brand
 *
 * Query params:
 * - brandId: Metricool brand ID (required)
 * - period: '7d', '30d', '90d', 'month' (default: '30d')
 * - startDate: YYYY-MM-DD (optional, overrides period)
 * - endDate: YYYY-MM-DD (optional, overrides period)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandIdStr = searchParams.get('brandId')
    const period = searchParams.get('period') || '30d'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!brandIdStr) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
        { status: 400 }
      )
    }

    const brandId = parseInt(brandIdStr, 10)
    if (isNaN(brandId)) {
      return NextResponse.json(
        { success: false, error: 'brandId must be a number' },
        { status: 400 }
      )
    }

    // Determine date range
    let startDate: string
    let endDate: string

    if (startDateParam && endDateParam) {
      startDate = startDateParam
      endDate = endDateParam
    } else if (period === 'month') {
      const range = getCurrentMonthRange()
      startDate = range.start
      endDate = range.end
    } else {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
      const range = getLastNDaysRange(days)
      startDate = range.start
      endDate = range.end
    }

    const client = createMetricoolClient()

    // Fetch analytics summary
    const analytics = await client.getAnalyticsSummary(brandId, startDate, endDate)

    // Fetch brand info for context
    const brand = await client.getBrand(brandId)

    return NextResponse.json({
      success: true,
      brand: {
        id: brand.id,
        name: brand.name,
        networks: brand.networks,
      },
      period: { startDate, endDate },
      analytics,
    })
  } catch (error) {
    console.error('Error fetching Metricool analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
