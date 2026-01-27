'use client'

import Link from 'next/link'
import { MoreHorizontal, AlertCircle, ChevronRight } from 'lucide-react'
import type { Client } from '@/lib/supabase/types'

interface ClientTableData extends Client {
  monthlyRevenue?: number
  baseline?: number
  upliftPercent?: number
  fee?: number
  healthScore?: number
  healthGrade?: 'A' | 'B' | 'C' | 'D' | 'F'
  alertCount?: number
}

interface ClientTableProps {
  clients: ClientTableData[]
}

export default function ClientTable({ clients }: ClientTableProps) {
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      prospect: 'badge-gray',
      negotiation: 'badge-yellow',
      trial: 'badge-info',
      active: 'badge-success',
      paused: 'badge-warning',
      terminated: 'badge-danger',
      management: 'badge-purple',
    }
    return styles[status] || 'badge-gray'
  }

  const getHealthBadge = (grade?: string) => {
    if (!grade) return null
    const styles: Record<string, string> = {
      A: 'health-a',
      B: 'health-b',
      C: 'health-c',
      D: 'health-d',
      F: 'health-f',
    }
    return (
      <span className={`badge ${styles[grade] || ''}`}>
        {grade}
      </span>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Status</th>
            <th className="text-right">Revenue</th>
            <th className="text-right">Baseline</th>
            <th className="text-right">Uplift</th>
            <th className="text-right">Fee</th>
            <th className="text-center">Health</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-500">
                No clients found
              </td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">
                        {client.display_name || client.business_name}
                      </div>
                      <div className="text-sm text-gray-500">{client.industry}</div>
                    </div>
                    {client.alertCount && client.alertCount > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">{client.alertCount}</span>
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(client.status)}`}>
                    {client.status}
                  </span>
                </td>
                <td className="text-right font-medium">
                  {formatCurrency(client.monthlyRevenue)}
                </td>
                <td className="text-right text-gray-500">
                  {formatCurrency(client.baseline)}
                </td>
                <td className="text-right">
                  {client.upliftPercent !== undefined ? (
                    <span className={client.upliftPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {client.upliftPercent >= 0 ? '+' : ''}{client.upliftPercent.toFixed(1)}%
                    </span>
                  ) : '-'}
                </td>
                <td className="text-right font-medium text-primary-600">
                  {formatCurrency(client.fee)}
                </td>
                <td className="text-center">
                  {getHealthBadge(client.healthGrade)}
                </td>
                <td>
                  <Link
                    href={`/clients/${client.id}`}
                    className="p-2 hover:bg-gray-100 rounded inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    View
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
