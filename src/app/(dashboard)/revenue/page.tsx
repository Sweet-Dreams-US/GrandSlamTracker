'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  Music,
  Mic2,
  Film,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns'

type DateRange = 'thisMonth' | 'lastMonth' | 'last90' | 'ytd' | 'allTime'

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  last90: 'Last 90 Days',
  ytd: 'Year to Date',
  allTime: 'All Time',
}

interface RevenueSummary {
  totalBookingRevenue: number
  totalBeatRevenue: number
  totalMediaRevenue: number
  totalRevenue: number
  bookingCount: number
  beatSaleCount: number
  mediaSaleCount: number
  avgBookingValue: number
}

interface EngineerStat {
  name: string
  sessionCount: number
  totalRevenue: number
  avgSessionValue: number
}

interface Booking {
  id: string
  customer_name: string | null
  artist_name: string | null
  start_time: string
  total_amount: number | null
  status: string | null
  engineer_name: string | null
  room: string | null
  duration: number | null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getDateRange(range: DateRange): { from: string; to: string } {
  const now = new Date()
  let from: Date, to: Date

  switch (range) {
    case 'thisMonth':
      from = startOfMonth(now)
      to = now
      break
    case 'lastMonth':
      from = startOfMonth(subMonths(now, 1))
      to = endOfMonth(subMonths(now, 1))
      break
    case 'last90':
      from = subDays(now, 90)
      to = now
      break
    case 'ytd':
      from = new Date(now.getFullYear(), 0, 1)
      to = now
      break
    case 'allTime':
      from = new Date(2020, 0, 1)
      to = now
      break
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

function StatCard({ label, value, icon: Icon, color, subtext, trend }: {
  label: string; value: string; icon: typeof DollarSign; color: string; subtext?: string; trend?: 'up' | 'down' | null
}) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
        {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{label}</p>
      {subtext && <p className="text-[10px] text-[var(--muted)] mt-0.5">{subtext}</p>}
    </div>
  )
}

export default function RevenueHubPage() {
  const [dateRange, setDateRange] = useState<DateRange>('allTime')
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [engineers, setEngineers] = useState<EngineerStat[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    const { from, to } = getDateRange(dateRange)
    const params = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`

    try {
      const [revRes, engRes, bookRes] = await Promise.all([
        fetch(`/api/music/revenue?${params}`),
        fetch(`/api/music/engineers?${params}`),
        fetch(`/api/music/bookings?${params}&limit=20`),
      ])

      const [revData, engData, bookData] = await Promise.all([
        revRes.json(),
        engRes.json(),
        bookRes.json(),
      ])

      if (revData.success) {
        setSummary({
          totalBookingRevenue: revData.totalBookingRevenue,
          totalBeatRevenue: revData.totalBeatRevenue,
          totalMediaRevenue: revData.totalMediaRevenue,
          totalRevenue: revData.totalRevenue,
          bookingCount: revData.bookingCount,
          beatSaleCount: revData.beatSaleCount,
          mediaSaleCount: revData.mediaSaleCount,
          avgBookingValue: revData.avgBookingValue,
        })
      }
      if (engData.success) setEngineers(engData.engineers || [])
      if (bookData.success) setBookings(bookData.bookings || [])
    } catch (err) {
      console.error('Error loading revenue data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange])

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  function handleRefresh() {
    setRefreshing(true)
    loadData()
  }

  // Build chart data from bookings
  const chartData = (() => {
    const monthMap = new Map<string, { studio: number; beats: number; media: number }>()
    for (const b of bookings) {
      const monthKey = format(new Date(b.start_time), 'MMM yyyy')
      const existing = monthMap.get(monthKey) || { studio: 0, beats: 0, media: 0 }
      existing.studio += b.total_amount || 0
      monthMap.set(monthKey, existing)
    }
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data, total: data.studio + data.beats + data.media }))
      .reverse()
  })()

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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Revenue Hub</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Sweet Dreams Music — Studio, Beats &amp; Media
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-1">
            {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  dateRange === r
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {DATE_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="bg-emerald-500"
            subtext={`${summary.bookingCount + summary.beatSaleCount + summary.mediaSaleCount} transactions`}
          />
          <StatCard
            label="Studio Bookings"
            value={formatCurrency(summary.totalBookingRevenue)}
            icon={Mic2}
            color="bg-blue-500"
            subtext={`${summary.bookingCount} sessions · ${formatCurrency(summary.avgBookingValue)} avg`}
          />
          <StatCard
            label="Beat Sales"
            value={formatCurrency(summary.totalBeatRevenue)}
            icon={Music}
            color="bg-purple-500"
            subtext={`${summary.beatSaleCount} purchases`}
          />
          <StatCard
            label="Media Sales"
            value={formatCurrency(summary.totalMediaRevenue)}
            icon={Film}
            color="bg-orange-500"
            subtext={`${summary.mediaSaleCount} sales`}
          />
        </div>
      )}

      {/* Revenue Chart */}
      {chartData.length > 1 && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Revenue by Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="studioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrencyFull(Number(value)), 'Studio']}
                />
                <Area type="monotone" dataKey="studio" stroke="#3b82f6" fill="url(#studioGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engineer Stats */}
        {engineers.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--muted)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Engineer Performance</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {engineers.map((eng) => (
                <div key={eng.name} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{eng.name}</p>
                    <p className="text-xs text-[var(--muted)]">{eng.sessionCount} sessions · {formatCurrency(eng.avgSessionValue)} avg</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">{formatCurrency(eng.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        {bookings.length > 0 && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--muted)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent Bookings</h3>
            </div>
            <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
              {bookings.slice(0, 10).map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {b.artist_name || b.customer_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {format(new Date(b.start_time), 'MMM d, yyyy')}
                      {b.engineer_name && ` · ${b.engineer_name}`}
                      {b.room && ` · ${b.room}`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-[var(--foreground)]">{formatCurrencyFull(b.total_amount || 0)}</p>
                    <p className={`text-[10px] font-medium ${b.status === 'confirmed' || b.status === 'completed' ? 'text-emerald-500' : 'text-[var(--muted)]'}`}>
                      {b.status || 'pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
