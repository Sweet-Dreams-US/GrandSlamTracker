'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Info, Check, Filter, RefreshCw } from 'lucide-react'
import { getAlerts, acknowledgeAlert, getClientsWithMetrics } from '@/lib/services'
import type { Alert } from '@/lib/supabase/types'

// Extended alert type with client name
interface AlertWithClient extends Alert {
  clientName: string
}

// Demo data fallback
const DEMO_ALERTS: AlertWithClient[] = [
  {
    id: 'demo-1',
    client_id: 'demo-2',
    clientName: 'Peak Fitness Center',
    alert_type: 'low_attribution',
    severity: 'warning',
    title: 'Low Attribution Rate',
    message: 'Only 15% of revenue is attributed to Sweet Dreams marketing efforts this month. Consider improving lead source tracking.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    client_id: 'demo-3',
    clientName: 'Smith & Associates Law',
    alert_type: 'trial_ending',
    severity: 'info',
    title: 'Trial Ending Soon',
    message: 'The trial period ends in 7 days. Schedule a review call to discuss conversion to full contract.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'demo-3',
    client_id: 'demo-3',
    clientName: 'Smith & Associates Law',
    alert_type: 'low_uplift',
    severity: 'warning',
    title: 'Low Uplift',
    message: 'Current uplift is 4.8%, below the 10% target. Review marketing strategy and campaign performance.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'demo-4',
    client_id: 'demo-1',
    clientName: 'Acme Remodeling',
    alert_type: 'payment_outstanding',
    severity: 'critical',
    title: 'Payment Outstanding',
    message: 'October payment of $2,250 is 30 days overdue. Follow up immediately.',
    acknowledged: true,
    acknowledged_at: new Date(Date.now() - 432000000).toISOString(),
    acknowledged_by: 'team',
    created_at: new Date(Date.now() - 864000000).toISOString(),
  },
  {
    id: 'demo-5',
    client_id: 'demo-1',
    clientName: 'Acme Remodeling',
    alert_type: 'high_growth',
    severity: 'info',
    title: 'Exceptional Growth',
    message: 'Revenue is up 25% this month. Great job! Consider case study opportunity.',
    acknowledged: true,
    acknowledged_at: new Date(Date.now() - 604800000).toISOString(),
    acknowledged_by: 'team',
    created_at: new Date(Date.now() - 1209600000).toISOString(),
  },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  const loadData = async () => {
    try {
      const [alertsData, clientsData] = await Promise.all([
        getAlerts(),
        getClientsWithMetrics(),
      ])

      if (alertsData.length === 0) {
        setAlerts(DEMO_ALERTS)
        setUsingDemoData(true)
      } else {
        // Map client names to alerts
        const clientMap = new Map(clientsData.map((c) => [c.id, c.display_name || c.business_name]))
        const alertsWithClients: AlertWithClient[] = alertsData.map((alert) => ({
          ...alert,
          clientName: clientMap.get(alert.client_id) || 'Unknown Client',
        }))
        setAlerts(alertsWithClients)
        setUsingDemoData(false)
      }
    } catch (error) {
      console.error('Error loading alerts:', error)
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

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'active' && !alert.acknowledged) ||
      (filter === 'acknowledged' && alert.acknowledged)

    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter

    return matchesStatus && matchesSeverity
  })

  const handleAcknowledge = async (alertId: string) => {
    if (usingDemoData) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : a
        )
      )
    } else {
      const result = await acknowledgeAlert(alertId)
      if (result.success) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
              : a
          )
        )
      }
    }
  }

  const handleAcknowledgeAll = async () => {
    const activeAlerts = alerts.filter((a) => !a.acknowledged)

    if (usingDemoData) {
      setAlerts((prev) =>
        prev.map((a) =>
          !a.acknowledged
            ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : a
        )
      )
    } else {
      // Acknowledge all in parallel
      await Promise.all(
        activeAlerts.map((alert) => acknowledgeAlert(alert.id))
      )
      setAlerts((prev) =>
        prev.map((a) =>
          !a.acknowledged
            ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : a
        )
      )
    }
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const activeCount = alerts.filter((a) => !a.acknowledged).length
  const criticalCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length

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
          <h1 className="page-title">Alerts</h1>
          <p className="page-description">
            {activeCount} active alerts{criticalCount > 0 && `, ${criticalCount} critical`}
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
          {activeCount > 0 && (
            <button onClick={handleAcknowledgeAll} className="btn-secondary">
              <Check className="h-4 w-4 mr-2" />
              Acknowledge All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'acknowledged')}
              className="input w-auto"
            >
              <option value="all">All Alerts</option>
              <option value="active">Active Only</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | 'critical' | 'warning' | 'info')}
            className="input w-auto"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            No alerts match the current filters
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`card p-4 border ${getBgColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{getIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <Link
                      href={`/clients/${alert.client_id}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {alert.clientName}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>
                      {new Date(alert.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="badge badge-gray">{alert.alert_type.replace('_', ' ')}</span>
                    {alert.acknowledged && (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="btn-secondary btn-sm"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
