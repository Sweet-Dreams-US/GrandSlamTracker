'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, Calendar, DollarSign, CheckCircle, Clock, Banknote } from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import { calculatePayout } from '@/lib/calculations/payoutCalculator'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { PayoutRecord } from '@/lib/supabase/types'
import { DEAL_TYPES, type DealType } from '@/lib/constants/dealTypes'

type Period = 'month' | 'quarter' | 'year'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

export default function FinancialsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [recentPayouts, setRecentPayouts] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('payout_records') as any)
        .select('*')
        .order('date', { ascending: false })
        .limit(10)
      if (data) setRecentPayouts(data as PayoutRecord[])
      setLoading(false)
    }
    load()
  }, [])

  // Calculate summary stats from real payout records
  const totalRevenue = recentPayouts.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const totalBusiness = recentPayouts.reduce((sum, r) => sum + Number(r.business_amount), 0)
  const totalSales = recentPayouts.reduce((sum, r) => sum + Number(r.sales_amount), 0)
  const totalWorker = recentPayouts.reduce((sum, r) => sum + Number(r.worker_amount), 0)

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
          <Link href="/financials/payouts" className="btn-primary">
            <Banknote className="h-4 w-4 mr-2" />
            Payout Operations
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Revenue"
          value={totalRevenue}
          format="currency"
          icon={DollarSign}
        />
        <SummaryCard
          title="Business Share"
          value={totalBusiness}
          format="currency"
          icon={CheckCircle}
        />
        <SummaryCard
          title="Sales Payouts"
          value={totalSales}
          format="currency"
          icon={Clock}
        />
        <SummaryCard
          title="Worker Payouts"
          value={totalWorker}
          format="currency"
          icon={Calendar}
        />
      </div>

      {/* Recent Payout Records */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold">Recent Payout Records</h3>
          <Link
            href="/financials/payouts"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View All
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : recentPayouts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payout records yet. Go to Payout Operations to create one.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Deal Type</th>
                  <th>Client</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Business</th>
                  <th className="text-right">Sales</th>
                  <th className="text-right">Worker</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{r.date}</td>
                    <td>
                      <span className="badge badge-info text-xs">
                        {DEAL_TYPES[r.deal_type as DealType]?.label ?? r.deal_type}
                      </span>
                    </td>
                    <td>{r.client_name}</td>
                    <td className="text-right font-medium">{fmt(Number(r.total_revenue))}</td>
                    <td className="text-right">{fmt(Number(r.business_amount))}</td>
                    <td className="text-right text-green-700">{fmt(Number(r.sales_amount))}</td>
                    <td className="text-right text-blue-700">{fmt(Number(r.worker_amount))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="font-medium">Total</td>
                  <td className="text-right font-bold">{fmt(totalRevenue)}</td>
                  <td className="text-right font-medium">{fmt(totalBusiness)}</td>
                  <td className="text-right font-medium text-green-700">{fmt(totalSales)}</td>
                  <td className="text-right font-medium text-blue-700">{fmt(totalWorker)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
