import { NextRequest, NextResponse } from 'next/server'
import {
  createMetricoolClient,
  normalizeNetworkName,
  getMonthRange,
} from '@/lib/integrations/metricool'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/metricool/sync
 * Sync Metricool data to Supabase for a client
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

    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth() + 1

    const { start, end } = getMonthRange(targetYear, targetMonth)

    const metricool = createMetricoolClient()

    // Fetch stats for each platform
    const platforms = ['instagram', 'facebook', 'tiktok', 'youtube']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any
    const results = []

    for (const platform of platforms) {
      try {
        const data = await metricool.getStatsValues(brandId, platform, start, end)
        if (!data || Object.keys(data).length === 0) continue

        const normalizedPlatform = normalizeNetworkName(platform)

        const { data: upserted, error } = await supabase
          .from('monthly_analytics')
          .upsert(
            {
              client_id: clientId,
              year: targetYear,
              month: targetMonth,
              platform: normalizedPlatform,
              followers: data.Followers || data.pageFollows || 0,
              follower_change: data.page_daily_follows_unique || 0,
              posts_published: 0,
              reach: data.reach || 0,
              impressions: data.impressions || data.page_posts_impressions || 0,
              engagements: data.accounts_engaged || data.page_actions_post_reactions_total || 0,
              engagement_rate: 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'client_id,year,month,platform' }
          )
          .select()

        if (error) {
          results.push({ platform: normalizedPlatform, success: false, error: error.message })
        } else {
          results.push({ platform: normalizedPlatform, success: true, data: upserted })
        }
      } catch {
        // Platform not connected, skip
      }
    }

    return NextResponse.json({
      success: true,
      synced: {
        brandId,
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
