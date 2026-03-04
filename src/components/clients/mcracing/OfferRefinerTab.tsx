'use client'

import { useState, useMemo } from 'react'
import { Sliders, Users, Trophy, Target, BarChart3, TrendingUp } from 'lucide-react'
import {
  SESSION_RATES, PARTY_PACKAGES, MEMBERSHIP_TIERS, LEAGUES, FACILITY,
  DEFAULT_MONTHLY_BUDGET, DEAL_TERMS, GROWTH_SCENARIOS, MONTHLY_TARGETS,
  EMPLOYEE_TRIGGERS, NINE_SIM_UPGRADE, type GrowthScenario,
} from '@/lib/constants/mcRacingPricing'

export default function OfferRefinerTab() {
  // Walk-in sliders
  const [weekdaySoloPerDay, setWeekdaySoloPerDay] = useState(4)
  const [weekendSoloPerDay, setWeekendSoloPerDay] = useState(6)
  const [weekdayGroupPerDay, setWeekdayGroupPerDay] = useState(2) // group sessions (fills all 3 rigs)
  const [weekendGroupPerDay, setWeekendGroupPerDay] = useState(3)
  const [avgSoloSpend, setAvgSoloSpend] = useState(55) // avg solo session
  const [avgGroupSpend, setAvgGroupSpend] = useState(135) // avg group session (3 drivers, 1hr)

  // Party sliders
  const [partiesPerMonth, setPartiesPerMonth] = useState(6)
  const [avgPartyRevenue, setAvgPartyRevenue] = useState(550) // between Standard ($500) and Premium ($650)

  // Membership sliders
  const [soloMembers, setSoloMembers] = useState(5)
  const [duoMembers, setDuoMembers] = useState(3)
  const [proMembers, setProMembers] = useState(4)

  // League sliders
  const [leagueRacersPerNight, setLeagueRacersPerNight] = useState(8)
  const [leagueNightsPerWeek, setLeagueNightsPerWeek] = useState(2) // Tue + Thu
  const [seasonPassPct, setSeasonPassPct] = useState(40) // % on season pass vs drop-in

  // Corporate
  const [corporatePerMonth, setCorporatePerMonth] = useState(1)
  const [avgCorporateRevenue, setAvgCorporateRevenue] = useState(2500)

  // Apply a growth scenario preset
  const applyScenario = (scenario: GrowthScenario) => {
    const { parties, members, leagueRacers, breakdown } = scenario

    setPartiesPerMonth(parties)
    setAvgPartyRevenue(parties > 0 ? Math.round(breakdown.parties / parties) : 500)

    // Distribute members across tiers
    const soloCount = Math.round(members * 0.4)
    const duoCount = Math.round(members * 0.25)
    const proCount = members - soloCount - duoCount
    setSoloMembers(soloCount)
    setDuoMembers(duoCount)
    setProMembers(proCount)

    setLeagueRacersPerNight(leagueRacers)
    setLeagueNightsPerWeek(leagueRacers > 6 ? 2 : 1)

    // Back-solve session volume from target
    const sessionRev = breakdown.sessions
    const totalSessions = Math.round(sessionRev / 70) // ~$70 avg session
    const soloSessions = Math.round(totalSessions * 0.6)
    const groupSessions = totalSessions - soloSessions
    setWeekdaySoloPerDay(Math.round(soloSessions / 26 * 0.6)) // 26 days/month, 60% weekday
    setWeekendSoloPerDay(Math.round(soloSessions / 26 * 0.4 / (FACILITY.weekendDays / FACILITY.daysPerWeek)))
    setWeekdayGroupPerDay(Math.round(groupSessions / 26 * 0.5))
    setWeekendGroupPerDay(Math.round(groupSessions / 26 * 0.5 / (FACILITY.weekendDays / FACILITY.daysPerWeek)))

    setCorporatePerMonth(scenario.targetRevenue >= 8000 ? 1 : 0)
    setAvgCorporateRevenue(2500)
  }

  // Revenue calculations
  const calc = useMemo(() => {
    const weeksPerMonth = 4.33

    // Sessions
    const weekdaySoloRev = weekdaySoloPerDay * avgSoloSpend * FACILITY.weekdayDays * weeksPerMonth
    const weekendSoloRev = weekendSoloPerDay * avgSoloSpend * FACILITY.weekendDays * weeksPerMonth
    const weekdayGroupRev = weekdayGroupPerDay * avgGroupSpend * FACILITY.weekdayDays * weeksPerMonth
    const weekendGroupRev = weekendGroupPerDay * avgGroupSpend * FACILITY.weekendDays * weeksPerMonth
    const totalSessions = Math.round(weekdaySoloRev + weekendSoloRev + weekdayGroupRev + weekendGroupRev)

    // Parties
    const totalParties = partiesPerMonth * avgPartyRevenue

    // Memberships
    const membershipRevenue = (soloMembers * 150) + (duoMembers * 225) + (proMembers * 250)
    const totalMembers = soloMembers + duoMembers + proMembers

    // Leagues (2-hr sessions, $30 drop-in, season pass = $200/8 weeks = $25/week)
    const weeksPerSeason = 8
    const monthlyLeagueNights = leagueNightsPerWeek * weeksPerMonth
    const passRacers = Math.round(leagueRacersPerNight * (seasonPassPct / 100))
    const dropInRacers = leagueRacersPerNight - passRacers
    const leagueRevenuePerNight = (dropInRacers * 30) + (passRacers * (200 / weeksPerSeason))
    const totalLeagues = Math.round(monthlyLeagueNights * leagueRevenuePerNight)

    // Corporate
    const totalCorporate = corporatePerMonth * avgCorporateRevenue

    // Recurring revenue
    const recurringRevenue = membershipRevenue + totalLeagues
    const totalRevenue = totalSessions + totalParties + membershipRevenue + totalLeagues + totalCorporate
    const recurringPct = totalRevenue > 0 ? (recurringRevenue / totalRevenue) * 100 : 0

    const netIncome = totalRevenue - DEFAULT_MONTHLY_BUDGET
    const vsBaseline = totalRevenue - DEAL_TERMS.baseline

    // Break-even
    const breakEvenSessions = Math.ceil(DEFAULT_MONTHLY_BUDGET / avgSoloSpend)
    const breakEvenParties = Math.ceil(DEFAULT_MONTHLY_BUDGET / avgPartyRevenue)
    const breakEvenMembers = Math.ceil(DEFAULT_MONTHLY_BUDGET / 200) // avg membership price

    // Employee trigger
    const nextHire = EMPLOYEE_TRIGGERS.find(t => totalRevenue < t.revenueThreshold)

    // Capacity analysis
    const maxDailyRigHours = FACILITY.rigs * FACILITY.hoursPerDay // 42
    const monthlyRigHours = maxDailyRigHours * FACILITY.daysPerWeek * weeksPerMonth // ~1092
    const usedByLeagues = leagueNightsPerWeek * 2 * FACILITY.rigs * weeksPerMonth // 2hr leagues
    const usedByParties = partiesPerMonth * 2.5 * FACILITY.rigs // avg 2.5 hr party
    const usedBySessions = ((weekdaySoloPerDay + weekdayGroupPerDay) * FACILITY.weekdayDays + (weekendSoloPerDay + weekendGroupPerDay) * FACILITY.weekendDays) * weeksPerMonth * 1.5 // ~1.5hr avg
    const totalUsedHours = usedByLeagues + usedByParties + usedBySessions
    const utilization = Math.min((totalUsedHours / monthlyRigHours) * 100, 100)

    return {
      totalSessions, totalParties, membershipRevenue, totalMembers, totalLeagues, totalCorporate,
      totalRevenue: Math.round(totalRevenue),
      recurringRevenue: Math.round(recurringRevenue),
      recurringPct: Math.round(recurringPct),
      netIncome: Math.round(netIncome),
      vsBaseline: Math.round(vsBaseline),
      breakEvenSessions, breakEvenParties, breakEvenMembers,
      utilization: Math.round(utilization),
      monthlyRigHours: Math.round(monthlyRigHours),
      nextHire,
    }
  }, [weekdaySoloPerDay, weekendSoloPerDay, weekdayGroupPerDay, weekendGroupPerDay, avgSoloSpend, avgGroupSpend, partiesPerMonth, avgPartyRevenue, soloMembers, duoMembers, proMembers, leagueRacersPerNight, leagueNightsPerWeek, seasonPassPct, corporatePerMonth, avgCorporateRevenue])

  const fmt = (n: number) => n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`

  return (
    <div className="space-y-6">
      {/* Growth Plan Scenario Presets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-mcracing-600" />
          <h3 className="text-sm font-semibold text-gray-900">Growth Plan Scenarios</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {GROWTH_SCENARIOS.map(s => (
            <button
              key={s.name}
              onClick={() => applyScenario(s)}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:bg-mcracing-50 hover:border-mcracing-300 transition-colors"
            >
              <div>{s.label}</div>
              <div className="text-mcracing-600 font-bold">{fmt(s.targetRevenue)}/mo</div>
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Summary Bar */}
      <div className={`rounded-xl border p-5 ${calc.netIncome >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase">Projected Revenue</div>
            <div className="text-2xl font-bold text-gray-900">{fmt(calc.totalRevenue)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase">Expenses</div>
            <div className="text-2xl font-bold text-gray-900">{fmt(DEFAULT_MONTHLY_BUDGET)}</div>
          </div>
          <div>
            <div className={`text-xs font-medium uppercase ${calc.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net Income</div>
            <div className={`text-2xl font-bold ${calc.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(calc.netIncome)}</div>
          </div>
          <div>
            <div className={`text-xs font-medium uppercase ${calc.vsBaseline >= 0 ? 'text-mcracing-600' : 'text-orange-600'}`}>vs Baseline</div>
            <div className={`text-2xl font-bold ${calc.vsBaseline >= 0 ? 'text-mcracing-700' : 'text-orange-700'}`}>{fmt(calc.vsBaseline)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase">Recurring</div>
            <div className="text-2xl font-bold text-gray-900">{calc.recurringPct}%</div>
            <div className="text-xs text-gray-400">{fmt(calc.recurringRevenue)}/mo</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="h-4 w-4 text-mcracing-600" />
            <h3 className="text-sm font-semibold text-gray-900">Session Revenue</h3>
            <span className="ml-auto text-sm font-bold text-mcracing-600">{fmt(calc.totalSessions)}/mo</span>
          </div>
          <div className="space-y-4">
            <SliderInput label="Solo sessions/day (weekday)" value={weekdaySoloPerDay} onChange={setWeekdaySoloPerDay} min={0} max={20} />
            <SliderInput label="Solo sessions/day (weekend)" value={weekendSoloPerDay} onChange={setWeekendSoloPerDay} min={0} max={25} />
            <SliderInput label="Group sessions/day (weekday)" value={weekdayGroupPerDay} onChange={setWeekdayGroupPerDay} min={0} max={10} />
            <SliderInput label="Group sessions/day (weekend)" value={weekendGroupPerDay} onChange={setWeekendGroupPerDay} min={0} max={15} />
            <SliderInput label="Avg solo spend" value={avgSoloSpend} onChange={setAvgSoloSpend} min={30} max={150} prefix="$" />
            <SliderInput label="Avg group spend (3 drivers)" value={avgGroupSpend} onChange={setAvgGroupSpend} min={80} max={350} prefix="$" />
          </div>
        </div>

        {/* Parties */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-pink-600" />
            <h3 className="text-sm font-semibold text-gray-900">Birthday Parties</h3>
            <span className="ml-auto text-sm font-bold text-pink-600">{fmt(calc.totalParties)}/mo</span>
          </div>
          <div className="space-y-4">
            <SliderInput label="Parties per month" value={partiesPerMonth} onChange={setPartiesPerMonth} min={0} max={20} suffix="/mo" />
            <SliderInput label="Avg party revenue" value={avgPartyRevenue} onChange={setAvgPartyRevenue} min={300} max={900} prefix="$" />
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Packages: Standard ${PARTY_PACKAGES[0].price} | Premium ${PARTY_PACKAGES[1].price} | Ultimate ${PARTY_PACKAGES[2].price}
            </div>
            <div className="text-xs text-gray-400">
              Growth Plan targets: Mo3={5}, Mo6={9}, Mo12={13} parties
            </div>
          </div>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Membership MRR</h3>
            <span className="ml-auto text-sm font-bold text-green-600">{fmt(calc.membershipRevenue)}/mo</span>
          </div>
          <div className="space-y-4">
            <SliderInput label="Solo members ($150/mo)" value={soloMembers} onChange={setSoloMembers} min={0} max={30} suffix=" members" />
            <SliderInput label="Duo members ($225/mo)" value={duoMembers} onChange={setDuoMembers} min={0} max={20} suffix=" members" />
            <SliderInput label="Pro members ($250/mo)" value={proMembers} onChange={setProMembers} min={0} max={15} suffix=" members" />
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              {calc.totalMembers} total members | Growth Plan: Mo6={14}, Mo12={20}
            </div>
          </div>
        </div>

        {/* Leagues & Corporate */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <h3 className="text-sm font-semibold text-gray-900">Leagues & Corporate</h3>
            <span className="ml-auto text-sm font-bold text-yellow-600">{fmt(calc.totalLeagues + calc.totalCorporate)}/mo</span>
          </div>
          <div className="space-y-4">
            <SliderInput label="League nights/week" value={leagueNightsPerWeek} onChange={setLeagueNightsPerWeek} min={0} max={4} suffix=" nights" />
            <SliderInput label="Racers per night" value={leagueRacersPerNight} onChange={setLeagueRacersPerNight} min={0} max={24} />
            <SliderInput label="Season pass %" value={seasonPassPct} onChange={setSeasonPassPct} min={0} max={100} suffix="%" />
            <div className="text-xs font-medium text-gray-700 pt-2">Corporate Events</div>
            <SliderInput label="Corporate events/month" value={corporatePerMonth} onChange={setCorporatePerMonth} min={0} max={6} suffix="/mo" />
            <SliderInput label="Avg corporate booking" value={avgCorporateRevenue} onChange={setAvgCorporateRevenue} min={1000} max={5000} prefix="$" />
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Leagues: {fmt(calc.totalLeagues)} | Corporate: {fmt(calc.totalCorporate)}
            </div>
          </div>
        </div>
      </div>

      {/* Capacity & Break-even */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-mcracing-600" />
            <h3 className="text-sm font-semibold text-gray-900">Capacity & Break-even</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Rig utilization (est.)</span>
              <span className="font-medium">{calc.utilization}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-full rounded-full transition-all ${calc.utilization > 80 ? 'bg-red-500' : calc.utilization > 60 ? 'bg-yellow-500' : 'bg-mcracing-500'}`}
                style={{ width: `${Math.min(calc.utilization, 100)}%` }}
              />
            </div>
            {calc.utilization > 75 && (
              <div className="text-xs text-amber-600 font-medium">
                Nearing capacity with 3 rigs. 9-sim expansion unlocks ${NINE_SIM_UPGRADE.monthlyCeiling.expanded.toLocaleString()}/mo ceiling.
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Sessions to break even</div>
                <div className="text-lg font-bold text-gray-900">{calc.breakEvenSessions}</div>
                <div className="text-xs text-gray-400">/mo @ ${avgSoloSpend}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Parties to break even</div>
                <div className="text-lg font-bold text-gray-900">{calc.breakEvenParties}</div>
                <div className="text-xs text-gray-400">/mo @ ${avgPartyRevenue}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Members to break even</div>
                <div className="text-lg font-bold text-gray-900">{calc.breakEvenMembers}</div>
                <div className="text-xs text-gray-400">@ ~$200/avg</div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Trigger + Revenue Mix */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Mix & Staffing</h3>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Sessions', value: calc.totalSessions, color: 'bg-indigo-500' },
              { label: 'Birthday Parties', value: calc.totalParties, color: 'bg-pink-500' },
              { label: 'Memberships', value: calc.membershipRevenue, color: 'bg-green-500' },
              { label: 'Leagues', value: calc.totalLeagues, color: 'bg-yellow-500' },
              { label: 'Corporate', value: calc.totalCorporate, color: 'bg-blue-500' },
            ].map(item => {
              const pct = calc.totalRevenue > 0 ? (item.value / calc.totalRevenue) * 100 : 0
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs font-medium text-gray-700">{item.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-xs font-medium text-gray-900">{fmt(item.value)}</div>
                  <div className="w-10 text-right text-xs text-gray-400">{pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>

          {calc.nextHire && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-700 mb-1">Next Staffing Milestone</div>
              <div className="bg-mcracing-50 rounded-lg p-3">
                <div className="text-xs text-mcracing-600">At {fmt(calc.nextHire.revenueThreshold)}/mo:</div>
                <div className="text-sm font-medium text-mcracing-900">{calc.nextHire.action}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SliderInput({ label, value, onChange, min, max, prefix, suffix }: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  prefix?: string
  suffix?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-900">{prefix}{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mcracing-600"
      />
    </div>
  )
}
