'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Filter, Search, RefreshCw } from 'lucide-react'
import LeadForm from '@/components/forms/LeadForm'
import { getLeads, createLead, updateLead } from '@/lib/services'
import type { Lead } from '@/lib/supabase/types'

// Demo data fallback
const DEMO_LEADS: Lead[] = [
  {
    id: 'demo-1',
    client_id: 'demo-1',
    lead_source_id: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    contact_name: 'Robert Wilson',
    contact_phone: '555-1234',
    contact_email: 'robert@email.com',
    source_type: 'sweetDreams',
    confidence_level: 'confirmed',
    status: 'quoted',
    estimated_value: 8500,
    final_value: null,
    won_date: null,
    lost_reason: null,
    notes: 'Kitchen remodel project',
  },
  {
    id: 'demo-2',
    client_id: 'demo-1',
    lead_source_id: null,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    contact_name: 'Jennifer Adams',
    contact_phone: '555-2345',
    contact_email: 'jennifer@email.com',
    source_type: 'sweetDreams',
    confidence_level: 'likely',
    status: 'new',
    estimated_value: 15000,
    final_value: null,
    won_date: null,
    lost_reason: null,
    notes: 'Full bathroom renovation',
  },
  {
    id: 'demo-3',
    client_id: 'demo-1',
    lead_source_id: null,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    contact_name: 'David Miller',
    contact_phone: '555-3456',
    contact_email: 'david@email.com',
    source_type: 'referral',
    confidence_level: 'confirmed',
    status: 'won',
    estimated_value: 12000,
    final_value: 11500,
    won_date: new Date(Date.now() - 432000000).toISOString().split('T')[0],
    lost_reason: null,
    notes: 'Basement finishing',
  },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'badge-info',
  contacted: 'badge-gray',
  qualified: 'badge-warning',
  quoted: 'badge-warning',
  won: 'badge-success',
  lost: 'badge-danger',
}

const SOURCE_COLORS: Record<string, string> = {
  sweetDreams: 'bg-blue-100 text-blue-800',
  organic: 'bg-green-100 text-green-800',
  referral: 'bg-yellow-100 text-yellow-800',
  unknown: 'bg-gray-100 text-gray-800',
}

export default function LeadsPage() {
  const params = useParams()
  const clientId = params.id as string
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLeads = async () => {
    try {
      const data = await getLeads(clientId)
      if (data.length === 0) {
        setLeads(DEMO_LEADS)
        setUsingDemoData(true)
      } else {
        setLeads(data)
        setUsingDemoData(false)
      }
    } catch (err) {
      console.error('Error loading leads:', err)
      setLeads(DEMO_LEADS)
      setUsingDemoData(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [clientId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadLeads()
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSearch =
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleSubmit = async (data: Partial<Lead>) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (usingDemoData) {
        // Handle demo data locally
        if (editingLead) {
          setLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? { ...l, ...data } : l))
          )
        } else {
          setLeads((prev) => [
            {
              ...data,
              id: `demo-${Date.now()}`,
              client_id: clientId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Lead,
            ...prev,
          ])
        }
      } else {
        // Real database operation
        if (editingLead) {
          const result = await updateLead(editingLead.id, data)
          if (result.error) {
            setError(result.error)
            return
          }
        } else {
          const result = await createLead({
            ...data,
            client_id: clientId,
          } as Omit<Lead, 'id' | 'created_at' | 'updated_at'>)
          if (result.error) {
            setError(result.error)
            return
          }
        }
        // Reload leads after successful save
        await loadLeads()
      }

      setShowForm(false)
      setEditingLead(null)
    } catch (err) {
      console.error('Error saving lead:', err)
      setError('Failed to save lead. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value?: number | null) =>
    value ? `$${value.toLocaleString()}` : '-'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-sm text-gray-500">
              Track leads and conversions
              {usingDemoData && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Demo Data
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingLead(null)
              setShowForm(true)
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Lead Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <LeadForm
              clientId={clientId}
              lead={editingLead || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingLead(null)
              }}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="quoted">Quoted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{leads.length}</p>
          <p className="text-sm text-gray-500">Total Leads</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {leads.filter((l) => l.status === 'won').length}
          </p>
          <p className="text-sm text-gray-500">Won</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {leads.filter((l) => ['new', 'contacted', 'qualified', 'quoted'].includes(l.status)).length}
          </p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">
            {formatCurrency(leads.filter((l) => l.status === 'won').reduce((sum, l) => sum + (l.final_value || 0), 0))}
          </p>
          <p className="text-sm text-gray-500">Won Value</p>
        </div>
      </div>

      {/* Lead Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th className="text-right">Est. Value</th>
                <th className="text-right">Final Value</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div>
                        <p className="font-medium">{lead.contact_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{lead.contact_email}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${SOURCE_COLORS[lead.source_type]}`}>
                        {lead.source_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="text-right">{formatCurrency(lead.estimated_value)}</td>
                    <td className="text-right font-medium text-green-600">
                      {formatCurrency(lead.final_value)}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingLead(lead)
                          setShowForm(true)
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
