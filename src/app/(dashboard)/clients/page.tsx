'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import ClientTable from '@/components/dashboard/ClientTable'

// Demo data
const DEMO_CLIENTS = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Acme Remodeling',
    display_name: 'Acme',
    status: 'active' as const,
    industry: 'remodeling',
    business_age_years: 5,
    primary_contact_name: 'John Smith',
    primary_contact_email: 'john@acme.com',
    primary_contact_phone: '555-0100',
    website_url: 'https://acme-remodeling.com',
    notes: null,
    monthlyRevenue: 85000,
    baseline: 70000,
    upliftPercent: 21.4,
    fee: 2250,
    healthGrade: 'A' as const,
    alertCount: 0,
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Peak Fitness Center',
    display_name: 'Peak Fitness',
    status: 'active' as const,
    industry: 'fitness',
    business_age_years: 3,
    primary_contact_name: 'Sarah Johnson',
    primary_contact_email: 'sarah@peakfitness.com',
    primary_contact_phone: '555-0200',
    website_url: 'https://peakfitness.com',
    notes: null,
    monthlyRevenue: 42000,
    baseline: 35000,
    upliftPercent: 20.0,
    fee: 1050,
    healthGrade: 'B' as const,
    alertCount: 1,
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Smith & Associates Law',
    display_name: 'S&A Law',
    status: 'trial' as const,
    industry: 'legal',
    business_age_years: 12,
    primary_contact_name: 'Michael Smith',
    primary_contact_email: 'mike@salaw.com',
    primary_contact_phone: '555-0300',
    website_url: 'https://salaw.com',
    notes: null,
    monthlyRevenue: 65000,
    baseline: 62000,
    upliftPercent: 4.8,
    fee: 480,
    healthGrade: 'C' as const,
    alertCount: 2,
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: 'Coastal HVAC Services',
    display_name: 'Coastal HVAC',
    status: 'paused' as const,
    industry: 'hvac',
    business_age_years: 8,
    primary_contact_name: 'David Lee',
    primary_contact_email: 'david@coastalhvac.com',
    primary_contact_phone: '555-0400',
    website_url: 'https://coastalhvac.com',
    notes: null,
    monthlyRevenue: 0,
    baseline: 55000,
    upliftPercent: 0,
    fee: 0,
    healthGrade: 'D' as const,
    alertCount: 0,
  },
]

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clients] = useState(DEMO_CLIENTS)

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
        <Link href="/clients/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Link>
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
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="terminated">Terminated</option>
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
