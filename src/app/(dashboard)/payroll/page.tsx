'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  Users,
  Wallet,
  Briefcase,
  ArrowRight,
  CalendarDays,
  CreditCard,
  PiggyBank,
  Clock,
} from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n)
}

interface ContractorPayment {
  id: string
  contractor_id: string
  date: string
  type: string
  revenue_source: string
  amount: number
  notes: string
  contractors?: { name: string }
}

interface OwnerPayment {
  id: string
  partner_name: string
  date: string
  category: string
  hours: number
  rate: number
  amount: number
}

interface Contractor {
  id: string
  name: string
  type: string
  status: string
}

export default function PayrollDashboard() {
  const [contractorPayments, setContractorPayments] = useState<ContractorPayment[]>([])
  const [ownerPayments, setOwnerPayments] = useState<OwnerPayment[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const [cpRes, opRes, cRes] = await Promise.all([
        (supabase.from('contractor_payments') as any)
          .select('*, contractors(name)')
          .gte('date', monthStart)
          .order('date', { ascending: false }),
        (supabase.from('owner_payments') as any)
          .select('*')
          .gte('date', monthStart)
          .order('date', { ascending: false }),
        (supabase.from('contractors') as any)
          .select('*'),
      ])

      if (cpRes.data) setContractorPayments(cpRes.data)
      if (opRes.data) setOwnerPayments(opRes.data)
      if (cRes.data) setContractors(cRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const totalContractorMTD = contractorPayments.reduce((s, p) => s + Number(p.amount), 0)
  const totalOwnerMTD = ownerPayments.reduce((s, p) => s + Number(p.amount), 0)
  const totalPayoutsMTD = totalContractorMTD + totalOwnerMTD
  const activeContractors = contractors.filter((c) => c.status === 'active').length

  const recentPayouts = [
    ...contractorPayments.slice(0, 5).map((p) => ({
      id: p.id,
      date: p.date,
      recipient: p.contractors?.name ?? 'Contractor',
      type: 'contractor' as const,
      amount: Number(p.amount),
      label: p.type,
    })),
    ...ownerPayments.slice(0, 5).map((p) => ({
      id: p.id,
      date: p.date,
      recipient: p.partner_name,
      type: 'owner' as const,
      amount: Number(p.amount),
      label: p.category,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  const quickLinks = [
    { href: '/payroll/contractors', label: 'Manage Contractors', icon: Users, description: 'Roster, W-9s, agreements' },
    { href: '/payroll/payments', label: 'Contractor Payments', icon: CreditCard, description: 'Log and track payments' },
    { href: '/payroll/owner-draws', label: 'Owner Draws', icon: PiggyBank, description: 'Guaranteed payments for Jay & Cole' },
    { href: '/payroll/payout-periods', label: 'Payout Periods', icon: Clock, description: 'Biweekly payout summaries' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Payroll Dashboard</h1>
        <p className="page-description">
          Contractor payments, owner draws, and payout period tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Payouts (MTD)"
          value={totalPayoutsMTD}
          format="currency"
          icon={DollarSign}
        />
        <SummaryCard
          title="Contractor Payments (MTD)"
          value={totalContractorMTD}
          format="currency"
          icon={Wallet}
        />
        <SummaryCard
          title="Owner Draws (MTD)"
          value={totalOwnerMTD}
          format="currency"
          icon={Briefcase}
        />
        <SummaryCard
          title="Active Contractors"
          value={activeContractors}
          format="number"
          icon={Users}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card p-5 hover:border-[#F4C430]/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#F4C430]/10 rounded-lg">
                <link.icon className="h-5 w-5 text-[#F4C430]" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-[#F4C430] transition-colors" />
            </div>
            <h3 className="mt-3 font-semibold text-white text-sm">{link.label}</h3>
            <p className="mt-1 text-xs text-gray-500">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Payouts */}
      <div className="card">
        <div className="p-4 border-b border-[#262626] flex justify-between items-center">
          <h3 className="font-semibold text-white">Recent Payouts (This Month)</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : recentPayouts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payouts recorded this month.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Recipient</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{p.date}</td>
                    <td className="font-medium text-white">{p.recipient}</td>
                    <td>
                      <span
                        className={`badge text-xs ${
                          p.type === 'owner' ? 'badge-warning' : 'badge-info'
                        }`}
                      >
                        {p.type === 'owner' ? 'Owner Draw' : 'Contractor'}
                      </span>
                    </td>
                    <td className="text-gray-400 capitalize">{p.label.replace(/_/g, ' ')}</td>
                    <td className="text-right font-medium text-white">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
