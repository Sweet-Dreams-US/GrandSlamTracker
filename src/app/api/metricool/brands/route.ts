import { NextResponse } from 'next/server'
import { createMetricoolClient } from '@/lib/integrations/metricool'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metricool/brands
 * Fetch all brands from Metricool account
 */
export async function GET() {
  try {
    const client = createMetricoolClient()
    const brands = await client.getBrands()

    return NextResponse.json({
      success: true,
      brands,
    })
  } catch (error) {
    console.error('Error fetching Metricool brands:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch brands',
      },
      { status: 500 }
    )
  }
}
