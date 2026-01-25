import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { Alert } from '@/lib/supabase/types'

interface AlertBadgeProps {
  alert: Alert
  onAcknowledge?: (id: string) => void
  compact?: boolean
}

export default function AlertBadge({ alert, onAcknowledge, compact = false }: AlertBadgeProps) {
  const getIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (alert.severity) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getBgColor()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{alert.title}</span>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
          <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
          <p className="mt-2 text-xs text-gray-400">
            {new Date(alert.created_at).toLocaleDateString()}
          </p>
        </div>
        {onAcknowledge && !alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="flex-shrink-0 p-1 hover:bg-white rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

interface AlertListProps {
  alerts: Alert[]
  onAcknowledge?: (id: string) => void
  maxItems?: number
}

export function AlertList({ alerts, onAcknowledge, maxItems = 5 }: AlertListProps) {
  const sortedAlerts = [...alerts]
    .filter((a) => !a.acknowledged)
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    .slice(0, maxItems)

  if (sortedAlerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No active alerts
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedAlerts.map((alert) => (
        <AlertBadge
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  )
}
