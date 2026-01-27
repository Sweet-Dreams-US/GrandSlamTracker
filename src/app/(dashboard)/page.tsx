'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, DollarSign, AlertCircle, TrendingUp, Plus, RefreshCw } from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import ClientTable from '@/components/dashboard/ClientTable'
import { AlertList } from '@/components/dashboard/AlertBadge'
import { getClientsWithMetrics, getAlerts, acknowledgeAlert, type ClientWithMetrics } from '@/lib/services'
import type { Alert } from '@/lib/supabase/types'

// Demo data fallback when database is empty
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
    healthScore: 85,
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
    healthScore: 72,
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
    healthScore: 65,
    healthGrade: 'C',
    alertCount: 2,
  },
]

const DEMO_ALERTS: Alert[] = [
  {
    id: 'demo-alert-1',
    client_id: 'demo-2',
    alert_type: 'low_attribution',
    severity: 'warning',
    title: 'Low Attribution Rate',
    message: 'Peak Fitness has only 15% Sweet Dreams attribution this month.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-alert-2',
    client_id: 'demo-3',
    alert_type: 'trial_ending',
    severity: 'info',
    title: 'Trial Ending Soon',
    message: 'S&A Law trial period ends in 7 days.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-alert-3',
    client_id: 'demo-3',
    alert_type: 'low_uplift',
    severity: 'warning',
    title: 'Low Uplift',
    message: 'S&A Law uplift is below 10% target.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: new Date().toISOString(),
  },
]

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientWithMetrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)

  const loadData = async () => {
    try {
      const [clientsData, alertsData] = await Promise.all([
        getClientsWithMetrics(),
        getAlerts({ acknowledged: false, limit: 10 }),
      ])

      // Use demo data if database is empty
      if (clientsData.length === 0) {
        setClients(DEMO_CLIENTS)
        setAlerts(DEMO_ALERTS)
        setUsingDemoData(true)
      } else {
        setClients(clientsData)
        setAlerts(alertsData)
        setUsingDemoData(false)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Fallback to demo data on error
      setClients(DEMO_CLIENTS)
      setAlerts(DEMO_ALERTS)
      setUsingDemoData(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Calculate summary stats
  const activeClients = clients.filter((c) => c.status === 'active' || c.status === 'trial')
  const totalProjectedFees = clients.reduce((sum, c) => sum + (c.fee || 0), 0)
  const totalRevenue = clients.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0)
  const avgUplift = clients.length > 0
    ? clients.reduce((sum, c) => sum + (c.upliftPercent || 0), 0) / clients.length
    : 0

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (usingDemoData) {
      // Handle demo data locally
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : a
        )
      )
    } else {
      // Real database update
      const result = await acknowledgeAlert(alertId)
      if (result.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="page-header">
          <h1 className="page-title">Portfolio Dashboard</h1>
          <p className="page-description">
            Overview of client performance and revenue
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Active Clients"
          value={activeClients.length}
          icon={Users}
          change={0}
          changeLabel="vs last month"
        />
        <SummaryCard
          title="Projected Fees"
          value={totalProjectedFees}
          format="currency"
          icon={DollarSign}
          change={12.5}
          changeLabel="vs last month"
        />
        <SummaryCard
          title="Total Revenue"
          value={totalRevenue}
          format="currency"
          icon={TrendingUp}
          change={8.3}
          changeLabel="vs last month"
        />
        <SummaryCard
          title="Avg. Uplift"
          value={avgUplift}
          format="percent"
          icon={TrendingUp}
          change={2.1}
          changeLabel="vs last month"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Table */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Clients</h2>
              <Link
                href="/clients"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <ClientTable clients={clients} />
          </div>
        </div>

        {/* Alerts */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Alerts
              </h2>
              <Link
                href="/alerts"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="p-4">
              <AlertList
                alerts={alerts}
                onAcknowledge={handleAcknowledgeAlert}
                maxItems={5}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
