'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Target,
  TrendingUp,
  Clock,
  Zap,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'

type ValueStackItem = {
  name: string
  value: number | null
  description: string
}

type WorksheetData = {
  id: string
  client_id: string | null
  dream_outcome: string
  likelihood_score: number | null
  time_to_result: string
  time_delay_score: number | null
  effort_required: string
  effort_score: number | null
  value_stack: ValueStackItem[]
  proposed_price: number | null
  engines_active: string[]
  notes: string
  status: string
  created_at: string
  updated_at: string
}

const ALL_ENGINES = [
  'Social Media Management',
  'Content Production',
  'SEO & Website',
  'Google Business Profile',
  'Paid Ads',
  'Email Marketing',
  'Branding & Design',
  'Analytics & Reporting',
  'AI Automation',
  'Studio Recording',
]

const STATUS_FLOW: Record<string, { next: string[]; colors: { bg: string; text: string } }> = {
  draft: {
    next: ['presented'],
    colors: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
  },
  presented: {
    next: ['accepted', 'declined'],
    colors: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  },
  accepted: {
    next: [],
    colors: { bg: 'bg-green-500/10', text: 'text-green-400' },
  },
  declined: {
    next: ['draft'],
    colors: { bg: 'bg-red-500/10', text: 'text-red-400' },
  },
}

export default function GrandSlamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([])

  const [form, setForm] = useState<WorksheetData>({
    id: '',
    client_id: null,
    dream_outcome: '',
    likelihood_score: null,
    time_to_result: '',
    time_delay_score: null,
    effort_required: '',
    effort_score: null,
    value_stack: [],
    proposed_price: null,
    engines_active: [],
    notes: '',
    status: 'draft',
    created_at: '',
    updated_at: '',
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient() as any

    const loadClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, business_name')
        .order('business_name')
      setClients(data || [])
    }

    const loadWorksheet = async () => {
      if (isNew) return
      try {
        const { data, error } = await supabase
          .from('grand_slam_worksheets')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          setForm({
            ...data,
            dream_outcome: data.dream_outcome || '',
            time_to_result: data.time_to_result || '',
            effort_required: data.effort_required || '',
            value_stack: (data.value_stack as ValueStackItem[]) || [],
            engines_active: (data.engines_active as string[]) || [],
            notes: data.notes || '',
            status: data.status || 'draft',
          })
        }
      } catch (err) {
        console.error('Error loading worksheet:', err)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
    loadWorksheet()
  }, [id, isNew])

  const updateField = <K extends keyof WorksheetData>(key: K, value: WorksheetData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleEngine = (engine: string) => {
    setForm((prev) => ({
      ...prev,
      engines_active: prev.engines_active.includes(engine)
        ? prev.engines_active.filter((e) => e !== engine)
        : [...prev.engines_active, engine],
    }))
  }

  const addValueStackItem = () => {
    setForm((prev) => ({
      ...prev,
      value_stack: [...prev.value_stack, { name: '', value: null, description: '' }],
    }))
  }

  const updateValueStackItem = (index: number, field: keyof ValueStackItem, value: string | number | null) => {
    setForm((prev) => {
      const updated = [...prev.value_stack]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, value_stack: updated }
    })
  }

  const removeValueStackItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      value_stack: prev.value_stack.filter((_, i) => i !== index),
    }))
  }

  const totalStackValue = form.value_stack.reduce((sum, item) => sum + (item.value || 0), 0)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createSupabaseBrowserClient() as any

    const payload = {
      client_id: form.client_id || null,
      dream_outcome: form.dream_outcome || null,
      likelihood_score: form.likelihood_score,
      time_to_result: form.time_to_result || null,
      time_delay_score: form.time_delay_score,
      effort_required: form.effort_required || null,
      effort_score: form.effort_score,
      value_stack: form.value_stack as any,
      proposed_price: form.proposed_price,
      engines_active: form.engines_active as any,
      notes: form.notes || null,
      status: form.status,
    }

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('grand_slam_worksheets')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        router.push(`/grand-slam/${data.id}`)
      } else {
        const { error } = await supabase
          .from('grand_slam_worksheets')
          .update(payload)
          .eq('id', id)

        if (error) throw error
      }
    } catch (err) {
      console.error('Error saving worksheet:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    updateField('status', newStatus)
    if (!isNew) {
      const supabase = createSupabaseBrowserClient() as any
      await supabase.from('grand_slam_worksheets').update({ status: newStatus }).eq('id', id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4C430]" />
      </div>
    )
  }

  const currentStatusConfig = STATUS_FLOW[form.status] || STATUS_FLOW.draft

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/grand-slam"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? 'New Grand Slam Worksheet' : 'Edit Worksheet'}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {form.dream_outcome || 'Define the dream outcome for your client'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#F4C430] text-black font-medium text-sm rounded-lg hover:bg-[#F4C430]/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Status Workflow */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500">Status:</span>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${currentStatusConfig.colors.bg} ${currentStatusConfig.colors.text}`}
          >
            {form.status}
          </span>
          {currentStatusConfig.next.length > 0 && (
            <>
              <span className="text-gray-600 text-xs">Move to:</span>
              {currentStatusConfig.next.map((next) => {
                const nextColors = STATUS_FLOW[next]?.colors || STATUS_FLOW.draft.colors
                const Icon = next === 'accepted' ? CheckCircle2 : next === 'declined' ? XCircle : FileText
                return (
                  <button
                    key={next}
                    onClick={() => handleStatusChange(next)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize border transition-colors hover:opacity-80 ${nextColors.bg} ${nextColors.text} border-current/20`}
                  >
                    <Icon className="h-3 w-3" />
                    {next}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Core Fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client & Dream Outcome */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-medium text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-[#F4C430]" />
              Dream Outcome
            </h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Client</label>
              <select
                value={form.client_id || ''}
                onChange={(e) => updateField('client_id', e.target.value || null)}
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

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Dream Outcome
              </label>
              <textarea
                value={form.dream_outcome}
                onChange={(e) => updateField('dream_outcome', e.target.value)}
                rows={3}
                placeholder="What is the ideal result the client wants to achieve?"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50 resize-none"
              />
            </div>
          </div>

          {/* Scores */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-5">
            <h2 className="text-sm font-medium text-white">Offer Scores</h2>

            {/* Likelihood */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <label className="text-xs text-gray-400">Perceived Likelihood of Achievement (1-10)</label>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.likelihood_score ?? 5}
                onChange={(e) => updateField('likelihood_score', parseInt(e.target.value))}
                className="w-full accent-[#F4C430]"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Unlikely</span>
                <span className="text-white font-bold text-sm">{form.likelihood_score ?? '--'}</span>
                <span>Certain</span>
              </div>
            </div>

            {/* Time Delay */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <label className="text-xs text-gray-400">Time Delay Score (1-10, higher = faster)</label>
              </div>
              <input
                type="text"
                value={form.time_to_result}
                onChange={(e) => updateField('time_to_result', e.target.value)}
                placeholder="e.g. 90 days to first results"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
              />
              <input
                type="range"
                min="1"
                max="10"
                value={form.time_delay_score ?? 5}
                onChange={(e) => updateField('time_delay_score', parseInt(e.target.value))}
                className="w-full accent-[#F4C430]"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Slow</span>
                <span className="text-white font-bold text-sm">{form.time_delay_score ?? '--'}</span>
                <span>Instant</span>
              </div>
            </div>

            {/* Effort */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <label className="text-xs text-gray-400">Effort & Sacrifice Score (1-10, higher = easier)</label>
              </div>
              <input
                type="text"
                value={form.effort_required}
                onChange={(e) => updateField('effort_required', e.target.value)}
                placeholder="e.g. Minimal client involvement needed"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
              />
              <input
                type="range"
                min="1"
                max="10"
                value={form.effort_score ?? 5}
                onChange={(e) => updateField('effort_score', parseInt(e.target.value))}
                className="w-full accent-[#F4C430]"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Hard</span>
                <span className="text-white font-bold text-sm">{form.effort_score ?? '--'}</span>
                <span>Effortless</span>
              </div>
            </div>
          </div>

          {/* Value Stack */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#F4C430]" />
                Value Stack
              </h2>
              <div className="flex items-center gap-3">
                {totalStackValue > 0 && (
                  <span className="text-xs text-gray-400">
                    Total: <span className="text-[#F4C430] font-bold">${totalStackValue.toLocaleString()}</span>
                  </span>
                )}
                <button
                  onClick={addValueStackItem}
                  className="inline-flex items-center gap-1 text-xs text-[#F4C430] hover:text-[#F4C430]/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>
            </div>

            {form.value_stack.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-gray-500">No items in the value stack yet.</p>
                <button
                  onClick={addValueStackItem}
                  className="mt-2 text-xs text-[#F4C430] hover:text-[#F4C430]/80"
                >
                  Add your first deliverable
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {form.value_stack.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-gray-600 font-mono mt-2">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateValueStackItem(idx, 'name', e.target.value)}
                          placeholder="Deliverable name"
                          className="sm:col-span-2 bg-transparent border border-[#262626] rounded px-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            value={item.value ?? ''}
                            onChange={(e) =>
                              updateValueStackItem(idx, 'value', e.target.value ? parseInt(e.target.value) : null)
                            }
                            placeholder="Value"
                            className="w-full bg-transparent border border-[#262626] rounded pl-6 pr-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeValueStackItem(idx)}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors mt-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="ml-6">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateValueStackItem(idx, 'description', e.target.value)}
                        placeholder="Brief description..."
                        className="w-full bg-transparent border-none text-xs text-gray-400 placeholder-gray-700 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-medium text-white">Notes</h2>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={4}
              placeholder="Additional context, objections handled, follow-up items..."
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F4C430]/50 resize-none"
            />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-5">
          {/* Proposed Price */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-medium text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#F4C430]" />
              Proposed Price
            </h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={form.proposed_price ?? ''}
                onChange={(e) =>
                  updateField('proposed_price', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0"
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-lg pl-8 pr-3 py-3 text-2xl font-bold text-white placeholder-gray-700 focus:outline-none focus:border-[#F4C430]/50"
              />
            </div>
            {totalStackValue > 0 && form.proposed_price && (
              <p className="text-xs text-gray-500">
                {Math.round((form.proposed_price / totalStackValue) * 100)}% of stack value (${totalStackValue.toLocaleString()})
              </p>
            )}
          </div>

          {/* Engines Checklist */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">Engines Active</h2>
              <span className="text-xs text-gray-500">
                {form.engines_active.length}/{ALL_ENGINES.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {ALL_ENGINES.map((engine) => {
                const isActive = form.engines_active.includes(engine)
                return (
                  <button
                    key={engine}
                    onClick={() => toggleEngine(engine)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      isActive
                        ? 'bg-[#F4C430]/10 text-[#F4C430] border border-[#F4C430]/20'
                        : 'bg-[#0A0A0A] text-gray-500 border border-[#1a1a1a] hover:border-[#262626]'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#F4C430] border-[#F4C430]' : 'border-[#363636]'
                      }`}
                    >
                      {isActive && (
                        <svg className="h-2.5 w-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {engine}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Score Summary */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-medium text-white">Score Summary</h2>
            <div className="space-y-2">
              {[
                { label: 'Likelihood', score: form.likelihood_score, color: 'text-green-400' },
                { label: 'Time Delay', score: form.time_delay_score, color: 'text-blue-400' },
                { label: 'Effort', score: form.effort_score, color: 'text-yellow-400' },
              ].map(({ label, score, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm font-mono font-bold ${score !== null ? color : 'text-gray-600'}`}>
                    {score !== null ? `${score}/10` : '--'}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Combined</span>
                  <span className="text-sm font-mono font-bold text-[#F4C430]">
                    {form.likelihood_score !== null &&
                    form.time_delay_score !== null &&
                    form.effort_score !== null
                      ? `${form.likelihood_score + form.time_delay_score + form.effort_score}/30`
                      : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
