/**
 * Google Search Console API Integration
 * Documentation: https://developers.google.com/webmaster-tools/v1/api_reference_index
 */

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3'

export interface GSCConfig {
  accessToken: string
  siteUrl: string // URL-encoded site URL (e.g., sc-domain:example.com)
}

export interface GSCReport {
  impressions: number
  clicks: number
  ctr: number
  avgPosition: number
  topQueries: {
    query: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }[]
  topPages: {
    page: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }[]
}

export class SearchConsoleClient {
  private accessToken: string
  private siteUrl: string

  constructor(config: GSCConfig) {
    this.accessToken = config.accessToken
    this.siteUrl = config.siteUrl
  }

  private async request<T>(endpoint: string, body?: object): Promise<T> {
    const url = `${GSC_API_BASE}${endpoint}`
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Search Console API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensions: ('query' | 'page' | 'country' | 'device' | 'date')[] = []
  ): Promise<{
    rows: {
      keys: string[]
      clicks: number
      impressions: number
      ctr: number
      position: number
    }[]
    responseAggregationType: string
  }> {
    const encodedSiteUrl = encodeURIComponent(this.siteUrl)
    return this.request(`/sites/${encodedSiteUrl}/searchAnalytics/query`, {
      startDate,
      endDate,
      dimensions,
      rowLimit: 25000,
    })
  }

  async getOverviewReport(startDate: string, endDate: string): Promise<GSCReport> {
    // Get aggregate metrics
    const totals = await this.getSearchAnalytics(startDate, endDate, [])

    // Get top queries
    const queries = await this.getSearchAnalytics(startDate, endDate, ['query'])

    // Get top pages
    const pages = await this.getSearchAnalytics(startDate, endDate, ['page'])

    const totalRow = totals.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 }

    return {
      impressions: totalRow.impressions,
      clicks: totalRow.clicks,
      ctr: totalRow.ctr * 100, // Convert to percentage
      avgPosition: totalRow.position,
      topQueries: (queries.rows || []).slice(0, 20).map((row) => ({
        query: row.keys[0],
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr * 100,
        position: row.position,
      })),
      topPages: (pages.rows || []).slice(0, 20).map((row) => ({
        page: row.keys[0],
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr * 100,
        position: row.position,
      })),
    }
  }
}

/**
 * Normalize Search Console data to our internal format
 */
export function normalizeGSCData(
  report: GSCReport,
  date: string
): {
  platform: string
  date: string
  metrics: Record<string, number>
} {
  return {
    platform: 'search_console',
    date,
    metrics: {
      search_impressions: report.impressions,
      search_clicks: report.clicks,
      search_ctr: report.ctr,
      avg_position: report.avgPosition,
    },
  }
}
