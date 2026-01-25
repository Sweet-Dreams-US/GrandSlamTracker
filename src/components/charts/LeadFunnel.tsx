'use client'

interface FunnelStage {
  name: string
  count: number
  value: number
}

interface LeadFunnelProps {
  data: {
    new: { count: number; value: number }
    contacted: { count: number; value: number }
    qualified: { count: number; value: number }
    quoted: { count: number; value: number }
    won: { count: number; value: number }
    lost: { count: number; value: number }
  }
}

const STAGE_COLORS = {
  new: 'bg-blue-500',
  contacted: 'bg-blue-400',
  qualified: 'bg-green-400',
  quoted: 'bg-yellow-400',
  won: 'bg-green-500',
  lost: 'bg-red-400',
}

const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
}

export default function LeadFunnel({ data }: LeadFunnelProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  const maxCount = Math.max(...Object.values(data).map((s) => s.count))

  // Active stages (excluding lost for funnel width calculation)
  const activeStages: (keyof typeof data)[] = ['new', 'contacted', 'qualified', 'quoted', 'won']

  return (
    <div className="space-y-6">
      {/* Funnel visualization */}
      <div className="space-y-2">
        {activeStages.map((stage, index) => {
          const stageData = data[stage]
          const width = maxCount > 0 ? (stageData.count / maxCount) * 100 : 0

          return (
            <div key={stage} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-600">
                {STAGE_LABELS[stage]}
              </div>
              <div className="flex-1">
                <div
                  className={`h-8 ${STAGE_COLORS[stage]} rounded-r-lg transition-all duration-300 flex items-center px-3`}
                  style={{ width: `${Math.max(width, 5)}%` }}
                >
                  <span className="text-white text-sm font-medium">
                    {stageData.count}
                  </span>
                </div>
              </div>
              <div className="w-28 text-right text-sm text-gray-600">
                {formatCurrency(stageData.value)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lost leads (separate) */}
      {data.lost.count > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm font-medium text-gray-600">
              {STAGE_LABELS.lost}
            </div>
            <div className="flex-1">
              <div
                className={`h-8 ${STAGE_COLORS.lost} rounded-r-lg transition-all duration-300 flex items-center px-3`}
                style={{
                  width: `${Math.max((data.lost.count / maxCount) * 100, 5)}%`,
                }}
              >
                <span className="text-white text-sm font-medium">
                  {data.lost.count}
                </span>
              </div>
            </div>
            <div className="w-28 text-right text-sm text-gray-600">
              {formatCurrency(data.lost.value)}
            </div>
          </div>
        </div>
      )}

      {/* Conversion metrics */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {data.new.count > 0
              ? ((data.won.count / data.new.count) * 100).toFixed(1)
              : 0}%
          </p>
          <p className="text-sm text-gray-500">Win Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data.won.value)}
          </p>
          <p className="text-sm text-gray-500">Won Value</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              data.new.value + data.contacted.value + data.qualified.value + data.quoted.value
            )}
          </p>
          <p className="text-sm text-gray-500">Pipeline Value</p>
        </div>
      </div>
    </div>
  )
}
