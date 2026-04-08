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
  FileText,
  AlertCircle,
  ExternalLink,
  Globe,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Play,
  ThumbsUp,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

type Period = '7d' | '30d' | '90d'
type ActiveTab = 'overview' | 'posts' | 'demographics'

const PERIOD_LABELS: Record<Period, string> = { '7d': '7 Days', '30d': '30 Days', '90d': '90 Days' }

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  youtube: '#FF0000',
  tiktok: '#000000',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
}

const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

function getPlatformIcon(p: string) {
  switch (p.toLowerCase()) {
    case 'instagram': return Instagram
    case 'facebook': return Facebook
    case 'youtube': return Youtube
    default: return BarChart3
  }
}

function formatNumber(num: number | undefined | null): string {
  if (num === null || num === undefined) return '0'
  if (num === 0) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

// Transform demographics data from object format { "M": 836, "F": 334 } to array format [{ label: "M", value: 836 }]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDemoArray(data: any): { label: string; value: number }[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([label, value]) => ({ label, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value)
  }
  return []
}

const GENDER_LABELS: Record<string, string> = { M: 'Male', F: 'Female', U: 'Unknown' }

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
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
  const platformColor = PLATFORM_COLORS[network] || '#6b7280'

  const followers = data.Followers || data.pageFollows || data.followers || 0
  const reach = data.reach || 0
  const impressions = data.impressions || data.page_posts_impressions || 0
  const engagements = data.accounts_engaged || data.page_actions_post_reactions_total || data.engagements || 0
  const engRate = reach > 0 ? ((engagements / reach) * 100).toFixed(2) : '0.00'

  // All possible extra metrics
  const extraMetrics = [
    { key: 'likes', label: 'Likes', icon: Heart, val: data.likes },
    { key: 'comments', label: 'Comments', icon: MessageCircle, val: data.comments },
    { key: 'shares', label: 'Shares', icon: Share2, val: data.shares },
    { key: 'saved', label: 'Saves', icon: Bookmark, val: data.saved },
    { key: 'clicks', label: 'Clicks', icon: MousePointer, val: data.profile_links_clicks || data.website_clicks },
    { key: 'views', label: 'Video Views', icon: Video, val: data.video_views || data.views },
    { key: 'pageViews', label: 'Page Views', icon: Eye, val: data.pageViews },
    { key: 'mediaView', label: 'Media Views', icon: Play, val: data.page_media_view },
    { key: 'newFollows', label: 'New Follows', icon: Users, val: data.page_daily_follows_unique },
    { key: 'reactions', label: 'Reactions', icon: ThumbsUp, val: data.page_actions_post_reactions_total },
    { key: 'friends', label: 'Following', icon: Users, val: data.Friends },
  ].filter(m => m.val != null && m.val !== undefined)

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: platformColor + '20' }}>
            <Icon className="h-5 w-5" style={{ color: platformColor }} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] capitalize">{network}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: platformColor + '15', color: platformColor }}>
            {engRate}% eng. rate
          </span>
        </div>
      </div>

      {/* Main metrics */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Followers" value={formatNumber(followers)} icon={Users} color="bg-blue-500" />
        <StatCard label="Reach" value={formatNumber(reach)} icon={Eye} color="bg-emerald-500" />
        <StatCard label="Impressions" value={formatNumber(impressions)} icon={TrendingUp} color="bg-purple-500" />
        <StatCard label="Engagements" value={formatNumber(engagements)} icon={Heart} color="bg-pink-500" />
      </div>

      {/* Extra metrics */}
      {extraMetrics.length > 0 && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {extraMetrics.map((m) => (
              <div key={m.key} className="text-center p-2.5 rounded-lg bg-[var(--surface-hover)]">
                <m.icon className="h-3.5 w-3.5 mx-auto text-[var(--muted)] mb-1" />
                <p className="text-sm font-bold text-[var(--foreground)]">{formatNumber(m.val)}</p>
                <p className="text-[10px] text-[var(--muted)]">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Post card component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PostCard({ post }: { post: any }) {
  const Icon = getPlatformIcon(post.platform)
  const platformColor = PLATFORM_COLORS[post.platform] || '#6b7280'

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Thumbnail */}
        {post.imageUrl && (
          <div className="w-24 h-24 flex-shrink-0 bg-[var(--surface-hover)]">
            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-3 w-3 flex-shrink-0" style={{ color: platformColor }} />
            <span className="text-[10px] font-medium capitalize" style={{ color: platformColor }}>{post.platform}</span>
            <span className="text-[10px] text-[var(--muted)] ml-auto">{formatDate(post.date)}</span>
          </div>
          <p className="text-xs text-[var(--foreground)] line-clamp-2 mb-2">
            {post.content || 'No caption'}
          </p>
          <div className="flex flex-wrap gap-3 text-[10px] text-[var(--muted)]">
            {post.likes > 0 && <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" /> {formatNumber(post.likes)}</span>}
            {post.comments > 0 && <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" /> {formatNumber(post.comments)}</span>}
            {post.shares > 0 && <span className="flex items-center gap-0.5"><Share2 className="h-2.5 w-2.5" /> {formatNumber(post.shares)}</span>}
            {post.saves > 0 && <span className="flex items-center gap-0.5"><Bookmark className="h-2.5 w-2.5" /> {formatNumber(post.saves)}</span>}
            {post.reach > 0 && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {formatNumber(post.reach)}</span>}
            {post.views > 0 && <span className="flex items-center gap-0.5"><Video className="h-2.5 w-2.5" /> {formatNumber(post.views)}</span>}
          </div>
        </div>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="p-3 flex items-start">
            <ExternalLink className="h-3.5 w-3.5 text-[var(--muted)] hover:text-[var(--accent)]" />
          </a>
        )}
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
  const [posts, setPosts] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [demographics, setDemographics] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [timelines, setTimelines] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [postFilter, setPostFilter] = useState<string>('all')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    try {
      const [brandsRes, analyticsRes, timelineRes] = await Promise.all([
        fetch('/api/metricool/brands'),
        fetch(`/api/metricool/analytics?brandId=${brandId}&period=${period}`),
        fetch(`/api/metricool/timeline?brandId=${brandId}&period=${period}`),
      ])

      const [brandsData, analyticsData, timelineData] = await Promise.all([
        brandsRes.json(),
        analyticsRes.json(),
        timelineRes.json(),
      ])

      if (brandsData.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const brand = brandsData.brands?.find((b: any) => String(b.id) === brandId)
        setBrandInfo(brand || null)
      }
      if (analyticsData.success) setAnalytics(analyticsData.analytics || [])
      if (timelineData.success) setTimelines(timelineData.timelines || null)
    } catch (err) {
      console.error('Error loading brand data:', err)
    } finally {
      setLoading(false)
    }
  }, [brandId, period])

  const loadPosts = useCallback(async () => {
    setPostsLoading(true)
    try {
      const res = await fetch(`/api/metricool/posts?brandId=${brandId}&period=${period}`)
      const data = await res.json()
      if (data.success) setPosts(data.posts || [])
    } catch (err) {
      console.error('Error loading posts:', err)
    } finally {
      setPostsLoading(false)
    }
  }, [brandId, period])

  const loadDemographics = useCallback(async () => {
    setDemoLoading(true)
    try {
      const res = await fetch(`/api/metricool/demographics?brandId=${brandId}&period=${period}`)
      const data = await res.json()
      if (data.success) setDemographics(data.demographics || null)
    } catch (err) {
      console.error('Error loading demographics:', err)
    } finally {
      setDemoLoading(false)
    }
  }, [brandId, period])

  // Load overview data on mount and period change
  useEffect(() => { loadOverview() }, [loadOverview])

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'posts' && posts.length === 0) loadPosts()
    if (activeTab === 'demographics' && !demographics) loadDemographics()
  }, [activeTab, loadPosts, loadDemographics, posts.length, demographics])

  // Reload everything when period changes
  useEffect(() => {
    setPosts([])
    setDemographics(null)
    setTimelines(null)
  }, [period])

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

  // Aggregate totals
  let totalFollowers = 0, totalReach = 0, totalImpressions = 0, totalEngagements = 0
  for (const a of analytics) {
    totalFollowers += a.Followers || a.pageFollows || a.followers || 0
    totalReach += a.reach || 0
    totalImpressions += a.impressions || a.page_posts_impressions || 0
    totalEngagements += a.accounts_engaged || a.page_actions_post_reactions_total || a.engagements || 0
  }
  const overallEngRate = totalReach > 0 ? ((totalEngagements / totalReach) * 100).toFixed(2) : '0.00'

  // Filter posts
  const filteredPosts = postFilter === 'all' ? posts : posts.filter(p => p.platform === postFilter)
  const postPlatforms = Array.from(new Set(posts.map(p => p.platform)))

  // Build follower distribution for pie chart
  const followerDistribution = analytics.map(a => ({
    name: (a.network as string).charAt(0).toUpperCase() + (a.network as string).slice(1),
    value: a.Followers || a.pageFollows || a.followers || 0,
    color: PLATFORM_COLORS[a.network as string] || '#6b7280',
  })).filter(d => d.value > 0)

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
              <img src={brandInfo.picture} alt={brandInfo.label} className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--accent)]/20" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {brandInfo?.label?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{brandInfo?.label || `Brand ${brandId}`}</h1>
              <p className="text-sm text-[var(--muted)]">Last {PERIOD_LABELS[period]} · {analytics.length} platform{analytics.length !== 1 ? 's' : ''} connected</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
            onClick={() => { loadOverview(); setPosts([]); setDemographics(null) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Generate Report
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Followers" value={formatNumber(totalFollowers)} icon={Users} color="bg-blue-500" subtext={`across ${analytics.length} platforms`} />
        <StatCard label="Total Reach" value={formatNumber(totalReach)} icon={Eye} color="bg-emerald-500" />
        <StatCard label="Total Impressions" value={formatNumber(totalImpressions)} icon={TrendingUp} color="bg-purple-500" />
        <StatCard label="Total Engagements" value={formatNumber(totalEngagements)} icon={Heart} color="bg-pink-500" />
        <StatCard label="Engagement Rate" value={`${overallEngRate}%`} icon={TrendingUp} color="bg-amber-500" subtext="engagements / reach" />
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
            {tab === 'posts' && posts.length > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-hover)]">{posts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Follower Distribution Chart */}
          {followerDistribution.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Follower Distribution</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={followerDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {followerDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => [formatNumber(Number(value)), 'Followers']}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: 'var(--foreground)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement comparison bar chart */}
              <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Platform Comparison</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.map(a => ({
                      name: (a.network as string).charAt(0).toUpperCase() + (a.network as string).slice(1),
                      reach: a.reach || 0,
                      impressions: a.impressions || a.page_posts_impressions || 0,
                      engagements: a.accounts_engaged || a.page_actions_post_reactions_total || a.engagements || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => formatNumber(Number(value))}
                      />
                      <Bar dataKey="reach" fill="#10b981" radius={[4, 4, 0, 0]} name="Reach" />
                      <Bar dataKey="impressions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Impressions" />
                      <Bar dataKey="engagements" fill="#ec4899" radius={[4, 4, 0, 0]} name="Engagements" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Timeline charts */}
          {timelines && Object.keys(timelines).length > 0 && (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Trends Over Time</h3>
              {Object.entries(timelines).map(([metric, data]) => {
                if (!Array.isArray(data) || data.length === 0) return null
                return (
                  <div key={metric} className="mb-6 last:mb-0">
                    <p className="text-xs text-[var(--muted)] capitalize mb-2">{metric}</p>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data as Record<string, unknown>[]}>
                          <defs>
                            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={(v) => formatNumber(v)} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill={`url(#grad-${metric})`} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Per-platform sections */}
          {analytics.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No analytics data available for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Platform Details</h3>
              {analytics.map((a) => (
                <PlatformSection key={a.network} network={a.network} data={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* POSTS TAB */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Post filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-1">
              <button
                onClick={() => setPostFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  postFilter === 'all' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                All ({posts.length})
              </button>
              {postPlatforms.map((p) => {
                const Icon = getPlatformIcon(p)
                const count = posts.filter(post => post.platform === p).length
                return (
                  <button
                    key={p}
                    onClick={() => setPostFilter(p)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      postFilter === p ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {count}
                  </button>
                )
              })}
            </div>
            {posts.length === 0 && !postsLoading && (
              <button onClick={loadPosts} className="text-xs text-[var(--accent)] hover:underline">Load Posts</button>
            )}
          </div>

          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No posts found for this period</p>
            </div>
          ) : (
            <>
              {/* Top performing post */}
              {filteredPosts.length > 0 && (() => {
                const topPost = [...filteredPosts].sort((a, b) => (b.engagement || b.likes || 0) - (a.engagement || a.likes || 0))[0]
                if (!topPost || (!topPost.likes && !topPost.engagement)) return null
                return (
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20 p-4">
                    <p className="text-[10px] uppercase font-semibold text-purple-400 mb-2">Top Performing Post</p>
                    <PostCard post={topPost} />
                  </div>
                )
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredPosts.map((post, i) => (
                  <PostCard key={post.id || i} post={post} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* DEMOGRAPHICS TAB */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          {demoLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]" />
            </div>
          ) : !demographics || Object.keys(demographics).length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No demographic data available</p>
              <p className="text-xs mt-1">Demographics require connected Instagram or Facebook accounts with enough data</p>
              <button onClick={loadDemographics} className="mt-3 text-xs text-[var(--accent)] hover:underline">Retry</button>
            </div>
          ) : (
            Object.entries(demographics).map(([platform, data]) => {
              const Icon = getPlatformIcon(platform)
              const platformColor = PLATFORM_COLORS[platform] || '#6b7280'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const d = data as any
              const genderData = d.gender ? toDemoArray(d.gender).map(g => ({ ...g, label: GENDER_LABELS[g.label] || g.label })) : []
              const ageData = d.age ? toDemoArray(d.age).sort((a, b) => {
                const aNum = parseInt(a.label); const bNum = parseInt(b.label)
                return (isNaN(aNum) ? 999 : aNum) - (isNaN(bNum) ? 999 : bNum)
              }) : []
              const countryData = d.country ? toDemoArray(d.country) : []
              const cityData = d.city ? toDemoArray(d.city) : []

              return (
                <div key={platform} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" style={{ color: platformColor }} />
                    <h3 className="text-sm font-semibold text-[var(--foreground)] capitalize">{platform} Demographics</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Gender */}
                    {genderData.length > 0 && (
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
                        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase mb-3">Gender</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="label">
                                {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                              <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Age */}
                    {ageData.length > 0 && (
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
                        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase mb-3">Age Groups</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Country */}
                    {countryData.length > 0 && (
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
                        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase mb-3 flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" /> Top Countries
                        </h4>
                        <div className="space-y-2">
                          {countryData.slice(0, 10).map((c, i) => {
                            const maxVal = countryData[0]?.value || 1
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-[var(--foreground)] w-24 truncate">{c.label}</span>
                                <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${(c.value / maxVal) * 100}%` }} />
                                </div>
                                <span className="text-xs text-[var(--muted)] w-12 text-right">{formatNumber(c.value)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* City */}
                    {cityData.length > 0 && (
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
                        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase mb-3 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> Top Cities
                        </h4>
                        <div className="space-y-2">
                          {cityData.slice(0, 10).map((c, i) => {
                            const maxVal = cityData[0]?.value || 1
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-[var(--foreground)] w-32 truncate">{c.label}</span>
                                <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(c.value / maxVal) * 100}%` }} />
                                </div>
                                <span className="text-xs text-[var(--muted)] w-12 text-right">{formatNumber(c.value)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
