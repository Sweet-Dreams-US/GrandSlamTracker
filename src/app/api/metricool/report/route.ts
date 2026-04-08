import { NextRequest, NextResponse } from 'next/server'
import {
  createMetricoolClient,
  getLastNDaysRange,
  type MetricoolBrand,
} from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

function formatNumber(num: number | undefined | null): string {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function generateReportHtml(
  brand: MetricoolBrand,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics: any[],
  period: string,
  dateRange: { start: string; end: string }
): string {
  const periodLabel = period === '7d' ? '7 Days' : period === '90d' ? '90 Days' : '30 Days'
  const startFormatted = `${dateRange.start.slice(0, 4)}-${dateRange.start.slice(4, 6)}-${dateRange.start.slice(6, 8)}`
  const endFormatted = `${dateRange.end.slice(0, 4)}-${dateRange.end.slice(4, 6)}-${dateRange.end.slice(6, 8)}`

  // Aggregate totals
  let totalFollowers = 0, totalReach = 0, totalImpressions = 0, totalEngagements = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformRows = analytics.map((a: any) => {
    const followers = a.Followers || a.pageFollows || a.followers || 0
    const reach = a.reach || 0
    const impressions = a.impressions || a.page_posts_impressions || 0
    const engagements = a.accounts_engaged || a.page_actions_post_reactions_total || a.engagements || 0

    totalFollowers += followers
    totalReach += reach
    totalImpressions += impressions
    totalEngagements += engagements

    return `
      <tr>
        <td style="padding:12px 16px;font-weight:600;text-transform:capitalize;border-bottom:1px solid #f0f0f0">${a.network}</td>
        <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #f0f0f0">${formatNumber(followers)}</td>
        <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #f0f0f0">${formatNumber(reach)}</td>
        <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #f0f0f0">${formatNumber(impressions)}</td>
        <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #f0f0f0">${formatNumber(engagements)}</td>
        <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #f0f0f0">${reach > 0 ? ((engagements / reach) * 100).toFixed(2) + '%' : '—'}</td>
      </tr>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Social Media Report — ${brand.label}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    .header { margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a; }
    .brand-name { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
    .subtitle { color: #666; font-size: 14px; margin-top: 6px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 32px 0; }
    .stat-card { background: #f8f8f8; border-radius: 12px; padding: 20px; }
    .stat-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 32px; font-weight: 700; margin-top: 4px; letter-spacing: -0.02em; }
    .section-title { font-size: 18px; font-weight: 600; margin: 36px 0 16px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #e0e0e0; }
    thead th:not(:first-child) { text-align: right; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; display: flex; justify-content: space-between; }
    @media print {
      .page { padding: 24px; }
      .stat-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand-name">${brand.label}</div>
      <div class="subtitle">Social Media Performance Report — Last ${periodLabel} (${startFormatted} to ${endFormatted})</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Followers</div>
        <div class="stat-value">${formatNumber(totalFollowers)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Reach</div>
        <div class="stat-value">${formatNumber(totalReach)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Impressions</div>
        <div class="stat-value">${formatNumber(totalImpressions)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Engagements</div>
        <div class="stat-value">${formatNumber(totalEngagements)}</div>
      </div>
    </div>

    <div class="section-title">Platform Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Platform</th>
          <th>Followers</th>
          <th>Reach</th>
          <th>Impressions</th>
          <th>Engagements</th>
          <th>Eng. Rate</th>
        </tr>
      </thead>
      <tbody>
        ${platformRows}
        <tr style="font-weight:700;background:#f8f8f8">
          <td style="padding:12px 16px">Total</td>
          <td style="padding:12px 16px;text-align:right">${formatNumber(totalFollowers)}</td>
          <td style="padding:12px 16px;text-align:right">${formatNumber(totalReach)}</td>
          <td style="padding:12px 16px;text-align:right">${formatNumber(totalImpressions)}</td>
          <td style="padding:12px 16px;text-align:right">${formatNumber(totalEngagements)}</td>
          <td style="padding:12px 16px;text-align:right">${totalReach > 0 ? ((totalEngagements / totalReach) * 100).toFixed(2) + '%' : '—'}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <span>Prepared by Sweet Dreams Media</span>
      <span>Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandId, period = '30d' } = body

    if (!brandId) {
      return NextResponse.json({ success: false, error: 'brandId is required' }, { status: 400 })
    }

    const client = createMetricoolClient()
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const dateRange = getLastNDaysRange(days)

    // Fetch brand info and analytics in parallel
    const [brands, analyticsData] = await Promise.all([
      client.getBrands(),
      (async () => {
        const platforms = ['instagram', 'facebook', 'tiktok', 'youtube']
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any[] = []
        for (const platform of platforms) {
          try {
            const data = await client.getStatsValues(parseInt(brandId), platform, dateRange.start, dateRange.end)
            if (data && Object.keys(data).length > 0) {
              results.push({ network: platform, ...data })
            }
          } catch { /* skip disconnected platforms */ }
        }
        return results
      })(),
    ])

    const brand = brands.find((b) => String(b.id) === String(brandId))
    if (!brand) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 })
    }

    const reportHtml = generateReportHtml(brand, analyticsData, period, dateRange)

    return NextResponse.json({
      success: true,
      reportHtml,
      brand: { id: brand.id, label: brand.label },
      period,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    )
  }
}
