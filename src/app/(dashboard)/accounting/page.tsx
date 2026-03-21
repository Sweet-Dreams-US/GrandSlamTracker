'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Music,
  Mic2,
  Film,
  Plus,
  FileText,
  Receipt,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { calculateMediaSplit } from '@/lib/constants/splitStructure'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'revenue' | 'expense'
  stream: string
}

export default function AccountingDashboard() {
  const [loading, setLoading] = useState(true)
  const [mediaProjects, setMediaProjects] = useState<any[]>([])
  const [studioSessions, setStudioSessions] = useState<any[]>([])
  const [beatSales, setBeatSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      const [payoutRes, expRes, invRes, studioApiRes] = await Promise.all([
        (supabase.from('payout_records') as any).select('*').gte('date', monthStart.split('T')[0]).order('date', { ascending: false }),
        (supabase.from('expenses') as any).select('*').gte('date', monthStart),
        (supabase.from('invoices') as any).select('*'),
        fetch(`/api/studio-revenue?start=${encodeURIComponent(monthStart)}&end=${encodeURIComponent(monthEnd)}`).then(r => r.json()).catch(() => ({ sessions: [], studioMediaSales: [] })),
      ])

      if (payoutRes.data) setMediaProjects(payoutRes.data)
      if (studioApiRes.sessions) setStudioSessions(studioApiRes.sessions)
      if (studioApiRes.studioMediaSales) setBeatSales(studioApiRes.studioMediaSales) // Studio media sales (content for music clients)
      if (expRes.data) setExpenses(expRes.data)
      if (invRes.data) setInvoices(invRes.data)
      setLoading(false)
    }
    load()
  }, [])

  // MTD Calculations
  const mediaRevenue = mediaProjects.reduce((s, p) => s + Number(p.total_revenue || 0), 0)
  const studioRevenue = studioSessions.reduce((s, p) => s + Number(p.billed || 0), 0)
  const beatRevenue = beatSales.reduce((s, p) => s + Number(p.amount || p.price || 0), 0)
  const totalRevenue = mediaRevenue + studioRevenue + beatRevenue
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netIncome = totalRevenue - totalExpenses

  // Business fund: business_amount from payout_records + business retention from studio
  const mediaBusinessCut = mediaProjects.reduce((s, p) => s + Number(p.business_amount || 0), 0)
  const businessFund =
    mediaBusinessCut +
    studioSessions.reduce((s, p) => s + Number(p.business_retention || 0), 0) +
    beatSales.reduce((s, p) => s + Number(p.business_retention || 0), 0) -
    totalExpenses

  // Revenue stream max for bar scaling
  const maxStream = Math.max(mediaRevenue, studioRevenue, beatRevenue, 1)

  // Recent transactions across all types
  const allTransactions: Transaction[] = [
    ...mediaProjects.map((p: any) => ({
      id: `m-${p.id}`,
      date: p.date || p.created_at,
      description: `Media: ${p.client_name || 'Project'}`,
      amount: Number(p.total_revenue || 0),
      type: 'revenue' as const,
      stream: 'media',
    })),
    ...studioSessions.map((s: any) => ({
      id: `s-${s.id}`,
      date: s.date,
      description: `Studio: ${s.artist || 'Session'} (${s.type || 'recording'})`,
      amount: Number(s.billed || 0),
      type: 'revenue' as const,
      stream: 'studio',
    })),
    ...beatSales.map((b: any) => ({
      id: `b-${b.id}`,
      date: b.date || b.created_at,
      description: `Media Sale: ${b.client || b.title || 'Untitled'} — ${b.description || ''}`,
      amount: Number(b.amount || b.price || 0),
      type: 'revenue' as const,
      stream: 'beats',
    })),
    ...expenses.map((e: any) => ({
      id: `e-${e.id}`,
      date: e.date,
      description: `${e.vendor || 'Expense'}: ${e.description || e.category || ''}`,
      amount: -Number(e.amount || 0),
      type: 'expense' as const,
      stream: 'expense',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Accounting</h1>
          <p className="page-description">Revenue, expenses, and financial overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/accounting/expenses" className="btn-secondary btn-sm flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Log Expense
          </Link>
          <Link href="/accounting/revenue" className="btn-secondary btn-sm flex items-center gap-1.5">
            <Mic2 className="h-3.5 w-3.5" />
            Log Session
          </Link>
          <Link href="/accounting/revenue" className="btn-secondary btn-sm flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5" />
            Log Beat Sale
          </Link>
          <Link href="/accounting/invoices" className="btn-primary btn-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Total Revenue (MTD)</p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(244, 196, 48, 0.1)' }}>
              <DollarSign className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <p className="stat-card-value">{fmt(totalRevenue)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Total Expenses (MTD)</p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <TrendingDown className="h-5 w-5" style={{ color: 'var(--danger)' }} />
            </div>
          </div>
          <p className="stat-card-value">{fmt(totalExpenses)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Net Income (MTD)</p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: netIncome >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
              <TrendingUp className="h-5 w-5" style={{ color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }} />
            </div>
          </div>
          <p className="stat-card-value" style={{ color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {fmt(netIncome)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="stat-card-title">Business Fund Balance</p>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <Wallet className="h-5 w-5" style={{ color: 'var(--info)' }} />
            </div>
          </div>
          <p className="stat-card-value">{fmt(businessFund)}</p>
        </div>
      </div>

      {/* Revenue by Stream + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue by Stream */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Revenue by Stream</h2>
            <Link href="/accounting/revenue" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Media Projects', value: mediaRevenue, icon: Film, color: 'var(--accent)' },
              { label: 'Studio Sessions', value: studioRevenue, icon: Mic2, color: 'var(--info)' },
              { label: 'Studio Media Sales', value: beatRevenue, icon: Music, color: 'var(--success)' },
            ].map((stream) => (
              <div key={stream.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <stream.icon className="h-4 w-4" style={{ color: stream.color }} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{stream.label}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{fmt(stream.value)}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${maxStream > 0 ? (stream.value / maxStream) * 100 : 0}%`,
                      backgroundColor: stream.color,
                      minWidth: stream.value > 0 ? '4px' : '0px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {totalRevenue > 0 && (
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>Total</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{fmt(totalRevenue)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Recent Transactions</h2>
          </div>
          {allTransactions.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>
              No transactions this month yet.
            </p>
          ) : (
            <div className="space-y-1">
              {allTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          tx.stream === 'media'
                            ? 'var(--accent)'
                            : tx.stream === 'studio'
                            ? 'var(--info)'
                            : tx.stream === 'beats'
                            ? 'var(--success)'
                            : 'var(--danger)',
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{tx.description}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmtDate(tx.date)}</p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-medium flex-shrink-0 ml-4"
                    style={{ color: tx.type === 'revenue' ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {tx.type === 'revenue' ? '+' : ''}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/accounting/revenue', label: 'Revenue Tracking', desc: 'Media, studio, and beat sales', icon: DollarSign },
          { href: '/accounting/invoices', label: 'Invoices', desc: `${invoices.filter((i: any) => i.status === 'sent' || i.status === 'partial').length} outstanding`, icon: FileText },
          { href: '/accounting/expenses', label: 'Expenses', desc: 'Log and categorize spending', icon: Receipt },
        ].map((nav) => (
          <Link
            key={nav.href}
            href={nav.href}
            className="card p-5 flex items-center gap-4 transition-colors group"
            style={{ borderColor: 'var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(244, 196, 48, 0.1)' }}>
              <nav.icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{nav.label}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{nav.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
          </Link>
        ))}
      </div>
    </div>
  )
}
