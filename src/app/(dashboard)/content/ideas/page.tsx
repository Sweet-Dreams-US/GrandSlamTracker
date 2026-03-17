'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Lightbulb, Plus, Filter, ArrowLeft, X, Sparkles } from 'lucide-react'

type ContentIdea = {
  id: string
  client_id: string | null
  title: string
  concept: string | null
  inspiration_source: string | null
  based_on_content_id: string | null
  score: number | null
  status: string
  converted_to: string | null
  created_at: string
  clients?: { business_name: string; display_name: string | null } | null
}

const STATUS_OPTIONS = ['new', 'approved', 'rejected', 'converted'] as const
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-400' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400' },
  converted: { bg: 'bg-[#F4C430]/10', text: 'text-[#F4C430]' },
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-600 text-xs">--</span>
  const color =
    score >= 8 ? 'text-green-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400'
  return (
    <span className={`font-mono font-bold text-sm ${color}`}>
      {score}/10
    </span>
  )
}

export default function ContentIdeasPage() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([])

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formConcept, setFormConcept] = useState('')
  const [formSource, setFormSource] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formScore, setFormScore] = useState('')

  const loadData = async () => {
    const supabase = createSupabaseBrowserClient() as any
    try {
      const [ideasRes, clientsRes] = await Promise.all([
        supabase
          .from('content_ideas')
          .select('*, clients(business_name, display_name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, business_name')
          .order('business_name'),
      ])

      if (ideasRes.error) throw ideasRes.error
      if (clientsRes.error) throw clientsRes.error

      setIdeas((ideasRes.data as ContentIdea[]) || [])
      setClients(clientsRes.data || [])
    } catch (err) {
      console.error('Error loading ideas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    setSubmitting(true)
    const supabase = createSupabaseBrowserClient() as any
    try {
      const { error } = await supabase.from('content_ideas').insert({
        title: formTitle.trim(),
        concept: formConcept.trim() || null,
        inspiration_source: formSource.trim() || null,
        client_id: formClientId || null,
        score: formScore ? parseInt(formScore) : null,
        status: 'new' as const,
      })

      if (error) throw error

      // Reset form and reload
      setFormTitle('')
      setFormConcept('')
      setFormSource('')
      setFormClientId('')
      setFormScore('')
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Error creating idea:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredIdeas =
    statusFilter === 'all' ? ideas : ideas.filter((i) => i.status === statusFilter)

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
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Content Ideas</h1>
            <p className="text-gray-400 text-sm mt-1">Backlog of content concepts and inspiration</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4C430] text-black font-medium text-sm rounded-lg hover:bg-[#F4C430]/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Idea'}
        </button>
      </div>

      {/* Add Idea Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[#F4C430]" />
            <h3 className="text-sm font-medium text-white">New Content Idea</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Behind the scenes studio tour"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Client</label>
              <select
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F4C430]/50"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Concept</label>
            <textarea
              value={formConcept}
              onChange={(e) => setFormConcept(e.target.value)}
              rows={3}
              placeholder="Describe the content idea, format, key talking points..."
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Inspiration Source</label>
              <input
                type="text"
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                placeholder="e.g. Competitor post, trending audio, client request"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Score (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formScore}
                onChange={(e) => setFormScore(e.target.value)}
                placeholder="Rate this idea"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !formTitle.trim()}
              className="px-5 py-2 bg-[#F4C430] text-black font-medium text-sm rounded-lg hover:bg-[#F4C430]/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Idea'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <div className="flex gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#F4C430]/10 text-[#F4C430] border border-[#F4C430]/30'
                : 'bg-[#141414] text-gray-400 border border-[#262626] hover:border-[#363636]'
            }`}
          >
            All ({ideas.length})
          </button>
          {STATUS_OPTIONS.map((s) => {
            const count = ideas.filter((i) => i.status === s).length
            const colors = STATUS_COLORS[s]
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? `${colors.bg} ${colors.text} border border-current/30`
                    : 'bg-[#141414] text-gray-400 border border-[#262626] hover:border-[#363636]'
                }`}
              >
                {s} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Ideas Table */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center">
          <Lightbulb className="h-10 w-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">
            {statusFilter === 'all' ? 'No ideas yet.' : `No ${statusFilter} ideas.`}
          </p>
          <p className="text-gray-600 text-xs mt-1">Click &quot;New Idea&quot; to add your first content concept.</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium px-4 py-3">
                  Title
                </th>
                <th className="text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium px-4 py-3 hidden md:table-cell">
                  Concept
                </th>
                <th className="text-left text-[11px] text-gray-500 uppercase tracking-wider font-medium px-4 py-3 hidden lg:table-cell">
                  Source
                </th>
                <th className="text-center text-[11px] text-gray-500 uppercase tracking-wider font-medium px-4 py-3">
                  Score
                </th>
                <th className="text-center text-[11px] text-gray-500 uppercase tracking-wider font-medium px-4 py-3">
                  Status
                </th>
                <th className="text-right text-[11px] text-gray-500 uppercase tracking-wider font-medium px-4 py-3 hidden sm:table-cell">
                  Added
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map((idea) => {
                const colors = STATUS_COLORS[idea.status] || STATUS_COLORS.new
                const clientName =
                  idea.clients?.display_name || idea.clients?.business_name || null
                return (
                  <tr
                    key={idea.id}
                    className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{idea.title}</p>
                      {clientName && (
                        <p className="text-xs text-gray-500 mt-0.5">{clientName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-gray-400 truncate max-w-[250px]">
                        {idea.concept || '--'}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {idea.inspiration_source || '--'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={idea.score} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${colors.bg} ${colors.text}`}
                      >
                        {idea.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-xs text-gray-600">
                        {new Date(idea.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
