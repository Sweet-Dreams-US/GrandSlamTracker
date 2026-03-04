'use client'

import { SESSION_RATES, PARTY_PACKAGES, MEMBERSHIP_TIERS, LEAGUES, FACILITY } from '@/lib/constants/mcRacingPricing'

interface PricingTabProps {
  onNavigate: (tab: string) => void
}

export default function PricingTab({ onNavigate }: PricingTabProps) {
  return (
    <div className="space-y-6">
      {/* Session Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Sim Racing Sessions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Per-session pricing — 3 simulators available</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Session</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Solo (1 Driver)</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Group (3 Drivers)</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Per Person (Group)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SESSION_RATES.map(rate => (
                <tr key={rate.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{rate.name}</td>
                  <td className="px-4 py-3 text-gray-600">{rate.duration}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${rate.solo}</td>
                  <td className="px-4 py-3 text-right font-medium text-mcracing-600">${rate.group}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${rate.perPersonGroup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-gray-50 text-xs text-gray-500">
          RC Track: 50% off with any sim session booking
        </div>
      </div>

      {/* Birthday Party Packages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Birthday Party Packages</h3>
          <p className="text-xs text-gray-500 mt-0.5">All-inclusive packages — highest margin revenue stream</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
          {PARTY_PACKAGES.map((pkg, i) => (
            <div
              key={pkg.name}
              className={`rounded-xl border p-5 ${i === 1 ? 'border-mcracing-300 bg-mcracing-50/50 ring-1 ring-mcracing-200' : 'border-gray-200'}`}
            >
              {i === 1 && <div className="text-xs font-bold text-mcracing-600 uppercase mb-2">Most Popular</div>}
              <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
              <div className="text-2xl font-bold text-mcracing-600 mt-2">${pkg.price}</div>
              <p className="text-xs text-gray-500 mt-1">Up to {pkg.maxKids} kids | {pkg.durationHrs} hours</p>
              <ul className="mt-3 space-y-1">
                {pkg.includes.map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-mcracing-500 mt-0.5">&#x2713;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Tiers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Monthly Memberships</h3>
          <p className="text-xs text-gray-500 mt-0.5">Recurring revenue — predictable, builds loyalty</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
          {MEMBERSHIP_TIERS.map(tier => (
            <div key={tier.name} className="rounded-xl border border-gray-200 p-5 hover:border-mcracing-300 transition-colors">
              <h4 className="font-semibold text-gray-900">{tier.name}</h4>
              <p className="text-xs text-gray-500">{tier.description}</p>
              <div className="text-2xl font-bold text-mcracing-600 mt-2">
                ${tier.monthlyPrice}<span className="text-sm font-normal text-gray-400">/mo</span>
              </div>
              <ul className="mt-3 space-y-1">
                {tier.includes.map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">&#x2713;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* League Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Racing Leagues</h3>
          <p className="text-xs text-gray-500 mt-0.5">Weekly competitive events — fills Tue & Thu nights</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">League</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Night</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Drop-in</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Season Pass</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Season</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LEAGUES.map(league => (
                <tr key={league.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{league.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{league.night}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-900">${league.dropInPrice}/week</td>
                  <td className="px-4 py-2.5 text-right font-medium text-mcracing-600">${league.seasonPassPrice}<span className="text-xs text-gray-400 ml-1">(save ${league.savings})</span></td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{league.seasonWeeks} weeks</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{league.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facility Info */}
      <div className="bg-mcracing-50 rounded-xl border border-mcracing-200 p-6">
        <h3 className="text-sm font-semibold text-mcracing-900 mb-3">Facility & Hours</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-xs text-mcracing-600 font-medium">Simulators</div>
            <div className="text-lg font-bold text-mcracing-900">{FACILITY.rigs}</div>
            <div className="text-xs text-mcracing-500">pro-grade rigs</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600 font-medium">Open Days</div>
            <div className="text-lg font-bold text-mcracing-900">Tue-Sun</div>
            <div className="text-xs text-mcracing-500">Closed {FACILITY.closedDay}</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600 font-medium">Hours</div>
            <div className="text-lg font-bold text-mcracing-900">Noon-2am</div>
            <div className="text-xs text-mcracing-500">{FACILITY.hoursPerDay} hrs/day</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600 font-medium">Weekly Hours</div>
            <div className="text-lg font-bold text-mcracing-900">{FACILITY.weeklyHours}</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600 font-medium">League Nights</div>
            <div className="text-lg font-bold text-mcracing-900">Tue & Thu</div>
            <div className="text-xs text-mcracing-500">2 nights/week</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-mcracing-200">
          <button
            onClick={() => onNavigate('refiner')}
            className="text-sm text-mcracing-700 hover:text-mcracing-900 font-medium hover:underline"
          >
            Model pricing changes in the Offer Refiner →
          </button>
        </div>
      </div>
    </div>
  )
}
