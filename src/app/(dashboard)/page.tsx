'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, DollarSign, AlertCircle, TrendingUp, Plus, RefreshCw } from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import ClientTable from '@/components/dashboard/ClientTable'
import { AlertList } from '@/components/dashboard/AlertBadge'
import { getClientsWithMetrics, getAlerts, acknowledgeAlert, type ClientWithMetrics } from '@/lib/services'
import type { Alert } from '@/lib/supabase/types'

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientWithMetrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const [clientsData, alertsData] = await Promise.all([
        getClientsWithMetrics(),
        getAlerts({ acknowledged: false, limit: 10 }),
      ])
      setClients(clientsData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
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
    const result = await acknowledgeAlert(alertId)
    if (result.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
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
          change={0}
          changeLabel="vs last month"
        />
        <SummaryCard
          title="Total Revenue"
          value={totalRevenue}
          format="currency"
          icon={TrendingUp}
          change={0}
          changeLabel="vs last month"
        />
        <SummaryCard
          title="Avg. Uplift"
          value={avgUplift}
          format="percent"
          icon={TrendingUp}
          change={0}
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
            {clients.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No clients yet. Add your first client to get started.</p>
              </div>
            ) : (
              <ClientTable clients={clients} />
            )}
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
