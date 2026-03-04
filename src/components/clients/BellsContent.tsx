'use client'

import { useState, useMemo } from 'react'
import { FileSignature, DollarSign, TrendingUp, Video, BarChart3, BookOpen, Presentation, ChevronDown, ChevronUp, Play, Users, Eye, Zap } from 'lucide-react'

// ─── Helper Components ──────────────────────────────────────────────────────
function SectionHeader({ id, label, title }: { id: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-2 p-4 border-b border-gray-200">
      <span id={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-bells-700 text-white scroll-mt-24">
        {label}
      </span>
      <h3 className="font-semibold">{title}</h3>
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Tier {
  zone: number
  label: string
  min: number
  max: number | null
  sweetDreamsPercent: number
  bellsPercent: number
}

interface PayoutExample {
  monthlyTotal: number
  sweetDreams: number
  sweetDreamsPercent: number
  bells: number
  bellsPercent: number
}

interface ViewScenario {
  label: string
  monthlyViews: number
  blendedRPM: number
  totalRevenue: number
  bellsTake: number
  sweetDreamsTake: number
}

interface ContentAngle {
  theme: string
  whyItWorks: string
  viralPotential: 'Very High' | 'High' | 'Medium-High' | 'Medium'
}

interface PlatformRPM {
  platform: string
  lowRPM: number
  midRPM: number
  highRPM: number
}

interface RiskItem {
  risk: string
  likelihood: 'Low' | 'Medium' | 'High'
  mitigation: string
}

// ─── Constants ──────────────────────────────────────────────────────────────
const TIERS: Tier[] = [
  { zone: 1, label: 'Production Cost Recovery', min: 0, max: 1500, sweetDreamsPercent: 0.80, bellsPercent: 0.20 },
  { zone: 2, label: 'Partnership Growth', min: 1501, max: 5000, sweetDreamsPercent: 0.60, bellsPercent: 0.40 },
  { zone: 3, label: 'True Partnership', min: 5001, max: 10000, sweetDreamsPercent: 0.50, bellsPercent: 0.50 },
  { zone: 4, label: 'Viral / Goodwill', min: 10001, max: null, sweetDreamsPercent: 0.40, bellsPercent: 0.60 },
]

const PLATFORM_RPMS: PlatformRPM[] = [
  { platform: 'Facebook Reels', lowRPM: 1.00, midRPM: 2.00, highRPM: 4.00 },
  { platform: 'Instagram Reels', lowRPM: 0.50, midRPM: 1.50, highRPM: 3.00 },
  { platform: 'TikTok', lowRPM: 0.50, midRPM: 1.00, highRPM: 2.00 },
  { platform: 'YouTube Shorts', lowRPM: 1.00, midRPM: 2.50, highRPM: 5.00 },
]

const CONTENT_ANGLES: ContentAngle[] = [
  { theme: '100th Anniversary Story', whyItWorks: 'Nostalgia + milestone + community history', viralPotential: 'Very High' },
  { theme: '"Last Rink Standing"', whyItWorks: 'Loss/preservation narrative, emotional', viralPotential: 'Very High' },
  { theme: 'Packed Saturday Night', whyItWorks: 'Energy, kids, glow lights, fun', viralPotential: 'High' },
  { theme: 'Adult Skate Night', whyItWorks: 'Already proven (22K views on one reel)', viralPotential: 'High' },
  { theme: 'K-Pop Night / Theme Nights', whyItWorks: 'Niche communities share aggressively', viralPotential: 'High' },
  { theme: 'Multi-Generational Families', whyItWorks: '"My grandma skated here" stories', viralPotential: 'Very High' },
  { theme: 'Behind the Scenes / Owner Story', whyItWorks: 'Authenticity, small business love', viralPotential: 'Medium-High' },
  { theme: 'Learn to Skate / Beginner Fails', whyItWorks: 'Relatable, funny, shareable', viralPotential: 'High' },
  { theme: 'Birthday Parties', whyItWorks: 'Parents tag, share, repost', viralPotential: 'Medium' },
  { theme: 'Before/After Rink Restoration', whyItWorks: 'Transformation content performs', viralPotential: 'Medium-High' },
]

const VIEW_SCENARIOS: ViewScenario[] = [
  { label: 'Slow Start (Mo 1-2)', monthlyViews: 500000, blendedRPM: 1.50, totalRevenue: 750, bellsTake: 150, sweetDreamsTake: 600 },
  { label: 'Building (Mo 3-4)', monthlyViews: 1000000, blendedRPM: 1.75, totalRevenue: 1750, bellsTake: 400, sweetDreamsTake: 1350 },
  { label: 'Conservative Cruising', monthlyViews: 2000000, blendedRPM: 2.00, totalRevenue: 4000, bellsTake: 1300, sweetDreamsTake: 2700 },
  { label: 'Moderate Success', monthlyViews: 3500000, blendedRPM: 2.50, totalRevenue: 8750, bellsTake: 3575, sweetDreamsTake: 5175 },
  { label: 'Viral Month', monthlyViews: 8000000, blendedRPM: 2.00, totalRevenue: 16000, bellsTake: 7700, sweetDreamsTake: 8300 },
  { label: 'Mega Viral', monthlyViews: 15000000, blendedRPM: 2.00, totalRevenue: 30000, bellsTake: 16200, sweetDreamsTake: 13800 },
]

const RISK_ITEMS: RiskItem[] = [
  { risk: 'Platform RPMs drop significantly', likelihood: 'Medium', mitigation: 'RPM protection clause triggers renegotiation below $0.50' },
  { risk: "Bell's terminates early", likelihood: 'Low', mitigation: '6-month minimum + 60-day notice' },
  { risk: "Bell's terminates and keeps earning on your content", likelihood: 'Medium', mitigation: '12-month post-termination split' },
  { risk: "Content doesn't go viral", likelihood: 'Low', mitigation: 'Consistent posting cadence builds compounding views' },
  { risk: "Bell's hires another videographer", likelihood: 'Low', mitigation: 'Exclusivity clause' },
  { risk: 'Monetization eligibility not met on new platforms', likelihood: 'Medium', mitigation: 'Build followers during early months; Facebook likely already qualifies' },
  { risk: 'Over-invest production time on low-return months', likelihood: 'Medium', mitigation: 'Batch shoots around events, keep production efficient' },
]

const PAYOUT_EXAMPLES: PayoutExample[] = [
  { monthlyTotal: 500, sweetDreams: 400, sweetDreamsPercent: 80.0, bells: 100, bellsPercent: 20.0 },
  { monthlyTotal: 1000, sweetDreams: 800, sweetDreamsPercent: 80.0, bells: 200, bellsPercent: 20.0 },
  { monthlyTotal: 1500, sweetDreams: 1200, sweetDreamsPercent: 80.0, bells: 300, bellsPercent: 20.0 },
  { monthlyTotal: 3000, sweetDreams: 2100, sweetDreamsPercent: 70.0, bells: 900, bellsPercent: 30.0 },
  { monthlyTotal: 5000, sweetDreams: 3300, sweetDreamsPercent: 66.0, bells: 1700, bellsPercent: 34.0 },
  { monthlyTotal: 7000, sweetDreams: 4300, sweetDreamsPercent: 61.4, bells: 2700, bellsPercent: 38.6 },
  { monthlyTotal: 10000, sweetDreams: 5800, sweetDreamsPercent: 58.0, bells: 4200, bellsPercent: 42.0 },
  { monthlyTotal: 15000, sweetDreams: 7800, sweetDreamsPercent: 52.0, bells: 7200, bellsPercent: 48.0 },
  { monthlyTotal: 20000, sweetDreams: 9800, sweetDreamsPercent: 49.0, bells: 10200, bellsPercent: 51.0 },
  { monthlyTotal: 30000, sweetDreams: 13800, sweetDreamsPercent: 46.0, bells: 16200, bellsPercent: 54.0 },
]

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { id: 'deal-overview', label: 'Deal Overview', icon: FileSignature },
  { id: 'revenue-projections', label: 'Revenue Projections', icon: TrendingUp },
  { id: 'content-strategy', label: 'Content Strategy', icon: Video },
  { id: 'platform-analytics', label: 'Platform Analytics', icon: BarChart3 },
  { id: 'internal-payouts', label: 'Internal Payouts', icon: DollarSign },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
  { id: 'pitch-deck', label: 'Pitch Deck', icon: Presentation },
]

type TabId = 'deal-overview' | 'revenue-projections' | 'content-strategy' | 'platform-analytics' | 'internal-payouts' | 'how-it-works' | 'pitch-deck'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value)

const formatPercent = (value: number) => `${value.toFixed(1)}%`

// ─── Tiered Revenue Split Calculator ────────────────────────────────────────
function calculateTieredSplit(monthlyTotal: number): { sweetDreams: number; bells: number } {
  let sweetDreams = 0
  let bells = 0
  let remaining = monthlyTotal

  for (const tier of TIERS) {
    const tierMax = tier.max ?? Infinity
    const tierRange = tierMax - tier.min + 1
    const amountInTier = Math.min(remaining, tier.max ? tierRange : remaining)

    if (amountInTier <= 0) break

    sweetDreams += amountInTier * tier.sweetDreamsPercent
    bells += amountInTier * tier.bellsPercent
    remaining -= amountInTier
  }

  return { sweetDreams: Math.round(sweetDreams), bells: Math.round(bells) }
}

// ─── Viral Potential Badge ──────────────────────────────────────────────────
function ViralBadge({ potential }: { potential: string }) {
  const colors: Record<string, string> = {
    'Very High': 'bg-green-100 text-green-800',
    'High': 'bg-blue-100 text-blue-800',
    'Medium-High': 'bg-teal-100 text-teal-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[potential] || 'bg-gray-100 text-gray-600'}`}>
      {potential}
    </span>
  )
}

function LikelihoodBadge({ likelihood }: { likelihood: string }) {
  const colors: Record<string, string> = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[likelihood] || 'bg-gray-100 text-gray-600'}`}>
      {likelihood}
    </span>
  )
}

// ─── Main Content Component ─────────────────────────────────────────────────
export default function BellsContent() {
  const [activeTab, setActiveTab] = useState<TabId>('deal-overview')
  const [showPayoutTable, setShowPayoutTable] = useState(false)
  const [customRevenue, setCustomRevenue] = useState<string>('')
  const [includeSales, setIncludeSales] = useState(true)

  // Custom revenue calculator
  const customSplit = useMemo(() => {
    const amount = parseFloat(customRevenue)
    if (isNaN(amount) || amount <= 0) return null
    return calculateTieredSplit(amount)
  }, [customRevenue])

  // Current metrics
  const currentMonthlyViews = 430000
  const currentMonetizableViews = 120000 // midpoint of 90K-150K
  const currentMonetizationRevenue = 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Header */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="card p-6 bg-gradient-to-r from-bells-700 to-teal-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Bell&apos;s Skating Rink</h1>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/90 text-xs font-bold">
                  <Zap className="h-3 w-3" /> CONTENT MONETIZATION
                </span>
              </div>
              <p className="text-bells-200">Fort Wayne, IN &middot; Entertainment / Recreation &middot; Approaching 100th Anniversary</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Baseline: $0/mo (no existing monetization)
                </span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Current Views: ~{formatNumber(currentMonthlyViews)}/mo
                </span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Deal Type: Tiered Revenue Share
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-bells-200">Current Social Presence</p>
              <p className="text-sm">Facebook primarily (6 accounts)</p>
              <p className="text-sm">~{formatNumber(currentMonthlyViews)} monthly views</p>
              <p className="text-sm">~{formatNumber(currentMonetizableViews)} monetizable video views</p>
              <p className="text-sm font-bold text-amber-300">Current Revenue: {formatCurrency(currentMonetizationRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Tabs */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto mb-6 border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-bells-700 text-bells-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Deal Overview */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'deal-overview' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Why This Is Different */}
          <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Why This Is a Different Deal Type
            </h3>
            <div className="space-y-2 text-sm text-amber-800">
              <p>This is <strong>not</strong> a standard Grand Slam on business revenue. This is a <strong>Content Monetization Partnership</strong> where:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The revenue being split <strong>doesn&apos;t exist yet</strong> &mdash; it&apos;s $0 today</li>
                <li>Sweet Dreams creates an entirely new income stream from platform monetization</li>
                <li>Bell&apos;s contributes nothing financially &mdash; no Foundation Fee, no retainer, no upfront cost</li>
                <li>Compensation is <strong>100% tied to monetization payouts</strong> from content produced and posted</li>
                <li>Without Sweet Dreams, this revenue stream never exists</li>
              </ul>
            </div>
          </div>

          {/* Business Profile */}
          <div className="card">
            <SectionHeader id="profile" label="Profile" title="Business Profile" />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Business</span><span className="font-medium">Bell&apos;s Skating Rink</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Industry</span><span className="font-medium">Entertainment / Recreation</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Location</span><span className="font-medium">Fort Wayne, IN</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Milestone</span><span className="font-medium text-amber-600">Approaching 100th Anniversary</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Market Position</span><span className="font-medium text-bells-700">Last roller rink standing in the area</span></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Social Presence</span><span className="font-medium">Facebook primarily, 6 accounts</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Current Monthly Views</span><span className="font-medium">~430,000 (mostly photos/text)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Monetizable Video Views</span><span className="font-medium">~90,000-150,000</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Current Monetization Revenue</span><span className="font-medium text-red-600">$0 (not set up)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Other Platform Presence</span><span className="font-medium text-red-600">None (no TikTok, YouTube, IG Reels)</span></div>
              </div>
            </div>
          </div>

          {/* Tiered Revenue Split */}
          <div className="card">
            <SectionHeader id="tiers" label="Tiers" title="Tiered Revenue Split Structure" />
            <p className="px-4 py-2 text-xs text-gray-500 bg-bells-50 border-b border-bells-100">
              These are <strong>marginal tiers</strong>, not flat rates. Each dollar is split according to the tier it falls in.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Zone</th>
                    <th className="text-left px-4 py-3">Monthly Range</th>
                    <th className="text-left px-4 py-3">Label</th>
                    <th className="text-center px-4 py-3">Sweet Dreams</th>
                    <th className="text-center px-4 py-3">Bell&apos;s</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TIERS.map((tier) => (
                    <tr key={tier.zone} className={tier.zone === 1 ? 'bg-bells-50' : ''}>
                      <td className="px-4 py-3 font-bold text-bells-700">Zone {tier.zone}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(tier.min)} &ndash; {tier.max ? formatCurrency(tier.max) : 'Uncapped'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{tier.label}</td>
                      <td className="px-4 py-3 text-center font-semibold text-bells-700">{(tier.sweetDreamsPercent * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{(tier.bellsPercent * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Worked Example */}
          <div className="card p-6 bg-gradient-to-r from-bells-50 to-teal-50 border-bells-200">
            <h3 className="font-semibold text-bells-900 mb-4">Worked Example: $7,000 Month</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-bells-200">
                <span className="font-bold text-bells-700 w-32">First $1,500</span>
                <span className="text-gray-500">&rarr;</span>
                <span>80/20</span>
                <span className="text-gray-500">&rarr;</span>
                <span className="text-bells-700 font-medium">SD gets $1,200</span>
                <span className="text-gray-300">|</span>
                <span className="text-amber-600 font-medium">Bell&apos;s gets $300</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-bells-200">
                <span className="font-bold text-bells-700 w-32">Next $3,500</span>
                <span className="text-gray-500">&rarr;</span>
                <span>60/40</span>
                <span className="text-gray-500">&rarr;</span>
                <span className="text-bells-700 font-medium">SD gets $2,100</span>
                <span className="text-gray-300">|</span>
                <span className="text-amber-600 font-medium">Bell&apos;s gets $1,400</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-bells-200">
                <span className="font-bold text-bells-700 w-32">Last $2,000</span>
                <span className="text-gray-500">&rarr;</span>
                <span>50/50</span>
                <span className="text-gray-500">&rarr;</span>
                <span className="text-bells-700 font-medium">SD gets $1,000</span>
                <span className="text-gray-300">|</span>
                <span className="text-amber-600 font-medium">Bell&apos;s gets $1,000</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-bells-700 text-white rounded-lg font-bold">
                <span className="w-32">TOTALS</span>
                <span>&rarr;</span>
                <span>Sweet Dreams: $4,300 (61.4%)</span>
                <span className="text-bells-200">|</span>
                <span>Bell&apos;s: $2,700 (38.6%)</span>
              </div>
            </div>
          </div>

          {/* Payout Examples Toggle */}
          <button
            onClick={() => setShowPayoutTable(!showPayoutTable)}
            className="w-full card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-700">Payout Examples at Key Revenue Levels</span>
            {showPayoutTable ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>

          {showPayoutTable && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right px-4 py-3">Monthly Total</th>
                      <th className="text-right px-4 py-3 bg-bells-50">Sweet Dreams $</th>
                      <th className="text-right px-4 py-3 bg-bells-50">Sweet Dreams %</th>
                      <th className="text-right px-4 py-3 bg-amber-50">Bell&apos;s $</th>
                      <th className="text-right px-4 py-3 bg-amber-50">Bell&apos;s %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {PAYOUT_EXAMPLES.map((ex) => (
                      <tr key={ex.monthlyTotal} className={ex.monthlyTotal === 7000 ? 'bg-bells-50 font-medium' : ''}>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(ex.monthlyTotal)}</td>
                        <td className="px-4 py-3 text-right text-bells-700">{formatCurrency(ex.sweetDreams)}</td>
                        <td className="px-4 py-3 text-right text-bells-600">{formatPercent(ex.sweetDreamsPercent)}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(ex.bells)}</td>
                        <td className="px-4 py-3 text-right text-amber-500">{formatPercent(ex.bellsPercent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
                Notice: Blended rate naturally slides from 80% at low volumes to low-to-mid 40s as revenue climbs. Bell&apos;s always gets a bigger slice as things scale.
              </div>
            </div>
          )}

          {/* Custom Revenue Calculator */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Revenue Split Calculator</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">Enter Monthly Revenue</label>
                <input
                  type="number"
                  value={customRevenue}
                  onChange={(e) => setCustomRevenue(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bells-500 focus:border-bells-500"
                />
              </div>
              {customSplit && (
                <div className="flex gap-4">
                  <div className="text-center p-3 bg-bells-50 rounded-lg border border-bells-200 min-w-[140px]">
                    <p className="text-xs text-gray-500">Sweet Dreams</p>
                    <p className="text-lg font-bold text-bells-700">{formatCurrency(customSplit.sweetDreams)}</p>
                    <p className="text-xs text-bells-600">{(customSplit.sweetDreams / parseFloat(customRevenue) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200 min-w-[140px]">
                    <p className="text-xs text-gray-500">Bell&apos;s</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(customSplit.bells)}</p>
                    <p className="text-xs text-amber-500">{(customSplit.bells / parseFloat(customRevenue) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What's Covered vs Not */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-green-900 mb-3">What&apos;s Covered Under the Split</h3>
              <ul className="space-y-2 text-sm">
                {['Facebook Reels monetization', 'Instagram Reels bonuses/monetization', 'TikTok Creator Fund / Creativity Program', 'YouTube Shorts Fund / Partner Program', 'Any future platform monetization programs'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">&#10003;</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-red-900 mb-3">What&apos;s NOT Covered (Separate)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-red-50 rounded border border-red-100">
                  <span className="text-gray-700">Website Hosting</span>
                  <span className="font-medium text-red-600">$140/mo</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded border border-red-100">
                  <span className="text-gray-700">Paid Ad Management</span>
                  <span className="font-medium text-red-600">TBD</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded border border-red-100">
                  <span className="text-gray-700">Sponsored Content / Brand Deals</span>
                  <span className="font-medium text-red-600">Per deal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="card">
            <SectionHeader id="terms" label="Terms" title="Contract Terms" />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-bells-50 rounded-lg border border-bells-200">
                  <p className="font-semibold text-bells-800">Minimum Term</p>
                  <p className="text-gray-700">6 months initial, then monthly auto-renew</p>
                </div>
                <div className="p-3 bg-bells-50 rounded-lg border border-bells-200">
                  <p className="font-semibold text-bells-800">Termination Notice</p>
                  <p className="text-gray-700">60 days written notice</p>
                </div>
                <div className="p-3 bg-bells-50 rounded-lg border border-bells-200">
                  <p className="font-semibold text-bells-800">Post-Termination</p>
                  <p className="text-gray-700">12-month tiered split on produced content</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-semibold text-amber-800">Exclusivity</p>
                  <p className="text-gray-700">No competing professional video content on managed accounts</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-semibold text-amber-800">RPM Protection</p>
                  <p className="text-gray-700">Renegotiation if RPM drops below $0.50 over 90 days</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-semibold text-amber-800">Content IP</p>
                  <p className="text-gray-700">Sweet Dreams retains IP, licensed to Bell&apos;s for social use</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Revenue Projections */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'revenue-projections' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Current Metrics */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Current Baseline Metrics</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-bells-50 rounded-lg border border-bells-200">
                <Eye className="h-5 w-5 mx-auto mb-1 text-bells-600" />
                <p className="text-xs text-gray-500">Monthly Views</p>
                <p className="text-lg font-bold text-bells-700">~430K</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Play className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-gray-500">Video Views</p>
                <p className="text-lg font-bold text-blue-700">~90K-150K</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <p className="text-xs text-gray-500">Current Revenue</p>
                <p className="text-lg font-bold text-red-600">$0</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Users className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-gray-500">Platforms Active</p>
                <p className="text-lg font-bold text-amber-600">1 of 4</p>
              </div>
            </div>
          </div>

          {/* Evidence of Potential */}
          <div className="card p-6 bg-gradient-to-r from-green-50 to-bells-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-4">Why These Numbers Are Realistic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                { text: 'Facebook already does 430K views/month with <strong>zero video strategy</strong>' },
                { text: 'Feb 5th single nostalgic photo post: <strong>71,121 views</strong>' },
                { text: 'K-Pop night spiked to <strong>41,285 views</strong>' },
                { text: '9 reels averaged ~<strong>10K views each</strong> with no optimization' },
                { text: 'Adult skate night reel: <strong>22,944 views</strong> with real engagement' },
                { text: '100th anniversary narrative is <strong>viral-ready content</strong>' },
                { text: '"Last roller rink standing" is an <strong>inherently emotional, shareable story</strong>' },
                { text: 'Adding TikTok, YouTube, Instagram Reels <strong>multiplies reach dramatically</strong>' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-green-100">
                  <span className="text-green-600 font-bold">&#10003;</span>
                  <span dangerouslySetInnerHTML={{ __html: item.text }} />
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Projections */}
          <div className="card">
            <SectionHeader id="scenarios" label="Scenarios" title="Scenario Projections (With Tiered Split)" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Scenario</th>
                    <th className="text-right px-4 py-3">Monthly Views</th>
                    <th className="text-right px-4 py-3">Blended RPM</th>
                    <th className="text-right px-4 py-3">Total Revenue</th>
                    <th className="text-right px-4 py-3 bg-amber-50">Bell&apos;s Take</th>
                    <th className="text-right px-4 py-3 bg-bells-50">Sweet Dreams Take</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {VIEW_SCENARIOS.map((s, i) => (
                    <tr key={s.label} className={i === 2 ? 'bg-bells-50' : ''}>
                      <td className="px-4 py-3 font-medium">{s.label}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(s.monthlyViews)}</td>
                      <td className="px-4 py-3 text-right">${s.blendedRPM.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatCurrency(s.bellsTake)}</td>
                      <td className="px-4 py-3 text-right text-bells-700 font-medium">{formatCurrency(s.sweetDreamsTake)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Growth Visual */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Revenue Growth Trajectory</h3>
            <div className="space-y-3">
              {VIEW_SCENARIOS.map((s) => {
                const maxRevenue = VIEW_SCENARIOS[VIEW_SCENARIOS.length - 1].totalRevenue
                const widthPercent = (s.totalRevenue / maxRevenue) * 100
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-40 text-sm text-gray-600 text-right shrink-0">{s.label}</div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-bells-500 to-teal-400 rounded-lg flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(widthPercent, 5)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{formatCurrency(s.totalRevenue)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly Timeline */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Expected Timeline to Viability</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-bells-200" />
              <div className="space-y-6">
                {[
                  { month: 'Month 1-2', title: 'Slow Start', desc: 'Setting up monetization, building content library, algorithm learning phase', revenue: '$300-$600/mo to Sweet Dreams' },
                  { month: 'Month 3-4', title: 'Building Momentum', desc: 'Algorithm starts favoring content, consistent posting cadence paying off', revenue: '$1,000-$1,500/mo to Sweet Dreams' },
                  { month: 'Month 5-6', title: 'Conservative Cruising', desc: 'Multi-platform presence established, content machine running smoothly', revenue: '$2,000-$3,000/mo to Sweet Dreams' },
                  { month: 'Month 6+', title: 'Scale Phase', desc: 'Viral hits become more frequent, compounding audience growth across platforms', revenue: '$3,000-$8,000+/mo to Sweet Dreams' },
                ].map((phase) => (
                  <div key={phase.month} className="flex gap-4 ml-2">
                    <div className="w-3 h-3 rounded-full bg-bells-500 mt-1.5 shrink-0 z-10" />
                    <div>
                      <p className="font-bold text-bells-800">{phase.month}: {phase.title}</p>
                      <p className="text-sm text-gray-600">{phase.desc}</p>
                      <p className="text-sm font-medium text-bells-600 mt-1">{phase.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Content Strategy */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'content-strategy' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Posting Cadence */}
          <div className="card p-6 bg-gradient-to-r from-bells-50 to-blue-50 border-bells-200">
            <h3 className="font-semibold text-bells-900 mb-3">Posting Cadence</h3>
            <div className="flex items-center gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-bells-200">
                <p className="text-3xl font-bold text-bells-700">3-4</p>
                <p className="text-sm text-gray-600">videos per week</p>
              </div>
              <div className="text-sm text-gray-600 max-w-md">
                <p className="font-medium text-gray-800 mb-1">Minimum to build algorithmic momentum</p>
                <p>Consistency matters more than volume for monetization. Posted across all managed platforms simultaneously.</p>
              </div>
            </div>
          </div>

          {/* Content Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-bells-900 mb-3">What Sweet Dreams Delivers</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Professional short-form video content (Reels, Shorts, TikToks)',
                  'Optimized for monetization (length, format, hooks, trends)',
                  'Posted across all managed platforms',
                  'Monetization dashboard setup and management',
                  'Analytics tracking and optimization',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-bells-600 mt-0.5">&#10003;</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-amber-900 mb-3">What Bell&apos;s Provides</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Venue access for filming',
                  'Permission to film customers/events (they handle waivers)',
                  'Cooperation on scheduling shoots around peak times',
                  'No interference with posting strategy or content direction',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">&#10003;</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Viral Content Angles */}
          <div className="card">
            <SectionHeader id="content-angles" label="Content" title="Viral Content Angles" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Content Theme</th>
                    <th className="text-left px-4 py-3">Why It Works</th>
                    <th className="text-center px-4 py-3">Viral Potential</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CONTENT_ANGLES.map((angle) => (
                    <tr key={angle.theme}>
                      <td className="px-4 py-3 font-medium">{angle.theme}</td>
                      <td className="px-4 py-3 text-gray-600">{angle.whyItWorks}</td>
                      <td className="px-4 py-3 text-center"><ViralBadge potential={angle.viralPotential} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 3 Content Plays */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Top 3 Content Plays (Highest Viral Potential)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-b from-amber-50 to-white rounded-lg border-2 border-amber-300">
                <p className="text-xs text-amber-600 font-bold uppercase">Play #1</p>
                <h4 className="font-bold text-gray-900 mt-1">100th Anniversary Story</h4>
                <p className="text-sm text-gray-600 mt-2">
                  This is a once-in-a-lifetime content moment. Historical footage, community stories, milestone celebration.
                  Every local news outlet will amplify this.
                </p>
                <ViralBadge potential="Very High" />
              </div>
              <div className="p-4 bg-gradient-to-b from-bells-50 to-white rounded-lg border-2 border-bells-300">
                <p className="text-xs text-bells-600 font-bold uppercase">Play #2</p>
                <h4 className="font-bold text-gray-900 mt-1">&quot;Last Rink Standing&quot;</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Loss/preservation narratives go mega viral. &quot;This is the last roller rink in Fort Wayne&quot;
                  triggers emotional sharing across demographics.
                </p>
                <ViralBadge potential="Very High" />
              </div>
              <div className="p-4 bg-gradient-to-b from-purple-50 to-white rounded-lg border-2 border-purple-300">
                <p className="text-xs text-purple-600 font-bold uppercase">Play #3</p>
                <h4 className="font-bold text-gray-900 mt-1">Multi-Generational Families</h4>
                <p className="text-sm text-gray-600 mt-2">
                  &quot;My grandma skated here, my mom skated here, and now my daughter skates here.&quot;
                  This is the kind of content that gets millions of shares.
                </p>
                <ViralBadge potential="Very High" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Platform Analytics */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'platform-analytics' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card">
            <SectionHeader id="rpm" label="RPM" title="Platform RPM Assumptions (Revenue per 1,000 Views)" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Platform</th>
                    <th className="text-right px-4 py-3 text-red-600">Low RPM</th>
                    <th className="text-right px-4 py-3 text-amber-600">Mid RPM</th>
                    <th className="text-right px-4 py-3 text-green-600">High RPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PLATFORM_RPMS.map((p) => (
                    <tr key={p.platform}>
                      <td className="px-4 py-3 font-medium">{p.platform}</td>
                      <td className="px-4 py-3 text-right text-red-600">${p.lowRPM.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">${p.midRPM.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-green-600">${p.highRPM.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-bells-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3">Blended Average</td>
                    <td className="px-4 py-3 text-right text-red-600">$0.75</td>
                    <td className="px-4 py-3 text-right text-amber-600">$1.75</td>
                    <td className="px-4 py-3 text-right text-green-600">$3.50</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
              Blended across platforms, assume $1.50-$3.00 average RPM for projections.
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Platform Presence: Current vs. Planned</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Facebook Reels', status: 'Active', color: 'bg-blue-600', note: 'Monetization not set up' },
                { name: 'Instagram Reels', status: 'Not Set Up', color: 'bg-pink-500', note: 'New platform to add' },
                { name: 'TikTok', status: 'Not Set Up', color: 'bg-gray-900', note: 'New platform to add' },
                { name: 'YouTube Shorts', status: 'Not Set Up', color: 'bg-red-600', note: 'New platform to add' },
              ].map((platform) => (
                <div key={platform.name} className={`p-4 rounded-lg border-2 ${platform.status === 'Active' ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                  <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center text-white text-xs font-bold mb-2`}>
                    {platform.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-sm">{platform.name}</p>
                  <p className={`text-xs mt-1 ${platform.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>{platform.status}</p>
                  <p className="text-xs text-gray-500 mt-1">{platform.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Monetization Eligibility Requirements</h3>
            <div className="space-y-3">
              {[
                { platform: 'Facebook Reels', requirement: '10K followers + 600K minutes viewed in 60 days', status: 'Likely qualifies', statusColor: 'text-green-600' },
                { platform: 'Instagram Reels', requirement: '10K followers + Professional account', status: 'Needs setup', statusColor: 'text-amber-600' },
                { platform: 'TikTok Creator Fund', requirement: '10K followers + 100K views in 30 days', status: 'Build during months 1-3', statusColor: 'text-amber-600' },
                { platform: 'YouTube Shorts', requirement: '1K subscribers + 10M Shorts views in 90 days', status: 'Build during months 1-6', statusColor: 'text-amber-600' },
              ].map((item) => (
                <div key={item.platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{item.platform}</p>
                    <p className="text-xs text-gray-500">{item.requirement}</p>
                  </div>
                  <span className={`text-xs font-semibold ${item.statusColor}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader id="risks" label="Risks" title="Risk Assessment" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Risk</th>
                    <th className="text-center px-4 py-3">Likelihood</th>
                    <th className="text-left px-4 py-3">Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {RISK_ITEMS.map((risk) => (
                    <tr key={risk.risk}>
                      <td className="px-4 py-3 font-medium">{risk.risk}</td>
                      <td className="px-4 py-3 text-center"><LikelihoodBadge likelihood={risk.likelihood} /></td>
                      <td className="px-4 py-3 text-gray-600">{risk.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: Internal Payouts */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'internal-payouts' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Internal Sweet Dreams Payout Structure</h3>
            <p className="text-sm text-gray-600 mb-4">The internal payout runs off Sweet Dreams&apos; share from the tiered split:</p>
            <div className="flex items-center gap-3 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={includeSales} onChange={() => setIncludeSales(!includeSales)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-bells-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bells-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">Include Sales ({includeSales ? '20%' : '0%'})</span>
            </div>
            <div className={`grid ${includeSales ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-6`}>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-500 uppercase">Business</p>
                <p className="text-3xl font-bold text-blue-700">35%</p>
                <p className="text-xs text-gray-500 mt-1">Overhead, infrastructure, profit</p>
              </div>
              <div className="text-center p-4 bg-bells-50 rounded-lg border border-bells-200">
                <p className="text-xs text-gray-500 uppercase">Worker</p>
                <p className="text-3xl font-bold text-bells-700">{includeSales ? '45%' : '65%'}</p>
                <p className="text-xs text-gray-500 mt-1">Shooting, editing, posting, platform mgmt</p>
              </div>
              {includeSales && (
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-gray-500 uppercase">Sales</p>
                  <p className="text-3xl font-bold text-amber-600">20%</p>
                  <p className="text-xs text-gray-500 mt-1">Client relationship, account mgmt</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <SectionHeader id="payout-examples" label="Payouts" title="Internal Payout Examples" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right px-4 py-3">Total Monetization</th>
                    <th className="text-right px-4 py-3 bg-amber-50">Bell&apos;s (Tiered)</th>
                    <th className="text-right px-4 py-3 bg-bells-50">Sweet Dreams Total</th>
                    <th className="text-right px-4 py-3 bg-blue-50">Business (35%)</th>
                    <th className="text-right px-4 py-3 bg-teal-50">Worker ({includeSales ? '45%' : '65%'})</th>
                    {includeSales && <th className="text-right px-4 py-3 bg-orange-50">Sales (20%)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[4000, 10000, 20000].map((total) => {
                    const split = calculateTieredSplit(total)
                    const business = Math.round(split.sweetDreams * 0.35)
                    const worker = Math.round(split.sweetDreams * (includeSales ? 0.45 : 0.65))
                    const sales = includeSales ? Math.round(split.sweetDreams * 0.20) : 0
                    return (
                      <tr key={total}>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(total)}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(split.bells)}</td>
                        <td className="px-4 py-3 text-right font-bold text-bells-700">{formatCurrency(split.sweetDreams)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(business)}</td>
                        <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(worker)}</td>
                        {includeSales && <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(sales)}</td>}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {[4000, 10000, 20000].map((total) => {
            const split = calculateTieredSplit(total)
            const business = Math.round(split.sweetDreams * 0.35)
            const worker = Math.round(split.sweetDreams * (includeSales ? 0.45 : 0.65))
            const sales = includeSales ? Math.round(split.sweetDreams * 0.20) : 0
            return (
              <div key={total} className="card p-6">
                <h3 className="font-semibold mb-4">{formatCurrency(total)} Total Monetization Month</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-bold text-gray-700 mb-2">External Split</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bell&apos;s (tiered)</span>
                        <span className="font-medium text-amber-600">{formatCurrency(split.bells)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sweet Dreams</span>
                        <span className="font-medium text-bells-700">{formatCurrency(split.sweetDreams)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-bells-50 rounded-lg p-4 border border-bells-200">
                    <h4 className="font-bold text-bells-800 mb-2">Sweet Dreams Internal ({formatCurrency(split.sweetDreams)})</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business (35%)</span>
                        <span className="font-medium text-blue-600">{formatCurrency(business)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Worker ({includeSales ? '45%' : '65%'})</span>
                        <span className="font-medium text-teal-600">{formatCurrency(worker)}</span>
                      </div>
                      {includeSales && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sales (20%)</span>
                          <span className="font-medium text-orange-600">{formatCurrency(sales)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: How It Works */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'how-it-works' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">How The Content Monetization Partnership Works</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bells-700 text-white flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Identify the Opportunity</h3>
                  <p className="text-gray-600 mt-1">Bell&apos;s Skating Rink has <strong>430,000 monthly views</strong> and makes <strong>$0</strong> from them. They have an existing audience but no video strategy and no monetization setup. Every dollar generated is new money.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bells-700 text-white flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Zero Risk to Bell&apos;s</h3>
                  <p className="text-gray-600 mt-1">There&apos;s <strong>no Foundation Fee, no retainer, no upfront cost</strong>. Sweet Dreams takes all the production risk. If the content flops, Bell&apos;s paid nothing. This is a pure revenue share on money that doesn&apos;t exist yet.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bells-700 text-white flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tiered Revenue Share</h3>
                  <p className="text-gray-600 mt-1">Revenue is split through marginal tiers. The first $1,500 is 80/20 (covering production costs). As revenue scales, the split tilts more toward Bell&apos;s &mdash; up to 60% on amounts over $10K.</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {TIERS.map((tier) => (
                      <div key={tier.zone} className="text-center p-2 bg-bells-50 rounded-lg border border-bells-200 text-xs">
                        <p className="font-bold text-bells-700">Zone {tier.zone}</p>
                        <p className="text-gray-600">{(tier.sweetDreamsPercent * 100).toFixed(0)}/{(tier.bellsPercent * 100).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bells-700 text-white flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Build the Content Machine</h3>
                  <p className="text-gray-600 mt-1">Sweet Dreams produces <strong>3-4 professional short-form videos per week</strong>, optimized for monetization across Facebook Reels, Instagram Reels, TikTok, and YouTube Shorts. Sets up and manages all monetization dashboards.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bells-700 text-white flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Algorithmic Momentum (2-3 Months)</h3>
                  <p className="text-gray-600 mt-1">It takes 2-3 months for algorithms to start favoring content consistently. The 6-month minimum term protects both parties during this ramp-up period. Consistent posting builds compounding views over time.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">6</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Scale &amp; Win Together</h3>
                  <p className="text-gray-600 mt-1">As views grow, revenue grows. The tiered structure means Bell&apos;s keeps an increasingly larger share. At $20K/month, Bell&apos;s is keeping 51% &mdash; over half. The bigger it grows, the better the deal is for them.</p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Current Revenue</p>
                      <p className="font-bold text-red-600">$0/mo</p>
                    </div>
                    <div className="p-3 bg-bells-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Conservative Target</p>
                      <p className="font-bold text-bells-700">$4,000/mo</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Viral Potential</p>
                      <p className="font-bold text-green-600">$15,000+/mo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Standard Grand Slam vs. Content Monetization</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Aspect</th>
                    <th className="text-left px-4 py-3">Standard Grand Slam</th>
                    <th className="text-left px-4 py-3">Content Monetization (Bell&apos;s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { aspect: 'Revenue Source', standard: 'Client business revenue', bells: 'Platform monetization payouts' },
                    { aspect: 'Foundation Fee', standard: 'Annual minimum based on size', bells: 'None' },
                    { aspect: 'Growth Fee', standard: 'Tiered % on uplift above baseline', bells: 'N/A - tiered monetization split' },
                    { aspect: 'Sustaining Fee', standard: 'Year 2+ income protection', bells: 'N/A' },
                    { aspect: 'Client Cost', standard: 'Pays fees from existing revenue', bells: '$0 - zero cost to client' },
                    { aspect: 'Baseline', standard: 'Current business revenue', bells: '$0 (no existing monetization)' },
                    { aspect: 'Revenue Split', standard: 'Fee on uplift, client keeps rest', bells: 'Marginal tiered split on all revenue' },
                    { aspect: 'Risk', standard: 'Shared - client pays only on growth', bells: 'Sweet Dreams bears all production risk' },
                  ].map((row) => (
                    <tr key={row.aspect}>
                      <td className="px-4 py-3 font-medium">{row.aspect}</td>
                      <td className="px-4 py-3 text-gray-600">{row.standard}</td>
                      <td className="px-4 py-3 text-bells-700 font-medium">{row.bells}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 7: Pitch Deck */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pitch-deck' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="card p-8 bg-gradient-to-r from-bells-700 to-teal-600 text-white text-center">
            <p className="text-xs text-bells-200 uppercase tracking-wide font-bold mb-3">The One-Liner</p>
            <blockquote className="text-xl font-bold leading-relaxed max-w-3xl mx-auto">
              &ldquo;I&apos;m not charging you anything. Zero. I take all the risk. If the videos flop, you paid me nothing.
              If they blow up, we both win &mdash; and the bigger we grow, the more you keep.
              You literally cannot lose money on this deal.&rdquo;
            </blockquote>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Key Selling Points</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Making $0 from 430K Views', desc: "They're currently making $0 from 430,000 monthly views. Every dollar generated is new money." },
                { title: 'Zero Cost to Them', desc: 'No retainer, no upfront fee, no production costs. Pure upside.' },
                { title: 'Taking Work Off Their Plate', desc: "They're already overwhelmed managing 6 accounts with no video strategy." },
                { title: 'Once-in-a-Lifetime Moment', desc: "The 100th anniversary is a once-in-a-lifetime content moment. If they don't capture it professionally, it's gone." },
                { title: 'New Platform Presence', desc: "Building presence on TikTok, YouTube platforms they don't exist on. That has value beyond just monetization." },
                { title: 'Deal Gets Better for Them', desc: 'Start at 20% and climb toward 60% on big months. The more successful, the better their deal.' },
              ].map((point) => (
                <div key={point.title} className="p-4 bg-bells-50 rounded-lg border border-bells-200">
                  <p className="font-semibold text-bells-800 text-sm">{point.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader id="objections" label="Objections" title="Objection Handling" />
            <div className="divide-y divide-gray-100">
              {[
                { objection: '"80/20 seems like a lot for you on the low end"', response: 'That covers my production costs when revenue is small. But look at the tiers — as we scale, you keep more and more. At $10K/month you\'re keeping 42%. At $20K you\'re over 50%. The deal literally gets better for you the more it works.' },
                { objection: '"What if we don\'t like the content?"', response: "You'll have input on what gets filmed, but I need creative control on editing and posting strategy — that's what drives the algorithm. If you're unhappy after 6 months, you walk away and keep every video I made." },
                { objection: '"Can\'t we just do this ourselves?"', response: 'You could, but you haven\'t. You have 430K views and $0 in monetization. The gap isn\'t the audience — it\'s the video production and platform strategy.' },
                { objection: '"6 months is a long commitment"', response: 'It takes 2-3 months for the algorithm to start favoring your content consistently. The 6-month minimum protects your results, not just mine.' },
                { objection: '"Why do you need access to our accounts?"', response: "So I can see what's working and optimize in real time. Full transparency — you can see everything I see. I need the dashboards to do my job." },
              ].map((item) => (
                <div key={item.objection} className="p-4">
                  <p className="font-semibold text-red-700 text-sm">{item.objection}</p>
                  <p className="text-sm text-gray-700 mt-2 bg-green-50 p-3 rounded-lg border border-green-100">{item.response}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader id="decision" label="Decision" title="Decision Summary" />
            <div className="p-4 space-y-2">
              {[
                { q: 'Is this a Grand Slam client?', a: 'No — Content Monetization Partnership (new deal type)', color: 'text-amber-600' },
                { q: 'Does it fit the standard fee structure?', a: 'No — tiered revenue share, no Foundation/Growth/Sustaining', color: 'text-amber-600' },
                { q: 'Is it worth pursuing?', a: 'Yes — high viral potential, $0 baseline, uncapped upside', color: 'text-green-600' },
                { q: 'Minimum viable for Sweet Dreams?', a: 'Yes if views hit 1M+/month (~$1,350/month to you)', color: 'text-green-600' },
                { q: 'Timeline to viability', a: '2-3 months to build momentum', color: 'text-blue-600' },
                { q: 'Best-case monthly income', a: '$8,000-$14,000+ on viral months', color: 'text-green-600' },
                { q: 'Worst-case monthly income', a: '$300-$600 on slow months (still beats $0)', color: 'text-amber-600' },
                { q: 'Website hosting separate?', a: 'Yes — $140/month, different invoice', color: 'text-blue-600' },
              ].map((item) => (
                <div key={item.q} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border text-sm">
                  <span className="text-gray-700 font-medium">{item.q}</span>
                  <span className={`font-semibold ${item.color}`}>{item.a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Deal Type Classification</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { field: 'Deal Type', value: 'content_monetization_share' },
                { field: 'Baseline', value: '$0 (no existing monetization)' },
                { field: 'Foundation Fee', value: 'None' },
                { field: 'Growth Fee', value: 'N/A — tiered monetization split' },
                { field: 'Sustaining Fee', value: 'N/A' },
                { field: 'Revenue Source', value: 'Platform monetization payouts only' },
                { field: 'Split Structure', value: 'Tier 1: 80/20, Tier 2: 60/40, Tier 3: 50/50, Tier 4: 40/60' },
                { field: 'Tier Breakpoints', value: '$1,500 / $5,000 / $10,000' },
                { field: 'Contract Term', value: '6 months initial, monthly auto-renew' },
                { field: 'Termination Notice', value: '60 days written' },
                { field: 'Post-Termination', value: '12-month tiered split on produced content' },
                { field: 'Cap', value: 'None — uncapped upside' },
              ].map((item) => (
                <div key={item.field} className="flex justify-between p-2 bg-gray-50 rounded border">
                  <span className="text-gray-600">{item.field}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
