'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import RevenueEntryForm from '@/components/forms/RevenueEntryForm'
import { getClientById, getTrailingRevenue, getFeeStructure, saveMonthlyRevenue, getRevenueHistory } from '@/lib/services'
import type { Client, FeeStructure, TrailingRevenue, FeeTier, Json } from '@/lib/supabase/types'

// Demo data fallback
const DEMO_TRAILING_REVENUE = [
  { id: 'demo-1', client_id: 'demo', year: 2024, month: 11, revenue: 68000, created_at: '' },
  { id: 'demo-2', client_id: 'demo', year: 2024, month: 10, revenue: 72000, created_at: '' },
  { id: 'demo-3', client_id: 'demo', year: 2024, month: 9, revenue: 65000, created_at: '' },
  { id: 'demo-4', client_id: 'demo', year: 2024, month: 8, revenue: 70000, created_at: '' },
  { id: 'demo-5', client_id: 'demo', year: 2024, month: 7, revenue: 75000, created_at: '' },
  { id: 'demo-6', client_id: 'demo', year: 2024, month: 6, revenue: 78000, created_at: '' },
  { id: 'demo-7', client_id: 'demo', year: 2024, month: 5, revenue: 71000, created_at: '' },
  { id: 'demo-8', client_id: 'demo', year: 2024, month: 4, revenue: 69000, created_at: '' },
  { id: 'demo-9', client_id: 'demo', year: 2024, month: 3, revenue: 67000, created_at: '' },
  { id: 'demo-10', client_id: 'demo', year: 2024, month: 2, revenue: 64000, created_at: '' },
  { id: 'demo-11', client_id: 'demo', year: 2024, month: 1, revenue: 62000, created_at: '' },
  { id: 'demo-12', client_id: 'demo', year: 2023, month: 12, revenue: 73000, created_at: '' },
]

const DEMO_CLIENT: Client = {
  id: 'demo',
  created_at: '',
  updated_at: '',
  business_name: 'Demo Client',
  display_name: 'Demo',
  status: 'active',
  industry: 'remodeling',
  business_age_years: 5,
  primary_contact_name: null,
  primary_contact_email: null,
  primary_contact_phone: null,
  website_url: null,
  notes: null,
  metricool_brand_id: null,
  metricool_brand_name: null,
}

export default function RevenueEntryPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const currentDate = new Date()

  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingDemoData, setUsingDemoData] = useState(false)

  const [client, setClient] = useState<Client | null>(null)
  const [trailingRevenue, setTrailingRevenue] = useState<TrailingRevenue[]>([])
  const [feeStructure, setFeeStructure] = useState<(FeeStructure & { fee_tiers: FeeTier[] }) | null>(null)
  const [yearToDateFees, setYearToDateFees] = useState(0)

  const loadData = async () => {
    setIsFetching(true)
    try {
      const [clientData, trailingData, feeData, revenueHistory] = await Promise.all([
        getClientById(clientId),
        getTrailingRevenue(clientId, 12),
        getFeeStructure(clientId),
        getRevenueHistory(clientId, { year }),
      ])

      if (clientData) {
        setClient(clientData)
        setTrailingRevenue(trailingData.length > 0 ? trailingData : DEMO_TRAILING_REVENUE)
        setFeeStructure(feeData)

        // Calculate year-to-date fees
        const ytdFees = revenueHistory
          .filter((r) => r.year === year && r.month < month)
          .reduce((sum, r) => sum + r.calculated_fee, 0)
        setYearToDateFees(ytdFees)

        setUsingDemoData(false)
      } else {
        // Fallback to demo data
        setClient(DEMO_CLIENT)
        setTrailingRevenue(DEMO_TRAILING_REVENUE)
        setYearToDateFees(9150)
        setUsingDemoData(true)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setClient(DEMO_CLIENT)
      setTrailingRevenue(DEMO_TRAILING_REVENUE)
      setYearToDateFees(9150)
      setUsingDemoData(true)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [clientId, year])

  const navigateMonth = (direction: -1 | 1) => {
    let newMonth = month + direction
    let newYear = year

    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }

    setMonth(newMonth)
    setYear(newYear)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    setError(null)

    try {
      if (usingDemoData) {
        // Simulate save for demo
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push(`/clients/${params.id}`)
        return
      }

      const result = await saveMonthlyRevenue({
        client_id: clientId,
        year,
        month,
        gross_revenue: data.gross_revenue,
        attributed_revenue: data.attributed_revenue,
        organic_revenue: data.organic_revenue,
        referral_revenue: data.referral_revenue,
        unknown_revenue: data.unknown_revenue,
        calculated_baseline: data.calculated_baseline,
        calculated_uplift: data.calculated_uplift,
        calculated_fee: data.calculated_fee,
        fee_breakdown: data.fee_breakdown,
        verified: data.verified,
        notes: data.notes,
        payment_status: 'pending',
        job_count: data.job_count,
        verification_date: data.verified ? new Date().toISOString() : null,
        verified_by: null,
        payment_date: null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push(`/clients/${params.id}`)
    } catch (err) {
      console.error('Error saving revenue:', err)
      setError('Failed to save revenue entry. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">Client not found</p>
          <Link href="/clients" className="text-primary-600 hover:text-primary-700">
            Back to clients
          </Link>
        </div>
      </div>
    )
  }

  // Convert trailing revenue to the format expected by the form
  const trailingRevenueForForm = trailingRevenue.map((r) => ({
    year: r.year,
    month: r.month,
    revenue: r.revenue,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/clients/${params.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Revenue Entry</h1>
          <p className="text-sm text-gray-500">
            {client.display_name || client.business_name}
            {usingDemoData && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                Demo Data
              </span>
            )}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <RevenueEntryForm
        clientId={clientId}
        year={year}
        month={month}
        industry={client.industry}
        businessAgeYears={client.business_age_years || 1}
        trailingRevenue={trailingRevenueForForm}
        monthlyCap={feeStructure?.monthly_cap || undefined}
        annualCap={feeStructure?.annual_cap || undefined}
        yearToDateFees={yearToDateFees}
        isGrandSlam={client.status !== 'management'}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
