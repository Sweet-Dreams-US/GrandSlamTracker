'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Music, DollarSign, Clock, Users, ArrowRight, Building2, TrendingUp } from 'lucide-react'

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

interface StudioMediaSale {
  id: string
  source: string
  date: string
  client: string
  description: string
  amount: number
  sale_type: string
  sold_by: string
  filmed_by: string
  edited_by: string
}

interface EngineerStats {
  sessions: number
  revenue: number
  payout: number
}

interface StudioData {
  sessions: StudioSession[]
  studioMediaSales: StudioMediaSale[]
  summary: {
    totalStudioRevenue: number
    totalEngineerPayouts: number
    totalBusinessRetention: number
    totalMediaSales: number
    sessionCount: number
  }
  byEngineer: Record<string, EngineerStats>
}

export default function StudioOverview() {
  const [data, setData] = useState<StudioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      try {
        const res = await fetch(`/api/studio-revenue?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
        const json = await res.json()
        setData(json)
      } catch {
        setData(null)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Studio</h1>
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Studio</h1>
        <div className="text-center py-12 text-gray-500">Failed to load studio data.</div>
      </div>
    )
  }

  const { sessions, studioMediaSales, summary, byEngineer } = data
  const engineerEntries = Object.entries(byEngineer)

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Studio</h1>
          <p className="text-sm text-gray-500">Sweet Dreams Music — Current Month</p>
        </div>
        <Link
          href="/studio/sessions"
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          All Sessions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="h-5 w-5 text-amber-400" /></div>
            <p className="text-sm font-medium text-gray-500">Sessions</p>
          </div>
          <p className="text-2xl font-bold text-white">{summary.sessionCount}</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Music className="h-5 w-5 text-blue-400" /></div>
            <p className="text-sm font-medium text-gray-500">Recording Revenue</p>
          </div>
          <p className="text-2xl font-bold text-white">${summary.totalStudioRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Building2 className="h-5 w-5 text-cyan-400" /></div>
            <p className="text-sm font-medium text-gray-500">Media Sales</p>
          </div>
          <p className="text-2xl font-bold text-cyan-400">${summary.totalMediaSales.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{studioMediaSales.length} sale{studioMediaSales.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg"><Users className="h-5 w-5 text-green-400" /></div>
            <p className="text-sm font-medium text-gray-500">Engineer Payouts</p>
          </div>
          <p className="text-2xl font-bold text-green-400">${summary.totalEngineerPayouts.toFixed(2)}</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-purple-400" /></div>
            <p className="text-sm font-medium text-gray-500">Business Retention</p>
          </div>
          <p className="text-2xl font-bold text-white">${summary.totalBusinessRetention.toFixed(2)}</p>
        </div>
      </div>

      {/* Per-Engineer Breakdown */}
      {engineerEntries.length > 0 && (
        <div className="bg-[#141414] rounded-xl border border-[#262626] mb-8">
          <div className="px-6 py-4 border-b border-[#262626] flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Engineers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0A0A0A] text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Engineer</th>
                  <th className="text-right px-6 py-3">Sessions</th>
                  <th className="text-right px-6 py-3">Revenue</th>
                  <th className="text-right px-6 py-3">Payout</th>
                  <th className="text-right px-6 py-3">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {engineerEntries.map(([name, stats]) => (
                  <tr key={name} className="hover:bg-[#0A0A0A]">
                    <td className="px-6 py-3 font-medium text-white">{name}</td>
                    <td className="px-6 py-3 text-right text-gray-300">{stats.sessions}</td>
                    <td className="px-6 py-3 text-right text-gray-300">${stats.revenue.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-green-400 font-medium">${stats.payout.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-gray-300">${(stats.revenue - stats.payout).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Studio Media Sales — content jobs for music clients */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] mb-8">
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Media Sales</h2>
            <span className="text-xs text-gray-500 ml-2">Content jobs for music clients</span>
          </div>
          {studioMediaSales.length > 0 && (
            <span className="text-sm font-bold text-cyan-400">${summary.totalMediaSales.toFixed(2)} total</span>
          )}
        </div>
        {studioMediaSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No media sales this month</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0A0A0A] text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Description</th>
                  <th className="text-left px-6 py-3">Sold By</th>
                  <th className="text-left px-6 py-3">Filmed By</th>
                  <th className="text-left px-6 py-3">Edited By</th>
                  <th className="text-right px-6 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {studioMediaSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-[#0A0A0A]">
                    <td className="px-6 py-3 text-gray-300">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-white font-medium">{sale.client}</td>
                    <td className="px-6 py-3 text-gray-300">{sale.description}</td>
                    <td className="px-6 py-3 text-gray-300">{sale.sold_by || '—'}</td>
                    <td className="px-6 py-3 text-gray-300">{sale.filmed_by || '—'}</td>
                    <td className="px-6 py-3 text-gray-300">{sale.edited_by || '—'}</td>
                    <td className="px-6 py-3 text-right text-cyan-400 font-medium">${sale.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="bg-[#141414] rounded-xl border border-[#262626]">
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
          <Link href="/studio/sessions" className="text-sm text-[#F4C430] hover:text-amber-400 font-medium">
            View All &rarr;
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No sessions this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0A0A0A] text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Engineer</th>
                  <th className="text-left px-6 py-3">Artist</th>
                  <th className="text-left px-6 py-3">Room</th>
                  <th className="text-right px-6 py-3">Hours</th>
                  <th className="text-right px-6 py-3">Billed</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {sessions.slice(0, 10).map(s => (
                  <tr key={s.id} className="hover:bg-[#0A0A0A]">
                    <td className="px-6 py-3 text-gray-300">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-medium text-white">{s.engineer}</td>
                    <td className="px-6 py-3 text-gray-300">{s.artist}</td>
                    <td className="px-6 py-3 text-gray-300 capitalize">{s.room}</td>
                    <td className="px-6 py-3 text-right text-gray-300">{s.hours}</td>
                    <td className="px-6 py-3 text-right font-medium text-white">${s.billed.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-gray-500/10 text-gray-400'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
