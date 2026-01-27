export interface RevenueStream {
  name: string
  monthlyAmount: number
  description?: string
}

export interface GrowthScenario {
  label: string
  growthPercent: number // as decimal, e.g. 0.50 = 50%
}

export interface TestClientData {
  name: string
  industry: string
  location: string
  monthlyBaseline: number
  streams: RevenueStream[]
  scenarios: GrowthScenario[]
}
