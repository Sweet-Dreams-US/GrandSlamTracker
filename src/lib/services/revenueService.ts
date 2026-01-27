import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { MonthlyRevenue, TrailingRevenue, FeeStructure, FeeTier } from '@/lib/supabase/types'

// Get monthly revenue history for a client
export async function getRevenueHistory(
  clientId: string,
  options?: { limit?: number; year?: number }
): Promise<MonthlyRevenue[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  let query = supabase
    .from('monthly_revenue')
    .select('*')
    .eq('client_id', clientId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (options?.year) {
    query = query.eq('year', options.year)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching revenue history:', error)
    return []
  }

  return data || []
}

// Get trailing revenue (for baseline calculation)
export async function getTrailingRevenue(clientId: string, months = 12): Promise<TrailingRevenue[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('trailing_revenue')
    .select('*')
    .eq('client_id', clientId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(months)

  if (error) {
    console.error('Error fetching trailing revenue:', error)
    return []
  }

  return data || []
}

// Calculate baseline from trailing revenue
export function calculateBaseline(trailingRevenue: TrailingRevenue[], method: 'trailing12' | 'trailing6' = 'trailing12'): number {
  const count = method === 'trailing12' ? 12 : 6
  const relevantRevenue = trailingRevenue.slice(0, count)

  if (relevantRevenue.length === 0) return 0

  const total = relevantRevenue.reduce((sum, r) => sum + r.revenue, 0)
  return total / relevantRevenue.length
}

// Save monthly revenue entry
export async function saveMonthlyRevenue(
  revenueData: Omit<MonthlyRevenue, 'id' | 'created_at' | 'updated_at'>
): Promise<{ revenue: MonthlyRevenue | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  // Check if entry already exists for this month
  const { data: existing } = await supabase
    .from('monthly_revenue')
    .select('id')
    .eq('client_id', revenueData.client_id)
    .eq('year', revenueData.year)
    .eq('month', revenueData.month)
    .single()

  let result
  if (existing) {
    // Update existing
    result = await supabase
      .from('monthly_revenue')
      .update({
        ...revenueData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    // Insert new
    result = await supabase
      .from('monthly_revenue')
      .insert(revenueData)
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error saving revenue:', result.error)
    return { revenue: null, error: result.error.message }
  }

  return { revenue: result.data, error: null }
}

// Get fee structure for a client
export async function getFeeStructure(clientId: string): Promise<(FeeStructure & { fee_tiers: FeeTier[] }) | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('fee_structures')
    .select('*, fee_tiers(*)')
    .eq('client_id', clientId)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching fee structure:', error)
    return null
  }

  return data
}

// Save or update fee structure
export async function saveFeeStructure(
  clientId: string,
  structure: Partial<FeeStructure>,
  tiers?: Omit<FeeTier, 'id' | 'fee_structure_id'>[]
): Promise<{ feeStructure: FeeStructure | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  // Check if structure exists
  const { data: existing } = await supabase
    .from('fee_structures')
    .select('id')
    .eq('client_id', clientId)
    .single()

  let feeStructureId: string

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('fee_structures')
      .update({
        ...structure,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return { feeStructure: null, error: error.message }
    }
    feeStructureId = data.id
  } else {
    // Insert
    const { data, error } = await supabase
      .from('fee_structures')
      .insert({
        ...structure,
        client_id: clientId,
      })
      .select()
      .single()

    if (error) {
      return { feeStructure: null, error: error.message }
    }
    feeStructureId = data.id
  }

  // Update tiers if provided
  if (tiers && tiers.length > 0) {
    // Delete existing tiers
    await supabase
      .from('fee_tiers')
      .delete()
      .eq('fee_structure_id', feeStructureId)

    // Insert new tiers
    await supabase
      .from('fee_tiers')
      .insert(tiers.map((tier) => ({
        ...tier,
        fee_structure_id: feeStructureId,
      })))
  }

  // Fetch and return the complete structure
  const { data: result } = await supabase
    .from('fee_structures')
    .select('*, fee_tiers(*)')
    .eq('id', feeStructureId)
    .single()

  return { feeStructure: result, error: null }
}

// Get financial summary for dashboard
export async function getFinancialSummary(options?: { year?: number; month?: number }): Promise<{
  totalRevenue: number
  totalFees: number
  avgUplift: number
  pendingPayments: number
  paidThisMonth: number
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const now = new Date()
  const year = options?.year || now.getFullYear()
  const month = options?.month || now.getMonth() + 1

  const { data, error } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('year', year)
    .eq('month', month)

  if (error || !data) {
    return {
      totalRevenue: 0,
      totalFees: 0,
      avgUplift: 0,
      pendingPayments: 0,
      paidThisMonth: 0,
    }
  }

  const revenues = data as MonthlyRevenue[]
  const totalRevenue = revenues.reduce((sum, r) => sum + r.gross_revenue, 0)
  const totalFees = revenues.reduce((sum, r) => sum + r.calculated_fee, 0)
  const totalBaseline = revenues.reduce((sum, r) => sum + r.calculated_baseline, 0)
  const avgUplift = totalBaseline > 0 ? ((totalRevenue - totalBaseline) / totalBaseline) * 100 : 0
  const pendingPayments = revenues.filter((r) => r.payment_status === 'pending' || r.payment_status === 'invoiced').length
  const paidThisMonth = revenues.filter((r) => r.payment_status === 'paid').reduce((sum, r) => sum + r.calculated_fee, 0)

  return {
    totalRevenue,
    totalFees,
    avgUplift,
    pendingPayments,
    paidThisMonth,
  }
}
