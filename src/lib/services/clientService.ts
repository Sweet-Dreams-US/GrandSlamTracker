import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Client, FeeStructure, MonthlyRevenue, Lead, Alert } from '@/lib/supabase/types'

// Extended client type with computed fields for dashboard display
export interface ClientWithMetrics extends Client {
  monthlyRevenue?: number
  baseline?: number
  upliftPercent?: number
  fee?: number
  healthScore?: number
  healthGrade?: 'A' | 'B' | 'C' | 'D' | 'F'
  alertCount?: number
}

// Helper to compute health grade from score
function getHealthGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

// Get all clients with their latest metrics
export async function getClientsWithMetrics(): Promise<ClientWithMetrics[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  // Get all clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .order('business_name')

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
    return []
  }

  if (!clients || clients.length === 0) {
    return []
  }

  // Get current month/year for latest revenue
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Get latest monthly revenue for each client
  const { data: revenues } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('year', currentYear)
    .eq('month', currentMonth)

  // Get alert counts for each client
  const { data: alerts } = await supabase
    .from('alerts')
    .select('client_id')
    .eq('acknowledged', false)

  // Get fee structures
  const { data: feeStructures } = await supabase
    .from('fee_structures')
    .select('*')

  // Map revenue and alerts to clients
  const revenueMap = new Map(revenues?.map((r: MonthlyRevenue) => [r.client_id, r]) || [])
  const alertCounts = new Map<string, number>()
  alerts?.forEach((a: { client_id: string }) => {
    alertCounts.set(a.client_id, (alertCounts.get(a.client_id) || 0) + 1)
  })
  const feeMap = new Map(feeStructures?.map((f: FeeStructure) => [f.client_id, f]) || [])

  return clients.map((client: Client) => {
    const revenue = revenueMap.get(client.id) as MonthlyRevenue | undefined
    const feeStructure = feeMap.get(client.id) as FeeStructure | undefined

    const monthlyRevenue = revenue?.gross_revenue || 0
    const baseline = revenue?.calculated_baseline || feeStructure?.custom_baseline || 0
    const uplift = monthlyRevenue - baseline
    const upliftPercent = baseline > 0 ? (uplift / baseline) * 100 : 0
    const fee = revenue?.calculated_fee || 0

    // Simple health score calculation
    let healthScore = 70 // Base score
    if (client.status === 'active') healthScore += 10
    if (upliftPercent > 10) healthScore += 10
    if (upliftPercent > 20) healthScore += 5
    if (alertCounts.get(client.id) || 0 > 0) healthScore -= 10
    healthScore = Math.min(100, Math.max(0, healthScore))

    return {
      ...client,
      monthlyRevenue,
      baseline,
      upliftPercent,
      fee,
      healthScore,
      healthGrade: getHealthGrade(healthScore),
      alertCount: alertCounts.get(client.id) || 0,
    }
  })
}

// Get single client by ID
export async function getClientById(id: string): Promise<Client | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  return data
}

// Get client with all related data
export async function getClientWithDetails(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const [
    clientResult,
    feeStructureResult,
    revenueResult,
    leadsResult,
    alertsResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('fee_structures').select('*, fee_tiers(*)').eq('client_id', id).single(),
    supabase.from('monthly_revenue').select('*').eq('client_id', id).order('year', { ascending: false }).order('month', { ascending: false }).limit(12),
    supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('alerts').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  return {
    client: clientResult.data as Client | null,
    feeStructure: feeStructureResult.data as (FeeStructure & { fee_tiers: unknown[] }) | null,
    revenueHistory: (revenueResult.data || []) as MonthlyRevenue[],
    leads: (leadsResult.data || []) as Lead[],
    alerts: (alertsResult.data || []) as Alert[],
  }
}

// Create a new client
export async function createClient(clientData: Partial<Client>): Promise<{ client: Client | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    return { client: null, error: error.message }
  }

  return { client: data, error: null }
}

// Update a client
export async function updateClient(id: string, updates: Partial<Client>): Promise<{ client: Client | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating client:', error)
    return { client: null, error: error.message }
  }

  return { client: data, error: null }
}

// Delete a client
export async function deleteClient(id: string): Promise<{ success: boolean; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
