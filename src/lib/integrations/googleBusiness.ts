/**
 * Google Business Profile API Integration
 * Documentation: https://developers.google.com/my-business/reference/rest
 */

const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GBP_METRICS_BASE = 'https://businessprofileperformance.googleapis.com/v1'

export interface GBPConfig {
  accessToken: string
  locationId: string // Full resource name: accounts/{accountId}/locations/{locationId}
}

export interface GBPReport {
  profileViews: number
  searchViews: number
  mapViews: number
  websiteClicks: number
  phoneCalls: number
  directionRequests: number
  messageCount: number
  bookings: number
}

export class GoogleBusinessClient {
  private accessToken: string
  private locationId: string

  constructor(config: GBPConfig) {
    this.accessToken = config.accessToken
    this.locationId = config.locationId
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GBP API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getLocation(): Promise<{
    name: string
    title: string
    storefrontAddress: object
    websiteUri?: string
    phoneNumbers?: { primaryPhone: string }
  }> {
    return this.request(`${GBP_API_BASE}/${this.locationId}?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers`)
  }

  async getDailyMetrics(
    startDate: string,
    endDate: string
  ): Promise<{
    multiDailyMetricTimeSeries: {
      dailyMetricTimeSeries: {
        dailyMetric: string
        timeSeries: {
          datedValues: {
            date: { year: number; month: number; day: number }
            value: string
          }[]
        }
      }
    }[]
  }> {
    const params = new URLSearchParams({
      'dailyRange.startDate.year': new Date(startDate).getFullYear().toString(),
      'dailyRange.startDate.month': (new Date(startDate).getMonth() + 1).toString(),
      'dailyRange.startDate.day': new Date(startDate).getDate().toString(),
      'dailyRange.endDate.year': new Date(endDate).getFullYear().toString(),
      'dailyRange.endDate.month': (new Date(endDate).getMonth() + 1).toString(),
      'dailyRange.endDate.day': new Date(endDate).getDate().toString(),
      'dailyMetrics': 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS,BUSINESS_IMPRESSIONS_DESKTOP_SEARCH,BUSINESS_IMPRESSIONS_MOBILE_MAPS,BUSINESS_IMPRESSIONS_MOBILE_SEARCH,WEBSITE_CLICKS,CALL_CLICKS,BUSINESS_DIRECTION_REQUESTS',
    })

    return this.request(
      `${GBP_METRICS_BASE}/${this.locationId}:getDailyMetricsTimeSeries?${params}`
    )
  }

  async getPerformanceReport(startDate: string, endDate: string): Promise<GBPReport> {
    try {
      const metrics = await this.getDailyMetrics(startDate, endDate)

      const sumMetric = (metricName: string): number => {
        const series = metrics.multiDailyMetricTimeSeries?.find(
          (m) => m.dailyMetricTimeSeries?.dailyMetric === metricName
        )
        return (
          series?.dailyMetricTimeSeries?.timeSeries?.datedValues?.reduce(
            (sum, v) => sum + parseInt(v.value || '0'),
            0
          ) || 0
        )
      }

      return {
        profileViews:
          sumMetric('BUSINESS_IMPRESSIONS_DESKTOP_MAPS') +
          sumMetric('BUSINESS_IMPRESSIONS_MOBILE_MAPS'),
        searchViews:
          sumMetric('BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') +
          sumMetric('BUSINESS_IMPRESSIONS_MOBILE_SEARCH'),
        mapViews:
          sumMetric('BUSINESS_IMPRESSIONS_DESKTOP_MAPS') +
          sumMetric('BUSINESS_IMPRESSIONS_MOBILE_MAPS'),
        websiteClicks: sumMetric('WEBSITE_CLICKS'),
        phoneCalls: sumMetric('CALL_CLICKS'),
        directionRequests: sumMetric('BUSINESS_DIRECTION_REQUESTS'),
        messageCount: 0, // Requires different API
        bookings: 0, // Requires different API
      }
    } catch (error) {
      console.error('Error fetching GBP metrics:', error)
      return {
        profileViews: 0,
        searchViews: 0,
        mapViews: 0,
        websiteClicks: 0,
        phoneCalls: 0,
        directionRequests: 0,
        messageCount: 0,
        bookings: 0,
      }
    }
  }
}

/**
 * Normalize GBP data to our internal format
 */
export function normalizeGBPData(
  report: GBPReport,
  date: string
): {
  platform: string
  date: string
  metrics: Record<string, number>
} {
  return {
    platform: 'google_business',
    date,
    metrics: {
      gbp_views: report.profileViews,
      gbp_searches: report.searchViews,
      gbp_map_views: report.mapViews,
      gbp_website_clicks: report.websiteClicks,
      gbp_calls: report.phoneCalls,
      gbp_directions: report.directionRequests,
    },
  }
}
