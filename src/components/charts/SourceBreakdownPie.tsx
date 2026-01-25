'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface SourceData {
  name: string
  value: number
  color: string
}

interface SourceBreakdownPieProps {
  data: {
    sweetDreams: number
    organic: number
    referral: number
    unknown: number
  }
}

const COLORS = {
  sweetDreams: '#0ea5e9',
  organic: '#22c55e',
  referral: '#f59e0b',
  unknown: '#9ca3af',
}

const LABELS = {
  sweetDreams: 'Sweet Dreams',
  organic: 'Organic',
  referral: 'Referral',
  unknown: 'Unknown',
}

export default function SourceBreakdownPie({ data }: SourceBreakdownPieProps) {
  const chartData: SourceData[] = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key as keyof typeof LABELS],
      value,
      color: COLORS[key as keyof typeof COLORS],
    }))

  const total = Object.values(data).reduce((sum, val) => sum + val, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  const formatPercent = (value: number) =>
    total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%'

  if (total === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-gray-500">
        No revenue data available
      </div>
    )
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              `${formatCurrency(Number(value))} (${formatPercent(Number(value))})`,
              '',
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
