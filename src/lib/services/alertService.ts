import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Alert } from '@/lib/supabase/types'

// Get all alerts, optionally filtered
export async function getAlerts(options?: {
  clientId?: string
  acknowledged?: boolean
  severity?: 'info' | 'warning' | 'critical'
  limit?: number
}): Promise<Alert[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.clientId) {
    query = query.eq('client_id', options.clientId)
  }

  if (options?.acknowledged !== undefined) {
    query = query.eq('acknowledged', options.acknowledged)
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return data || []
}

// Acknowledge an alert
export async function acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<{ success: boolean; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { error } = await supabase
    .from('alerts')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy || null,
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error acknowledging alert:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Create a new alert
export async function createAlert(alertData: {
  client_id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
}): Promise<{ alert: Alert | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('alerts')
    .insert(alertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating alert:', error)
    return { alert: null, error: error.message }
  }

  return { alert: data, error: null }
}

// Delete an alert
export async function deleteAlert(alertId: string): Promise<{ success: boolean; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)

  if (error) {
    console.error('Error deleting alert:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Get alert counts by severity
export async function getAlertSummary(): Promise<{
  total: number
  critical: number
  warning: number
  info: number
  unacknowledged: number
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseBrowserClient() as any

  const { data, error } = await supabase
    .from('alerts')
    .select('severity, acknowledged')

  if (error || !data) {
    return { total: 0, critical: 0, warning: 0, info: 0, unacknowledged: 0 }
  }

  return {
    total: data.length,
    critical: data.filter((a: Alert) => a.severity === 'critical').length,
    warning: data.filter((a: Alert) => a.severity === 'warning').length,
    info: data.filter((a: Alert) => a.severity === 'info').length,
    unacknowledged: data.filter((a: Alert) => !a.acknowledged).length,
  }
}
