/**
 * Metricool API Integration
 * API Documentation: https://app.metricool.com/api-info
 *
 * Your brands:
 * - Sweet Dreams (our business)
 * - Crooked Lake Sandbar Music Festival (management client)
 * - Fort Wayne Direct Primary Care (management client)
 * - MC Sim Racing Fort Wayne (Partnership client)
 */

const METRICOOL_API_BASE = 'https://app.metricool.com/api'

// Types based on Metricool API responses
export interface MetricoolBrand {
  id: number
  name: string
  blogUrl: string | null
  timezone: string
  networks: MetricoolNetwork[]
}

export interface MetricoolNetwork {
  id: string
  network: string // 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', etc.
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
 */
export class MetricoolClient {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${METRICOOL_API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
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
    return this.request<MetricoolBrand[]>('/v1/brands')
  }

  /**
   * Get a specific brand by ID
   */
  async getBrand(brandId: number): Promise<MetricoolBrand> {
    return this.request<MetricoolBrand>(`/v1/brands/${brandId}`)
  }

  /**
   * Get analytics summary for a brand
   */
  async getAnalyticsSummary(
    brandId: number,
    startDate: string, // YYYY-MM-DD
    endDate: string    // YYYY-MM-DD
  ): Promise<MetricoolAnalyticsSummary[]> {
    const params = new URLSearchParams({
      init: startDate,
      end: endDate,
    })
    return this.request<MetricoolAnalyticsSummary[]>(
      `/v1/brands/${brandId}/analytics/summary?${params}`
    )
  }

  /**
   * Get posts for a brand
   */
  async getPosts(
    brandId: number,
    startDate: string,
    endDate: string,
    network?: string,
    limit: number = 100
  ): Promise<MetricoolPost[]> {
    const params = new URLSearchParams({
      init: startDate,
      end: endDate,
      limit: limit.toString(),
    })
    if (network) {
      params.set('network', network)
    }
    return this.request<MetricoolPost[]>(
      `/v1/brands/${brandId}/posts?${params}`
    )
  }

  /**
   * Get follower history for a brand
   */
  async getFollowerHistory(
    brandId: number,
    startDate: string,
    endDate: string,
    network?: string
  ): Promise<MetricoolFollowerHistory[]> {
    const params = new URLSearchParams({
      init: startDate,
      end: endDate,
    })
    if (network) {
      params.set('network', network)
    }
    return this.request<MetricoolFollowerHistory[]>(
      `/v1/brands/${brandId}/followers?${params}`
    )
  }

  /**
   * Get web analytics (if Google Analytics is connected)
   */
  async getWebAnalytics(
    brandId: number,
    startDate: string,
    endDate: string
  ): Promise<MetricoolWebAnalytics[]> {
    const params = new URLSearchParams({
      init: startDate,
      end: endDate,
    })
    return this.request<MetricoolWebAnalytics[]>(
      `/v1/brands/${brandId}/analytics/web?${params}`
    )
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
 * Format date for Metricool API (YYYY-MM-DD)
 */
export function formatMetricoolDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get date range for current month
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
 * Get date range for last N days
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
 * Normalize network name to lowercase standard
 */
export function normalizeNetworkName(network: string): string {
  const normalized = network.toLowerCase()
  // Map variations to standard names
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
