'use client'

import { useState, ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  }

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || (
        <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
      )}
      {isVisible && (
        <span
          className={`absolute z-50 ${positionClasses[position]} w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg`}
        >
          {content}
          <span
            className={`absolute ${arrowClasses[position]} border-4`}
          />
        </span>
      )}
    </span>
  )
}

// Pre-defined tooltips for common terms
export const TOOLTIPS = {
  effectiveRate: 'Total Fees ÷ Total Revenue. Shows what percentage of client revenue Sweet Dreams earns overall.',
  foundationFee: 'Annual minimum fee based on business size. Ensures baseline income regardless of growth.',
  sustainingFee: 'Year 2+ protection. If new baseline would reduce income below last year, this fee makes up the difference.',
  growthFee: 'Performance-based fee on revenue growth above baseline. Higher tiers = lower rates (volume discount).',
  baseline: 'The client\'s average monthly revenue used as the starting point. Growth is measured against this.',
  baselineRetention: 'At year reset, how much growth carries into the new baseline. Higher = higher new baseline, lower future growth fees.',
  industryGrowth: 'Expected annual growth rate for this industry. Used to adjust baseline calculations.',
  uplift: 'Revenue above baseline. This is what Sweet Dreams earns growth fees on.',
  growthTiers: 'Fee rates decrease as growth percentage increases. Rewards high-performing clients with lower marginal rates.',
  grandSlam: 'Special pricing: No Foundation Fee in Year 1. Client only pays growth fees until Year 2.',
  projectionMonths: 'How far into the future to project. Longer periods show baseline resets and compounding effects.',
}
