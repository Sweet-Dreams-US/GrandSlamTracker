'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, RefreshCw } from 'lucide-react'
import ClientTable from '@/components/dashboard/ClientTable'
import { getClientsWithMetrics, type ClientWithMetrics } from '@/lib/services'

// Demo data fallback
const DEMO_CLIENTS: ClientWithMetrics[] = [
  {
    id: 'demo-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Acme Remodeling',
    display_name: 'Acme',
    status: 'active',
    industry: 'remodeling',
    business_age_years: 5,
    primary_contact_name: 'John Smith',
    primary_contact_email: 'john@acme.com',
    primary_contact_phone: '555-0100',
    website_url: 'https://acme-remodeling.com',
    notes: null,
    metricool_brand_id: null,
    metricool_brand_name: null,
    monthlyRevenue: 85000,
    baseline: 70000,
    upliftPercent: 21.4,
    fee: 2250,
    healthGrade: 'A',
    alertCount: 0,
  },
  {
    id: 'demo-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Peak Fitness Center',
    display_name: 'Peak Fitness',
    status: 'active',
    industry: 'fitness',
    business_age_years: 3,
    primary_contact_name: 'Sarah Johnson',
    primary_contact_email: 'sarah@peakfitness.com',
    primary_contact_phone: '555-0200',
    website_url: 'https://peakfitness.com',
    notes: null,
    metricool_brand_id: null,
    metricool_brand_name: null,
    monthlyRevenue: 42000,
    baseline: 35000,
    upliftPercent: 20.0,
    fee: 1050,
    healthGrade: 'B',
    alertCount: 1,
  },
  {
    id: 'demo-3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Smith & Associates Law',
    display_name: 'S&A Law',
    status: 'trial',
    industry: 'legal',
    business_age_years: 12,
    primary_contact_name: 'Michael Smith',
    primary_contact_email: 'mike@salaw.com',
    primary_contact_phone: '555-0300',
    website_url: 'https://salaw.com',
    notes: null,
    metricool_brand_id: null,
    metricool_brand_name: null,
    monthlyRevenue: 65000,
    baseline: 62000,
    upliftPercent: 4.8,
    fee: 480,
    healthGrade: 'C',
    alertCount: 2,
  },
  {
    id: 'demo-4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Coastal HVAC Services',
    display_name: 'Coastal HVAC',
    status: 'paused',
    industry: 'hvac',
    business_age_years: 8,
    primary_contact_name: 'David Lee',
    primary_contact_email: 'david@coastalhvac.com',
    primary_contact_phone: '555-0400',
    website_url: 'https://coastalhvac.com',
    notes: null,
    metricool_brand_id: null,
    metricool_brand_name: null,
    monthlyRevenue: 0,
    baseline: 55000,
    upliftPercent: 0,
    fee: 0,
    healthGrade: 'D',
    alertCount: 0,
  },
]

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clients, setClients] = useState<ClientWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)

  const loadClients = async () => {
    try {
      const data = await getClientsWithMetrics()
      if (data.length === 0) {
        setClients(DEMO_CLIENTS)
        setUsingDemoData(true)
      } else {
        setClients(data)
        setUsingDemoData(false)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients(DEMO_CLIENTS)
      setUsingDemoData(true)
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
            {usingDemoData && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                Demo Data
              </span>
            )}
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
        <ClientTable clients={filteredClients} />
      </div>
    </div>
  )
}
