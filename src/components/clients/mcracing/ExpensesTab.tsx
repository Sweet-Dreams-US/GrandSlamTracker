'use client'

import { useState, useEffect } from 'react'
import { Plus, Save, Copy, Trash2 } from 'lucide-react'
import { getMonthlyExpenses, saveExpense, updateExpense, deleteExpense, seedDefaultExpenses, copyExpensesFromLastMonth, getMonthlyRevenueTotals } from '@/lib/services/mcRacingService'
import { DEFAULT_MONTHLY_BUDGET } from '@/lib/constants/mcRacingPricing'
import type { MonthlyExpense } from '@/lib/supabase/types'

interface ExpensesTabProps {
  selectedYear: number
  selectedMonth: number
}

export default function ExpensesTab({ selectedYear, selectedMonth }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([])
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({})
  const [showAddRow, setShowAddRow] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')

  async function loadData() {
    setLoading(true)
    const [expData, rev] = await Promise.all([
      getMonthlyExpenses(selectedYear, selectedMonth),
      getMonthlyRevenueTotals(selectedYear, selectedMonth),
    ])
    setExpenses(expData)
    setRevenue(rev)
    const amounts: Record<string, string> = {}
    expData.forEach(e => { amounts[e.id] = String(e.amount) })
    setEditAmounts(amounts)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [selectedYear, selectedMonth])

  const handleSeedDefaults = async () => {
    setSaving('seed')
    await seedDefaultExpenses(selectedYear, selectedMonth)
    setSaving(null)
    loadData()
  }

  const handleCopyFromLastMonth = async () => {
    setSaving('copy')
    await copyExpensesFromLastMonth(selectedYear, selectedMonth)
    setSaving(null)
    loadData()
  }

  const handleUpdateAmount = async (expense: MonthlyExpense) => {
    const newAmt = Number(editAmounts[expense.id])
    if (isNaN(newAmt) || newAmt === Number(expense.amount)) return
    setSaving(expense.id)
    await updateExpense(expense.id, { amount: newAmt })
    setSaving(null)
    loadData()
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    loadData()
  }

  const handleAddRow = async () => {
    if (!newCategory || !newLabel || !newAmount) return
    setSaving('add')
    await saveExpense({
      year: selectedYear,
      month: selectedMonth,
      category: newCategory.toLowerCase().replace(/\s+/g, '_'),
      label: newLabel,
      amount: Number(newAmount),
      is_recurring: false,
    })
    setNewCategory('')
    setNewLabel('')
    setNewAmount('')
    setShowAddRow(false)
    setSaving(null)
    loadData()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const netIncome = revenue - totalExpenses

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcracing-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs font-medium text-gray-500 uppercase">Monthly Expenses</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">${totalExpenses.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-0.5">Budget: ${DEFAULT_MONTHLY_BUDGET.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs font-medium text-gray-500 uppercase">Revenue This Month</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">${revenue.toLocaleString()}</div>
        </div>
        <div className={`rounded-xl border p-5 ${netIncome >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-xs font-medium uppercase ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net Income Preview</div>
          <div className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {netIncome < 0 ? '-' : ''}${Math.abs(netIncome).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">No expenses set for this month. Start with defaults or copy from last month.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={saving === 'seed'}
              className="flex items-center gap-2 px-4 py-2 bg-mcracing-600 text-white rounded-lg text-sm font-medium hover:bg-mcracing-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {saving === 'seed' ? 'Loading...' : 'Load Defaults ($4,750)'}
            </button>
            <button
              onClick={handleCopyFromLastMonth}
              disabled={saving === 'copy'}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              {saving === 'copy' ? 'Copying...' : 'Copy from Last Month'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Expense Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Monthly Expenses</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyFromLastMonth}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Copy className="h-3 w-3" /> Copy Last Month
                </button>
                <button
                  onClick={() => setShowAddRow(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-mcracing-600 hover:bg-mcracing-50 rounded-lg font-medium"
                >
                  <Plus className="h-3 w-3" /> Add Row
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Expense</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Recurring</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{expense.label}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          value={editAmounts[expense.id] || ''}
                          onChange={e => setEditAmounts(prev => ({ ...prev, [expense.id]: e.target.value }))}
                          onBlur={() => handleUpdateAmount(expense)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateAmount(expense) }}
                          className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-mcracing-500 focus:border-mcracing-500"
                        />
                        {saving === expense.id && <div className="animate-spin h-3 w-3 border-b-2 border-mcracing-600 rounded-full" />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${expense.is_recurring ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {expense.is_recurring ? 'Yes' : 'One-time'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {showAddRow && (
                  <tr className="bg-mcracing-50/50">
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Category ID"
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Label"
                          value={newLabel}
                          onChange={e => setNewLabel(e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        placeholder="0"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-400">One-time</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={handleAddRow}
                        disabled={saving === 'add'}
                        className="p-1 text-mcracing-600 hover:text-mcracing-800"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">${totalExpenses.toLocaleString()}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
