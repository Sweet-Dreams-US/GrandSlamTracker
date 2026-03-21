'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Check,
  Circle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Building2,
  Music,
  Briefcase,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/* ── Types ─────────────────────────────────────────────────────── */

interface TeamMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: 'owner' | 'worker' | 'sales' | 'engineer' | 'contractor'
  entity: 'sweet_dreams_us' | 'sweet_dreams_music' | 'both'
  status: 'active' | 'inactive'
  pay_type: '1099_contractor' | 'w2_employee' | 'owner_draw'
  tax_status: 'w9_received' | 'w9_pending' | '1099_filed' | 'k1_filed' | 'none'
  documents_needed: string[]
  documents_received: string[]
  hourly_rate: number | null
  default_split_percent: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

type FormData = {
  name: string
  email: string
  phone: string
  role: string
  entity: string
  status: string
  pay_type: string
  tax_status: string
  documents_needed: string
  documents_received: string
  hourly_rate: string
  default_split_percent: string
  notes: string
}

const emptyForm: FormData = {
  name: '',
  email: '',
  phone: '',
  role: 'worker',
  entity: 'sweet_dreams_us',
  status: 'active',
  pay_type: '1099_contractor',
  tax_status: 'none',
  documents_needed: '',
  documents_received: '',
  hourly_rate: '',
  default_split_percent: '',
  notes: '',
}

/* ── Constants ─────────────────────────────────────────────────── */

const ROLES: Record<string, string> = {
  owner: 'Owner',
  worker: 'Worker',
  sales: 'Sales',
  engineer: 'Engineer',
  contractor: 'Contractor',
}

const ENTITIES: Record<string, string> = {
  sweet_dreams_us: 'Sweet Dreams US',
  sweet_dreams_music: 'Sweet Dreams Music',
  both: 'Both Entities',
}

const PAY_TYPES: Record<string, string> = {
  '1099_contractor': '1099 Contractor',
  w2_employee: 'W-2 Employee',
  owner_draw: 'Owner Draw',
}

const TAX_STATUSES: Record<string, string> = {
  w9_received: 'W-9 Received',
  w9_pending: 'W-9 Pending',
  '1099_filed': '1099 Filed',
  k1_filed: 'K-1 Filed',
  none: 'None',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  worker: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  sales: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  engineer: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  contractor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
}

const ENTITY_ICONS: Record<string, typeof Building2> = {
  sweet_dreams_us: Building2,
  sweet_dreams_music: Music,
  both: Briefcase,
}

/* ── Component ─────────────────────────────────────────────────── */

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Filters
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const loadData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data } = await (supabase.from('team_members') as any)
      .select('*')
      .order('name')
    if (data) setMembers(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  /* ── Filtering ────────────────────────────────────────────── */

  const filtered = members.filter((m) => {
    if (filterEntity !== 'all' && m.entity !== filterEntity) return false
    if (filterRole !== 'all' && m.role !== filterRole) return false
    if (filterStatus !== 'all' && m.status !== filterStatus) return false
    return true
  })

  const groupByEntity = (list: TeamMember[]) => {
    const groups: Record<string, TeamMember[]> = {
      both: [],
      sweet_dreams_us: [],
      sweet_dreams_music: [],
    }
    list.forEach((m) => {
      if (groups[m.entity]) groups[m.entity].push(m)
    })
    return groups
  }

  const grouped = groupByEntity(filtered)

  /* ── Summary stats ────────────────────────────────────────── */

  const totalActive = members.filter((m) => m.status === 'active').length
  const countUS = members.filter(
    (m) => m.entity === 'sweet_dreams_us' || m.entity === 'both'
  ).length
  const countMusic = members.filter(
    (m) => m.entity === 'sweet_dreams_music' || m.entity === 'both'
  ).length
  const pendingW9 = members.filter((m) => m.tax_status === 'w9_pending').length

  /* ── Form helpers ─────────────────────────────────────────── */

  function openAdd() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(m: TeamMember) {
    setForm({
      name: m.name,
      email: m.email || '',
      phone: m.phone || '',
      role: m.role,
      entity: m.entity,
      status: m.status,
      pay_type: m.pay_type,
      tax_status: m.tax_status,
      documents_needed: (m.documents_needed || []).join(', '),
      documents_received: (m.documents_received || []).join(', '),
      hourly_rate: m.hourly_rate != null ? String(m.hourly_rate) : '',
      default_split_percent:
        m.default_split_percent != null ? String(m.default_split_percent) : '',
      notes: m.notes || '',
    })
    setEditingId(m.id)
    setShowModal(true)
  }

  function buildPayload() {
    const parseArr = (s: string) =>
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    return {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
      entity: form.entity,
      status: form.status,
      pay_type: form.pay_type,
      tax_status: form.tax_status,
      documents_needed: parseArr(form.documents_needed),
      documents_received: parseArr(form.documents_received),
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      default_split_percent: form.default_split_percent
        ? Number(form.default_split_percent)
        : null,
      notes: form.notes.trim() || null,
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    const payload = buildPayload()

    if (editingId) {
      await (supabase.from('team_members') as any)
        .update(payload)
        .eq('id', editingId)
    } else {
      await (supabase.from('team_members') as any).insert([payload])
    }

    setShowModal(false)
    setEditingId(null)
    setSaving(false)
    loadData()
  }

  async function handleDelete(id: string) {
    const supabase = createSupabaseBrowserClient()
    await (supabase.from('team_members') as any).delete().eq('id', id)
    setDeleteConfirm(null)
    loadData()
  }

  /* ── Tax status badge ─────────────────────────────────────── */

  function taxBadge(status: string) {
    if (['w9_received', '1099_filed', 'k1_filed'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 size={12} />
          {TAX_STATUSES[status] || status}
        </span>
      )
    }
    if (status === 'w9_pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-500/25">
          <AlertCircle size={12} />
          {TAX_STATUSES[status]}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-500/15 px-2.5 py-0.5 text-xs font-medium text-neutral-400 border border-neutral-500/25">
        {TAX_STATUSES[status] || status}
      </span>
    )
  }

  /* ── Render ───────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/payroll"
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--muted)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Team Management
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Manage team members, roles, and tax documents
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-1">
            <Users size={14} />
            Total Active
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {totalActive}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-1">
            <Building2 size={14} />
            Sweet Dreams US
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {countUS}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-1">
            <Music size={14} />
            Sweet Dreams Music
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {countMusic}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium mb-1">
            <AlertCircle size={14} />
            Pending W-9s
          </div>
          <p className={`text-2xl font-bold ${pendingW9 > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {pendingW9}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Filter size={14} />
          Filters
        </div>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">All Entities</option>
          <option value="sweet_dreams_us">Sweet Dreams US</option>
          <option value="sweet_dreams_music">Sweet Dreams Music</option>
          <option value="both">Both</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(filterEntity !== 'all' || filterRole !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setFilterEntity('all')
              setFilterRole('all')
              setFilterStatus('all')
            }}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grouped Cards */}
      {(['both', 'sweet_dreams_us', 'sweet_dreams_music'] as const).map(
        (entityKey) => {
          const group = grouped[entityKey]
          if (!group || group.length === 0) return null
          const EntityIcon = ENTITY_ICONS[entityKey]
          return (
            <div key={entityKey} className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <EntityIcon size={18} className="text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">
                  {ENTITIES[entityKey]}
                </h2>
                <span className="text-xs text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-2 py-0.5">
                  {group.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((m) => (
                  <div
                    key={m.id}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]/40 transition-colors relative"
                  >
                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      {deleteConfirm === m.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Confirm delete"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] transition-colors"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--muted)] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Name + Role */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] font-bold text-sm shrink-0">
                        {m.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[var(--foreground)] font-semibold truncate">
                          {m.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role] || 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30'}`}
                          >
                            {ROLES[m.role] || m.role}
                          </span>
                          {m.status === 'inactive' && (
                            <span className="inline-block rounded-full bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-xs text-red-400">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Pay Type</span>
                        <span className="text-[var(--foreground)]">
                          {PAY_TYPES[m.pay_type] || m.pay_type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--muted)]">Tax Status</span>
                        {taxBadge(m.tax_status)}
                      </div>
                      {m.hourly_rate != null && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">
                            Hourly Rate
                          </span>
                          <span className="text-[var(--foreground)]">
                            ${Number(m.hourly_rate).toFixed(2)}/hr
                          </span>
                        </div>
                      )}
                      {m.default_split_percent != null && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">
                            Default Split
                          </span>
                          <span className="text-[var(--foreground)]">
                            {Number(m.default_split_percent)}%
                          </span>
                        </div>
                      )}
                      {m.email && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Email</span>
                          <span className="text-[var(--foreground)] truncate ml-2 max-w-[180px]">
                            {m.email}
                          </span>
                        </div>
                      )}
                      {m.phone && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">Phone</span>
                          <span className="text-[var(--foreground)]">
                            {m.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Document tracking */}
                    {((m.documents_needed && m.documents_needed.length > 0) ||
                      (m.documents_received &&
                        m.documents_received.length > 0)) && (
                      <div className="mt-4 pt-3 border-t border-[var(--border)]">
                        <p className="text-xs font-medium text-[var(--muted)] mb-2">
                          Documents
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.documents_needed || []).map((doc) => {
                            const received = (
                              m.documents_received || []
                            ).includes(doc)
                            return (
                              <span
                                key={doc}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
                                  received
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                }`}
                              >
                                {received ? (
                                  <CheckCircle2 size={10} />
                                ) : (
                                  <Circle size={10} />
                                )}
                                {doc}
                              </span>
                            )
                          })}
                          {/* Show received docs not in needed list */}
                          {(m.documents_received || [])
                            .filter(
                              (doc) => !(m.documents_needed || []).includes(doc)
                            )
                            .map((doc) => (
                              <span
                                key={doc}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              >
                                <CheckCircle2 size={10} />
                                {doc}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {m.notes && (
                      <div className="mt-3 pt-2 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--muted)] italic leading-relaxed">
                          {m.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        }
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--muted)]">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No team members found</p>
          <p className="text-sm mt-1">
            {members.length > 0
              ? 'Try adjusting your filters'
              : 'Add your first team member to get started'}
          </p>
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false)
              setEditingId(null)
            }}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="Full name"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Role + Entity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {Object.entries(ROLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Entity
                  </label>
                  <select
                    value={form.entity}
                    onChange={(e) =>
                      setForm({ ...form, entity: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {Object.entries(ENTITIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status + Pay Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Pay Type
                  </label>
                  <select
                    value={form.pay_type}
                    onChange={(e) =>
                      setForm({ ...form, pay_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {Object.entries(PAY_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tax Status */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Tax Status
                </label>
                <select
                  value={form.tax_status}
                  onChange={(e) =>
                    setForm({ ...form, tax_status: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {Object.entries(TAX_STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hourly Rate + Default Split */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={(e) =>
                      setForm({ ...form, hourly_rate: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Default Split (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.default_split_percent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        default_split_percent: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Documents */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Documents Needed{' '}
                  <span className="text-[var(--muted)]/60">
                    (comma-separated)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.documents_needed}
                  onChange={(e) =>
                    setForm({ ...form, documents_needed: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="W-9, Contract, NDA"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Documents Received{' '}
                  <span className="text-[var(--muted)]/60">
                    (comma-separated)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.documents_received}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      documents_received: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="W-9, Contract"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-black/20 text-[var(--foreground)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                  }}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-transparent text-[var(--foreground)] py-2.5 text-sm font-medium hover:bg-[var(--border)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 rounded-xl bg-[var(--accent)] text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Update Member'
                      : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
