'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  Music,
} from 'lucide-react'

interface StudioSession {
  id: string
  source: string
  date: string
  engineer: string
  artist: string
  type: string
  hours: number
  rate: number
  billed: number
  engineer_payout: number
  business_retention: number
  room: string
  status: string
}

export default function StudioSessionsPage() {
  const [sessions, setSessions] = useState<StudioSession[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filters
  const [filterEngineer, setFilterEngineer] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // Fetch last 12 months of sessions
      const now = new Date()
      const start = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      try {
        const res = await fetch(`/api/studio-revenue?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
        const json = await res.json()
        setSessions(json.sessions || [])
      } catch {
        setSessions([])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Unique engineer names from fetched data
  const engineerNames = useMemo(() => {
    const names = new Set(sessions.map(s => s.engineer))
    return Array.from(names).sort()
  }, [sessions])

  // Unique statuses from fetched data
  const statuses = useMemo(() => {
    const s = new Set(sessions.map(x => x.status))
    return Array.from(s).sort()
  }, [sessions])

  // Apply filters
  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (filterEngineer !== 'all' && s.engineer !== filterEngineer) return false
      if (filterType !== 'all' && s.type !== filterType) return false
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterDateFrom) {
        const sessionDate = s.date.split('T')[0]
        if (sessionDate < filterDateFrom) return false
      }
      if (filterDateTo) {
        const sessionDate = s.date.split('T')[0]
        if (sessionDate > filterDateTo) return false
      }
      return true
    })
  }, [sessions, filterEngineer, filterType, filterStatus, filterDateFrom, filterDateTo])

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
  }

  // Summary stats for filtered results
  const totalCharge = filtered.reduce((t, s) => t + s.billed, 0)
  const totalEngineerPay = filtered.reduce((t, s) => t + s.engineer_payout, 0)
  const totalRetention = filtered.reduce((t, s) => t + s.business_retention, 0)

  const hasActiveFilters = filterEngineer !== 'all' || filterType !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/studio" className="p-2 rounded-lg hover:bg-[#0A0A0A] transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">All Sessions</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} session{filtered.length !== 1 ? 's' : ''} &middot; ${totalCharge.toFixed(2)} total revenue
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">Active</span>
            )}
          </div>
          {showFilters ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {showFilters && (
          <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Engineer</label>
              <select
                value={filterEngineer}
                onChange={e => setFilterEngineer(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Engineers</option>
                {engineerNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Types</option>
                <option value="recording">Recording</option>
                <option value="media">Media</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141414] rounded-lg border border-[#262626] px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Total Charges</p>
          <p className="text-lg font-bold text-white">${totalCharge.toFixed(2)}</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-[#262626] px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Engineer Payouts</p>
          <p className="text-lg font-bold text-green-400">${totalEngineerPay.toFixed(2)}</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-[#262626] px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Business Retention</p>
          <p className="text-lg font-bold text-amber-400">${totalRetention.toFixed(2)}</p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading sessions...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No sessions found.</div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {filtered.map(s => {
              const isExpanded = expandedId === s.id
              return (
                <div key={s.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#0A0A0A] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg shrink-0 bg-amber-500/10">
                        <Music className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{s.artist}</p>
                          <span className="text-xs text-gray-600">&middot;</span>
                          <p className="text-xs text-gray-400">{s.engineer}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(s.date).toLocaleDateString()} &middot; {s.room} &middot; {s.hours}hr
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-white">${s.billed.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-gray-500/10 text-gray-400'}`}>
                        {s.status}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Billed</p>
                          <p className="font-medium text-white">${s.billed.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Engineer Payout</p>
                          <p className="font-medium text-green-400">${s.engineer_payout.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Business Retention</p>
                          <p className="font-medium text-amber-400">${s.business_retention.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rate</p>
                          <p className="font-medium text-white">${s.rate.toFixed(2)}/hr</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Room</p>
                          <p className="font-medium text-white capitalize">{s.room}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
