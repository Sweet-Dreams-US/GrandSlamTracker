/**
 * MC Racing Service Layer
 * CRUD operations for revenue entries and monthly expenses
 *
 * Note: revenue_entries and monthly_expenses are new tables not yet deployed.
 * We use untyped Supabase calls with explicit return types until the DB schema
 * is deployed and types are regenerated.
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { RevenueEntry, RevenueEntryUpdate, MonthlyExpense, MonthlyExpenseUpdate } from '@/lib/supabase/types'
import { DEFAULT_MONTHLY_EXPENSES } from '@/lib/constants/mcRacingPricing'

const CLIENT_ID = 'mcracing'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): any {
  return createSupabaseBrowserClient()
}

// ─── Revenue Entries ────────────────────────────────────────────────────────

export async function getRevenueEntries(year: number, month: number): Promise<RevenueEntry[]> {
  const supabase = getClient()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('revenue_entries')
    .select('*')
    .eq('client_id', CLIENT_ID)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching revenue entries:', error)
    return []
  }
  return (data as RevenueEntry[]) || []
}

export async function getAllRevenueEntries(): Promise<RevenueEntry[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('revenue_entries')
    .select('*')
    .eq('client_id', CLIENT_ID)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching all revenue entries:', error)
    return []
  }
  return (data as RevenueEntry[]) || []
}

export async function saveRevenueEntry(entry: {
  date: string
  category: string
  amount: number
  quantity?: number
  notes?: string | null
}): Promise<RevenueEntry | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('revenue_entries')
    .insert({ ...entry, client_id: CLIENT_ID })
    .select()
    .single()

  if (error) {
    console.error('Error saving revenue entry:', error)
    return null
  }
  return data as RevenueEntry
}

export async function updateRevenueEntry(id: string, updates: RevenueEntryUpdate): Promise<RevenueEntry | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('revenue_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating revenue entry:', error)
    return null
  }
  return data as RevenueEntry
}

export async function deleteRevenueEntry(id: string): Promise<boolean> {
  const supabase = getClient()
  const { error } = await supabase
    .from('revenue_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting revenue entry:', error)
    return false
  }
  return true
}

export async function getRevenueSummaryByCategory(year: number, month: number): Promise<Record<string, { total: number; count: number }>> {
  const entries = await getRevenueEntries(year, month)
  const summary: Record<string, { total: number; count: number }> = {}

  for (const entry of entries) {
    if (!summary[entry.category]) {
      summary[entry.category] = { total: 0, count: 0 }
    }
    summary[entry.category].total += Number(entry.amount)
    summary[entry.category].count += 1
  }

  return summary
}

export async function getMonthlyRevenueTotals(year: number, month: number): Promise<number> {
  const entries = await getRevenueEntries(year, month)
  return entries.reduce((sum, e) => sum + Number(e.amount), 0)
}

// ─── Monthly Expenses ───────────────────────────────────────────────────────

export async function getMonthlyExpenses(year: number, month: number): Promise<MonthlyExpense[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('monthly_expenses')
    .select('*')
    .eq('client_id', CLIENT_ID)
    .eq('year', year)
    .eq('month', month)
    .order('category')

  if (error) {
    console.error('Error fetching expenses:', error)
    return []
  }
  return (data as MonthlyExpense[]) || []
}

export async function saveExpense(expense: {
  year: number
  month: number
  category: string
  label: string
  amount: number
  is_recurring?: boolean
}): Promise<MonthlyExpense | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('monthly_expenses')
    .upsert(
      { ...expense, client_id: CLIENT_ID },
      { onConflict: 'client_id,year,month,category' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error saving expense:', error)
    return null
  }
  return data as MonthlyExpense
}

export async function updateExpense(id: string, updates: MonthlyExpenseUpdate): Promise<MonthlyExpense | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('monthly_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating expense:', error)
    return null
  }
  return data as MonthlyExpense
}

export async function deleteExpense(id: string): Promise<boolean> {
  const supabase = getClient()
  const { error } = await supabase
    .from('monthly_expenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting expense:', error)
    return false
  }
  return true
}

export async function seedDefaultExpenses(year: number, month: number): Promise<MonthlyExpense[]> {
  const existing = await getMonthlyExpenses(year, month)
  if (existing.length > 0) return existing

  const supabase = getClient()
  const expenses = DEFAULT_MONTHLY_EXPENSES.map(e => ({
    client_id: CLIENT_ID,
    year,
    month,
    category: e.category,
    label: e.label,
    amount: e.amount,
    is_recurring: e.is_recurring,
  }))

  const { data, error } = await supabase
    .from('monthly_expenses')
    .insert(expenses)
    .select()

  if (error) {
    console.error('Error seeding expenses:', error)
    return []
  }
  return (data as MonthlyExpense[]) || []
}

export async function copyExpensesFromLastMonth(year: number, month: number): Promise<MonthlyExpense[]> {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevExpenses = await getMonthlyExpenses(prevYear, prevMonth)

  if (prevExpenses.length === 0) return []

  const supabase = getClient()
  const newExpenses = prevExpenses.map(e => ({
    client_id: CLIENT_ID,
    year,
    month,
    category: e.category,
    label: e.label,
    amount: Number(e.amount),
    is_recurring: e.is_recurring,
  }))

  const { data, error } = await supabase
    .from('monthly_expenses')
    .upsert(newExpenses, { onConflict: 'client_id,year,month,category' })
    .select()

  if (error) {
    console.error('Error copying expenses:', error)
    return []
  }
  return (data as MonthlyExpense[]) || []
}

// ─── P&L Calculator ─────────────────────────────────────────────────────────

export async function getMonthlyPnL(year: number, month: number, baseline: number) {
  const [revenue, expenses] = await Promise.all([
    getMonthlyRevenueTotals(year, month),
    getMonthlyExpenses(year, month),
  ])

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const netIncome = revenue - totalExpenses
  const vsBaseline = revenue - baseline

  return {
    revenue,
    totalExpenses,
    netIncome,
    vsBaseline,
    expenseBreakdown: expenses,
  }
}
