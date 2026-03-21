'use client'

import { useState, useEffect } from 'react'
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

const emptyMedia = {
  date: new Date().toISOString().split('T')[0],
  client: '',
  type: 'video',
  gross_revenue: '',
  status: 'completed',
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
        (supabase.from('payout_records') as any).select('*').gte('date', start.split('T')[0]).lte('date', end.split('T')[0]).order('date', { ascending: false }),
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

  async function handleMediaSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createSupabaseBrowserClient()
    const gross = Number(mediaForm.gross_revenue)
    const split = calculateMediaSplit(gross, false)
    const row = {
      date: mediaForm.date,
      deal_type: 'transactional',
      client_name: mediaForm.client,
      total_revenue: gross,
      business_amount: split.businessAmount,
      sales_amount: split.salesAmount,
      worker_amount: split.workerAmount,
      tier_used: split.tier.label,
    }
    const { data } = await (supabase.from('payout_records') as any).insert(row).select().single()
    if (data) setMediaProjects((prev) => [data, ...prev])
    setMediaForm({ ...emptyMedia })
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
            <form onSubmit={handleMediaSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="label">Date</label>
                <input type="date" className="input" value={mediaForm.date} onChange={(e) => setMediaForm({ ...mediaForm, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Client</label>
                <input type="text" className="input" placeholder="Client name" value={mediaForm.client} onChange={(e) => setMediaForm({ ...mediaForm, client: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Type</label>
                <select className="input" value={mediaForm.type} onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value })}>
                  <option value="video">Video</option>
                  <option value="photo">Photo</option>
                  <option value="social">Social Media</option>
                  <option value="branding">Branding</option>
                  <option value="web">Web</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Gross Revenue</label>
                <input type="number" step="0.01" className="input" placeholder="0.00" value={mediaForm.gross_revenue} onChange={(e) => setMediaForm({ ...mediaForm, gross_revenue: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={mediaForm.status} onChange={(e) => setMediaForm({ ...mediaForm, status: e.target.value })}>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="form-group sm:col-span-2 lg:col-span-3 flex items-end">
                {(() => {
                  const gross = Number(mediaForm.gross_revenue || 0)
                  const tier = getMediaSplitTier(gross)
                  const split = calculateMediaSplit(gross, false)
                  return (
                    <div className="space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
                      <span className="badge-info text-xs">{tier.label} tier</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span>Business ({pct(tier.business + tier.salesReward)}): <strong style={{ color: 'var(--foreground)' }}>{fmt(split.businessAmount)}</strong></span>
                        <span>Worker ({pct(tier.worker)}): <strong style={{ color: 'var(--foreground)' }}>{fmt(split.workerAmount)}</strong></span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>(Sales reward {pct(tier.salesReward)} held — no salesperson)</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="form-group flex items-end">
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Project'}
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
                  <th>Date</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Gross Revenue</th>
                  <th>Tier</th>
                  <th>Business</th>
                  <th>Sales</th>
                  <th>Workers</th>
                </tr>
              </thead>
              <tbody>
                {mediaProjects.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8" style={{ color: 'var(--muted)' }}>No media projects this month</td></tr>
                ) : (
                  mediaProjects.map((p: any) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.date || p.created_at)}</td>
                      <td className="font-medium">{p.client_name || '-'}</td>
                      <td><span className="badge-info capitalize">{p.deal_type?.replace('_', ' ') || '-'}</span></td>
                      <td className="font-medium">{fmt(Number(p.total_revenue || 0))}</td>
                      <td><span className="text-xs" style={{ color: 'var(--muted)' }}>{p.tier_used || '-'}</span></td>
                      <td style={{ color: 'var(--success)' }}>{fmt(Number(p.business_amount || 0))}</td>
                      <td style={{ color: 'var(--accent)' }}>{fmt(Number(p.sales_amount || 0))}</td>
                      <td style={{ color: 'var(--warning)' }}>{fmt(Number(p.worker_amount || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
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
