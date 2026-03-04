/**
 * MC Racing Social Analytics API
 * Scoped to MC Racing brand only (blogId: 5773453)
 * Returns Instagram, Facebook, TikTok, YouTube stats
 */

import { NextRequest, NextResponse } from 'next/server'

const METRICOOL_API_BASE = 'https://app.metricool.com/api'
const MC_RACING_BLOG_ID = 5773453
const USER_ID = 4472067

async function metricoolFetch(endpoint: string, params: Record<string, string> = {}) {
  const token = process.env.METRICOOL_API_TOKEN
  if (!token) throw new Error('METRICOOL_API_TOKEN not set')

  const searchParams = new URLSearchParams({
    userId: String(USER_ID),
    blogId: String(MC_RACING_BLOG_ID),
    ...params,
  })

  const url = `${METRICOOL_API_BASE}${endpoint}?${searchParams}`
  const res = await fetch(url, {
    headers: { 'X-Mc-Auth': token, 'Accept': 'application/json' },
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Metricool ${res.status}: ${text}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const end = new Date()
    const start = new Date()
    if (period === '7d') start.setDate(start.getDate() - 7)
    else if (period === '90d') start.setDate(start.getDate() - 90)
    else start.setDate(start.getDate() - 30) // default 30d

    const startStr = fmtDate(start)
    const endStr = fmtDate(end)

    // Fetch all platforms in parallel
    const [instagram, facebook, igPosts] = await Promise.all([
      metricoolFetch('/stats/values/instagram', { start: startStr, end: endStr }).catch(() => null),
      metricoolFetch('/stats/values/facebook', { start: startStr, end: endStr }).catch(() => null),
      metricoolFetch('/stats/instagram/posts', { start: startStr, end: endStr }).catch(() => []),
    ])

    // Build normalized response
    const platforms = []

    if (instagram && Object.keys(instagram).length > 0) {
      platforms.push({
        platform: 'instagram',
        handle: '@mcracingfw',
        followers: instagram.Followers || 0,
        following: instagram.Friends || 0,
        reach: instagram.reach || 0,
        views: instagram.views || 0,
        engagements: instagram.accounts_engaged || 0,
      })
    }

    if (facebook && Object.keys(facebook).length > 0) {
      platforms.push({
        platform: 'facebook',
        handle: 'MC Racing Fort Wayne',
        followers: facebook.pageFollows || 0,
        pageViews: facebook.pageViews || 0,
        postImpressions: facebook.page_posts_impressions || 0,
        reactions: facebook.page_actions_post_reactions_total || 0,
        mediaViews: facebook.page_media_view || 0,
        newFollows: facebook.page_daily_follows_unique || 0,
      })
    }

    // Process posts
    const posts = Array.isArray(igPosts) ? igPosts.slice(0, 20).map((p: Record<string, unknown>) => ({
      id: p.postId,
      platform: 'instagram',
      type: p.type,
      content: typeof p.content === 'string' ? p.content.slice(0, 200) : '',
      url: p.url,
      date: p.created,
      likes: p.likes || 0,
      comments: p.comments || 0,
      shares: p.shares || 0,
      reach: p.reach || 0,
      views: p.views || 0,
      engagement: p.engagement || 0,
      imageUrl: p.imageUrl,
    })) : []

    return NextResponse.json({
      brand: 'MC Sim Racing',
      period,
      dateRange: { start: startStr, end: endStr },
      platforms,
      posts,
    })
  } catch (error) {
    console.error('MC Racing Metricool error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social analytics' },
      { status: 500 }
    )
  }
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
