import { NextRequest, NextResponse } from 'next/server'
import {
  createMetricoolClient,
  getCurrentMonthRange,
  normalizeNetworkName,
} from '@/lib/integrations/metricool'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/metricool/sync
 * Sync Metricool data to Supabase for a client
 *
 * Body:
 * - clientId: UUID of the client in our system
 * - brandId: Metricool brand ID
 * - year: (optional) year to sync, defaults to current
 * - month: (optional) month to sync, defaults to current
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, brandId, year, month } = body

    if (!clientId || !brandId) {
      return NextResponse.json(
        { success: false, error: 'clientId and brandId are required' },
        { status: 400 }
      )
    }

    // Get date range
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth() + 1

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0]

    // Fetch from Metricool
    const metricool = createMetricoolClient()
    const [analytics, brand] = await Promise.all([
      metricool.getAnalyticsSummary(brandId, startDate, endDate),
      metricool.getBrand(brandId),
    ])

    // Store in Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any
    const results = []

    for (const data of analytics) {
      const platform = normalizeNetworkName(data.network)

      // Upsert into monthly_analytics
      const { data: upserted, error } = await supabase
        .from('monthly_analytics')
        .upsert(
          {
            client_id: clientId,
            year: targetYear,
            month: targetMonth,
            platform,
            followers: data.followers,
            follower_change: data.followersChange,
            posts_published: data.posts,
            reach: data.reach,
            impressions: data.impressions,
            engagements: data.interactions,
            engagement_rate: data.interactionRate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'client_id,year,month,platform',
          }
        )
        .select()

      if (error) {
        console.error(`Error upserting analytics for ${platform}:`, error)
        results.push({ platform, success: false, error: error.message })
      } else {
        results.push({ platform, success: true, data: upserted })
      }
    }

    // Also update the client's metricool link
    await supabase
      .from('clients')
      .update({
        metricool_brand_id: brandId,
        metricool_brand_name: brand.name,
      })
      .eq('id', clientId)

    return NextResponse.json({
      success: true,
      synced: {
        brandId,
        brandName: brand.name,
        clientId,
        period: { year: targetYear, month: targetMonth },
        platforms: results,
      },
    })
  } catch (error) {
    console.error('Error syncing Metricool data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync data',
      },
      { status: 500 }
    )
  }
}
