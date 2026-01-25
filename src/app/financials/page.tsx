'use client'

import { useState } from 'react'
import { Download, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import { calculatePayout } from '@/lib/calculations/payoutCalculator'

// Demo data
const DEMO_FEE_DATA = [
  {
    clientId: '1',
    clientName: 'Acme Remodeling',
    month: 'December 2024',
    fee: 2250,
    status: 'pending' as const,
    paymentDate: null,
  },
  {
    clientId: '2',
    clientName: 'Peak Fitness Center',
    month: 'December 2024',
    fee: 1050,
    status: 'pending' as const,
    paymentDate: null,
  },
  {
    clientId: '3',
    clientName: 'Smith & Associates Law',
    month: 'December 2024',
    fee: 480,
    status: 'invoiced' as const,
    paymentDate: null,
  },
  {
    clientId: '1',
    clientName: 'Acme Remodeling',
    month: 'November 2024',
    fee: 2100,
    status: 'paid' as const,
    paymentDate: '2024-12-05',
  },
  {
    clientId: '2',
    clientName: 'Peak Fitness Center',
    month: 'November 2024',
    fee: 980,
    status: 'paid' as const,
    paymentDate: '2024-12-03',
  },
]

type Period = 'month' | 'quarter' | 'year'

export default function FinancialsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [feeData, setFeeData] = useState(DEMO_FEE_DATA)
  const [selectedFees, setSelectedFees] = useState<string[]>([])

  // Calculate totals
  const feesOwed = feeData
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + f.fee, 0)
  const feesCollected = feeData
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.fee, 0)
  const feesPending = feeData
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.fee, 0)
  const collectionRate = feesOwed + feesCollected > 0
    ? (feesCollected / (feesOwed + feesCollected)) * 100
    : 0

  // Calculate payouts for selected fees
  const selectedTotal = feeData
    .filter((f) => selectedFees.includes(`${f.clientId}-${f.month}`))
    .reduce((sum, f) => sum + f.fee, 0)
  const payoutBreakdown = calculatePayout(selectedTotal)

  const handleMarkPaid = (clientId: string, month: string) => {
    setFeeData((prev) =>
      prev.map((f) =>
        f.clientId === clientId && f.month === month
          ? { ...f, status: 'paid' as const, paymentDate: new Date().toISOString().split('T')[0] }
          : f
      )
    )
  }

  const toggleFeeSelection = (clientId: string, month: string) => {
    const key = `${clientId}-${month}`
    setSelectedFees((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'badge-warning',
      invoiced: 'badge-info',
      paid: 'badge-success',
      overdue: 'badge-danger',
    }
    return styles[status] || 'badge-gray'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="page-header">
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-description">
            Track fees, payments, and internal payouts
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="input w-auto"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Fees Owed"
          value={feesOwed}
          format="currency"
          icon={DollarSign}
        />
        <SummaryCard
          title="Collected"
          value={feesCollected}
          format="currency"
          icon={CheckCircle}
        />
        <SummaryCard
          title="Pending"
          value={feesPending}
          format="currency"
          icon={Clock}
        />
        <SummaryCard
          title="Collection Rate"
          value={collectionRate}
          format="percent"
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Table */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Client Fees</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFees(
                              feeData.map((f) => `${f.clientId}-${f.month}`)
                            )
                          } else {
                            setSelectedFees([])
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                    <th>Client</th>
                    <th>Period</th>
                    <th className="text-right">Fee</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.map((fee) => (
                    <tr key={`${fee.clientId}-${fee.month}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedFees.includes(`${fee.clientId}-${fee.month}`)}
                          onChange={() => toggleFeeSelection(fee.clientId, fee.month)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="font-medium">{fee.clientName}</td>
                      <td className="text-gray-500">{fee.month}</td>
                      <td className="text-right font-medium">{formatCurrency(fee.fee)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(fee.status)}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td>
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(fee.clientId, fee.month)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="font-medium">Total</td>
                    <td className="text-right font-bold">
                      {formatCurrency(feeData.reduce((sum, f) => sum + f.fee, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Payout Calculator */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Payout Calculator</h3>

            {selectedFees.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Select fees from the table to calculate payouts
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Selected Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedTotal)}</p>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Business ({payoutBreakdown.breakdown.businessPercentage}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(payoutBreakdown.businessAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Sales ({payoutBreakdown.breakdown.salesPercentage}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(payoutBreakdown.salesAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Worker ({payoutBreakdown.breakdown.workerPercentage}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(payoutBreakdown.workerAmount)}
                    </span>
                  </div>
                </div>

                <button className="btn-primary w-full">
                  Record Payout
                </button>
              </div>
            )}
          </div>

          {/* Recent Payouts */}
          <div className="card p-6 mt-6">
            <h3 className="font-semibold mb-4">Recent Payouts</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dec 1, 2024</span>
                <span className="font-medium">$2,856</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nov 1, 2024</span>
                <span className="font-medium">$2,640</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Oct 1, 2024</span>
                <span className="font-medium">$2,380</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
