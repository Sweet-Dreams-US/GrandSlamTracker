'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Target, Plus, RefreshCw, TrendingUp, Clock, Zap, DollarSign } from 'lucide-react'

type GrandSlamWorksheet = {
  id: string
  client_id: string | null
  dream_outcome: string | null
  likelihood_score: number | null
  time_to_result: string | null
  time_delay_score: number | null
  effort_required: string | null
  effort_score: number | null
  value_stack: any | null
  proposed_price: number | null
  engines_active: string[] | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  clients?: { business_name: string; display_name: string | null } | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  presented: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  accepted: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  declined: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}

function ScoreGauge({ label, score, icon: Icon, max = 10 }: { label: string; score: number | null; icon: typeof TrendingUp; max?: number }) {
  const value = score ?? 0
  const pct = (value / max) * 100
  const color = value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] text-gray-500">{label}</span>
          <span className="text-xs font-mono font-bold text-white">
            {score !== null ? `${score}/${max}` : '--'}
          </span>
        </div>
        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function GrandSlamPage() {
  const [worksheets, setWorksheets] = useState<GrandSlamWorksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    const supabase = createSupabaseBrowserClient() as any
    try {
      const { data, error } = await supabase
        .from('grand_slam_worksheets')
        .select('*, clients(business_name, display_name)')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setWorksheets((data as GrandSlamWorksheet[]) || [])
    } catch (err) {
      console.error('Error loading worksheets:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4C430]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Grand Slam Offers</h1>
          <p className="text-gray-400 text-sm mt-1">
            Craft irresistible offers using the Grand Slam framework
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/grand-slam/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4C430] text-black font-medium text-sm rounded-lg hover:bg-[#F4C430]/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Worksheet
          </Link>
        </div>
      </div>

      {/* Worksheet Cards */}
      {worksheets.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No Grand Slam worksheets yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Create your first worksheet to design a high-value offer.
          </p>
          <Link
            href="/grand-slam/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#F4C430] text-black font-medium text-sm rounded-lg hover:bg-[#F4C430]/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Worksheet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {worksheets.map((ws) => {
            const colors = STATUS_COLORS[ws.status] || STATUS_COLORS.draft
            const clientName =
              ws.clients?.display_name || ws.clients?.business_name || 'No Client'

            return (
              <Link
                key={ws.id}
                href={`/grand-slam/${ws.id}`}
                className="block bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-[#F4C430]/30 transition-all group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">{clientName}</p>
                    <h3 className="text-sm font-medium text-white truncate group-hover:text-[#F4C430] transition-colors">
                      {ws.dream_outcome || 'Untitled Worksheet'}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${colors.bg} ${colors.text}`}
                  >
                    {ws.status}
                  </span>
                </div>

                {/* Scores */}
                <div className="space-y-2.5 mb-4">
                  <ScoreGauge label="Likelihood" score={ws.likelihood_score} icon={TrendingUp} />
                  <ScoreGauge label="Time Delay" score={ws.time_delay_score} icon={Clock} />
                  <ScoreGauge label="Effort" score={ws.effort_score} icon={Zap} />
                </div>

                {/* Price */}
                {ws.proposed_price !== null && (
                  <div className="flex items-center gap-2 pt-3 border-t border-[#1a1a1a]">
                    <DollarSign className="h-3.5 w-3.5 text-[#F4C430]" />
                    <span className="text-lg font-bold text-white">
                      ${ws.proposed_price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-500">proposed</span>
                  </div>
                )}

                {/* Engines */}
                {ws.engines_active && ws.engines_active.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {ws.engines_active.map((engine) => (
                      <span
                        key={engine}
                        className="text-[10px] px-1.5 py-0.5 bg-[#F4C430]/10 text-[#F4C430] rounded"
                      >
                        {engine}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <p className="text-[11px] text-gray-600 mt-3">
                  Updated{' '}
                  {new Date(ws.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
