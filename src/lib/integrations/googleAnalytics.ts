/**
 * Google Analytics (GA4) API Integration
 * Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

const GA4_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'

export interface GA4Config {
  accessToken: string
  propertyId: string
}

export interface GA4Report {
  sessions: number
  users: number
  newUsers: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
  conversions: number
  topPages: {
    path: string
    pageViews: number
    avgTimeOnPage: number
  }[]
  trafficSources: {
    source: string
    sessions: number
    users: number
  }[]
}

export class GoogleAnalyticsClient {
  private accessToken: string
  private propertyId: string

  constructor(config: GA4Config) {
    this.accessToken = config.accessToken
    this.propertyId = config.propertyId
  }

  private async request<T>(endpoint: string, body: object): Promise<T> {
    const url = `${GA4_API_BASE}/properties/${this.propertyId}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GA4 API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async runReport(
    startDate: string,
    endDate: string,
    metrics: string[],
    dimensions?: string[]
  ): Promise<any> {
    return this.request(':runReport', {
      dateRanges: [{ startDate, endDate }],
      metrics: metrics.map((m) => ({ name: m })),
      dimensions: dimensions?.map((d) => ({ name: d })),
    })
  }

  async getOverviewReport(startDate: string, endDate: string): Promise<GA4Report> {
    // Get main metrics
    const mainReport = await this.runReport(startDate, endDate, [
      'sessions',
      'totalUsers',
      'newUsers',
      'screenPageViews',
      'averageSessionDuration',
      'bounceRate',
      'conversions',
    ])

    // Get top pages
    const pagesReport = await this.runReport(
      startDate,
      endDate,
      ['screenPageViews', 'averageSessionDuration'],
      ['pagePath']
    )

    // Get traffic sources
    const sourcesReport = await this.runReport(
      startDate,
      endDate,
      ['sessions', 'totalUsers'],
      ['sessionSource']
    )

    return {
      sessions: parseFloat(mainReport.rows?.[0]?.metricValues?.[0]?.value || '0'),
      users: parseFloat(mainReport.rows?.[0]?.metricValues?.[1]?.value || '0'),
      newUsers: parseFloat(mainReport.rows?.[0]?.metricValues?.[2]?.value || '0'),
      pageViews: parseFloat(mainReport.rows?.[0]?.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseFloat(mainReport.rows?.[0]?.metricValues?.[4]?.value || '0'),
      bounceRate: parseFloat(mainReport.rows?.[0]?.metricValues?.[5]?.value || '0'),
      conversions: parseFloat(mainReport.rows?.[0]?.metricValues?.[6]?.value || '0'),
      topPages: (pagesReport.rows || []).slice(0, 10).map((row: any) => ({
        path: row.dimensionValues?.[0]?.value || '',
        pageViews: parseFloat(row.metricValues?.[0]?.value || '0'),
        avgTimeOnPage: parseFloat(row.metricValues?.[1]?.value || '0'),
      })),
      trafficSources: (sourcesReport.rows || []).slice(0, 10).map((row: any) => ({
        source: row.dimensionValues?.[0]?.value || '',
        sessions: parseFloat(row.metricValues?.[0]?.value || '0'),
        users: parseFloat(row.metricValues?.[1]?.value || '0'),
      })),
    }
  }
}

/**
 * Normalize GA4 data to our internal format
 */
export function normalizeGA4Data(
  report: GA4Report,
  date: string
): {
  platform: string
  date: string
  metrics: Record<string, number>
} {
  return {
    platform: 'google_analytics',
    date,
    metrics: {
      sessions: report.sessions,
      users: report.users,
      new_users: report.newUsers,
      page_views: report.pageViews,
      avg_session_duration: report.avgSessionDuration,
      bounce_rate: report.bounceRate,
      conversions: report.conversions,
    },
  }
}
