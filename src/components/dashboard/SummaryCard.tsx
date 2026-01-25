import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  format?: 'currency' | 'number' | 'percent'
}

export default function SummaryCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  format = 'number',
}: SummaryCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (change === undefined) return ''
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="stat-card-title">{title}</p>
        {Icon && (
          <div className="p-2 bg-primary-50 rounded-lg">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
        )}
      </div>
      <p className="stat-card-value">{formatValue(value)}</p>
      {change !== undefined && (
        <div className={`stat-card-change ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-gray-500 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
