/**
 * Metricool API Integration
 * API Documentation: https://app.metricool.com/resources/apidocs/index.html
 *
 * Auth: X-Mc-Auth header with userToken, plus userId & blogId query params
 * Date format: YYYYMMDD
 *
 * Your brands:
 * - Sweet Dreams Music (id: 5773395)
 * - Fort Wayne Direct Primary Care (id: 5773452)
 * - MC Sim Racing (id: 5773453)
 * - Crooked Lake Sandbar Music Festival (id: 5773454)
 * - Bell's Skating Rink (id: 5836312)
 * - Prime Dealer Equity Fund (id: 5891018)
 */

const METRICOOL_API_BASE = 'https://app.metricool.com/api'
const METRICOOL_USER_ID = 4472067

// Brand IDs for quick reference
export const METRICOOL_BRANDS = {
  sweetDreams: 5773395,
  fortWayneDPC: 5773452,
  mcRacing: 5773453,
  sandbarFest: 5773454,
  bellsRink: 5836312,
  primeDealerEquity: 5891018,
} as const

// Types based on Metricool API responses
export interface MetricoolBrand {
  id: number
  userId: number
  label: string
  url: string | null
  picture: string | null
  facebook: string | null
  instagram: string | null
  youtube: string | null
  tiktok: string | null
  twitter: string | null
  linkedinCompany: string | null
  threads: string | null
  bluesky: string | null
  timezone: string
}

export interface MetricoolNetwork {
  id: string
  network: string
  name: string
  profileUrl: string
  profileImage: string | null
}

export interface MetricoolAnalyticsSummary {
  network: string
  followers: number
  followersChange: number
  posts: number
  reach: number
  impressions: number
  interactions: number
  interactionRate: number
}

export interface MetricoolPost {
  id: string
  network: string
  type: string
  publishedAt: string
  content: string
  url: string
  impressions: number
  reach: number
  interactions: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  videoViews: number
}

export interface MetricoolFollowerHistory {
  date: string
  network: string
  followers: number
  change: number
}

export interface MetricoolWebAnalytics {
  date: string
  sessions: number
  users: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
  newUsers: number
}

/**
 * Metricool API Client
 * Uses X-Mc-Auth header + userId/blogId query params
 */
export class MetricoolClient {
  private token: string
  private userId: number

  constructor(token: string, userId: number = METRICOOL_USER_ID) {
    this.token = token
    this.userId = userId
  }

  private buildUrl(endpoint: string, blogId: number, extraParams?: Record<string, string>): string {
    const params = new URLSearchParams({
      userId: String(this.userId),
      blogId: String(blogId),
      ...extraParams,
    })
    return `${METRICOOL_API_BASE}${endpoint}?${params}`
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Mc-Auth': this.token,
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Metricool API error (${response.status}): ${errorText}`)
    }

    const text = await response.text()
    if (!text) return {} as T

    return JSON.parse(text)
  }

  /**
   * Get all brands (accounts) connected to this Metricool account
   */
  async getBrands(): Promise<MetricoolBrand[]> {
    const params = new URLSearchParams({
      userToken: this.token,
    })
    return this.request<MetricoolBrand[]>(
      `${METRICOOL_API_BASE}/admin/simpleProfiles?${params}`
    )
  }

  /**
   * Get Instagram analytics for a brand
   */
  async getInstagramAnalytics(
    blogId: number,
    startDate: string, // YYYYMMDD
    endDate: string    // YYYYMMDD
  ): Promise<Record<string, unknown>> {
    const url = this.buildUrl('/stats/instagram/posts', blogId, {
      start: startDate,
      end: endDate,
    })
    return this.request<Record<string, unknown>>(url)
  }

  /**
   * Get Facebook analytics for a brand
   */
  async getFacebookAnalytics(
    blogId: number,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    const url = this.buildUrl('/stats/facebook/posts', blogId, {
      start: startDate,
      end: endDate,
    })
    return this.request<Record<string, unknown>>(url)
  }

  /**
   * Get stats values for a category
   * Categories: 'facebook', 'instagram', 'twitter', 'youtube', 'tiktok', 'linkedin', etc.
   */
  async getStatsValues(
    blogId: number,
    category: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    const url = this.buildUrl(`/stats/values/${category}`, blogId, {
      start: startDate,
      end: endDate,
    })
    return this.request<Record<string, unknown>>(url)
  }

  /**
   * Get stats timeline for a metric
   */
  async getStatsTimeline(
    blogId: number,
    metric: string,
    startDate: string,
    endDate: string
  ): Promise<unknown[]> {
    const url = this.buildUrl(`/stats/timeline/${metric}`, blogId, {
      start: startDate,
      end: endDate,
    })
    return this.request<unknown[]>(url)
  }

  /**
   * Get aggregated stats
   */
  async getStatsAggregation(
    blogId: number,
    metric: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    const url = this.buildUrl(`/stats/aggregation/${metric}`, blogId, {
      start: startDate,
      end: endDate,
    })
    return this.request<Record<string, unknown>>(url)
  }

  /**
   * Get community demographics (gender, age, country, city)
   */
  async getCommunityStats(
    blogId: number,
    statType: 'gender' | 'age' | 'country' | 'city',
    provider: string,
    startDate: string,
    endDate: string
  ): Promise<unknown> {
    const url = this.buildUrl(`/stats/${statType}/${provider}`, blogId, {
      start: startDate,
      end: endDate,
    })
    return this.request<unknown>(url)
  }
}

/**
 * Create a Metricool client from environment variable
 */
export function createMetricoolClient(): MetricoolClient {
  const token = process.env.METRICOOL_API_TOKEN
  if (!token) {
    throw new Error('METRICOOL_API_TOKEN environment variable not set')
  }
  return new MetricoolClient(token)
}

/**
 * Format date for Metricool API (YYYYMMDD)
 */
export function formatMetricoolDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/**
 * Get date range for current month (YYYYMMDD format)
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: formatMetricoolDate(start),
    end: formatMetricoolDate(end),
  }
}

/**
 * Get date range for last N days (YYYYMMDD format)
 */
export function getLastNDaysRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return {
    start: formatMetricoolDate(start),
    end: formatMetricoolDate(end),
  }
}

/**
 * Get date range for a specific month (YYYYMMDD format)
 */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: formatMetricoolDate(start),
    end: formatMetricoolDate(end),
  }
}

/**
 * Normalize network name to lowercase standard
 */
export function normalizeNetworkName(network: string): string {
  const normalized = network.toLowerCase()
  const mapping: Record<string, string> = {
    'fb': 'facebook',
    'ig': 'instagram',
    'tw': 'twitter',
    'x': 'twitter',
    'li': 'linkedin',
    'yt': 'youtube',
    'tt': 'tiktok',
    'pin': 'pinterest',
  }
  return mapping[normalized] || normalized
}
