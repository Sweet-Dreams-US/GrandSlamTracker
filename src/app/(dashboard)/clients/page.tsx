'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, RefreshCw, Users } from 'lucide-react'
import ClientTable from '@/components/dashboard/ClientTable'
import { getClientsWithMetrics, type ClientWithMetrics } from '@/lib/services'

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clients, setClients] = useState<ClientWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadClients = async () => {
    try {
      const data = await getClientsWithMetrics()
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadClients()
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
      <div className="flex justify-between items-center">
        <div className="page-header">
          <h1 className="page-title">Clients</h1>
          <p className="page-description">
            Manage your client portfolio
          </p>
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
          <Link href="/clients/new" className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="prospect">Prospect</option>
              <option value="negotiation">Negotiation</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="terminated">Terminated</option>
              <option value="management">Management</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredClients.length} of {clients.length} clients
      </p>

      {/* Client Table */}
      <div className="card">
        {clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No clients yet. Add your first client to get started.</p>
          </div>
        ) : (
          <ClientTable clients={filteredClients} />
        )}
      </div>
    </div>
  )
}
