'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  Users,
  Eye,
  Heart,
  TrendingUp,
  MessageCircle,
  Share2,
  Bookmark,
  MousePointer,
  Video,
  Instagram,
  Facebook,
  Youtube,
  BarChart3,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react'

type Period = '7d' | '30d' | '90d'
type ActiveTab = 'overview' | 'posts' | 'demographics'

const PERIOD_LABELS: Record<Period, string> = { '7d': '7 Days', '30d': '30 Days', '90d': '90 Days' }

function getPlatformIcon(p: string) {
  switch (p.toLowerCase()) {
    case 'instagram': return Instagram
    case 'facebook': return Facebook
    case 'youtube': return Youtube
    default: return BarChart3
  }
}

function formatNumber(num: number | undefined | null): string {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function formatPercent(num: number | undefined | null): string {
  if (!num) return '0%'
  return `${num.toFixed(2)}%`
}

function StatCard({ label, value, icon: Icon, color, subtext }: {
  label: string; value: string; icon: typeof Users; color: string; subtext?: string
}) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs text-[var(--muted)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      {subtext && <p className="text-xs text-[var(--muted)] mt-1">{subtext}</p>}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PlatformSection({ network, data }: { network: string; data: any }) {
  const Icon = getPlatformIcon(network)

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--muted)]" />
        <h3 className="text-sm font-semibold text-[var(--foreground)] capitalize">{network}</h3>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Followers"
          value={formatNumber(data.Followers || data.pageFollows || data.followers)}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Reach"
          value={formatNumber(data.reach)}
          icon={Eye}
          color="bg-emerald-500"
        />
        <StatCard
          label="Impressions"
          value={formatNumber(data.impressions || data.page_posts_impressions)}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          label="Engagements"
          value={formatNumber(data.accounts_engaged || data.page_actions_post_reactions_total || data.engagements)}
          icon={Heart}
          color="bg-pink-500"
        />
      </div>
      {/* Extra metrics if available */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {data.likes != null && (
            <div className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
              <Heart className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
              <p className="text-xs font-bold text-[var(--foreground)]">{formatNumber(data.likes)}</p>
              <p className="text-[10px] text-[var(--muted)]">Likes</p>
            </div>
          )}
          {data.comments != null && (
            <div className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
              <MessageCircle className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
              <p className="text-xs font-bold text-[var(--foreground)]">{formatNumber(data.comments)}</p>
              <p className="text-[10px] text-[var(--muted)]">Comments</p>
            </div>
          )}
          {data.shares != null && (
            <div className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
              <Share2 className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
              <p className="text-xs font-bold text-[var(--foreground)]">{formatNumber(data.shares)}</p>
              <p className="text-[10px] text-[var(--muted)]">Shares</p>
            </div>
          )}
          {data.saved != null && (
            <div className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
              <Bookmark className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
              <p className="text-xs font-bold text-[var(--foreground)]">{formatNumber(data.saved)}</p>
              <p className="text-[10px] text-[var(--muted)]">Saves</p>
            </div>
          )}
          {(data.profile_links_clicks || data.website_clicks) != null && (
            <div className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
              <MousePointer className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
              <p className="text-xs font-bold text-[var(--foreground)]">{formatNumber(data.profile_links_clicks || data.website_clicks)}</p>
              <p className="text-[10px] text-[var(--muted)]">Clicks</p>
            </div>
          )}
          {data.video_views != null && (
            <div className="text-center p-2 rounded-lg bg-[var(--surface-hover)]">
              <Video className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
              <p className="text-xs font-bold text-[var(--foreground)]">{formatNumber(data.video_views)}</p>
              <p className="text-[10px] text-[var(--muted)]">Video Views</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BrandDetailPage() {
  const params = useParams()
  const brandId = params.brandId as string

  const [period, setPeriod] = useState<Period>('30d')
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [brandInfo, setBrandInfo] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analytics, setAnalytics] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [brandsRes, analyticsRes, postsRes] = await Promise.all([
        fetch('/api/metricool/brands'),
        fetch(`/api/metricool/analytics?brandId=${brandId}&period=${period}`),
        fetch(`/api/metricool/posts?brandId=${brandId}&period=${period}`),
      ])

      const brandsData = await brandsRes.json()
      const analyticsData = await analyticsRes.json()
      const postsData = await postsRes.json()

      if (brandsData.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const brand = brandsData.brands?.find((b: any) => String(b.id) === brandId)
        setBrandInfo(brand || null)
      }
      if (analyticsData.success) setAnalytics(analyticsData.analytics || [])
      if (postsData.success) setPosts(postsData.posts)
    } catch (err) {
      console.error('Error loading brand data:', err)
    } finally {
      setLoading(false)
    }
  }, [brandId, period])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleGenerateReport() {
    setGenerating(true)
    try {
      const res = await fetch('/api/metricool/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, period }),
      })
      const data = await res.json()
      if (data.success && data.reportHtml) {
        // Open report in new tab
        const blob = new Blob([data.reportHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/analytics" className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
            <ArrowLeft className="h-5 w-5 text-[var(--muted)]" />
          </Link>
          <div className="flex items-center gap-3">
            {brandInfo?.picture ? (
              <img src={brandInfo.picture} alt={brandInfo.label} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {brandInfo?.label?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{brandInfo?.label || `Brand ${brandId}`}</h1>
              <p className="text-sm text-[var(--muted)]">Last {PERIOD_LABELS[period]}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {generating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Generate Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(['overview', 'posts', 'demographics'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {analytics.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No analytics data available for this period</p>
            </div>
          ) : (
            analytics.map((a) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = a as any
              return (
                <PlatformSection key={data.network} network={data.network} data={data} />
              )
            })
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          {posts && typeof posts === 'object' && Array.isArray(posts) ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {posts.map((post: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-hover)]">
                  <div className="flex-1">
                    <p className="text-sm text-[var(--foreground)] line-clamp-2">{post.content || post.message || 'No caption'}</p>
                    <div className="flex gap-4 mt-2">
                      {post.likes != null && <span className="text-xs text-[var(--muted)]">{formatNumber(post.likes)} likes</span>}
                      {post.comments != null && <span className="text-xs text-[var(--muted)]">{formatNumber(post.comments)} comments</span>}
                      {post.reach != null && <span className="text-xs text-[var(--muted)]">{formatNumber(post.reach)} reach</span>}
                      {post.impressions != null && <span className="text-xs text-[var(--muted)]">{formatNumber(post.impressions)} impressions</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts && typeof posts === 'object' ? (
            <pre className="text-xs text-[var(--muted)] overflow-auto max-h-96">
              {JSON.stringify(posts, null, 2)}
            </pre>
          ) : (
            <div className="text-center py-8 text-[var(--muted)]">
              <p>No post data available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'demographics' && (
        <div className="text-center py-12 text-[var(--muted)]">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Demographics</p>
          <p className="text-sm mt-1">Audience gender, age, location data — coming from Metricool community stats</p>
        </div>
      )}
    </div>
  )
}
