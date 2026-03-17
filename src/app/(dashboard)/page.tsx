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
            className="p-2 text-gray-500 hover:text-white hover:bg-[#1A1A1A] rounded-lg disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/clients/new" className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-[#F4C430] text-black hover:bg-[#E5B72B] px-4 py-2 transition-colors">
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
            <div className="p-4 border-b border-[#262626] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">All Clients</h2>
              <Link
                href="/clients"
                className="text-sm text-[#F4C430] hover:text-[#E5B72B]"
              >
                View All
              </Link>
            </div>
            {clients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
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
            <div className="p-4 border-b border-[#262626] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#F4C430]" />
                Alerts
              </h2>
              <Link
                href="/alerts"
                className="text-sm text-[#F4C430] hover:text-[#E5B72B]"
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
