'use client'

import { useState } from 'react'
import { LayoutDashboard, DollarSign, Receipt, TrendingUp, Tag, Sliders, FileSignature, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardTab from './mcracing/DashboardTab'
import RevenueTab from './mcracing/RevenueTab'
import ExpensesTab from './mcracing/ExpensesTab'
import PnLTab from './mcracing/PnLTab'
import PricingTab from './mcracing/PricingTab'
import OfferRefinerTab from './mcracing/OfferRefinerTab'
import ContractTab from './mcracing/ContractTab'
import SocialTab from './mcracing/SocialTab'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'pnl', label: 'P&L', icon: TrendingUp },
  { id: 'social', label: 'Social', icon: BarChart3 },
  { id: 'pricing', label: 'Pricing', icon: Tag },
  { id: 'refiner', label: 'Offer Refiner', icon: Sliders },
  { id: 'contract', label: 'Contract', icon: FileSignature },
]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function MCRacingContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(3) // March 2026

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  const showMonthSelector = ['dashboard', 'revenue', 'expenses', 'pnl'].includes(activeTab)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-mcracing-900 via-mcracing-800 to-mcracing-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MC Racing</h1>
              <p className="text-mcracing-200 text-sm">Business Management Dashboard</p>
            </div>
            {showMonthSelector && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px scrollbar-none">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-gray-50 text-mcracing-700 border-t-2 border-mcracing-500'
                      : 'text-mcracing-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'revenue' && (
          <RevenueTab
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        )}
        {activeTab === 'pnl' && (
          <PnLTab
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingTab onNavigate={setActiveTab} />
        )}
        {activeTab === 'social' && <SocialTab />}
        {activeTab === 'refiner' && <OfferRefinerTab />}
        {activeTab === 'contract' && <ContractTab />}
      </div>
    </div>
  )
}
