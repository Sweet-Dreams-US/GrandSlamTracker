'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Film, FileText, Mic, Camera, RefreshCw, Lightbulb, ChevronRight } from 'lucide-react'

type ContentItem = {
  id: string
  client_id: string
  title: string
  description: string | null
  content_type: string
  status: string
  scheduled_date: string | null
  posted_date: string | null
  platforms: string[] | null
  raw_file_url: string | null
  final_file_url: string | null
  thumbnail_url: string | null
  assigned_to: string | null
  analytics: any | null
  ai_generated: boolean
  ai_prompt: string | null
  tags: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
  clients?: { business_name: string; display_name: string | null } | null
}

const STATUSES = ['idea', 'filming', 'editing', 'review', 'scheduled', 'posted', 'analyzed'] as const

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  idea: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  filming: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  editing: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  review: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  scheduled: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  posted: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  analyzed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
}

const TYPE_ICONS: Record<string, typeof Film> = {
  video: Film,
  photo: Camera,
  audio: Mic,
  blog: FileText,
}

function ContentCard({ item }: { item: ContentItem }) {
  const colors = STATUS_COLORS[item.status] || STATUS_COLORS.idea
  const TypeIcon = TYPE_ICONS[item.content_type] || FileText
  const clientName = item.clients?.display_name || item.clients?.business_name || 'Unknown'

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg p-3.5 hover:border-[#363636] transition-colors group cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white truncate flex-1">{item.title}</h4>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.bg} ${colors.text}`}>
          <TypeIcon className="h-3 w-3" />
          {item.content_type}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2 truncate">{clientName}</p>
      {item.scheduled_date && (
        <p className="text-[11px] text-gray-600">
          {new Date(item.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
      {item.platforms && item.platforms.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.platforms.map((p) => (
            <span key={p} className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] text-gray-500 rounded">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContentPipelinePage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    const supabase = createSupabaseBrowserClient() as any
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*, clients(business_name, display_name)')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setItems((data as ContentItem[]) || [])
    } catch (err) {
      console.error('Error loading content items:', err)
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

  // Summary stats
  const totalItems = items.length
  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = items.filter((i) => i.status === s).length
    return acc
  }, {} as Record<string, number>)
  const byType = items.reduce((acc, i) => {
    acc[i.content_type] = (acc[i.content_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
          <h1 className="text-2xl font-bold text-white">Content Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">Track content from idea to analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/content/ideas"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#141414] border border-[#262626] text-gray-300 rounded-lg hover:border-[#F4C430]/50 hover:text-[#F4C430] transition-colors"
          >
            <Lightbulb className="h-4 w-4" />
            Ideas Backlog
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-white mt-0.5">{totalItems}</p>
        </div>
        {STATUSES.map((s) => {
          const colors = STATUS_COLORS[s]
          return (
            <div key={s} className="bg-[#141414] border border-[#262626] rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                <p className="text-[11px] text-gray-500 uppercase tracking-wider capitalize">{s}</p>
              </div>
              <p className={`text-xl font-bold mt-0.5 ${colors.text}`}>{byStatus[s] || 0}</p>
            </div>
          )
        })}
      </div>

      {/* Type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div className="flex gap-4">
          {Object.entries(byType).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || FileText
            return (
              <div key={type} className="flex items-center gap-2 text-sm text-gray-400">
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{type}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Kanban Board */}
      {totalItems === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center">
          <Film className="h-10 w-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No content items yet.</p>
          <p className="text-gray-600 text-xs mt-1">Content items will appear here as they move through the pipeline.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const colors = STATUS_COLORS[status]
            const columnItems = items.filter((i) => i.status === status)

            return (
              <div key={status} className="min-w-[260px] w-[260px] shrink-0">
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  <h3 className="text-sm font-medium text-gray-300 capitalize">{status}</h3>
                  <span className="text-xs text-gray-600 ml-auto">{columnItems.length}</span>
                </div>

                {/* Column Body */}
                <div className="space-y-2 min-h-[200px] bg-[#0E0E0E] border border-[#1a1a1a] rounded-lg p-2">
                  {columnItems.length === 0 ? (
                    <div className="flex items-center justify-center h-[180px]">
                      <p className="text-xs text-gray-700">No items</p>
                    </div>
                  ) : (
                    columnItems.map((item) => (
                      <ContentCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
