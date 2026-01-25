'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  TrendingUp,
  BarChart3,
  Target,
  DollarSign,
  Activity,
  FileText,
  Settings,
} from 'lucide-react'
import SummaryCard from '@/components/dashboard/SummaryCard'
import RevenueChart from '@/components/charts/RevenueChart'
import SourceBreakdownPie from '@/components/charts/SourceBreakdownPie'
import LeadFunnel from '@/components/charts/LeadFunnel'

// Demo data
const DEMO_CLIENT = {
  id: '1',
  business_name: 'Acme Remodeling',
  display_name: 'Acme',
  status: 'active' as const,
  industry: 'remodeling',
  business_age_years: 5,
  primary_contact_name: 'John Smith',
  primary_contact_email: 'john@acme.com',
  primary_contact_phone: '555-0100',
  website_url: 'https://acme-remodeling.com',
}

const DEMO_REVENUE_DATA = [
  { month: 'Jul', revenue: 72000, baseline: 68000, fee: 600 },
  { month: 'Aug', revenue: 78000, baseline: 70000, fee: 1200 },
  { month: 'Sep', revenue: 82000, baseline: 72000, fee: 1500 },
  { month: 'Oct', revenue: 79000, baseline: 71000, fee: 1200 },
  { month: 'Nov', revenue: 85000, baseline: 70000, fee: 2250 },
  { month: 'Dec', revenue: 88000, baseline: 72000, fee: 2400 },
]

const DEMO_SOURCE_DATA = {
  sweetDreams: 45000,
  organic: 25000,
  referral: 10000,
  unknown: 5000,
}

const DEMO_LEAD_DATA = {
  new: { count: 12, value: 48000 },
  contacted: { count: 8, value: 32000 },
  qualified: { count: 5, value: 25000 },
  quoted: { count: 3, value: 18000 },
  won: { count: 2, value: 15000 },
  lost: { count: 1, value: 5000 },
}

type TabId = 'performance' | 'analytics' | 'leads' | 'financials' | 'activity' | 'settings'

const TABS: { id: TabId; label: string; icon: typeof TrendingUp }[] = [
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Target },
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function ClientDetailPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState<TabId>('performance')
  const client = DEMO_CLIENT

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {client.display_name || client.business_name}
              </h1>
              <span className="badge badge-success">{client.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {client.industry} &bull; {client.business_age_years} years in business
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/clients/${params.id}/revenue`} className="btn-secondary">
            <DollarSign className="h-4 w-4 mr-2" />
            Enter Revenue
          </Link>
          <Link href={`/clients/${params.id}/edit`} className="btn-primary">
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Monthly Revenue"
          value={85000}
          format="currency"
          change={7.1}
        />
        <SummaryCard
          title="Baseline"
          value={70000}
          format="currency"
        />
        <SummaryCard
          title="Uplift"
          value={21.4}
          format="percent"
          change={3.2}
        />
        <SummaryCard
          title="Current Fee"
          value={2250}
          format="currency"
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="card p-6">
                <h3 className="section-title">Revenue vs Baseline</h3>
                <RevenueChart data={DEMO_REVENUE_DATA} showBaseline showFee />
              </div>

              {/* Source Breakdown */}
              <div className="card p-6">
                <h3 className="section-title">Revenue Attribution</h3>
                <SourceBreakdownPie data={DEMO_SOURCE_DATA} />
              </div>
            </div>

            {/* Health Score */}
            <div className="card p-6">
              <h3 className="section-title">Health Score</h3>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-green-600">A</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">85/100</p>
                </div>
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">22</p>
                    <p className="text-xs text-gray-500">Growth</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">18</p>
                    <p className="text-xs text-gray-500">Attribution</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">17</p>
                    <p className="text-xs text-gray-500">Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">18</p>
                    <p className="text-xs text-gray-500">Payment</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">10</p>
                    <p className="text-xs text-gray-500">Activity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="section-title">Lead Pipeline</h3>
              <Link href={`/clients/${params.id}/leads`} className="btn-primary btn-sm">
                Manage Leads
              </Link>
            </div>
            <div className="card p-6">
              <LeadFunnel data={DEMO_LEAD_DATA} />
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="section-title">Fee History</h3>
              <div className="table-container mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Baseline</th>
                      <th className="text-right">Uplift</th>
                      <th className="text-right">Fee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_REVENUE_DATA.slice().reverse().map((row) => (
                      <tr key={row.month}>
                        <td>{row.month} 2024</td>
                        <td className="text-right">${row.revenue.toLocaleString()}</td>
                        <td className="text-right">${row.baseline.toLocaleString()}</td>
                        <td className="text-right text-green-600">
                          ${(row.revenue - row.baseline).toLocaleString()}
                        </td>
                        <td className="text-right font-medium">${row.fee.toLocaleString()}</td>
                        <td><span className="badge badge-success">Paid</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="section-title">Year Summary</h3>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">$484,000</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Uplift</p>
                  <p className="text-2xl font-bold text-green-600">$61,000</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Fees</p>
                  <p className="text-2xl font-bold text-primary-600">$9,150</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Effective Rate</p>
                  <p className="text-2xl font-bold">15%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="section-title">Activity Log</h3>
              <Link href={`/clients/${params.id}/activity`} className="btn-primary btn-sm">
                Log Activity
              </Link>
            </div>
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dec 15, 2024</td>
                      <td>Social Post</td>
                      <td>Holiday campaign posts</td>
                      <td className="text-right">5</td>
                      <td className="text-right">2.0</td>
                    </tr>
                    <tr>
                      <td>Dec 12, 2024</td>
                      <td>Content Creation</td>
                      <td>Blog article: Winter remodeling tips</td>
                      <td className="text-right">1</td>
                      <td className="text-right">3.5</td>
                    </tr>
                    <tr>
                      <td>Dec 10, 2024</td>
                      <td>Meeting</td>
                      <td>Monthly strategy review</td>
                      <td className="text-right">1</td>
                      <td className="text-right">1.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="section-title">Contract Configuration</h3>
              <Link
                href={`/clients/${params.id}/contract`}
                className="btn-secondary mt-4"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Contract
              </Link>
            </div>

            <div className="card p-6">
              <h3 className="section-title">Integrations</h3>
              <Link
                href={`/clients/${params.id}/integrations`}
                className="btn-secondary mt-4"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Integrations
              </Link>
            </div>
          </div>
        )}

        {(activeTab === 'analytics') && (
          <div className="card p-8 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Analytics data will appear here once integrations are connected.</p>
            <Link
              href={`/clients/${params.id}/integrations`}
              className="btn-primary mt-4"
            >
              Connect Integrations
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
