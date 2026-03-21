'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { LogOut, Music, Video, Clock, DollarSign, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import sweetDreamsLogo from '@/assets/SweetDreamsUSlogowide.png'
import {
  STUDIOS,
  ENGINEERS,
  MEDIA_SERVICES,
  BANK_ENTITIES,
  type StudioId,
  type MediaRole,
  type EngineerId,
} from '@/lib/constants/studioRates'
import {
  calculateRecordingSession,
  calculateMediaSession,
} from '@/lib/calculations/studioPayoutCalculator'
import type { StudioSession } from '@/lib/supabase/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EngineerAccount {
  username: string
  password: string
  engineerId: EngineerId
  displayName: string
}

const ENGINEER_USERS: EngineerAccount[] = [
  { username: 'prvrb', password: 'ProverbStudio2025', engineerId: 'prvrb', displayName: 'PRVRB' },
  { username: 'iszac', password: 'IsaacStudio2025', engineerId: 'iszac_griner', displayName: 'Iszac Griner' },
  { username: 'jayvalleo', password: 'NeverPonYourA7', engineerId: 'jay_val_leo', displayName: 'Jay Val Leo' },
  { username: 'zion', password: 'ZionStudio2025', engineerId: 'zion_tinsley', displayName: 'Zion Tinsley' },
]

type Tab = 'log' | 'sessions' | 'payouts'

export default function EngineerPortal() {
  const [user, setUser] = useState<EngineerAccount | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Check localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studio-engineer-auth')
    if (saved) {
      const match = ENGINEER_USERS.find(u => u.username === saved)
      if (match) setUser(match)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const match = ENGINEER_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    )
    if (match) {
      localStorage.setItem('studio-engineer-auth', match.username)
      setUser(match)
      setLoginError('')
    } else {
      setLoginError('Incorrect username or password.')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('studio-engineer-auth')
    setUser(null)
    setUsername('')
    setPassword('')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900">
        <div className="max-w-sm w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-4">
              <Image src={sweetDreamsLogo} alt="Sweet Dreams" height={48} className="w-auto mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Studio Portal</h1>
            <p className="text-sm text-gray-500 mb-6">Engineer Session Tracker</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setLoginError('') }}
                placeholder="Username"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-amber-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return <EngineerDashboard user={user} onLogout={handleLogout} />
}

// ─── Dashboard (post-login) ───────────────────────────────────────
function EngineerDashboard({ user, onLogout }: { user: EngineerAccount; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('log')
  const [sessions, setSessions] = useState<StudioSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('studio_sessions')
      .select('*')
      .eq('engineer', user.engineerId)
      .order('session_date', { ascending: false })
    setSessions((data as StudioSession[]) || [])
    setLoading(false)
  }, [user.engineerId])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'log', label: 'Log Session', icon: <Music className="h-4 w-4" /> },
    { id: 'sessions', label: 'My Sessions', icon: <Clock className="h-4 w-4" /> },
    { id: 'payouts', label: 'My Payouts', icon: <DollarSign className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Image src={sweetDreamsLogo} alt="Sweet Dreams" height={32} className="w-auto" />
          </div>
          <p className="text-sm text-gray-500 mt-1">Welcome back, <span className="font-medium text-gray-900">{user.displayName}</span></p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'log' && <LogSessionTab user={user} onSessionLogged={fetchSessions} />}
      {tab === 'sessions' && <MySessionsTab sessions={sessions} loading={loading} />}
      {tab === 'payouts' && <MyPayoutsTab sessions={sessions} loading={loading} />}
    </div>
  )
}

// ─── Log Session Tab ──────────────────────────────────────────────
function LogSessionTab({ user, onSessionLogged }: { user: EngineerAccount; onSessionLogged: () => void }) {
  const [sessionType, setSessionType] = useState<'recording' | 'media'>('recording')
  const [studio, setStudio] = useState<StudioId>('studio_a')
  const [hours, setHours] = useState('')
  const [isBlock, setIsBlock] = useState(false)
  const [mediaService, setMediaService] = useState<string>(MEDIA_SERVICES[0].id)
  const [mediaRole, setMediaRole] = useState<MediaRole>('produced')
  const [mediaCharge, setMediaCharge] = useState('')
  const [clientName, setClientName] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Live preview
  const preview = (() => {
    if (sessionType === 'recording') {
      const h = parseFloat(hours)
      if (!h || h <= 0) return null
      return calculateRecordingSession({ studio, hours: h, isBlock })
    } else {
      const charge = parseFloat(mediaCharge)
      if (!charge || charge <= 0) return null
      return calculateMediaSession({ totalCharge: charge, mediaRole })
    }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preview || !clientName.trim()) return
    setSubmitting(true)
    setSubmitResult(null)

    const row = {
      engineer: user.engineerId,
      session_type: sessionType,
      studio: sessionType === 'recording' ? studio : null,
      hours: sessionType === 'recording' ? parseFloat(hours) : null,
      is_block: sessionType === 'recording' ? isBlock : false,
      media_service_type: sessionType === 'media' ? mediaService : null,
      media_role: sessionType === 'media' ? mediaRole : null,
      client_name: clientName.trim(),
      session_date: sessionDate,
      total_charge: preview.totalCharge,
      engineer_payout: preview.engineerPayout,
      studio_payout: preview.studioPayout,
      bank_entity: preview.bankEntity,
      status: 'pending' as const,
      notes: notes.trim() || null,
    }

    const { error } = await supabase.from('studio_sessions').insert(row)

    if (error) {
      setSubmitResult({ ok: false, msg: error.message })
    } else {
      setSubmitResult({ ok: true, msg: 'Session logged successfully!' })
      setClientName('')
      setHours('')
      setMediaCharge('')
      setNotes('')
      setIsBlock(false)
      onSessionLogged()
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Log a New Session</h2>

      {/* Session Type Toggle */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setSessionType('recording')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
            sessionType === 'recording'
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Music className="h-4 w-4" />
          Recording Session
        </button>
        <button
          type="button"
          onClick={() => setSessionType('media')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
            sessionType === 'media'
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Video className="h-4 w-4" />
          Media Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="e.g. John Smith"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Session Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Recording-specific fields */}
        {sessionType === 'recording' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Studio Room</label>
              <select
                value={studio}
                onChange={(e) => setStudio(e.target.value as StudioId)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {Object.entries(STUDIOS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name} — ${val.hourlyRate}/hr (${val.blockRate}/{val.blockHours}hr block)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                placeholder="e.g. 3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBlock}
                  onChange={(e) => setIsBlock(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Block rate pricing (3-hour blocks)</span>
              </label>
            </div>
          </>
        )}

        {/* Media-specific fields */}
        {sessionType === 'media' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                value={mediaService}
                onChange={(e) => setMediaService(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {MEDIA_SERVICES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Charge ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={mediaCharge}
                onChange={(e) => setMediaCharge(e.target.value)}
                required
                placeholder="e.g. 200"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMediaRole('produced')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    mediaRole === 'produced'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Produced (65/35)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaRole('upsold')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    mediaRole === 'upsold'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Upsold (15/85)
                </button>
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional details..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Payout Preview</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-amber-600">Total Charge</p>
              <p className="text-lg font-bold text-amber-900">${preview.totalCharge.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-amber-600">Your Payout</p>
              <p className="text-lg font-bold text-green-700">${preview.engineerPayout.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-amber-600">Studio ({BANK_ENTITIES[preview.bankEntity]})</p>
              <p className="text-lg font-bold text-amber-900">${preview.studioPayout.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      {submitResult && (
        <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg text-sm ${
          submitResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {submitResult.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {submitResult.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={!preview || !clientName.trim() || submitting}
        className="w-full bg-amber-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Log Session'}
      </button>
    </form>
  )
}

// ─── My Sessions Tab ──────────────────────────────────────────────
function MySessionsTab({ sessions, loading }: { sessions: StudioSession[]; loading: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) return <div className="text-center py-12 text-gray-500">Loading sessions...</div>
  if (sessions.length === 0) return <div className="text-center py-12 text-gray-500">No sessions yet. Log your first session above!</div>

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{sessions.length} Session{sessions.length !== 1 ? 's' : ''}</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {sessions.map((s) => (
          <div key={s.id}>
            <button
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${s.session_type === 'recording' ? 'bg-amber-100' : 'bg-purple-100'}`}>
                  {s.session_type === 'recording' ? <Music className="h-4 w-4 text-amber-700" /> : <Video className="h-4 w-4 text-purple-700" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.client_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(s.session_date + 'T00:00:00').toLocaleDateString()} &middot;{' '}
                    {s.session_type === 'recording'
                      ? `${STUDIOS[s.studio as StudioId]?.name || s.studio} — ${s.hours}hr${s.is_block ? ' (block)' : ''}`
                      : `${MEDIA_SERVICES.find(m => m.id === s.media_service_type)?.name || s.media_service_type} (${s.media_role})`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status]}`}>
                  {s.status}
                </span>
                <span className="text-sm font-semibold text-green-700">+${Number(s.engineer_payout).toFixed(2)}</span>
                {expandedId === s.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </button>
            {expandedId === s.id && (
              <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-gray-500">Total Charge</p><p className="font-medium">${Number(s.total_charge).toFixed(2)}</p></div>
                <div><p className="text-gray-500">Your Payout</p><p className="font-medium text-green-700">${Number(s.engineer_payout).toFixed(2)}</p></div>
                <div><p className="text-gray-500">Studio Cut</p><p className="font-medium">${Number(s.studio_payout).toFixed(2)}</p></div>
                <div><p className="text-gray-500">Bank Entity</p><p className="font-medium">{BANK_ENTITIES[s.bank_entity as keyof typeof BANK_ENTITIES]}</p></div>
                {s.notes && <div className="col-span-2 md:col-span-4"><p className="text-gray-500">Notes</p><p className="font-medium">{s.notes}</p></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── My Payouts Tab ───────────────────────────────────────────────
function MyPayoutsTab({ sessions, loading }: { sessions: StudioSession[]; loading: boolean }) {
  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  const paid = sessions.filter(s => s.status === 'paid')
  const approved = sessions.filter(s => s.status === 'approved')
  const pending = sessions.filter(s => s.status === 'pending')

  const sum = (arr: StudioSession[]) => arr.reduce((t, s) => t + Number(s.engineer_payout), 0)

  const totalEarned = sum(paid)
  const awaitingPayment = sum(approved)
  const pendingReview = sum(pending)

  // Per-month breakdown of paid sessions
  const monthlyMap = new Map<string, number>()
  paid.forEach(s => {
    const key = s.session_date.slice(0, 7) // YYYY-MM
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(s.engineer_payout))
  })
  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Paid Out</p>
          <p className="text-2xl font-bold text-green-700">${totalEarned.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{paid.length} session{paid.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Approved (Awaiting Pay)</p>
          <p className="text-2xl font-bold text-blue-700">${awaitingPayment.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{approved.length} session{approved.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-amber-700">${pendingReview.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{pending.length} session{pending.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Payouts</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {monthlyBreakdown.map(([month, total]) => (
              <div key={month} className="flex items-center justify-between px-6 py-3">
                <p className="text-sm text-gray-700">
                  {new Date(month + '-01T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm font-semibold text-green-700">${total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-500">No payouts yet. Start logging sessions!</div>
      )}
    </div>
  )
}
