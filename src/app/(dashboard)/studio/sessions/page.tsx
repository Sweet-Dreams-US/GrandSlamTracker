'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Banknote,
  Filter,
  Music,
  Video,
} from 'lucide-react'
import {
  ENGINEERS,
  STUDIOS,
  MEDIA_SERVICES,
  BANK_ENTITIES,
  SESSION_STATUSES,
  type StudioId,
} from '@/lib/constants/studioRates'
import type { StudioSession } from '@/lib/supabase/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('studio_sessions')
      .select('*')
      .order('session_date', { ascending: false })
    setSessions((data as StudioSession[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // Apply filters
  const filtered = sessions.filter(s => {
    if (filterEngineer !== 'all' && s.engineer !== filterEngineer) return false
    if (filterType !== 'all' && s.session_type !== filterType) return false
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterDateFrom && s.session_date < filterDateFrom) return false
    if (filterDateTo && s.session_date > filterDateTo) return false
    return true
  })

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'paid') => {
    await supabase.from('studio_sessions').update({ status: newStatus }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
  }

  // Summary stats for filtered results
  const totalCharge = filtered.reduce((t, s) => t + Number(s.total_charge), 0)
  const totalEngineerPay = filtered.reduce((t, s) => t + Number(s.engineer_payout), 0)
  const totalStudioPay = filtered.reduce((t, s) => t + Number(s.studio_payout), 0)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/studio" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Sessions</h1>
          <p className="text-sm text-gray-500">{filtered.length} session{filtered.length !== 1 ? 's' : ''} &middot; ${totalCharge.toFixed(2)} total revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {(filterEngineer !== 'all' || filterType !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Active</span>
            )}
          </div>
          {showFilters ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {showFilters && (
          <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Engineer</label>
              <select value={filterEngineer} onChange={e => setFilterEngineer(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="all">All Engineers</option>
                {ENGINEERS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="all">All Types</option>
                <option value="recording">Recording</option>
                <option value="media">Media</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="all">All Statuses</option>
                {SESSION_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Total Charges</p>
          <p className="text-lg font-bold text-gray-900">${totalCharge.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Engineer Payouts</p>
          <p className="text-lg font-bold text-green-700">${totalEngineerPay.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Studio Revenue</p>
          <p className="text-lg font-bold text-amber-700">${totalStudioPay.toFixed(2)}</p>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading sessions...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No sessions found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(s => {
              const engName = ENGINEERS.find(e => e.id === s.engineer)?.name || s.engineer
              const isExpanded = expandedId === s.id
              return (
                <div key={s.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${s.session_type === 'recording' ? 'bg-amber-100' : 'bg-purple-100'}`}>
                        {s.session_type === 'recording' ? <Music className="h-4 w-4 text-amber-700" /> : <Video className="h-4 w-4 text-purple-700" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.client_name}</p>
                          <span className="text-xs text-gray-400">&middot;</span>
                          <p className="text-xs text-gray-500">{engName}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(s.session_date + 'T00:00:00').toLocaleDateString()} &middot;{' '}
                          {s.session_type === 'recording'
                            ? `${STUDIOS[s.studio as StudioId]?.name || s.studio} — ${s.hours}hr${s.is_block ? ' (block)' : ''}`
                            : `${MEDIA_SERVICES.find(m => m.id === s.media_service_type)?.name || s.media_service_type} (${s.media_role})`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-900">${Number(s.total_charge).toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{s.status}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Total Charge</p>
                          <p className="font-medium">${Number(s.total_charge).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Engineer Payout</p>
                          <p className="font-medium text-green-700">${Number(s.engineer_payout).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Studio Cut</p>
                          <p className="font-medium">${Number(s.studio_payout).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bank Entity</p>
                          <p className="font-medium">{BANK_ENTITIES[s.bank_entity as keyof typeof BANK_ENTITIES]}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Engineer</p>
                          <p className="font-medium">{engName}</p>
                        </div>
                        {s.notes && (
                          <div className="col-span-2 md:col-span-5">
                            <p className="text-gray-500">Notes</p>
                            <p className="font-medium">{s.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {s.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(s.id, 'approved')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        )}
                        {(s.status === 'pending' || s.status === 'approved') && (
                          <button
                            onClick={() => handleStatusChange(s.id, 'paid')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            <Banknote className="h-3.5 w-3.5" />
                            Mark Paid
                          </button>
                        )}
                        {s.status === 'paid' && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Paid
                          </span>
                        )}
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
