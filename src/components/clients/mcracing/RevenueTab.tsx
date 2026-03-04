'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { getRevenueEntries, saveRevenueEntry, updateRevenueEntry, deleteRevenueEntry, getRevenueSummaryByCategory } from '@/lib/services/mcRacingService'
import { REVENUE_CATEGORIES, type RevenueCategory } from '@/lib/constants/mcRacingPricing'
import type { RevenueEntry } from '@/lib/supabase/types'

interface RevenueTabProps {
  selectedYear: number
  selectedMonth: number
}

// Quick-tap amounts for common transactions
const QUICK_AMOUNTS = [55, 99, 135, 200, 250, 500, 650, 800]

// Simplified category groups for non-accountants
const EASY_CATEGORIES: { label: string; value: RevenueCategory; emoji: string; description: string }[] = [
  { label: 'Walk-in Session', value: 'session_solo', emoji: '🏎️', description: '1 driver came in' },
  { label: 'Group Session', value: 'session_group', emoji: '👥', description: '2-3 drivers together' },
  { label: 'Birthday Party', value: 'birthday_party', emoji: '🎂', description: 'Party package booked' },
  { label: 'Membership', value: 'membership', emoji: '💳', description: 'Monthly member payment' },
  { label: 'League Night', value: 'league', emoji: '🏆', description: 'League entry / season pass' },
  { label: 'Corporate Event', value: 'corporate', emoji: '🏢', description: 'Business booking' },
  { label: 'RC Track', value: 'rc_track', emoji: '🎮', description: 'RC track rental' },
  { label: 'Merch / Other', value: 'merchandise', emoji: '🛍️', description: 'Merchandise or other sale' },
]

export default function RevenueTab({ selectedYear, selectedMonth }: RevenueTabProps) {
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [summary, setSummary] = useState<Record<string, { total: number; count: number }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formDate, setFormDate] = useState(() => {
    const d = new Date(selectedYear, selectedMonth - 1, new Date().getDate())
    return d.toISOString().split('T')[0]
  })
  const [formCategory, setFormCategory] = useState<RevenueCategory>('session_solo')
  const [formAmount, setFormAmount] = useState('')
  const [formQuantity, setFormQuantity] = useState('1')
  const [formNotes, setFormNotes] = useState('')

  async function loadData() {
    setLoading(true)
    const [entryData, summaryData] = await Promise.all([
      getRevenueEntries(selectedYear, selectedMonth),
      getRevenueSummaryByCategory(selectedYear, selectedMonth),
    ])
    setEntries(entryData)
    setSummary(summaryData)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    setFormDate(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(Math.min(new Date().getDate(), 28)).padStart(2, '0')}`)
  }, [selectedYear, selectedMonth])

  const resetForm = () => {
    setFormDate(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(Math.min(new Date().getDate(), 28)).padStart(2, '0')}`)
    setFormCategory('session_solo')
    setFormAmount('')
    setFormQuantity('1')
    setFormNotes('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!formAmount || Number(formAmount) <= 0) return
    setSaving(true)

    if (editingId) {
      await updateRevenueEntry(editingId, {
        date: formDate,
        category: formCategory,
        amount: Number(formAmount),
        quantity: Number(formQuantity) || 1,
        notes: formNotes || null,
      })
    } else {
      await saveRevenueEntry({
        date: formDate,
        category: formCategory,
        amount: Number(formAmount),
        quantity: Number(formQuantity) || 1,
        notes: formNotes || null,
      })
    }

    setSaving(false)
    resetForm()
    loadData()
  }

  const handleEdit = (entry: RevenueEntry) => {
    setEditingId(entry.id)
    setFormDate(entry.date)
    setFormCategory(entry.category as RevenueCategory)
    setFormAmount(String(entry.amount))
    setFormQuantity(String(entry.quantity))
    setFormNotes(entry.notes || '')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    await deleteRevenueEntry(id)
    loadData()
  }

  const handleQuickCategory = (cat: RevenueCategory) => {
    setFormCategory(cat)
    setShowForm(true)
  }

  const handleQuickAmount = (amount: number) => {
    setFormAmount(String(amount))
  }

  const totalRevenue = entries.reduce((sum, e) => sum + Number(e.amount), 0)
  const getCategoryLabel = (val: string) => {
    const easy = EASY_CATEGORIES.find(c => c.value === val)
    if (easy) return easy.label
    return REVENUE_CATEGORIES.find(c => c.value === val)?.label || val
  }
  const getCategoryEmoji = (val: string) => {
    return EASY_CATEGORIES.find(c => c.value === val)?.emoji || '💰'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcracing-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-mcracing-50 rounded-xl p-4 border border-mcracing-100 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-mcracing-600 uppercase">Total Money In</div>
          <div className="text-2xl font-bold text-mcracing-900">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-mcracing-500">{entries.length} transactions this month</div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-mcracing-600 text-white rounded-xl text-sm font-semibold hover:bg-mcracing-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Log Transaction
          </button>
        )}
      </div>

      {/* Quick Category Buttons (shown when form is closed) */}
      {!showForm && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EASY_CATEGORIES.map(cat => {
            const catData = summary[cat.value]
            return (
              <button
                key={cat.value}
                onClick={() => handleQuickCategory(cat.value)}
                className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-mcracing-300 hover:bg-mcracing-50/50 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-mcracing-700">{cat.label}</span>
                </div>
                <div className="text-xs text-gray-400">{cat.description}</div>
                {catData && (
                  <div className="text-xs font-medium text-mcracing-600 mt-1">
                    ${catData.total.toLocaleString()} ({catData.count})
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-mcracing-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <ArrowDownLeft className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                {editingId ? 'Edit Transaction' : 'Money In — New Transaction'}
              </h3>
            </div>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Category Selection - visual grid */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">What was it?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EASY_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFormCategory(cat.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formCategory === cat.value
                      ? 'bg-mcracing-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount with quick-tap */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">How much?</label>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-gray-400">$</span>
              <input
                type="number"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-2xl font-bold focus:ring-2 focus:ring-mcracing-500 focus:border-mcracing-500"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    formAmount === String(amt)
                      ? 'bg-mcracing-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Quantity + Notes in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-mcracing-500 focus:border-mcracing-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">How many? (qty)</label>
              <input
                type="number"
                value={formQuantity}
                onChange={e => setFormQuantity(e.target.value)}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-mcracing-500 focus:border-mcracing-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="e.g. John's birthday"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-mcracing-500 focus:border-mcracing-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !formAmount || Number(formAmount) <= 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : editingId ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </div>
      )}

      {/* Entries List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
        </div>
        {entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-gray-400">No transactions this month yet.</p>
            <p className="text-xs text-gray-300 mt-1">Tap a category above or hit &quot;Log Transaction&quot; to start.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="text-xl shrink-0">{getCategoryEmoji(entry.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{getCategoryLabel(entry.category)}</span>
                    {entry.quantity > 1 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">x{entry.quantity}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {entry.notes && <span className="ml-2 text-gray-300">— {entry.notes}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-green-600">+${Number(entry.amount).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(entry)} className="p-1.5 text-gray-300 hover:text-mcracing-600 rounded-lg hover:bg-gray-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-gray-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Footer */}
        {entries.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-lg font-bold text-green-600">+${totalRevenue.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
