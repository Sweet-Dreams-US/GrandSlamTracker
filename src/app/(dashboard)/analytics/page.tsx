'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  RefreshCw,
  Instagram,
  Facebook,
  Youtube,
  Users,
  Eye,
  Heart,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  Globe,
  Building2,
} from 'lucide-react'

interface Brand {
  id: number
  label: string
  picture: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  tiktok: string | null
  twitter: string | null
  linkedinCompany: string | null
  threads: string | null
  bluesky: string | null
}

interface BrandAnalytics {
  brand: Brand
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics: any[]
  loading: boolean
  error: string | null
}

type Period = '7d' | '30d' | '90d'
type ViewMode = 'all' | 'account'

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
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

function getConnectedPlatforms(brand: Brand): string[] {
  const platforms: string[] = []
  if (brand.instagram) platforms.push('instagram')
  if (brand.facebook) platforms.push('facebook')
  if (brand.youtube) platforms.push('youtube')
  if (brand.tiktok) platforms.push('tiktok')
  if (brand.twitter) platforms.push('twitter')
  if (brand.linkedinCompany) platforms.push('linkedin')
  if (brand.threads) platforms.push('threads')
  if (brand.bluesky) platforms.push('bluesky')
  return platforms
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMetrics(analytics: any[]) {
  let totalFollowers = 0, totalReach = 0, totalImpressions = 0, totalEngagements = 0
  for (const a of analytics) {
    totalFollowers += a.Followers || a.pageFollows || a.followers || 0
    totalReach += a.reach || 0
    totalImpressions += a.impressions || a.page_posts_impressions || 0
    totalEngagements += a.accounts_engaged || a.page_actions_post_reactions_total || a.engagements || 0
  }
  return { totalFollowers, totalReach, totalImpressions, totalEngagements }
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Users; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
        <p className="text-xs text-[var(--muted)]">{label}</p>
      </div>
    </div>
  )
}

function BrandCard({ brandData }: { brandData: BrandAnalytics }) {
  const { brand, analytics, loading, error } = brandData
  const platforms = getConnectedPlatforms(brand)
  const { totalFollowers, totalReach, totalImpressions, totalEngagements } = extractMetrics(analytics)

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.picture ? (
              <img src={brand.picture} alt={brand.label} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {brand.label.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{brand.label}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {platforms.map((p) => {
                  const Icon = getPlatformIcon(p)
                  return <Icon key={p} className="h-3.5 w-3.5 text-[var(--muted)]" />
                })}
              </div>
            </div>
          </div>
          <Link
            href={`/analytics/${brand.id}`}
            className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Details <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--surface-hover)] rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-amber-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Followers" value={formatNumber(totalFollowers)} icon={Users} color="bg-blue-500" />
            <MetricCard label="Reach" value={formatNumber(totalReach)} icon={Eye} color="bg-emerald-500" />
            <MetricCard label="Impressions" value={formatNumber(totalImpressions)} icon={TrendingUp} color="bg-purple-500" />
            <MetricCard label="Engagements" value={formatNumber(totalEngagements)} icon={Heart} color="bg-pink-500" />
          </div>
        )}
      </div>
      {!loading && analytics.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {analytics.map((a: any) => {
              const network = a.network as string
              const Icon = getPlatformIcon(network)
              const followers = a.Followers || a.pageFollows || a.followers || 0
              return (
                <div key={network} className="flex-1 rounded-lg bg-[var(--surface-hover)] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span className="text-xs font-medium text-[var(--muted)] capitalize">{network}</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{formatNumber(followers)}</p>
                  <p className="text-[10px] text-[var(--muted)]">followers</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Detailed single-account view with all social platforms expanded
function AccountDetailView({ brandData, period }: { brandData: BrandAnalytics; period: Period }) {
  const { brand, analytics, loading, error } = brandData
  const platforms = getConnectedPlatforms(brand)
  const { totalFollowers, totalReach, totalImpressions, totalEngagements } = extractMetrics(analytics)

  return (
    <div className="space-y-6">
      {/* Account Header */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand.picture ? (
              <img src={brand.picture} alt={brand.label} className="w-16 h-16 rounded-full object-cover ring-2 ring-[var(--accent)]/20" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl ring-2 ring-[var(--accent)]/20">
                {brand.label.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{brand.label}</h2>
              <div className="flex items-center gap-2 mt-1">
                {platforms.map((p) => {
                  const Icon = getPlatformIcon(p)
                  return (
                    <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[10px] text-[var(--muted)] font-medium capitalize">
                      <Icon className="h-3 w-3" /> {p}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
          <Link
            href={`/analytics/${brand.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-all"
          >
            Full Report <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--surface)] rounded-xl border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500"><Users className="h-4 w-4 text-white" /></div>
                <span className="text-xs text-[var(--muted)]">Total Followers</span>
              </div>
              <p className="text-3xl font-bold text-[var(--foreground)]">{formatNumber(totalFollowers)}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500"><Eye className="h-4 w-4 text-white" /></div>
                <span className="text-xs text-[var(--muted)]">Total Reach</span>
              </div>
              <p className="text-3xl font-bold text-[var(--foreground)]">{formatNumber(totalReach)}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-500"><TrendingUp className="h-4 w-4 text-white" /></div>
                <span className="text-xs text-[var(--muted)]">Total Impressions</span>
              </div>
              <p className="text-3xl font-bold text-[var(--foreground)]">{formatNumber(totalImpressions)}</p>
            </div>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-pink-500"><Heart className="h-4 w-4 text-white" /></div>
                <span className="text-xs text-[var(--muted)]">Total Engagements</span>
              </div>
              <p className="text-3xl font-bold text-[var(--foreground)]">{formatNumber(totalEngagements)}</p>
            </div>
          </div>

          {/* Per-Platform Sections */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Platform Breakdown</h3>
            {analytics.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted)]">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No analytics data for this period</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {analytics.map((a: any) => {
                  const network = a.network as string
                  const Icon = getPlatformIcon(network)
                  const followers = a.Followers || a.pageFollows || a.followers || 0
                  const reach = a.reach || 0
                  const impressions = a.impressions || a.page_posts_impressions || 0
                  const engagements = a.accounts_engaged || a.page_actions_post_reactions_total || a.engagements || 0
                  const engRate = reach > 0 ? ((engagements / reach) * 100).toFixed(2) : '0.00'

                  return (
                    <div key={network} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-[var(--muted)]" />
                          <span className="text-sm font-semibold text-[var(--foreground)] capitalize">{network}</span>
                        </div>
                        <span className="text-xs text-[var(--muted)]">{engRate}% eng. rate</span>
                      </div>
                      <div className="p-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[var(--muted)]">Followers</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{formatNumber(followers)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--muted)]">Reach</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{formatNumber(reach)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--muted)]">Impressions</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{formatNumber(impressions)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--muted)]">Engagements</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{formatNumber(engagements)}</p>
                        </div>
                      </div>
                      {/* Extra metrics row */}
                      <div className="px-5 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {a.likes != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-xs text-[var(--muted)]">
                              <Heart className="h-3 w-3" /> {formatNumber(a.likes)} likes
                            </span>
                          )}
                          {a.comments != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-xs text-[var(--muted)]">
                              {formatNumber(a.comments)} comments
                            </span>
                          )}
                          {a.shares != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-xs text-[var(--muted)]">
                              {formatNumber(a.shares)} shares
                            </span>
                          )}
                          {a.saved != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-xs text-[var(--muted)]">
                              {formatNumber(a.saved)} saves
                            </span>
                          )}
                          {a.video_views != null && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-xs text-[var(--muted)]">
                              {formatNumber(a.video_views)} views
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandAnalytics, setBrandAnalytics] = useState<Map<number, BrandAnalytics>>(new Map())
  const [period, setPeriod] = useState<Period>('30d')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    loadBrands()
  }, [])

  useEffect(() => {
    if (brands.length > 0) {
      loadAllAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, period])

  async function loadBrands() {
    try {
      const res = await fetch('/api/metricool/brands')
      const data = await res.json()
      if (data.success && data.brands) {
        setBrands(data.brands)
      } else {
        setError(data.error || 'Failed to load brands')
      }
    } catch {
      setError('Metricool API token not configured')
    } finally {
      setLoading(false)
    }
  }

  async function loadAllAnalytics() {
    const newMap = new Map<number, BrandAnalytics>()
    for (const brand of brands) {
      newMap.set(brand.id, { brand, analytics: [], loading: true, error: null })
    }
    setBrandAnalytics(new Map(newMap))

    await Promise.all(
      brands.map(async (brand) => {
        try {
          const res = await fetch(`/api/metricool/analytics?brandId=${brand.id}&period=${period}`)
          const data = await res.json()
          if (data.success) {
            newMap.set(brand.id, { brand, analytics: data.analytics || [], loading: false, error: null })
          } else {
            newMap.set(brand.id, { brand, analytics: [], loading: false, error: data.error })
          }
        } catch {
          newMap.set(brand.id, { brand, analytics: [], loading: false, error: 'Failed to load' })
        }
        setBrandAnalytics(new Map(newMap))
      })
    )
  }

  async function handleSyncAll() {
    setSyncing(true)
    await loadAllAnalytics()
    setSyncing(false)
  }

  function selectAccount(brandId: number | null) {
    setSelectedBrandId(brandId)
    setViewMode(brandId ? 'account' : 'all')
    setDropdownOpen(false)
  }

  const selectedBrand = selectedBrandId ? brandAnalytics.get(selectedBrandId) : null

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
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Social Analytics</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {viewMode === 'all'
              ? `All Sweet Dreams Metricool brands \u2014 ${brands.length} connected`
              : selectedBrand?.brand.label || 'Select an account'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Account Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors min-w-[180px]"
            >
              {viewMode === 'all' ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-[var(--muted)]" />
                  All Accounts
                </>
              ) : (
                <>
                  {selectedBrand?.brand.picture ? (
                    <img src={selectedBrand.brand.picture} className="h-4 w-4 rounded-full" alt="" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5 text-[var(--muted)]" />
                  )}
                  {selectedBrand?.brand.label || 'Select...'}
                </>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)] ml-auto" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
                  <button
                    onClick={() => selectAccount(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--surface-hover)] transition-colors ${
                      viewMode === 'all' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--foreground)]'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    <div>
                      <p className="font-medium">All Accounts</p>
                      <p className="text-[10px] text-[var(--muted)]">{brands.length} brands combined</p>
                    </div>
                  </button>
                  <div className="border-t border-[var(--border)]" />
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => selectAccount(brand.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--surface-hover)] transition-colors ${
                        selectedBrandId === brand.id ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--foreground)]'
                      }`}
                    >
                      {brand.picture ? (
                        <img src={brand.picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {brand.label.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{brand.label}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getConnectedPlatforms(brand).map((p) => {
                            const Icon = getPlatformIcon(p)
                            return <Icon key={p} className="h-2.5 w-2.5 text-[var(--muted)]" />
                          })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Period Selector */}
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
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{error}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Set METRICOOL_API_TOKEN in .env.local to connect</p>
          </div>
        </div>
      )}

      {/* SINGLE ACCOUNT VIEW */}
      {viewMode === 'account' && selectedBrand && (
        <AccountDetailView brandData={selectedBrand} period={period} />
      )}

      {/* ALL ACCOUNTS VIEW */}
      {viewMode === 'all' && (
        <>
          {/* Aggregate Stats Bar */}
          {brands.length > 0 && (
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-6 text-white">
              <h2 className="text-sm font-medium text-purple-200 mb-4">All Brands Combined — Last {PERIOD_LABELS[period]}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {(() => {
                  let tf = 0, tr = 0, ti = 0, te = 0
                  brandAnalytics.forEach((ba) => {
                    const m = extractMetrics(ba.analytics)
                    tf += m.totalFollowers; tr += m.totalReach; ti += m.totalImpressions; te += m.totalEngagements
                  })
                  return (
                    <>
                      <div>
                        <p className="text-xs text-purple-300">Total Followers</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(tf)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-300">Total Reach</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(tr)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-300">Total Impressions</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(ti)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-300">Total Engagements</p>
                        <p className="text-3xl font-bold mt-1">{formatNumber(te)}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {brands.map((brand) => {
              const data = brandAnalytics.get(brand.id) || { brand, analytics: [], loading: true, error: null }
              return <BrandCard key={brand.id} brandData={data} />
            })}
          </div>
        </>
      )}
    </div>
  )
}
