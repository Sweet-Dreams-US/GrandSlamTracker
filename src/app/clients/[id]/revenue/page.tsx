'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import RevenueEntryForm from '@/components/forms/RevenueEntryForm'

// Demo data
const DEMO_TRAILING_REVENUE = [
  { year: 2024, month: 11, revenue: 68000 },
  { year: 2024, month: 10, revenue: 72000 },
  { year: 2024, month: 9, revenue: 65000 },
  { year: 2024, month: 8, revenue: 70000 },
  { year: 2024, month: 7, revenue: 75000 },
  { year: 2024, month: 6, revenue: 78000 },
  { year: 2024, month: 5, revenue: 71000 },
  { year: 2024, month: 4, revenue: 69000 },
  { year: 2024, month: 3, revenue: 67000 },
  { year: 2024, month: 2, revenue: 64000 },
  { year: 2024, month: 1, revenue: 62000 },
  { year: 2023, month: 12, revenue: 73000 },
]

export default function RevenueEntryPage() {
  const params = useParams()
  const router = useRouter()
  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      // TODO: Save to Supabase
      console.log('Saving revenue entry:', { clientId: params.id, year, month, ...data })
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push(`/clients/${params.id}`)
    } finally {
      setIsLoading(false)
    }
  }

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
          <p className="text-sm text-gray-500">Enter monthly revenue data</p>
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

      {/* Form - now uses automatic tier rates based on baseline */}
      <RevenueEntryForm
        clientId={params.id as string}
        year={year}
        month={month}
        industry="remodeling"
        businessAgeYears={5}
        trailingRevenue={DEMO_TRAILING_REVENUE}
        monthlyCap={3000}
        annualCap={30000}
        yearToDateFees={9150}
        isGrandSlam={true}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
