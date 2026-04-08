import { NextRequest, NextResponse } from 'next/server'
import { createMetricoolClient, getLastNDaysRange } from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/posts?brandId=123&period=30d
 * Fetch posts for ALL connected platforms on a brand
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

    // Fetch posts from all platforms in parallel
    const [igPosts, fbPosts] = await Promise.all([
      client.getInstagramAnalytics(brandId, start, end).catch(() => null),
      client.getFacebookAnalytics(brandId, start, end).catch(() => null),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPosts: any[] = []

    // Normalize Instagram posts
    if (igPosts && Array.isArray(igPosts)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of igPosts as any[]) {
        allPosts.push({
          id: p.postId || p.id,
          platform: 'instagram',
          type: p.type || 'post',
          content: typeof p.content === 'string' ? p.content : '',
          url: p.url || null,
          date: p.created || p.publishedAt || null,
          likes: p.likes || 0,
          comments: p.comments || 0,
          shares: p.shares || 0,
          saves: p.saved || p.saves || 0,
          reach: p.reach || 0,
          impressions: p.impressions || 0,
          views: p.views || p.videoViews || 0,
          engagement: p.engagement || 0,
          imageUrl: p.imageUrl || null,
        })
      }
    }

    // Normalize Facebook posts
    if (fbPosts && Array.isArray(fbPosts)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of fbPosts as any[]) {
        allPosts.push({
          id: p.postId || p.id,
          platform: 'facebook',
          type: p.type || 'post',
          content: typeof p.content === 'string' ? p.content : (typeof p.message === 'string' ? p.message : ''),
          url: p.url || null,
          date: p.created || p.publishedAt || null,
          likes: p.likes || p.reactions || 0,
          comments: p.comments || 0,
          shares: p.shares || 0,
          saves: 0,
          reach: p.reach || 0,
          impressions: p.impressions || 0,
          views: p.views || p.videoViews || 0,
          engagement: p.engagement || 0,
          imageUrl: p.imageUrl || null,
        })
      }
    }

    // Sort by date descending
    allPosts.sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return NextResponse.json({
      success: true,
      period: { startDate: start, endDate: end },
      posts: allPosts,
      totalPosts: allPosts.length,
    })
  } catch (error) {
    console.error('Error fetching Metricool posts:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
