'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Film,
  Mic2,
  Music,
  Plus,
  X,
  Loader2,
  DollarSign,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Users,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  getMediaSplitTier,
  calculateMediaSplit,
  STUDIO_SPLITS,
  STUDIO_ENGINEERS,
  STUDIO_RATES,
} from '@/lib/constants/splitStructure'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const pct = (n: number) => `${Math.round(n * 100)}%`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

type Tab = 'media' | 'studio' | 'beats'

interface WorkerEntry { name: string; percent: string }
interface SalesEntry { name: string; percent: string }

const emptyMedia = {
  date: new Date().toISOString().split('T')[0],
  client: '',
  deal_type: 'transactional' as string,
  gross_revenue: '',
  notes: '',
  workers: [{ name: '', percent: '100' }] as WorkerEntry[],
  salesPeople: [] as SalesEntry[],
  hasSalesPerson: false,
}

const emptyStudio = {
  date: new Date().toISOString().split('T')[0],
  engineer: '',
  artist: '',
  type: 'recording',
  hours: '',
  rate: '',
  engineer_payout_pct: '60',
}

const emptyBeat = {
  date: new Date().toISOString().split('T')[0],
  title: '',
  producer: '',
  license_type: 'exclusive',
  price: '',
  buyer_state: '',
  tax_rate: '0',
  producer_payout_pct: '50',
}

export default function RevenuePage() {
  const [tab, setTab] = useState<Tab>('media')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [mediaProjects, setMediaProjects] = useState<any[]>([])
  const [studioSessions, setStudioSessions] = useState<any[]>([])
  const [beatSales, setBeatSales] = useState<any[]>([])

  const [mediaForm, setMediaForm] = useState({ ...emptyMedia })
  const [studioForm, setStudioForm] = useState({ ...emptyStudio })
  const [beatForm, setBeatForm] = useState({ ...emptyBeat })
  const [expandedMediaId, setExpandedMediaId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()
      const [year, month] = selectedMonth.split('-').map(Number)
      const start = new Date(year, month - 1, 1).toISOString()
      const end = new Date(year, month, 0, 23, 59, 59).toISOString()

      const [mediaRes, beatsRes, studioApiRes] = await Promise.all([
        (supabase.from('payout_records') as any).select('*').order('date', { ascending: false }),
        (supabase.from('beat_sales') as any).select('*').gte('date', start).lte('date', end).order('date', { ascending: false }),
        fetch(`/api/studio-revenue?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`).then(r => r.json()).catch(() => ({ sessions: [] })),
      ])

      if (mediaRes.data) setMediaProjects(mediaRes.data)
      if (studioApiRes.sessions) setStudioSessions(studioApiRes.sessions)
      if (beatsRes.data) setBeatSales(beatsRes.data)
      setLoading(false)
    }
    load()
  }, [selectedMonth])

  const mediaTotal = mediaProjects.reduce((s, p) => s + Number(p.total_revenue || 0), 0)
  const studioTotal = studioSessions.reduce((s, p) => s + Number(p.billed || 0), 0)
  const beatTotal = beatSales.reduce((s, p) => s + Number(p.price || 0), 0)

  async function handleDeletePayout(id: string) {
    setDeleting(id)
    const supabase = createSupabaseBrowserClient()
    await (supabase.from('payout_records') as any).delete().eq('id', id)
    setMediaProjects((prev) => prev.filter((p) => p.id !== id))
    setConfirmDelete(null)
    setExpandedMediaId(null)
    setDeleting(null)
  }

  async function handleMediaSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()
    const gross = Number(mediaForm.gross_revenue)
    const hasSales = mediaForm.hasSalesPerson && mediaForm.salesPeople.some(s => s.name.trim())
    const split = calculateMediaSplit(gross, hasSales)

    // Build worker breakdown
    const validWorkers = mediaForm.workers.filter(w => w.name.trim())
    const workerBreakdown = validWorkers.map(w => ({
      name: w.name.trim(),
      percent: Number(w.percent),
      amount: Math.round(split.workerAmount * (Number(w.percent) / 100) * 100) / 100,
    }))
    const workerPersonStr = validWorkers.map(w => `${w.name.trim()} (${w.percent}%)`).join(', ')

    // Build sales breakdown
    const validSales = hasSales ? mediaForm.salesPeople.filter(s => s.name.trim()) : []
    const salesBreakdown = validSales.map(s => ({
      name: s.name.trim(),
      percent: Number(s.percent),
      amount: Math.round(split.salesAmount * (Number(s.percent) / 100) * 100) / 100,
    }))
    const salesPersonStr = validSales.length > 0 ? validSales.map(s => `${s.name.trim()} (${s.percent}%)`).join(', ') : null

    const tier = getMediaSplitTier(gross)
    const row = {
      date: mediaForm.date,
      deal_type: mediaForm.deal_type,
      client_name: mediaForm.client,
      total_revenue: gross,
      business_amount: split.businessAmount,
      sales_amount: split.salesAmount,
      worker_amount: split.workerAmount,
      sales_person: salesPersonStr,
      worker_person: workerPersonStr || null,
      tier_used: split.tier.label,
      notes: mediaForm.notes || null,
      calculation_details: {
        dealType: mediaForm.deal_type,
        tierBreakdown: [{
          tierLabel: tier.label,
          amountInTier: gross,
          businessPercent: tier.business,
          salesPercent: hasSales ? tier.salesReward : 0,
          workerPercent: tier.worker,
          businessAmount: split.businessAmount,
          salesAmount: split.salesAmount,
          workerAmount: split.workerAmount,
        }],
        effectiveRates: {
          business: hasSales ? tier.business : tier.business + tier.salesReward,
          sales: hasSales ? tier.salesReward : 0,
          worker: tier.worker,
        },
        workerBreakdown,
        salesBreakdown,
      },
    }
    const { data } = await (supabase.from('payout_records') as any).insert(row).select().single()
    if (data) setMediaProjects((prev) => [data, ...prev])
    setMediaForm({ ...emptyMedia, workers: [{ name: '', percent: '100' }], salesPeople: [] })
    setShowForm(false)
    setSubmitting(false)
  }

  async function handleStudioSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()
    const hours = Number(studioForm.hours)
    const rate = Number(studioForm.rate)
    const billed = hours * rate
    const engPct = Number(studioForm.engineer_payout_pct) / 100
    const row = {
      date: new Date(studioForm.date).toISOString(),
      engineer: studioForm.engineer,
      artist: studioForm.artist,
      type: studioForm.type,
      hours,
      rate,
      billed,
      engineer_payout: billed * engPct,
      business_retention: billed * (1 - engPct),
    }
    const { data } = await (supabase.from('acct_studio_sessions') as any).insert(row).select().single()
    if (data) setStudioSessions((prev) => [data, ...prev])
    setStudioForm({ ...emptyStudio })
    setShowForm(false)
    setSubmitting(false)
  }

  async function handleBeatSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()
    const price = Number(beatForm.price)
    const taxRate = Number(beatForm.tax_rate) / 100
    const tax = price * taxRate
    const prodPct = Number(beatForm.producer_payout_pct) / 100
    const row = {
      date: new Date(beatForm.date).toISOString(),
      title: beatForm.title,
      producer: beatForm.producer,
      license_type: beatForm.license_type,
      price,
      buyer_state: beatForm.buyer_state,
      tax_collected: tax,
      producer_payout: price * prodPct,
      business_retention: price * (1 - prodPct),
    }
    const { data } = await (supabase.from('beat_sales') as any).insert(row).select().single()
    if (data) setBeatSales((prev) => [data, ...prev])
    setBeatForm({ ...emptyBeat })
    setShowForm(false)
    setSubmitting(false)
  }

  const tabs: { key: Tab; label: string; icon: typeof Film }[] = [
    { key: 'media', label: 'Media Projects', icon: Film },
    { key: 'studio', label: 'Studio Sessions', icon: Mic2 },
    { key: 'beats', label: 'Beat Sales', icon: Music },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <Link href="/accounting" className="text-xs flex items-center gap-1 mb-2" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="h-3 w-3" /> Accounting
          </Link>
          <h1 className="page-title">Revenue Tracking</h1>
          <p className="page-description">Track income across all revenue streams</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            className="input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? 'Cancel' : 'Add New'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Media Revenue', value: mediaTotal, icon: Film, color: 'var(--accent)' },
          { label: 'Studio Revenue', value: studioTotal, icon: Mic2, color: 'var(--info)' },
          { label: 'Beat Sales', value: beatTotal, icon: Music, color: 'var(--success)' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="stat-card-title">{s.label}</p>
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <p className="stat-card-value">{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="tabs flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab flex items-center gap-2 ${tab === t.key ? 'tab-active' : ''}`}
            onClick={() => { setTab(t.key); setShowForm(false) }}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="section-title">
            {tab === 'media' ? 'New Media Project' : tab === 'studio' ? 'New Studio Session' : 'New Beat Sale'}
          </h3>

          {tab === 'media' && (
            <form onSubmit={handleMediaSubmit} className="space-y-5">
              {/* Row 1: Core info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="label">Date *</label>
                  <input type="date" className="input" value={mediaForm.date} onChange={(e) => setMediaForm({ ...mediaForm, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Client *</label>
                  <input type="text" className="input" placeholder="Client or project name" value={mediaForm.client} onChange={(e) => setMediaForm({ ...mediaForm, client: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Deal Type</label>
                  <select className="input" value={mediaForm.deal_type} onChange={(e) => setMediaForm({ ...mediaForm, deal_type: e.target.value })}>
                    <option value="transactional">Transactional</option>
                    <option value="grand_slam_monthly">Grand Slam Monthly</option>
                    <option value="grand_slam_upfront">Grand Slam Upfront</option>
                    <option value="buyout">Buyout</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Gross Revenue *</label>
                  <input type="number" step="0.01" className="input" placeholder="0.00" value={mediaForm.gross_revenue} onChange={(e) => setMediaForm({ ...mediaForm, gross_revenue: e.target.value })} required />
                </div>
              </div>

              {/* Row 2: Notes */}
              <div className="form-group">
                <label className="label">Notes / Description</label>
                <input type="text" className="input" placeholder="What's the job? e.g. Music video + 3 reels, Website build, Drone coverage..." value={mediaForm.notes} onChange={(e) => setMediaForm({ ...mediaForm, notes: e.target.value })} />
              </div>

              {/* Row 3: Workers */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    <Users className="h-3.5 w-3.5 inline mr-1.5" style={{ color: 'var(--warning)' }} />
                    Workers
                  </p>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}
                    onClick={() => setMediaForm({ ...mediaForm, workers: [...mediaForm.workers, { name: '', percent: '0' }] })}
                  >
                    <Plus className="h-3 w-3 inline mr-1" />Add Worker
                  </button>
                </div>
                <div className="space-y-2">
                  {mediaForm.workers.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        placeholder="Name (e.g. Cole, Jay)"
                        value={w.name}
                        onChange={(e) => {
                          const updated = [...mediaForm.workers]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setMediaForm({ ...mediaForm, workers: updated })
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="input w-20 text-center"
                          placeholder="%"
                          value={w.percent}
                          onChange={(e) => {
                            const updated = [...mediaForm.workers]
                            updated[i] = { ...updated[i], percent: e.target.value }
                            setMediaForm({ ...mediaForm, workers: updated })
                          }}
                        />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>%</span>
                      </div>
                      {mediaForm.workers.length > 1 && (
                        <button
                          type="button"
                          className="p-1 rounded"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setMediaForm({ ...mediaForm, workers: mediaForm.workers.filter((_, j) => j !== i) })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {(() => {
                  const totalPct = mediaForm.workers.reduce((s, w) => s + (Number(w.percent) || 0), 0)
                  const isOff = totalPct !== 100 && mediaForm.workers.some(w => w.name.trim())
                  return isOff ? (
                    <p className="text-xs mt-2" style={{ color: totalPct > 100 ? 'var(--danger)' : 'var(--warning)' }}>
                      Worker split totals {totalPct}% — should be 100%
                    </p>
                  ) : null
                })()}
              </div>

              {/* Row 4: Sales */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mediaForm.hasSalesPerson}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setMediaForm({
                          ...mediaForm,
                          hasSalesPerson: checked,
                          salesPeople: checked && mediaForm.salesPeople.length === 0
                            ? [{ name: '', percent: '100' }]
                            : mediaForm.salesPeople,
                        })
                      }}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      <DollarSign className="h-3.5 w-3.5 inline mr-1" style={{ color: 'var(--accent)' }} />
                      Salesperson on this deal
                    </span>
                  </label>
                  {mediaForm.hasSalesPerson && (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}
                      onClick={() => setMediaForm({ ...mediaForm, salesPeople: [...mediaForm.salesPeople, { name: '', percent: '0' }] })}
                    >
                      <Plus className="h-3 w-3 inline mr-1" />Add
                    </button>
                  )}
                </div>
                {mediaForm.hasSalesPerson && (
                  <div className="space-y-2">
                    {mediaForm.salesPeople.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Salesperson name"
                          value={s.name}
                          onChange={(e) => {
                            const updated = [...mediaForm.salesPeople]
                            updated[i] = { ...updated[i], name: e.target.value }
                            setMediaForm({ ...mediaForm, salesPeople: updated })
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="input w-20 text-center"
                            placeholder="%"
                            value={s.percent}
                            onChange={(e) => {
                              const updated = [...mediaForm.salesPeople]
                              updated[i] = { ...updated[i], percent: e.target.value }
                              setMediaForm({ ...mediaForm, salesPeople: updated })
                            }}
                          />
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>%</span>
                        </div>
                        {mediaForm.salesPeople.length > 1 && (
                          <button
                            type="button"
                            className="p-1 rounded"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => setMediaForm({ ...mediaForm, salesPeople: mediaForm.salesPeople.filter((_, j) => j !== i) })}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Split Preview + Submit */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {(() => {
                  const gross = Number(mediaForm.gross_revenue || 0)
                  const hasSales = mediaForm.hasSalesPerson && mediaForm.salesPeople.some(s => s.name.trim())
                  const tier = getMediaSplitTier(gross)
                  const split = calculateMediaSplit(gross, hasSales)
                  return (
                    <div className="space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
                      {gross > 0 && <span className="badge-info text-xs mr-2">{tier.label} tier</span>}
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span>Business: <strong style={{ color: 'var(--success)' }}>{fmt(split.businessAmount)}</strong></span>
                        {hasSales && <span>Sales: <strong style={{ color: 'var(--accent)' }}>{fmt(split.salesAmount)}</strong></span>}
                        <span>Workers: <strong style={{ color: 'var(--warning)' }}>{fmt(split.workerAmount)}</strong></span>
                        {!hasSales && gross > 0 && (
                          <span className="text-xs">(Sales {pct(tier.salesReward)} absorbed by business)</span>
                        )}
                      </div>
                    </div>
                  )
                })()}
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Job'}
                </button>
              </div>
            </form>
          )}

          {tab === 'studio' && (
            <form onSubmit={handleStudioSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="label">Date</label>
                <input type="date" className="input" value={studioForm.date} onChange={(e) => setStudioForm({ ...studioForm, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Engineer</label>
                <input type="text" className="input" placeholder="Engineer name" value={studioForm.engineer} onChange={(e) => setStudioForm({ ...studioForm, engineer: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Artist</label>
                <input type="text" className="input" placeholder="Artist name" value={studioForm.artist} onChange={(e) => setStudioForm({ ...studioForm, artist: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Session Type</label>
                <select className="input" value={studioForm.type} onChange={(e) => setStudioForm({ ...studioForm, type: e.target.value })}>
                  <option value="recording">Recording</option>
                  <option value="mixing">Mixing</option>
                  <option value="mastering">Mastering</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Hours</label>
                <input type="number" step="0.5" className="input" placeholder="0" value={studioForm.hours} onChange={(e) => setStudioForm({ ...studioForm, hours: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Rate ($/hr)</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={studioForm.rate} onChange={(e) => setStudioForm({ ...studioForm, rate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Engineer Payout %</label>
                <input type="number" className="input" value={studioForm.engineer_payout_pct} onChange={(e) => setStudioForm({ ...studioForm, engineer_payout_pct: e.target.value })} required />
              </div>
              <div className="form-group flex items-end">
                <div className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                  <p>Billed: <strong style={{ color: 'var(--foreground)' }}>{fmt(Number(studioForm.hours || 0) * Number(studioForm.rate || 0))}</strong></p>
                  <p>Eng: <strong>{fmt(Number(studioForm.hours || 0) * Number(studioForm.rate || 0) * Number(studioForm.engineer_payout_pct || 0) / 100)}</strong></p>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Session'}
                </button>
              </div>
            </form>
          )}

          {tab === 'beats' && (
            <form onSubmit={handleBeatSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="label">Date</label>
                <input type="date" className="input" value={beatForm.date} onChange={(e) => setBeatForm({ ...beatForm, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Beat Title</label>
                <input type="text" className="input" placeholder="Beat title" value={beatForm.title} onChange={(e) => setBeatForm({ ...beatForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Producer</label>
                <input type="text" className="input" placeholder="Producer name" value={beatForm.producer} onChange={(e) => setBeatForm({ ...beatForm, producer: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">License Type</label>
                <select className="input" value={beatForm.license_type} onChange={(e) => setBeatForm({ ...beatForm, license_type: e.target.value })}>
                  <option value="exclusive">Exclusive</option>
                  <option value="non-exclusive">Non-Exclusive</option>
                  <option value="lease">Lease</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Price</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={beatForm.price} onChange={(e) => setBeatForm({ ...beatForm, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Buyer State</label>
                <input type="text" className="input" placeholder="e.g. TX" value={beatForm.buyer_state} onChange={(e) => setBeatForm({ ...beatForm, buyer_state: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Tax Rate %</label>
                <input type="number" step="0.01" className="input" value={beatForm.tax_rate} onChange={(e) => setBeatForm({ ...beatForm, tax_rate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Producer Payout %</label>
                <input type="number" className="input" value={beatForm.producer_payout_pct} onChange={(e) => setBeatForm({ ...beatForm, producer_payout_pct: e.target.value })} required />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between">
                <div className="text-sm flex gap-4" style={{ color: 'var(--muted)' }}>
                  <span>Tax: <strong style={{ color: 'var(--foreground)' }}>{fmt(Number(beatForm.price || 0) * Number(beatForm.tax_rate || 0) / 100)}</strong></span>
                  <span>Producer: <strong>{fmt(Number(beatForm.price || 0) * Number(beatForm.producer_payout_pct || 0) / 100)}</strong></span>
                  <span>Business: <strong>{fmt(Number(beatForm.price || 0) * (1 - Number(beatForm.producer_payout_pct || 0) / 100))}</strong></span>
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Beat Sale'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : (
        <div className="table-container">
          {tab === 'media' && (
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Gross Revenue</th>
                  <th>Tier</th>
                  <th>Business</th>
                  <th>Sales</th>
                  <th>Workers</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {mediaProjects.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--muted)' }}>No media projects this period</td></tr>
                ) : (
                  mediaProjects.map((p: any) => {
                    const isExpanded = expandedMediaId === p.id
                    const details = p.calculation_details
                    const workers = details?.workerBreakdown || []
                    const sales = details?.salesBreakdown || []
                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          className="cursor-pointer transition-colors"
                          style={{ backgroundColor: isExpanded ? 'var(--surface-hover)' : undefined }}
                          onClick={() => setExpandedMediaId(isExpanded ? null : p.id)}
                        >
                          <td className="pr-0">
                            {isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
                              : <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
                            }
                          </td>
                          <td>{fmtDate(p.date || p.created_at)}</td>
                          <td className="font-medium">{p.client_name || '-'}</td>
                          <td className="font-medium">{fmt(Number(p.total_revenue || 0))}</td>
                          <td><span className="text-xs" style={{ color: 'var(--muted)' }}>{p.tier_used || '-'}</span></td>
                          <td style={{ color: 'var(--success)' }}>{fmt(Number(p.business_amount || 0))}</td>
                          <td style={{ color: 'var(--accent)' }}>{fmt(Number(p.sales_amount || 0))}</td>
                          <td style={{ color: 'var(--warning)' }}>{fmt(Number(p.worker_amount || 0))}</td>
                          <td className="pl-0">
                            {confirmDelete === p.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="text-xs px-2 py-1 rounded"
                                  style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                                  onClick={() => handleDeletePayout(p.id)}
                                  disabled={deleting === p.id}
                                >
                                  {deleting === p.id ? '...' : 'Yes'}
                                </button>
                                <button
                                  className="text-xs px-2 py-1 rounded"
                                  style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
                                  onClick={() => setConfirmDelete(null)}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                className="p-1 rounded transition-colors opacity-40 hover:opacity-100"
                                style={{ color: 'var(--danger)' }}
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id) }}
                                title="Delete payout"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <div className="px-6 py-4" style={{ backgroundColor: 'var(--surface)' }}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Workers */}
                                  <div>
                                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                                      <Users className="h-3 w-3 inline mr-1" />Workers
                                    </p>
                                    {workers.length > 0 ? workers.map((w: any, i: number) => (
                                      <div key={i} className="flex justify-between text-sm py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--foreground)' }}>{w.name} ({w.percent}%)</span>
                                        <span className="font-medium" style={{ color: 'var(--warning)' }}>{fmt(w.amount)}</span>
                                      </div>
                                    )) : (
                                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.worker_person || 'No breakdown'}</p>
                                    )}
                                  </div>
                                  {/* Sales */}
                                  <div>
                                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                                      <DollarSign className="h-3 w-3 inline mr-1" />Sales Commission
                                    </p>
                                    {sales.length > 0 ? sales.map((s: any, i: number) => (
                                      <div key={i} className="flex justify-between text-sm py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--foreground)' }}>{s.name} ({s.percent}%)</span>
                                        <span className="font-medium" style={{ color: 'var(--accent)' }}>{fmt(s.amount)}</span>
                                      </div>
                                    )) : (
                                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.sales_person || 'No salesperson'}</p>
                                    )}
                                  </div>
                                  {/* Details */}
                                  <div>
                                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Details</p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>Deal Type</span>
                                        <span className="capitalize" style={{ color: 'var(--foreground)' }}>{p.deal_type?.replace('_', ' ') || '-'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: 'var(--muted)' }}>Business Cut</span>
                                        <span style={{ color: 'var(--success)' }}>{fmt(Number(p.business_amount || 0))}</span>
                                      </div>
                                      {p.notes && (
                                        <div className="pt-2">
                                          <span className="text-xs" style={{ color: 'var(--muted)' }}>Notes: </span>
                                          <span className="text-xs" style={{ color: 'var(--foreground)' }}>{p.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
              {mediaProjects.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3}></td>
                    <td className="font-bold">{fmt(mediaTotal)}</td>
                    <td></td>
                    <td className="font-bold" style={{ color: 'var(--success)' }}>
                      {fmt(mediaProjects.reduce((s, p) => s + Number(p.business_amount || 0), 0))}
                    </td>
                    <td className="font-bold" style={{ color: 'var(--accent)' }}>
                      {fmt(mediaProjects.reduce((s, p) => s + Number(p.sales_amount || 0), 0))}
                    </td>
                    <td className="font-bold" style={{ color: 'var(--warning)' }}>
                      {fmt(mediaProjects.reduce((s, p) => s + Number(p.worker_amount || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {tab === 'studio' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Engineer</th>
                  <th>Artist</th>
                  <th>Room</th>
                  <th>Hours</th>
                  <th>Billed</th>
                  <th>Eng. Payout (60%)</th>
                  <th>Business (40%)</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {studioSessions.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--muted)' }}>No studio sessions this month</td></tr>
                ) : (
                  studioSessions.map((s: any) => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.date)}</td>
                      <td className="font-medium">{s.engineer || '-'}</td>
                      <td>{s.artist || '-'}</td>
                      <td><span className="badge-info capitalize text-xs">{(s.room || '-').replace('_', ' ')}</span></td>
                      <td>{s.hours}h</td>
                      <td className="font-medium">{fmt(Number(s.billed || 0))}</td>
                      <td style={{ color: 'var(--warning)' }}>{fmt(Number(s.engineer_payout || 0))}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(Number(s.business_retention || 0))}</td>
                      <td>
                        {s.source === 'sweet_dreams_music' ? (
                          <span className="badge-success text-xs">Music Site</span>
                        ) : (
                          <span className="badge-gray text-xs">Manual</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === 'beats' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Producer</th>
                  <th>License</th>
                  <th>Price</th>
                  <th>Buyer State</th>
                  <th>Tax</th>
                  <th>Producer Payout</th>
                  <th>Business</th>
                </tr>
              </thead>
              <tbody>
                {beatSales.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--muted)' }}>No beat sales this month</td></tr>
                ) : (
                  beatSales.map((b: any) => (
                    <tr key={b.id}>
                      <td>{fmtDate(b.date)}</td>
                      <td className="font-medium">{b.title || '-'}</td>
                      <td>{b.producer || '-'}</td>
                      <td><span className="badge-info capitalize">{b.license_type || '-'}</span></td>
                      <td className="font-medium">{fmt(Number(b.price || 0))}</td>
                      <td>{b.buyer_state || '-'}</td>
                      <td>{fmt(Number(b.tax_collected || 0))}</td>
                      <td style={{ color: 'var(--warning)' }}>{fmt(Number(b.producer_payout || 0))}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(Number(b.business_retention || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
