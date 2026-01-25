'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Info, Check, Filter } from 'lucide-react'
import type { Alert } from '@/lib/supabase/types'

// Demo data
const DEMO_ALERTS: (Alert & { clientName: string })[] = [
  {
    id: '1',
    client_id: '2',
    clientName: 'Peak Fitness Center',
    alert_type: 'low_attribution',
    severity: 'warning',
    title: 'Low Attribution Rate',
    message: 'Only 15% of revenue is attributed to Sweet Dreams marketing efforts this month. Consider improving lead source tracking.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: '2024-12-15T10:00:00Z',
  },
  {
    id: '2',
    client_id: '3',
    clientName: 'Smith & Associates Law',
    alert_type: 'trial_ending',
    severity: 'info',
    title: 'Trial Ending Soon',
    message: 'The trial period ends in 7 days. Schedule a review call to discuss conversion to full contract.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: '2024-12-14T09:00:00Z',
  },
  {
    id: '3',
    client_id: '3',
    clientName: 'Smith & Associates Law',
    alert_type: 'low_uplift',
    severity: 'warning',
    title: 'Low Uplift',
    message: 'Current uplift is 4.8%, below the 10% target. Review marketing strategy and campaign performance.',
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by: null,
    created_at: '2024-12-13T14:00:00Z',
  },
  {
    id: '4',
    client_id: '1',
    clientName: 'Acme Remodeling',
    alert_type: 'payment_outstanding',
    severity: 'critical',
    title: 'Payment Outstanding',
    message: 'October payment of $2,250 is 30 days overdue. Follow up immediately.',
    acknowledged: true,
    acknowledged_at: '2024-12-10T11:00:00Z',
    acknowledged_by: 'team',
    created_at: '2024-12-05T08:00:00Z',
  },
  {
    id: '5',
    client_id: '1',
    clientName: 'Acme Remodeling',
    alert_type: 'high_growth',
    severity: 'info',
    title: 'Exceptional Growth',
    message: 'Revenue is up 25% this month. Great job! Consider case study opportunity.',
    acknowledged: true,
    acknowledged_at: '2024-12-08T15:00:00Z',
    acknowledged_by: 'team',
    created_at: '2024-12-01T10:00:00Z',
  },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(DEMO_ALERTS)
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'active' && !alert.acknowledged) ||
      (filter === 'acknowledged' && alert.acknowledged)

    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter

    return matchesStatus && matchesSeverity
  })

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
          : a
      )
    )
  }

  const handleAcknowledgeAll = () => {
    setAlerts((prev) =>
      prev.map((a) =>
        !a.acknowledged
          ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
          : a
      )
    )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="page-header">
          <h1 className="page-title">Alerts</h1>
          <p className="page-description">
            {activeCount} active alerts{criticalCount > 0 && `, ${criticalCount} critical`}
          </p>
        </div>
        {activeCount > 0 && (
          <button onClick={handleAcknowledgeAll} className="btn-secondary">
            <Check className="h-4 w-4 mr-2" />
            Acknowledge All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input w-auto"
            >
              <option value="all">All Alerts</option>
              <option value="active">Active Only</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
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
