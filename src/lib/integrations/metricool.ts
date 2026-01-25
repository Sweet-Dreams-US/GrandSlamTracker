/**
 * Metricool API Integration
 * Documentation: https://app.metricool.com/api-info
 */

const METRICOOL_API_BASE = 'https://app.metricool.com/api/v2'

export interface MetricoolBrand {
  id: string
  name: string
  timezone: string
}

export interface MetricoolAnalytics {
  platform: string
  followers: number
  followerChange: number
  postsPublished: number
  reach: number
  impressions: number
  engagements: number
  engagementRate: number
  topPosts: {
    id: string
    type: string
    date: string
    impressions: number
    engagements: number
    url?: string
  }[]
}

export interface MetricoolConfig {
  apiKey: string
  brandId: string
}

export class MetricoolClient {
  private apiKey: string
  private brandId: string

  constructor(config: MetricoolConfig) {
    this.apiKey = config.apiKey
    this.brandId = config.brandId
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${METRICOOL_API_BASE}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Metricool API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getBrand(): Promise<MetricoolBrand> {
    return this.request<MetricoolBrand>(`/brands/${this.brandId}`)
  }

  async getAnalytics(
    startDate: string,
    endDate: string,
    platforms?: string[]
  ): Promise<MetricoolAnalytics[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    })

    if (platforms) {
      params.set('platforms', platforms.join(','))
    }

    return this.request<MetricoolAnalytics[]>(
      `/brands/${this.brandId}/analytics?${params}`
    )
  }

  async getFollowers(
    startDate: string,
    endDate: string
  ): Promise<{ platform: string; date: string; count: number }[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    })

    return this.request(`/brands/${this.brandId}/followers?${params}`)
  }

  async getPosts(
    startDate: string,
    endDate: string,
    platform?: string
  ): Promise<{
    id: string
    platform: string
    type: string
    date: string
    content: string
    impressions: number
    engagements: number
    likes: number
    comments: number
    shares: number
    url?: string
  }[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    })

    if (platform) {
      params.set('platform', platform)
    }

    return this.request(`/brands/${this.brandId}/posts?${params}`)
  }
}

/**
 * Normalize Metricool data to our internal format
 */
export function normalizeMetricoolData(
  analytics: MetricoolAnalytics[],
  date: string
): {
  platform: string
  date: string
  metrics: Record<string, number>
}[] {
  return analytics.map((a) => ({
    platform: a.platform.toLowerCase(),
    date,
    metrics: {
      followers: a.followers,
      follower_change: a.followerChange,
      posts_published: a.postsPublished,
      reach: a.reach,
      impressions: a.impressions,
      engagements: a.engagements,
      engagement_rate: a.engagementRate,
    },
  }))
}
