import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Lead } from '@/lib/supabase/types'

// Get leads for a client
export async function getLeads(
  clientId: string,
  options?: {
    status?: Lead['status']
    sourceType?: Lead['source_type']
    limit?: number
  }
): Promise<Lead[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  let query = supabase
    .from('leads')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.sourceType) {
    query = query.eq('source_type', options.sourceType)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return data || []
}

// Get lead statistics for a client
export async function getLeadStats(clientId: string): Promise<{
  total: number
  byStatus: Record<Lead['status'], number>
  bySource: Record<Lead['source_type'], number>
  totalValue: number
  conversionRate: number
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('client_id', clientId)

  if (error || !data) {
    return {
      total: 0,
      byStatus: { new: 0, contacted: 0, qualified: 0, quoted: 0, won: 0, lost: 0 },
      bySource: { sweetDreams: 0, organic: 0, referral: 0, unknown: 0 },
      totalValue: 0,
      conversionRate: 0,
    }
  }

  const leads = data as Lead[]
  const byStatus: Record<Lead['status'], number> = { new: 0, contacted: 0, qualified: 0, quoted: 0, won: 0, lost: 0 }
  const bySource: Record<Lead['source_type'], number> = { sweetDreams: 0, organic: 0, referral: 0, unknown: 0 }

  leads.forEach((lead) => {
    byStatus[lead.status] = (byStatus[lead.status] || 0) + 1
    bySource[lead.source_type] = (bySource[lead.source_type] || 0) + 1
  })

  const wonLeads = leads.filter((l) => l.status === 'won')
  const closedLeads = leads.filter((l) => l.status === 'won' || l.status === 'lost')
  const totalValue = wonLeads.reduce((sum, l) => sum + (l.final_value || l.estimated_value || 0), 0)
  const conversionRate = closedLeads.length > 0 ? (wonLeads.length / closedLeads.length) * 100 : 0

  return {
    total: leads.length,
    byStatus,
    bySource,
    totalValue,
    conversionRate,
  }
}

// Create a new lead
export async function createLead(
  leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
): Promise<{ lead: Lead | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    return { lead: null, error: error.message }
  }

  return { lead: data, error: null }
}

// Update a lead
export async function updateLead(
  leadId: string,
  updates: Partial<Lead>
): Promise<{ lead: Lead | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    console.error('Error updating lead:', error)
    return { lead: null, error: error.message }
  }

  return { lead: data, error: null }
}

// Delete a lead
export async function deleteLead(leadId: string): Promise<{ success: boolean; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)

  if (error) {
    console.error('Error deleting lead:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Mark lead as won
export async function markLeadAsWon(
  leadId: string,
  finalValue: number
): Promise<{ lead: Lead | null; error: string | null }> {
  return updateLead(leadId, {
    status: 'won',
    final_value: finalValue,
    won_date: new Date().toISOString().split('T')[0],
  })
}

// Mark lead as lost
export async function markLeadAsLost(
  leadId: string,
  reason: string
): Promise<{ lead: Lead | null; error: string | null }> {
  return updateLead(leadId, {
    status: 'lost',
    lost_reason: reason,
  })
}
