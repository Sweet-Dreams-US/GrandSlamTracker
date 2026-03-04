'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Music, DollarSign, Clock, Users, ArrowRight, Building2 } from 'lucide-react'
import { ENGINEERS, STUDIOS, BANK_ENTITIES, type StudioId } from '@/lib/constants/studioRates'
import type { StudioSession } from '@/lib/supabase/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function StudioOverview() {
  const [sessions, setSessions] = useState<StudioSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('studio_sessions')
        .select('*')
        .order('session_date', { ascending: false })
      setSessions((data as StudioSession[]) || [])
      setLoading(false)
    }
    fetch()
  }, [])

  // Current month filter
  const now = new Date()
  const thisMonth = sessions.filter(s => {
    const d = new Date(s.session_date + 'T00:00:00')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const musicRevenue = sessions.filter(s => s.bank_entity === 'sweet_dreams_music').reduce((t, s) => t + Number(s.total_charge), 0)
  const usRevenue = sessions.filter(s => s.bank_entity === 'sweet_dreams_us').reduce((t, s) => t + Number(s.total_charge), 0)
  const pendingPayouts = sessions.filter(s => s.status === 'approved').reduce((t, s) => t + Number(s.engineer_payout), 0)

  // Per-engineer breakdown
  const engineerStats = ENGINEERS.map(eng => {
    const engSessions = sessions.filter(s => s.engineer === eng.id)
    return {
      ...eng,
      totalSessions: engSessions.length,
      totalRevenue: engSessions.reduce((t, s) => t + Number(s.total_charge), 0),
      totalPayout: engSessions.reduce((t, s) => t + Number(s.engineer_payout), 0),
      pending: engSessions.filter(s => s.status === 'pending').length,
    }
  }).filter(e => e.totalSessions > 0)

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Studio</h1>
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio</h1>
          <p className="text-sm text-gray-500">Sweet Dreams Music &amp; Sweet Dreams US</p>
        </div>
        <Link
          href="/studio/sessions"
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Manage Sessions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-amber-700" /></div>
            <p className="text-sm font-medium text-gray-500">Sessions This Month</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{thisMonth.length}</p>
          <p className="text-xs text-gray-400 mt-1">{sessions.length} total all-time</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Music className="h-5 w-5 text-blue-700" /></div>
            <p className="text-sm font-medium text-gray-500">Music Revenue</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${musicRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Sweet Dreams Music (recording)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Building2 className="h-5 w-5 text-purple-700" /></div>
            <p className="text-sm font-medium text-gray-500">US Revenue</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${usRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Sweet Dreams US (media)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-700" /></div>
            <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">${pendingPayouts.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Approved, awaiting payment</p>
        </div>
      </div>

      {/* Per-Engineer Breakdown */}
      {engineerStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Engineers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Engineer</th>
                  <th className="text-right px-6 py-3">Sessions</th>
                  <th className="text-right px-6 py-3">Total Revenue</th>
                  <th className="text-right px-6 py-3">Total Payouts</th>
                  <th className="text-right px-6 py-3">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {engineerStats.map(eng => (
                  <tr key={eng.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{eng.name}</td>
                    <td className="px-6 py-3 text-right text-gray-700">{eng.totalSessions}</td>
                    <td className="px-6 py-3 text-right text-gray-700">${eng.totalRevenue.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-green-700 font-medium">${eng.totalPayout.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right">
                      {eng.pending > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{eng.pending}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          <Link href="/studio/sessions" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            View All &rarr;
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No sessions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Engineer</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-right px-6 py-3">Charge</th>
                  <th className="text-left px-6 py-3">Entity</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.slice(0, 10).map(s => {
                  const engName = ENGINEERS.find(e => e.id === s.engineer)?.name || s.engineer
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-100 text-yellow-700',
                    approved: 'bg-blue-100 text-blue-700',
                    paid: 'bg-green-100 text-green-700',
                  }
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-700">{new Date(s.session_date + 'T00:00:00').toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{engName}</td>
                      <td className="px-6 py-3 text-gray-700">{s.client_name}</td>
                      <td className="px-6 py-3 text-gray-700 capitalize">{s.session_type}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">${Number(s.total_charge).toFixed(2)}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{BANK_ENTITIES[s.bank_entity as keyof typeof BANK_ENTITIES]}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
