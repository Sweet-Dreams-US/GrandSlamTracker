import { NextRequest, NextResponse } from 'next/server'
import { createMetricoolClient, getLastNDaysRange } from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/demographics?brandId=123&period=30d
 * Fetch community demographics (gender, age, country, city) for all connected platforms
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
    const platforms = ['instagram', 'facebook']
    const statTypes = ['gender', 'age', 'country', 'city'] as const

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const demographics: Record<string, any> = {}

    for (const platform of platforms) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const platformData: Record<string, any> = {}
      const results = await Promise.allSettled(
        statTypes.map(async (statType) => {
          const data = await client.getCommunityStats(brandId, statType, platform, start, end)
          return { statType, data }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data) {
          platformData[result.value.statType] = result.value.data
        }
      }

      if (Object.keys(platformData).length > 0) {
        demographics[platform] = platformData
      }
    }

    return NextResponse.json({
      success: true,
      period: { startDate: start, endDate: end },
      demographics,
    })
  } catch (error) {
    console.error('Error fetching demographics:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch demographics' },
      { status: 500 }
    )
  }
}
