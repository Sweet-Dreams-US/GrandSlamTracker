SWEET DREAMS GRAND SLAM SYSTEM
Complete Architecture Document

SECTION 1: SYSTEM OVERVIEW
1.1 What This Is
An internal operations tool for Sweet Dreams Media. It tracks client performance, calculates fees based on contract terms, and generates reports. Nobody but us ever touches it.
1.2 What This System Does
FunctionDescriptionClient ManagementStore client info, contracts, terms, baselinesAnalytics TrackingPull data from social platforms, Google Analytics, Search Console, GBPLead AttributionTrack where leads come from, attribute revenue to sourcesFee CalculationCalculate what we're owed based on contract brackets and capsPayout SplitsCalculate internal splits (Business, Sales, Worker)Scenario ModelingProject fees for prospects, compare pricing structuresReport GenerationCreate PDFs for clients and internal useActivity LoggingTrack our work (content produced, hours spent)
1.3 What This System Does NOT Do
Not ThisWe Do This InsteadSend invoicesWe email invoices manuallyProcess paymentsWe check bank account, mark as paid in systemGive clients accessClients never see this toolAutomate client communicationWe email/call manuallyConnect to Stripe/QuickBooksWe handle accounting separately
1.4 Core Philosophy
Track everything. Calculate everything. Share selectively.
We maintain complete internal visibility into every client's performance, every lead source, every dollar of growth. We generate professional reports and proposals. But we control when and how information leaves this system—always manually, always on our terms.
1.5 Users
Only Sweet Dreams Media team members. No client logins. No external access.

SECTION 2: DATA MODELS
2.1 Client Profile
Client {
  // Identity
  id: unique identifier
  businessName: string
  industry: enum (remodeling, fitness, restaurant, retail, service, other)
  ownerName: string
  contactEmail: string
  contactPhone: string
  
  // Business Characteristics
  businessAge: number (years in business)
  employeeCount: number
  serviceArea: string (local, regional, national)
  seasonalBusiness: boolean
  peakMonths: array (if seasonal)
  slowMonths: array (if seasonal)
  
  // Financial Baseline
  trailingRevenue: array of monthly revenue (12 months)
  averageMonthlyRevenue: number (calculated)
  averageJobValue: number
  averageMonthlyJobs: number
  
  // Contract Terms
  contractType: enum (grandSlam, transactional, hybrid)
  contractStartDate: date
  trialEndDate: date
  status: enum (prospect, trial, active, paused, terminated, completed)
  
  // System
  healthScore: number (0-100)
  lastActivityDate: date
  notes: text
  createdAt: timestamp
  updatedAt: timestamp
}
2.2 Fee Structure
FeeStructure {
  id: unique identifier
  clientId: reference to Client
  
  // Baseline Configuration
  baselineMethod: enum (trailing12, trailing6, custom)
  baselineGrowthFactor: decimal (default 0.12 for 12%)
  seasonalAdjustment: boolean
  customBaseline: number (if method is custom)
  
  // Tiers
  tiers: array of FeeTier
  
  // Caps
  monthlyCap: number (optional)
  annualCap: number (optional)
  
  // Minimum
  monthlyMinimum: number (optional retainer floor)
}

FeeTier {
  tierName: string
  growthFloor: decimal (0 = 0%, 0.25 = 25%)
  growthCeiling: decimal
  feePercentage: decimal
  sortOrder: number
}
2.3 Monthly Revenue Record
MonthlyRevenue {
  id: unique identifier
  clientId: reference to Client
  month: date (YYYY-MM-01)
  
  // Revenue Data (we enter from client)
  grossRevenue: number
  jobCount: number
  averageJobValue: number (calculated)
  
  // Attribution Breakdown
  attributedRevenue: number (from our efforts)
  organicRevenue: number (would have happened anyway)
  referralRevenue: number (word of mouth)
  unknownRevenue: number (source unclear)
  attributionRate: decimal (calculated)
  
  // Calculations (system generates)
  baselineExpected: number
  upliftRevenue: number
  growthPercentage: decimal
  feeCalculated: number
  feeAfterCap: number
  
  // Payment Tracking (we update manually)
  paid: boolean
  paidAmount: number
  paidDate: date
  
  // Verification
  revenueVerified: boolean
  verificationMethod: string
  
  notes: text
}
2.4 Lead Record
Lead {
  id: unique identifier
  clientId: reference to Client
  
  // Lead Info
  leadName: string
  leadContact: string
  leadDate: date
  jobType: string
  estimatedValue: number
  
  // Attribution
  sourceCategory: enum (sweetDreams, organic, referral, paid, unknown)
  sourceChannel: string (social, website, google, direct, phone, walkIn, referral)
  sourcePlatform: string (instagram, facebook, tiktok, google, etc)
  sourceContent: string (specific post/page if known)
  
  // Confidence
  attributionConfidence: enum (confirmed, likely, assumed, unknown)
  attributionNotes: string
  
  // Outcome
  status: enum (new, contacted, quoted, won, lost, pending)
  finalValue: number
  outcomeDate: date
  outcomeNotes: string
}
2.5 Lead Source Template
LeadSource {
  id: unique identifier
  clientId: reference to Client
  
  name: string
  category: enum (sweetDreams, organic, referral, paid, unknown)
  channel: string
  platform: string
  isActive: boolean
}
2.6 Analytics Data
DailyMetric {
  id: unique identifier
  clientId: reference to Client
  date: date
  platform: string (instagram, facebook, tiktok, youtube, website, gbp, etc)
  metricName: string (followers, reach, impressions, visits, etc)
  metricValue: number
}

MonthlyAnalytics {
  id: unique identifier
  clientId: reference to Client
  month: date
  
  // Social Totals
  totalFollowers: number
  followerGrowth: number
  totalPosts: number
  totalReach: number
  totalImpressions: number
  totalEngagements: number
  engagementRate: decimal
  
  // Platform Breakdown (flexible JSON)
  platformStats: {
    instagram: { followers, growth, posts, reach, engagement }
    facebook: { followers, growth, posts, reach, engagement }
    tiktok: { followers, growth, posts, reach, engagement }
    // etc
  }
  
  // Website (from GA4)
  websiteVisits: number
  uniqueVisitors: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: decimal
  goalCompletions: number
  
  // Top Performers
  topPosts: array
  topPages: array
}
2.7 Activity Log
ActivityEntry {
  id: unique identifier
  clientId: reference to Client
  date: date
  
  activityType: enum (content, posting, strategy, communication, admin)
  description: string
  quantity: number
  hoursSpent: decimal
}

MonthlyActivity {
  id: unique identifier
  clientId: reference to Client
  month: date
  
  // Content
  videosProduced: number
  videosPublished: number
  photosProduced: number
  photosPublished: number
  graphicsCreated: number
  postsPublished: number
  contentDays: number
  
  // Time
  hoursStrategy: decimal
  hoursProduction: decimal
  hoursPosting: decimal
  hoursCommunication: decimal
  totalHours: decimal
  
  // Communication
  strategyCalls: number
  reportsDelivered: number
}
2.8 Internal Payout
InternalPayout {
  id: unique identifier
  paymentDate: date
  grossAmount: number
  
  // Splits
  businessAmount: number
  businessPercentage: decimal
  salesAmount: number
  salesPercentage: decimal
  workerAmount: number
  workerPercentage: decimal
  
  // Source
  sourceClients: array of client IDs
  sourceMonths: array of months
  
  notes: string
}
2.9 Integration Connection
Integration {
  id: unique identifier
  clientId: reference to Client
  platform: string (metricool, google_analytics, search_console, gbp)
  
  accountId: string
  accountName: string
  accessToken: encrypted string
  refreshToken: encrypted string
  tokenExpiresAt: timestamp
  
  status: enum (active, expired, error, disconnected)
  lastSyncAt: timestamp
  lastError: string
}
2.10 Alert
Alert {
  id: unique identifier
  clientId: reference to Client
  
  alertType: string
  severity: enum (info, warning, critical, positive)
  message: string
  
  acknowledged: boolean
  acknowledgedAt: timestamp
}
2.11 Drive Link
DriveLink {
  id: unique identifier
  clientId: reference to Client
  
  linkType: enum (contract, proposal, report, other)
  fileName: string
  driveUrl: string
  driveFileId: string
}
2.12 Saved Scenario
SavedScenario {
  id: unique identifier
  
  name: string
  prospectName: string
  industry: string
  baselineRevenue: number
  
  scenarioData: JSON (full scenario configuration)
  
  createdAt: timestamp
}

SECTION 3: CALCULATION ENGINES
3.1 Baseline Calculator
Purpose: Determine fair "expected" revenue without Sweet Dreams involvement.
FUNCTION calculateBaseline(client, targetMonth):

  // Step 1: Get trailing average
  trailing = client.trailingRevenue (last 12 months)
  average = sum(trailing) / 12
  
  // Step 2: Apply industry growth factor
  // Industry defaults:
  //   remodeling: 12%
  //   fitness: 15%
  //   restaurant: 5%
  //   retail: 8%
  //   service: 10%
  
  growthFactor = getIndustryGrowth(client.industry)
  baseGrowth = average * (1 + growthFactor)
  
  // Step 3: Seasonal adjustment (if applicable)
  IF client.seasonalBusiness:
    seasonalIndex = getSeasonalIndex(client.industry, targetMonth)
    adjusted = baseGrowth * seasonalIndex
  ELSE:
    adjusted = baseGrowth
  
  // Step 4: Maturity buffer
  // Younger businesses have more natural volatility
  IF client.businessAge < 2 years:
    buffer = 20%
  ELSE IF client.businessAge < 5 years:
    buffer = 10%
  ELSE:
    buffer = 5%
  
  finalBaseline = adjusted * (1 + buffer)
  
  RETURN finalBaseline
Seasonal Index Table (Remodeling):
MonthIndexNotesJanuary0.65Post-holiday slowFebruary0.70Still slowMarch0.90Picking upApril1.15Spring rushMay1.30PeakJune1.35PeakJuly1.25StrongAugust1.20StrongSeptember1.10Winding downOctober1.00AverageNovember0.80Holiday slowdownDecember0.60Holiday slow

3.2 Fee Tier Generator
Purpose: Generate appropriate fee tiers based on business size.
FUNCTION generateFeeTiers(baselineMonthlyRevenue):

  // Determine category
  IF baseline < $10,000/month:
    category = "micro"
  ELSE IF baseline < $30,000/month:
    category = "small"
  ELSE IF baseline < $100,000/month:
    category = "medium"
  ELSE IF baseline < $300,000/month:
    category = "large"
  ELSE:
    category = "enterprise"
  
  RETURN TIER_TEMPLATES[category]
Tier Templates:
MICRO (Under $10k/month baseline)
TierGrowth RangeFeeFoundation0-25%7%Momentum26-50%20%Acceleration51-100%15%Scale101-200%12%Dominance201%+10%
No suggested cap

SMALL ($10k-$30k/month baseline)
TierGrowth RangeFeeFoundation0-25%5%Momentum26-50%15%Acceleration51-100%10%Scale101-200%7%Dominance201%+5%
Suggested caps: $8,000/month, $80,000/year

MEDIUM ($30k-$100k/month baseline)
TierGrowth RangeFeeFoundation0-25%4%Momentum26-50%8%Acceleration51-100%6%Scale101-200%5%Dominance201%+4%
Suggested caps: $12,000/month, $120,000/year

LARGE ($100k-$300k/month baseline)
TierGrowth RangeFeeFoundation0-25%3%Momentum26-50%5%Acceleration51-100%4%Scale101-200%3%Dominance201%+2.5%
Suggested caps: $15,000/month, $150,000/year

ENTERPRISE (Over $300k/month baseline)
TierGrowth RangeFeeFoundation0-25%2.5%Momentum26-50%4%Acceleration51-100%3%Scale101-200%2.5%Dominance201%+2%
Suggested caps: $25,000/month, $250,000/year

3.3 Monthly Fee Calculator
Purpose: Calculate the fee owed for a given month.
FUNCTION calculateMonthlyFee(client, monthlyRevenue):

  // Step 1: Get baseline
  baseline = calculateBaseline(client, monthlyRevenue.month)
  
  // Step 2: Calculate uplift
  uplift = monthlyRevenue.grossRevenue - baseline
  
  // If no uplift
  IF uplift <= 0:
    IF client.feeStructure.monthlyMinimum exists:
      RETURN {
        baseline: baseline,
        uplift: 0,
        fee: client.feeStructure.monthlyMinimum,
        feeType: "minimum retainer",
        breakdown: []
      }
    ELSE:
      RETURN {
        baseline: baseline,
        uplift: 0,
        fee: 0,
        feeType: "no uplift",
        breakdown: []
      }
  
  // Step 3: Calculate growth percentage
  growthPercent = uplift / baseline
  
  // Step 4: Apply tiered fees
  totalFee = 0
  breakdown = []
  
  FOR EACH tier IN client.feeStructure.tiers (sorted by floor):
    
    // Calculate dollar range for this tier
    tierFloor$ = baseline * tier.growthFloor
    tierCeiling$ = baseline * tier.growthCeiling
    tierRange$ = tierCeiling$ - tierFloor$
    
    // How much uplift falls in this tier?
    IF growthPercent > tier.growthFloor:
      
      IF growthPercent >= tier.growthCeiling:
        // Full tier applies
        applicableAmount = tierRange$
      ELSE:
        // Partial tier
        applicableAmount = (growthPercent - tier.growthFloor) * baseline
      
      tierFee = applicableAmount * tier.feePercentage
      totalFee += tierFee
      
      breakdown.push({
        tier: tier.tierName,
        applicableRevenue: applicableAmount,
        percentage: tier.feePercentage,
        fee: tierFee
      })
  
  // Step 5: Apply caps
  capped = false
  
  IF client.feeStructure.monthlyCap exists:
    IF totalFee > client.feeStructure.monthlyCap:
      totalFee = client.feeStructure.monthlyCap
      capped = true
  
  IF client.feeStructure.annualCap exists:
    yearToDate = sum of fees already calculated this year
    IF yearToDate + totalFee > client.feeStructure.annualCap:
      totalFee = client.feeStructure.annualCap - yearToDate
      capped = true
  
  RETURN {
    grossRevenue: monthlyRevenue.grossRevenue,
    baseline: baseline,
    uplift: uplift,
    growthPercentage: growthPercent,
    fee: totalFee,
    capped: capped,
    breakdown: breakdown
  }

3.4 Attribution Calculator
Purpose: Determine how much revenue is attributable to Sweet Dreams.
FUNCTION calculateAttribution(monthlyRevenue, leads):

  // Tally by source
  attributed = 0  // sweetDreams
  organic = 0
  referral = 0
  unknown = 0
  
  FOR EACH lead IN leads WHERE lead.status = 'won':
    
    IF lead.sourceCategory = 'sweetDreams':
      attributed += lead.finalValue
    ELSE IF lead.sourceCategory = 'organic':
      organic += lead.finalValue
    ELSE IF lead.sourceCategory = 'referral':
      referral += lead.finalValue
    ELSE:
      unknown += lead.finalValue
  
  // Handle unknown attribution
  // Apply ratio of known sources to unknown
  IF unknown > 0:
    knownTotal = attributed + organic + referral
    IF knownTotal > 0:
      attributedRatio = attributed / knownTotal
      attributed += unknown * attributedRatio
      organic += unknown * (1 - attributedRatio)
    ELSE:
      // All unknown - be conservative
      organic += unknown
  
  total = attributed + organic + referral
  attributionRate = attributed / total
  
  RETURN {
    totalRevenue: total,
    attributedRevenue: attributed,
    organicRevenue: organic,
    referralRevenue: referral,
    unknownRevenue: unknown,
    attributionRate: attributionRate
  }

3.5 Internal Payout Calculator
Purpose: Split collected fees among Business, Sales, and Worker.
FUNCTION calculatePayout(grossPayment, contractType):

  // Business reserve is ALWAYS 30%
  businessPercent = 0.30
  businessAmount = grossPayment * businessPercent
  
  // Get variable splits based on contract type and amount
  splits = getPayoutSplits(contractType, grossPayment)
  
  salesAmount = grossPayment * splits.salesPercent
  workerAmount = grossPayment * splits.workerPercent
  
  RETURN {
    grossPayment: grossPayment,
    businessAmount: businessAmount,
    businessPercent: 0.30,
    salesAmount: salesAmount,
    salesPercent: splits.salesPercent,
    workerAmount: workerAmount,
    workerPercent: splits.workerPercent
  }
Payout Split Tables:
Grand Slam Contracts
Revenue TierSalesWorkerBusiness$0 - $2,5000%70%30%$2,501 - $10,0007.5%62.5%30%$10,001 - $30,0007.2%62.8%30%$30,001 - $70,0005.9%64.1%30%$70,001 - $100,0004%66%30%$100,001 - $200,0003%67%30%$200,001+2.5%67.5%30%
Transactional Media Contracts
Revenue TierSalesWorkerBusiness$0 - $5,00020%50%30%$5,001 - $15,00015%55%30%$15,001 - $30,00010%60%30%$30,001 - $70,0008%62%30%$70,001+5%65%30%
Upfront Contracts
Revenue TierSalesWorkerBusiness$0 - $5,00010%60%30%$5,001 - $15,0008.6%61.3%30%$15,001 - $30,0006.8%63.1%30%$30,001 - $70,0005.2%64.8%30%$70,001+3%67%30%

3.6 Buyout Calculator
Purpose: Calculate exit fee when client wants to keep systems.
FUNCTION calculateBuyout(client):

  // Step 1: Base fee (average of last 3 months commission)
  lastThree = client.monthlyRevenue.last(3)
  averageCommission = sum(lastThree.feeCalculated) / 3
  
  // Step 2: Determine sustained growth duration
  // Count months with over 50% growth
  sustainedMonths = count(client.monthlyRevenue WHERE growthPercentage > 0.50)
  
  // Step 3: Apply longevity multiplier
  IF sustainedMonths < 3:
    multiplier = 1
  ELSE IF sustainedMonths < 6:
    multiplier = 2
  ELSE IF sustainedMonths < 12:
    multiplier = 4
  ELSE IF sustainedMonths < 24:
    multiplier = 6
  ELSE:
    multiplier = 10
  
  // Step 4: Calculate base buyout
  baseBuyout = averageCommission * multiplier
  
  // Step 5: Premiums
  IF client has custom code/workflows:
    baseBuyout *= 1.25
  
  IF client has trained AI systems:
    baseBuyout *= 1.15
  
  RETURN {
    averageMonthlyCommission: averageCommission,
    sustainedGrowthMonths: sustainedMonths,
    longevityMultiplier: multiplier,
    buyoutAmount: baseBuyout,
    
    includedAssets: [
      "Website ownership transfer",
      "Social media assets",
      "Custom workflows (perpetual license)",
      "Marketing templates",
      "Lead tracking systems"
    ],
    
    excludedAssets: [
      "SweetDreams Engine core code",
      "Ongoing support",
      "Future updates"
    ]
  }
Longevity Multiplier Table:
Sustained Growth DurationMultiplierLess than 3 months1x3 - 6 months2x6 - 12 months4x12 - 24 months6x24+ months10x

3.7 Health Score Calculator
Purpose: Quick assessment of client health (0-100).
FUNCTION calculateHealthScore(client):

  score = 0
  factors = {}
  
  // Growth Factor (0-30 points)
  growthRate = (currentMonth.revenue - baseline) / baseline
  IF growthRate > 0.50:
    score += 30
    factors.growth = "Excellent"
  ELSE IF growthRate > 0.25:
    score += 25
    factors.growth = "Strong"
  ELSE IF growthRate > 0.10:
    score += 20
    factors.growth = "Good"
  ELSE IF growthRate > 0:
    score += 15
    factors.growth = "Modest"
  ELSE:
    score += 5
    factors.growth = "Below baseline"
  
  // Attribution Factor (0-25 points)
  IF attributionRate > 0.50:
    score += 25
    factors.attribution = "High"
  ELSE IF attributionRate > 0.35:
    score += 20
    factors.attribution = "Good"
  ELSE IF attributionRate > 0.20:
    score += 15
    factors.attribution = "Moderate"
  ELSE:
    score += 5
    factors.attribution = "Low"
  
  // Engagement Factor (0-20 points)
  IF engagementRate > industryAverage * 1.5:
    score += 20
    factors.engagement = "Excellent"
  ELSE IF engagementRate > industryAverage:
    score += 15
    factors.engagement = "Good"
  ELSE:
    score += 10
    factors.engagement = "Average"
  
  // Payment Factor (0-15 points)
  IF all invoices paid on time:
    score += 15
    factors.payment = "Excellent"
  ELSE IF average delay < 7 days:
    score += 10
    factors.payment = "Good"
  ELSE:
    score += 5
    factors.payment = "Needs attention"
  
  // Communication Factor (0-10 points)
  IF responds within 24 hours:
    score += 10
    factors.communication = "Excellent"
  ELSE IF responds within 72 hours:
    score += 7
    factors.communication = "Good"
  ELSE:
    score += 3
    factors.communication = "Slow"
  
  // Determine grade
  IF score >= 90: grade = "A"
  ELSE IF score >= 80: grade = "B"
  ELSE IF score >= 70: grade = "C"
  ELSE IF score >= 60: grade = "D"
  ELSE: grade = "F"
  
  RETURN {
    score: score,
    grade: grade,
    factors: factors
  }

3.8 Scenario Projector
Purpose: Model "what if" scenarios for prospects and planning.
FUNCTION projectScenario(inputs, feeStructure, months):

  // inputs: { currentRevenue, industry, isSeasonal, growthRate }
  
  results = []
  cumulativeFees = 0
  
  baseline = calculateBaseline(inputs)
  
  FOR month = 1 TO months:
    
    // Project revenue with growth
    projectedRevenue = inputs.currentRevenue * (1 + inputs.growthRate * month/12)
    
    // Apply seasonality if applicable
    IF inputs.isSeasonal:
      seasonalIndex = getSeasonalIndex(inputs.industry, month)
      projectedRevenue *= seasonalIndex
    
    // Calculate fee
    feeCalc = calculateFee(projectedRevenue, baseline, feeStructure)
    cumulativeFees += feeCalc.fee
    
    results.push({
      month: month,
      projectedRevenue: projectedRevenue,
      baseline: baseline,
      uplift: feeCalc.uplift,
      growthPercentage: feeCalc.growthPercentage,
      fee: feeCalc.fee,
      cumulativeFees: cumulativeFees,
      effectiveRate: feeCalc.fee / projectedRevenue
    })
  
  // Check annual cap
  totalFees = cumulativeFees
  IF feeStructure.annualCap exists:
    IF totalFees > feeStructure.annualCap:
      totalFees = feeStructure.annualCap
      capApplied = true
  
  RETURN {
    monthlyProjections: results,
    annualRevenue: sum of projectedRevenue,
    annualFees: totalFees,
    effectiveAnnualRate: totalFees / annualRevenue,
    capApplied: capApplied
  }

SECTION 4: INTEGRATION SOURCES
4.1 Overview
We pull data automatically from external platforms. We enter revenue and lead outcomes manually based on client communication.
4.2 Automatic Data Pulls
SourceWhat We PullFrequencyConnectionMetricoolPosts, engagement, reach, impressions, followersDailyMetricool APIGoogle Analytics (GA4)Traffic, users, pages, goals, conversionsDailyGA4 APIGoogle Search ConsoleRankings, keywords, clicks, impressionsDailySearch Console APIGoogle Business ProfileLocal views, calls, directions, reviewsDailyGBP API
4.3 Manual Data Entry
DataSourceFrequencyWho EntersMonthly revenueClient (call/email)MonthlyUsJob countClient (call/email)MonthlyUsNew leadsClient reporting + observationAs they comeUsLead outcomesClient feedbackAs they closeUsOur activity/hoursInternal trackingWeeklyWorkerPayment receivedBank accountWhen paidUs
4.4 Social Media Scheduler: Metricool
Why Metricool:
RequirementMetricool DeliversMulti-clientUnlimited brands on agency plansAll platformsInstagram, Facebook, TikTok, YouTube, X, LinkedIn, Pinterest, Google Business, ThreadsSchedulingFull calendar, best-time suggestions, bulk uploadAnalyticsComprehensive per-platform statsAPI AccessFull REST API for pulling data into our systemPrice~$29/mo (5 brands), ~$99/mo (15 brands), custom for more
What We Pull From Metricool API:

Followers (by platform, over time)
Follower growth (net change)
Posts published (count, by platform)
Reach (by post, aggregate)
Impressions (by post, aggregate)
Engagements (likes, comments, shares, saves)
Engagement rate
Best performing posts
Best posting times

4.5 Google Integrations
Google Analytics (GA4)

Sessions / visits
Unique users
Page views
Top pages
Traffic sources
Average session duration
Bounce rate
Goal completions / conversions

Google Search Console

Search impressions
Search clicks
Click-through rate
Average position
Top queries
Top pages

Google Business Profile

Profile views
Search appearances
Phone calls
Direction requests
Website clicks
Review count / rating

Google Drive

Store contracts, proposals, reports
Link files to client records
Manual upload/download (no automation needed)

4.6 Integration Architecture
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL PLATFORMS                           │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│   Metricool   │   Google      │   Google      │   Google        │
│   ─────────   │   Analytics   │   Search      │   Business      │
│   Scheduling  │   (GA4)       │   Console     │   Profile       │
│   + Analytics │               │               │                 │
└───────┬───────┴───────┬───────┴───────┬───────┴────────┬────────┘
        │               │               │                │
        │     ┌─────────┴───────────────┴────────┐       │
        │     │         OAuth Tokens             │       │
        │     │   (stored per client/platform)   │       │
        │     └─────────────────┬─────────────────┘       │
        │                       │                         │
        └───────────────────────┼─────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULED JOBS (Daily 6am)                    │
│                                                                  │
│   FOR EACH active client:                                        │
│     FOR EACH connected integration:                              │
│       1. Check token validity (refresh if needed)                │
│       2. Pull yesterday's metrics                                │
│       3. Normalize data to our schema                            │
│       4. Store in daily_metrics table                            │
│       5. Flag any errors for review                              │
│                                                                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OUR DATABASE                                │
│                                                                  │
│   daily_metrics    →    monthly_analytics (aggregated)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

SECTION 5: USER INTERFACE
5.1 Dashboard Overview
We have four main dashboards:

Portfolio Dashboard - All clients at a glance
Client Detail Dashboard - Deep dive into one client
Financial Dashboard - Money tracking and payouts
Scenario Tool - Prospect modeling and projections


5.2 Portfolio Dashboard (Home Screen)
Purpose: See all clients at a glance, spot issues fast.
Summary Cards (Top)

Total Active Clients
Total Projected Monthly Fees
Total Collected This Month
Total Outstanding

Client Table
ColumnDescriptionClient NameClick to open detailStatusTrial / Active / PausedLast Month RevenueTheir grossCurrent Month RevenueIf enteredBaselineExpectedUplift %Growth over baselineProjected FeeWhat we're owedPaidYes / No / PartialHealth ScoreA / B / C / D / FLast ActivityDays agoAlertsCount
Table is sortable, filterable, color-coded by health
Quick Actions

Add New Client
Run Monthly Reconciliation
Generate Portfolio Report
View All Alerts


5.3 Client Detail Dashboard
Purpose: Everything about one client.
Header

Client Name
Status
Contract Start Date
Health Score (grade)
Current Tier Category

Tabs:

Tab: Performance
Key Metrics Cards (Current vs Last Month vs Baseline)

Revenue (with trend arrow)
Leads (with trend arrow)
Jobs (with trend arrow)
Conversion Rate (with trend arrow)

Charts

Revenue Over Time (12 months, line chart with baseline overlay)
Leads Over Time (12 months, by source)
Conversion Rate Over Time (12 months)

Source Breakdown (Pie Chart)

Sweet Dreams %
Organic %
Referral %
Unknown %


Tab: Social & Web Analytics
Social Summary

Total Followers (all platforms)
Follower Growth (this month)
Total Posts (this month)
Total Engagements
Engagement Rate
Top Platform

Platform Table
PlatformFollowersGrowthPostsReachEngagementInstagramFacebookTikToketc
Website Summary

Visits
Unique Users
Avg Session Duration
Bounce Rate
Goal Completions

Top Content

Top 5 Posts (by engagement)
Top 5 Pages (by visits)


Tab: Leads
Lead Funnel

Total Leads → Contacted → Quoted → Won / Lost / Pending

Lead Table
DateNameSourceChannelStatusEst ValueFinal ValueNotes
Add New Lead Button

Tab: Financials
Contract Terms Display

Baseline Method
Current Baseline
Tier Structure (table)
Monthly Cap
Annual Cap

Fee History Table
MonthRevenueBaselineUpliftFee OwedPaidPaid Date
Year Summary

Total Revenue
Total Uplift
Total Fees
Remaining Cap
Effective Rate

Projection Tool

Input: Assumed monthly revenue going forward
Output: Projected annual fee


Tab: Our Activity
Activity Log Table
DateTypeDescriptionHours
Add Activity Button
Monthly Summary

Content Produced
Posts Published
Hours Logged
Strategy Calls


Tab: Notes & Files
Notes

Rich text area
Timestamped entries
Internal only

Linked Google Drive Files

Contract: [link]
Proposals: [links]
Reports: [links]
Add Link Button


5.4 Financial Dashboard
Purpose: Track all money across all clients.
Period Selector

This Month / Last Month / This Quarter / This Year / Custom

Summary Cards

Total Fees Owed
Total Fees Collected
Total Outstanding
Collection Rate %

Client Fee Table
ClientRevenueBaselineUpliftFee OwedPaidAmount PaidOutstandingDays Out
Totals row at bottom
Export to CSV button
Internal Payout Calculator

Select payments to include (checkboxes)
Total Selected: $X
Calculate Splits:

Business Reserve (30%): $X
Sales Payout: $X
Worker Payout: $X


Record Payout Button

Payout History Table
DateGrossBusinessSalesWorkerNotes

5.5 Scenario Modeling Tool
Purpose: Model pricing for prospects and existing clients.
Input Section

Business Name (optional, for saving)
Industry (dropdown)
Current Monthly Revenue (number)
Trailing 12 Months (optional, 12 number inputs)
Seasonal Business (toggle)
Projected Growth Rate (slider: 10% to 200%)

Auto-Calculated Display

Business Category: [Micro/Small/Medium/Large/Enterprise]
Calculated Baseline: $X/month
Suggested Tiers: [table]
Suggested Caps: $X/month, $X/year

Projection Table
MonthProjected RevenueBaselineUpliftFeeCumulative12...12Total
Annual Summary

Total Projected Revenue: $X
Total Projected Fees: $X
Effective Rate: X%
Cap Applied: Yes/No

Comparison Mode

Structure A: [editable tiers and caps]
Structure B: [editable tiers and caps]
Side-by-Side Results
Annual Difference Highlighted

Actions

Export Proposal (PDF)
Save Scenario
Load Saved Scenario


SECTION 6: REPORTS
6.1 Report Philosophy
All reports are generated as PDFs. We download them, save to Google Drive, and share via email manually. No automated sending.
6.2 Available Reports
ReportAudienceFrequencyMonthly Performance ReportClient (we share)MonthlyQuarterly Business ReviewClient (we share)QuarterlyProposal DocumentProspect (we share)As neededPortfolio SummaryInternalMonthlyFinancial ReconciliationInternalMonthlyClient Profitability AnalysisInternalQuarterly

6.3 Monthly Performance Report (Client-Facing)
Cover Page

Client logo (if we have it)
"Monthly Performance Report"
Period: [Month Year]
Prepared by Sweet Dreams Media

Executive Summary (1 page)

Headline: "Your business generated $X this month, up Y% from baseline."
3-5 Key Wins (bullet points)
Key Metrics Box:

Revenue
Leads
New Customers
Top Source



Performance Details (1-2 pages)

Revenue Chart (6 months, line)
Lead Funnel Visual
Source Breakdown Pie Chart
Conversion Rate Trend

Social & Web Performance (1 page)

Social Highlights:

Total Reach
Total Engagement
Follower Growth
Top Post (screenshot or description)


Web Highlights:

Visits
Top Pages
Conversion Events



Content Recap (1 page)

Content Produced (list with thumbnails if possible)
Posts Published (count by platform)
Upcoming Content (preview)

Recommendations (1 page)

What Worked
Opportunities
Next Month Focus

Footer

Sweet Dreams Media contact info
"Prepared exclusively for [Client Name]"


6.4 Proposal Document (Prospect-Facing)
Cover Page

"Partnership Proposal"
"Sweet Dreams Media × [Prospect Name]"
Date

The Opportunity (1 page)

Personalized intro about their business
What we noticed about their market/competition
What we see as possible

Our Approach (1 page)

Partnership philosophy (not transactional)
Services we provide
How we work

The Numbers (1-2 pages)
Baseline Calculation

Their trailing revenue
Industry growth factor
Calculated baseline
Explanation of methodology

Tier Structure

Table of tiers and percentages
Why this is fair

Projections

Conservative scenario table
Moderate scenario table
Aggressive scenario table

Caps

Monthly cap
Annual cap
Explanation: "This protects you"

The Trial (1 page)

Duration: 30 days
What we need: access list
What they get: deliverables
No risk: explanation
Decision point: what happens at end

Next Steps (1 page)

If they say yes, what happens
Timeline
Contact info


6.5 Internal Reports
Portfolio Summary (Monthly)

All clients with status
Month-over-month revenue trends
Total fees collected
Alerts and flags
Health score distribution

Financial Reconciliation (Monthly)

Fees owed by client
Fees collected
Outstanding
Payout splits recorded
Year-to-date totals

Client Profitability Analysis (Quarterly)

Revenue per client
Hours per client
Effective hourly rate
Growth trajectory
Renewal risk flags


SECTION 7: WORKFLOWS
7.1 Monthly Reconciliation Workflow
Trigger: 1st of each month (reminder, then manual execution)
STEP 1: Pull Automated Data
─────────────────────────────
FOR EACH active client:
  • Trigger data pull from Metricool
  • Trigger data pull from GA4
  • Trigger data pull from Search Console
  • Trigger data pull from GBP
  • Aggregate into monthly_analytics record
  • Flag any connection errors

STEP 2: Collect Client Revenue
─────────────────────────────
FOR EACH active client:
  • Check if revenue entered for last month
  • IF not entered:
    → Add to "needs revenue" list
    → Send email/make call to request
    → Set 3-day follow-up reminder

STEP 3: Enter Revenue & Leads
─────────────────────────────
As client info comes in:
  • Enter gross revenue
  • Enter job count
  • Review lead list
  • Update lead outcomes (won/lost)
  • Add any new leads
  • Attribute sources

STEP 4: Run Calculations
─────────────────────────────
FOR EACH client with complete data:
  • Calculate baseline for month
  • Calculate attribution breakdown
  • Calculate uplift
  • Apply tier structure
  • Check caps
  • Store fee in monthly_revenue record

STEP 5: Generate Reports
─────────────────────────────
FOR EACH client:
  • Generate Monthly Performance Report (PDF)
  • Download
  • Save to Google Drive (client folder)
  • Email to client

STEP 6: Track Payment
─────────────────────────────
FOR EACH fee owed:
  • Add to outstanding list
  • When client pays:
    → Mark as paid in system
    → Enter paid date and amount
    → Calculate internal payout splits
    → Record payout

7.2 New Client Onboarding Workflow
STEP 1: Initial Setup
─────────────────────────────
- Create client record
- Enter business info
- Enter owner/contact info
- Select industry
- Set seasonality flags

STEP 2: Revenue History
─────────────────────────────
- Enter trailing 12-month revenue
  (or best estimate if not available)
- Enter average job value
- Enter average monthly jobs

STEP 3: Baseline & Terms
─────────────────────────────
- System calculates suggested baseline
- System generates recommended tiers
- Review and adjust if needed
- Set caps (monthly/annual)
- Set trial end date
- Save fee structure

STEP 4: Access & Integrations
─────────────────────────────
- Get social media credentials
- Add client to Metricool
- Connect their GA4 (get view access)
- Connect Search Console
- Connect Google Business Profile
- Test all connections
- Store tokens

STEP 5: Lead Tracking Setup
─────────────────────────────
- Create lead source templates
  (instagram, facebook, website, google, etc.)
- Document existing lead sources
- Establish current conversion baseline
- Set up UTM conventions

STEP 6: Documentation
─────────────────────────────
- Generate proposal document (if not already)
- Store signed contract in Google Drive
- Link Drive files in system
- Add onboarding notes

STEP 7: Activate
─────────────────────────────
- Set status to "trial" or "active"
- Start content calendar in Metricool
- Begin posting
- Begin tracking

7.3 Lead Entry Workflow
When a new lead comes in (client tells us or we observe):

1. Create lead record
2. Enter lead info (name, contact, date, job type)
3. Determine source:
   • Can we confirm where they came from?
   • If yes → select source, mark confidence "confirmed"
   • If likely → select likely source, mark "likely"
   • If unclear → mark "unknown"
4. Set estimated value
5. Set status to "new"

When lead status changes:

1. Update status (contacted, quoted, won, lost, pending)
2. If won:
   • Enter final value
   • Enter outcome date
3. If lost:
   • Enter reason in notes
4. Attribution flows into monthly calculations

SECTION 8: ALERTS
8.1 Alert Philosophy
Alerts appear on the dashboard. We check the dashboard regularly. No automated notifications—we're in control.
8.2 Alert Types
Performance Alerts
AlertConditionSeverityLow UpliftMonthly uplift < 10% of baselineWarningHigh GrowthMonthly uplift > 50% of baselinePositiveNegative GrowthRevenue below baselineCriticalDeclining Trend3 consecutive months of declineWarning
Attribution Alerts
AlertConditionSeverityLow AttributionAttribution rate < 15%WarningHigh UnknownUnknown source > 40% of leadsWarning
Operational Alerts
AlertConditionSeverityMissing RevenueDay 5+ of month, revenue not enteredWarningIntegration ErrorData pull failedCriticalNo ActivityNo activity logged in 14+ daysWarning
Financial Alerts
AlertConditionSeverityPayment OutstandingInvoice 15+ days unpaidWarningPayment Very LateInvoice 30+ days unpaidCriticalCap ApproachingYear-to-date fees > 80% of annual capInfoCap ReachedYear-to-date fees = annual capInfo
Trial Alerts
AlertConditionSeverityTrial Ending Soon7 or fewer days until trial endInfoTrial EndedTrial end date passed, no status changeWarning
8.3 Alert Display
On Portfolio Dashboard:

Alert count badge on each client row
Click to expand/see alerts
"View All Alerts" button

On Client Detail Dashboard:

Alert banner at top if any active alerts
List of current alerts
"Acknowledge" button to dismiss

Alert Record:



SECTION 9: ANALYTICS & PERFORMANCE TRACKING ENGINE (REVISED)

9.1 Overview
This is an internal operations tool. No clients ever log in. No automated invoicing. No payment processing. We track, calculate, generate reports, and download/print what we need. Client communication happens through email and Google Drive—manually, on our terms.
What this system does:

Pulls analytics from client websites and social platforms
Tracks leads and attributes them to sources
Logs our activity (content produced, hours worked)
Calculates what we're owed based on contract terms
Generates downloadable/printable reports and proposals
Stores everything for internal reference

What this system does NOT do:

Send invoices (we email those ourselves)
Process payments (we track manually when paid)
Give clients any access whatsoever
Automate client-facing communication


9.2 Data We Track
Client Business Metrics (Their Numbers)
BusinessMetrics {
  clientId: string
  period: date (YYYY-MM)
  
  // Revenue Metrics (we input from client conversations)
  grossRevenue: number
  jobCount: number
  averageJobValue: number
  largestJob: number
  smallestJob: number
  
  // Lead Metrics
  totalLeads: number
  qualifiedLeads: number
  proposalsSent: number
  proposalsAccepted: number
  leadToProposalRate: number (calculated)
  proposalCloseRate: number (calculated)
  overallConversionRate: number (calculated)
  
  // Source Tracking
  revenueBySource: array[RevenueBySource]
  leadsBySource: array[LeadsBySource]
  
  // Verification
  revenueVerified: boolean
  verificationMethod: string (selfReported, bankStatement, P&L)
  verificationDate: date
  notes: string
}
Sweet Dreams Activity Metrics (Our Numbers)
SweetDreamsActivity {
  clientId: string
  period: date (YYYY-MM)
  
  // Content Production
  videosProduced: number
  videosPublished: number
  photosProduced: number
  photosPublished: number
  graphicsCreated: number
  contentDaysCompleted: number
  
  // Social Media Activity (pulled from scheduler)
  postsPublished: number
  postsByPlatform: {
    instagram: number
    facebook: number
    tiktok: number
    youtube: number
    linkedin: number
    twitter: number
    googleBusiness: number
  }
  
  // Engagement Metrics (pulled from scheduler API)
  totalImpressions: number
  totalReach: number
  totalEngagements: number
  engagementRate: number
  followerGrowth: {
    instagram: number
    facebook: number
    tiktok: number
    youtube: number
    linkedin: number
    twitter: number
  }
  
  // Website Metrics (pulled from Google Analytics)
  websiteVisits: number
  uniqueVisitors: number
  pageViews: number
  averageSessionDuration: number
  bounceRate: number
  topLandingPages: array[PageMetric]
  goalCompletions: number
  
  // Time Investment
  hoursStrategy: number
  hoursProduction: number
  hoursPosting: number
  hoursCommunication: number
  totalHours: number
  
  // Communication Log
  strategyCallsHeld: number
  emailsSent: number
  reportsDelivered: number
}
Lead Tracking
LeadRecord {
  id: string
  clientId: string
  
  // Lead Info (we enter this)
  leadName: string
  leadContact: string (phone or email)
  leadDate: date
  jobType: string
  estimatedValue: number
  
  // Source Attribution
  sourceCategory: enum (sweetDreams, organic, referral, paid, unknown)
  sourceChannel: string (social, website, google, direct, phone, walkIn, referral)
  sourcePlatform: string (instagram, facebook, google, etc.)
  sourceContent: string (which post/page if known)
  
  // How We Know
  attributionConfidence: enum (confirmed, likely, assumed, unknown)
  attributionNotes: string
  
  // Outcome
  status: enum (new, contacted, quoted, won, lost, pending)
  finalValue: number (if won)
  outcomeDate: date
  outcomeNotes: string
}

9.3 Integration Sources
Automatic Data Pulls
SourceWhat We PullFrequencyConnection MethodSocial Media SchedulerPosts published, engagement, reach, impressions, follower countsDailyScheduler APIGoogle Analytics (GA4)Website visits, users, pages, conversions, traffic sourcesDailyGA4 APIGoogle Search ConsoleSearch impressions, clicks, rankings, keywordsDailySearch Console APIGoogle Business ProfileViews, searches, calls, direction requests, reviewsDailyGBP APIGoogle DriveAccess stored contracts, reports, client filesOn-demandDrive API
Manual Input (We Enter This)
Data TypeSourceFrequencyWho EntersClient monthly revenueClient call/emailMonthlyUsLead recordsClient reporting + our trackingAs they comeUsLead outcomesClient feedbackAs they closeUsOur activity/hoursInternal trackingWeeklyWorkerPayment receivedBank account checkAs paidUs

9.4 Social Media Scheduling Platform Recommendation
Requirements:

Handle many clients (agency/multi-brand model)
Schedule posts across all major platforms
Has API access to pull analytics into our system
Cost-effective at scale
Reliable, not going to disappear


TOP RECOMMENDATION: Metricool
FeatureDetailsMulti-clientYes—unlimited brands on agency plansPlatformsInstagram, Facebook, TikTok, YouTube, X, LinkedIn, Pinterest, Google Business, ThreadsSchedulingFull calendar, best-time suggestions, bulk uploadAnalyticsComprehensive per-platform statsAPI AccessFull REST API on paid plansCompetitor TrackingYes (bonus feature)Pricing~$29/mo (5 brands), ~$99/mo (15 brands), custom for 50+White-labelAvailable on higher tiers
Why Metricool:

API is accessible without enterprise pricing (unlike Hootsuite/Sprout)
Covers TikTok well (many don't)
Analytics are deep enough for real reporting
Price scales reasonably with client count
Interface is clean, easy to train someone on

Metricool API - What We Can Pull:

Engagement metrics (likes, comments, shares, saves)
Reach and impressions per post and aggregate
Follower growth over time
Individual post performance
Best posting times
Competitor benchmarks


Alternative Options:
PlatformStrengthsWeaknessesAPI AccessPricePublerCheap, solid featuresSmaller companyGood API~$12/mo (5 brands)SocialBeeContent categories, recyclingAPI is newerDecent~$49/mo (5 brands)LoomlyClean UI, approvals workflowAPI limited on lower tiersMedium~$79/mo (10 brands)AgorapulseStrong agency tools, inbox mgmtExpensiveGood (higher tiers)~$99/mo (10 profiles)SendibleBuilt for agencies, white-labelDated interfaceGood~$89/mo (12 profiles)Vista SocialModern, good analyticsNewer platformGood API~$39/mo (8 profiles)
Second Choice: Vista Social

Newer platform but built specifically for agencies
Modern interface
Good API documentation
Aggressive pricing
Worth watching as it matures


9.5 Integration Architecture
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DATA SOURCES                             │
├───────────────┬───────────────┬───────────────┬─────────────────────────┤
│  Metricool    │  Google       │  Google       │  Google                 │
│  (Scheduler)  │  Analytics    │  Search       │  Business               │
│               │  (GA4)        │  Console      │  Profile                │
├───────────────┼───────────────┼───────────────┼─────────────────────────┤
│  • Posts      │  • Traffic    │  • Rankings   │  • Local views          │
│  • Engagement │  • Users      │  • Keywords   │  • Calls                │
│  • Reach      │  • Pages      │  • Clicks     │  • Directions           │
│  • Followers  │  • Goals      │  • CTR        │  • Reviews              │
└───────┬───────┴───────┬───────┴───────┬───────┴────────────┬────────────┘
        │               │               │                    │
        └───────────────┴───────────────┴────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER (Our Backend)                      │
│                                                                          │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│   │  Scheduled      │   │  API            │   │  Data           │       │
│   │  Jobs (Daily)   │   │  Connectors     │   │  Normalizer     │       │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘       │
│                                                                          │
│   • Pull social stats at 6am daily                                       │
│   • Pull GA4 stats at 6am daily                                          │
│   • Pull GBP stats at 6am daily                                          │
│   • Normalize all data into our schema                                   │
│   • Flag anomalies or missing data                                       │
│                                                                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         OUR DATABASE (Supabase)                          │
│                                                                          │
│   Clients │ Contracts │ Metrics │ Leads │ Activity │ Calculations       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

9.6 Dashboards (Internal Only)
Portfolio Dashboard (Home Screen)
Purpose: See all clients at a glance, spot issues fast.
PortfolioDashboard {
  
  // Summary Cards
  totalActiveClients: number
  totalProjectedMonthlyFees: number
  totalCollectedThisMonth: number
  totalOutstanding: number
  
  // Client Table
  clientTable: {
    columns: [
      clientName,
      status (trial, active, paused),
      lastMonthRevenue,
      currentMonthRevenue (if entered),
      baselineExpected,
      upliftPercent,
      projectedFee,
      feeCollected (yes/no),
      healthScore (A/B/C/D/F),
      lastActivity (days ago),
      alerts (count)
    ]
    sortable: true
    filterable: true
    colorCoded: true
    clickToExpand: true
  }
  
  // Quick Actions
  actions: [
    "Add New Client",
    "Run Monthly Reconciliation",
    "Generate Portfolio Report",
    "View Alerts"
  ]
}
Client Detail Dashboard
Purpose: Deep dive into one client's performance and contract status.
ClientDetailDashboard {
  
  // Header
  clientName: string
  status: string
  contractStart: date
  currentTier: string
  healthScore: grade
  
  // Tab: Performance
  performanceTab: {
    
    // Key Metrics (Current Month vs Last Month vs Baseline)
    metricsCards: [
      { label: "Revenue", current, previous, baseline, trend },
      { label: "Leads", current, previous, trend },
      { label: "Jobs", current, previous, trend },
      { label: "Conversion Rate", current, previous, trend }
    ]
    
    // Charts
    revenueChart: LineChart (12 months, baseline overlay)
    leadsChart: LineChart (12 months, by source)
    conversionChart: LineChart (12 months)
    
    // Source Breakdown
    sourceBreakdown: PieChart {
      sweetDreams: percent
      organic: percent
      referral: percent
      unknown: percent
    }
  }
  
  // Tab: Social & Web Analytics
  analyticsTab: {
    
    // Social Summary (pulled from Metricool)
    socialSummary: {
      totalFollowers: number
      followerGrowth: number (this month)
      totalPosts: number (this month)
      totalEngagements: number
      engagementRate: percent
      topPlatform: string
    }
    
    // Platform Breakdown
    platformTable: {
      columns: [platform, followers, growth, posts, reach, engagement]
    }
    
    // Website Summary (pulled from GA4)
    webSummary: {
      visits: number
      uniqueUsers: number
      avgSessionDuration: string
      bounceRate: percent
      goalCompletions: number
    }
    
    // Top Content
    topPosts: Table (top 10 by engagement)
    topPages: Table (top 10 by visits)
  }
  
  // Tab: Leads
  leadsTab: {
    
    // Lead Funnel
    funnel: {
      totalLeads: number
      qualified: number
      quoted: number
      won: number
      lost: number
      pending: number
    }
    
    // Lead Table
    leadTable: {
      columns: [date, name, source, status, estimatedValue, finalValue, notes]
      filterable: true
      editable: true
    }
    
    // Add Lead Button
  }
  
  // Tab: Financials
  financialsTab: {
    
    // Contract Terms Display
    contractTerms: {
      baselineMethod: string
      currentBaseline: number
      tiers: display
      monthlyCap: number
      annualCap: number
    }
    
    // Fee History Table
    feeHistory: {
      columns: [month, revenue, baseline, uplift, feeOwed, paid, paidDate]
    }
    
    // Year Summary
    yearSummary: {
      totalRevenue: number
      totalUplift: number
      totalFees: number
      remainingCap: number
      effectiveRate: percent
    }
    
    // Projected Remaining Year
    projectedRemaining: {
      assumedMonthlyRevenue: input
      projectedAnnualFee: calculated
    }
  }
  
  // Tab: Our Activity
  activityTab: {
    
    // Activity Log
    activityLog: {
      columns: [date, type, description, hours]
      filterable: true
      addNew: button
    }
    
    // Monthly Summary
    monthlySummary: {
      contentProduced: number
      postsPublished: number
      hoursLogged: number
      strategyCallsHeld: number
    }
    
    // Content Calendar (view of scheduled posts)
    contentCalendar: embed from Metricool or simplified view
  }
  
  // Tab: Notes & Files
  notesTab: {
    
    // Notes (internal only)
    notes: textArea (rich text, timestamped entries)
    
    // Linked Google Drive Files
    driveFiles: {
      contract: link
      proposals: links
      reports: links
      addLink: button
    }
  }
}
Financial Summary Dashboard
Purpose: Track money across all clients.
FinancialDashboard {
  
  // Period Selector
  period: dropdown (This Month, Last Month, This Quarter, This Year, Custom)
  
  // Summary Cards
  totalFeesOwed: number
  totalFeesCollected: number
  totalOutstanding: number
  collectionRate: percent
  
  // Client Fee Table
  feeTable: {
    columns: [
      clientName,
      grossRevenue,
      baseline,
      uplift,
      feeOwed,
      paid (yes/no/partial),
      amountPaid,
      outstanding,
      daysOutstanding
    ]
    totals: row at bottom
    exportable: true
  }
  
  // Internal Payout Calculator
  payoutCalculator: {
    // Select which payments to include
    selectedPayments: checkboxes
    totalSelected: number
    
    // Calculate splits
    businessReserve: number (30%)
    salesPayout: number (varies)
    workerPayout: number (varies)
    
    // Record Payout Button
  }
  
  // Payout History
  payoutHistory: {
    columns: [date, grossAmount, business, sales, worker, notes]
  }
  
  // Charts
  revenueOverTime: LineChart (fees collected by month)
  clientBreakdown: BarChart (fees by client)
}
Scenario Modeling Tool
Purpose: Model pricing for prospects and existing clients.
ScenarioTool {
  
  // Input Section
  inputs: {
    businessName: text (optional, for saving)
    industry: dropdown
    currentMonthlyRevenue: number
    trailingRevenue: array[12] (optional for better baseline)
    isSeasonal: toggle
    projectedGrowthRate: slider (10% to 200%)
  }
  
  // Auto-Calculated
  calculations: {
    businessCategory: display (micro, small, medium, large, enterprise)
    suggestedBaseline: number
    suggestedTiers: display
    suggestedCaps: display
  }
  
  // Projection Table
  projectionTable: {
    columns: [month, projectedRevenue, baseline, uplift, fee, cumulative]
    rows: 12 months
    totals: annual summary
  }
  
  // Comparison Mode
  comparisonMode: {
    structure1: editable tiers
    structure2: editable tiers
    sideBySide: comparison display
    annualDifference: highlighted
  }
  
  // Export
  exportProposal: button (generates PDF)
  saveScenario: button (stores for later)
}

9.7 Report Generation
All reports are generated as PDFs for download/print. No automated sending.
Available Reports
ReportAudienceContentFrequencyMonthly Performance ReportClient (we share)Revenue, leads, social stats, content recap, recommendationsMonthlyQuarterly Business ReviewClient (we share)Quarter summary, trends, YoY, strategy review, goalsQuarterlyProposal DocumentProspectBaseline calculation, tier structure, projections, termsAs neededInternal Portfolio SummaryUsAll clients, fees, health scores, alertsMonthlyFinancial ReconciliationUsFees owed, collected, payoutsMonthlyClient Profitability AnalysisUsHours vs fees, effective hourly rate, ROI by clientQuarterly
Report Templates
Monthly Performance Report (Client-Facing)
MonthlyPerformanceReport {
  
  // Cover Page
  clientLogo (if available)
  reportTitle: "Monthly Performance Report"
  period: "January 2026"
  preparedBy: "Sweet Dreams Media"
  
  // Executive Summary (1 page)
  summarySection: {
    headline: "Your business generated $X this month, up Y% from baseline."
    keyWins: bulletPoints (3-5 highlights)
    keyMetrics: {
      revenue: number
      leads: number
      newCustomers: number
      topSource: string
    }
  }
  
  // Performance Details (1-2 pages)
  performanceSection: {
    revenueChart: lineChart (6 months)
    leadFunnel: visual
    sourceBreakdown: pieChart
    conversionRate: trend
  }
  
  // Social & Web Performance (1 page)
  digitalSection: {
    socialHighlights: {
      totalReach: number
      totalEngagement: number
      followerGrowth: number
      topPost: screenshot or description
    }
    webHighlights: {
      visits: number
      topPages: list
      conversionEvents: number
    }
  }
  
  // Content Recap (1 page)
  contentSection: {
    contentProduced: list with thumbnails
    postsPublished: count by platform
    upcomingContent: preview
  }
  
  // Recommendations (1 page)
  recommendationsSection: {
    whatWorked: bulletPoints
    opportunities: bulletPoints
    nextMonthFocus: bulletPoints
  }
  
  // Footer
  contactInfo: Sweet Dreams Media contact
  confidentiality: "Prepared exclusively for [Client Name]"
}
Proposal Document (Prospect-Facing)
ProposalDocument {
  
  // Cover Page
  title: "Partnership Proposal"
  subtitle: "Sweet Dreams Media × [Prospect Name]"
  date: date
  
  // The Opportunity (1 page)
  opportunitySection: {
    intro: personalized paragraph about their business
    marketContext: what we noticed about their competition
    potential: what we see possible
  }
  
  // Our Approach (1 page)
  approachSection: {
    philosophy: partnership not transaction
    whatWeHandle: services list
    howWeWork: brief process overview
  }
  
  // The Numbers (1-2 pages)
  numbersSection: {
    baselineCalculation: {
      theirTrailingRevenue: number
      industryGrowthFactor: percent
      calculatedBaseline: number
      explanation: how we got here
    }
    tierStructure: {
      table: tiers with percentages
      explanation: why this is fair
    }
    projections: {
      conservativeScenario: table
      moderateScenario: table
      aggressiveScenario: table
    }
    caps: {
      monthlyCap: number
      annualCap: number
      explanation: this protects you
    }
  }
  
  // The Trial (1 page)
  trialSection: {
    duration: 30 days
    whatWeNeed: access list
    whatYouGet: deliverables
    noRisk: explanation
    decisionPoint: what happens at end
  }
  
  // Next Steps (1 page)
  nextStepsSection: {
    ifYesPath: what happens next
    timeline: expected milestones
    contactInfo: how to proceed
  }
}

9.8 Workflows
Monthly Reconciliation Workflow (Internal Process)
MonthlyReconciliation {
  
  // Trigger: 1st of each month (manual or reminder)
  
  Step 1: Pull Automated Data
  ─────────────────────────────
  FOR EACH active client:
    • Pull Metricool data for previous month
    • Pull GA4 data for previous month
    • Pull GBP data for previous month
    • Store in daily_metrics table
    • Flag any missing data
  
  Step 2: Request Client Revenue
  ─────────────────────────────
  FOR EACH active client:
    • Check if revenue already entered
    • IF not: add to "needs revenue" list
    • Send email/call to request numbers
    • Set follow-up reminder for 3 days
  
  Step 3: Enter Revenue & Leads
  ─────────────────────────────
  FOR EACH client (as info comes in):
    • Enter gross revenue
    • Enter job count
    • Review/update lead outcomes
    • Mark any new leads
    • Attribute sources
  
  Step 4: Run Calculations
  ─────────────────────────────
  FOR EACH client with complete data:
    • Calculate baseline for month
    • Calculate uplift
    • Apply tier structure
    • Check caps
    • Generate fee amount
    • Store in monthly_revenue table
  
  Step 5: Generate Reports
  ─────────────────────────────
  FOR EACH client:
    • Generate Monthly Performance Report (PDF)
    • Download and save to Google Drive
    • Share with client via email
  
  Step 6: Track Payment
  ─────────────────────────────
  FOR EACH fee owed:
    • Add to outstanding list
    • When paid: mark as paid, enter date
    • Calculate internal payouts
    • Record payout splits
}
New Client Onboarding Workflow
ClientOnboarding {
  
  Step 1: Initial Setup
  ─────────────────────────────
  • Create client record
  • Enter business info
  • Enter trailing 12-month revenue (or best estimate)
  • Select industry
  • Set seasonality flags
  
  Step 2: Baseline & Terms
  ─────────────────────────────
  • System calculates suggested baseline
  • System generates recommended tiers
  • Review and adjust if needed
  • Set caps
  • Set trial end date
  • Save contract terms
  
  Step 3: Access & Integrations
  ─────────────────────────────
  • Get social media credentials
  • Add client to Metricool
  • Connect GA4 (get view access)
  • Connect Search Console
  • Connect Google Business Profile
  • Test all connections
  
  Step 4: Lead Tracking Setup
  ─────────────────────────────
  • Set up UTM conventions for this client
  • Create tracking spreadsheet/system
  • Document current lead sources
  • Establish baseline lead flow
  
  Step 5: Documentation
  ─────────────────────────────
  • Generate proposal document
  • Store signed contract in Google Drive
  • Link files in system
  • Add onboarding notes
  
  Step 6: Activate
  ─────────────────────────────
  • Set status to "trial" or "active"
  • Start content calendar
  • Begin tracking
}

9.9 Alerts System
Alerts appear on dashboard. No automated notifications—we check the dashboard.
AlertTypes {
  
  // Performance Alerts
  {
    type: "low_uplift"
    condition: monthlyUplift < (baseline * 0.10)
    severity: warning
    message: "[Client] uplift is only X% this month"
  }
  
  {
    type: "high_growth"
    condition: monthlyUplift > (baseline * 0.50)
    severity: positive
    message: "[Client] is up X%! Document what's working."
  }
  
  {
    type: "negative_growth"
    condition: monthlyRevenue < baseline
    severity: critical
    message: "[Client] is below baseline. Review immediately."
  }
  
  // Attribution Alerts
  {
    type: "low_attribution"
    condition: attributionRate < 0.15
    severity: warning
    message: "[Client] attribution rate is only X%. Check tracking."
  }
  
  {
    type: "high_unknown"
    condition: unknownSourceRate > 0.40
    severity: warning
    message: "[Client] has X% unknown source leads. Improve tracking."
  }
  
  // Operational Alerts
  {
    type: "missing_revenue"
    condition: dayOfMonth > 5 AND revenueNotEntered
    severity: warning
    message: "[Client] revenue not entered for last month."
  }
  
  {
    type: "integration_error"
    condition: dataPullFailed
    severity: critical
    message: "[Client] [Platform] data pull failed. Check connection."
  }
  
  // Financial Alerts
  {
    type: "payment_outstanding"
    condition: invoiceAge > 15 AND unpaid
    severity: warning
    message: "[Client] payment outstanding for X days."
  }
  
  {
    type: "cap_approaching"
    condition: yearToDateFees > (annualCap * 0.80)
    severity: info
    message: "[Client] is at X% of annual cap."
  }
  
  {
    type: "cap_reached"
    condition: yearToDateFees >= annualCap
    severity: info
    message: "[Client] has reached annual cap. No additional fees this year."
  }
  
  // Trial Alerts
  {
    type: "trial_ending"
    condition: daysUntilTrialEnd <= 7
    severity: info
    message: "[Client] trial ends in X days. Schedule review meeting."
  }
}

9.10 Database Schema (Complete)
sql-- =====================================================
-- CORE TABLES
-- =====================================================

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  owner_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_age INTEGER,
  employee_count INTEGER,
  service_area TEXT,
  is_seasonal BOOLEAN DEFAULT false,
  peak_months INTEGER[],
  slow_months INTEGER[],
  contract_type TEXT DEFAULT 'grandSlam',
  contract_start_date DATE,
  trial_end_date DATE,
  status TEXT DEFAULT 'trial',
  health_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fee Structures
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  baseline_method TEXT DEFAULT 'trailing12',
  baseline_growth_factor DECIMAL DEFAULT 0.12,
  seasonal_adjustment BOOLEAN DEFAULT false,
  monthly_cap DECIMAL,
  annual_cap DECIMAL,
  monthly_minimum DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fee Tiers
CREATE TABLE fee_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
  tier_name TEXT,
  growth_floor DECIMAL,
  growth_ceiling DECIMAL,
  fee_percentage DECIMAL,
  sort_order INTEGER
);

-- =====================================================
-- REVENUE & FINANCIAL TABLES
-- =====================================================

-- Trailing Revenue (historical, for baseline calculation)
CREATE TABLE trailing_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  revenue DECIMAL NOT NULL,
  job_count INTEGER,
  source TEXT DEFAULT 'client_reported',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monthly Revenue (ongoing tracking)
CREATE TABLE monthly_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  gross_revenue DECIMAL,
  job_count INTEGER,
  average_job_value DECIMAL,
  
  -- Attribution breakdown
  attributed_revenue DECIMAL,
  organic_revenue DECIMAL,
  referral_revenue DECIMAL,
  unknown_revenue DECIMAL,
  attribution_rate DECIMAL,
  
  -- Calculations
  baseline_expected DECIMAL,
  uplift_revenue DECIMAL,
  growth_percentage DECIMAL,
  fee_calculated DECIMAL,
  fee_after_cap DECIMAL,
  
  -- Payment tracking
  paid BOOLEAN DEFAULT false,
  paid_amount DECIMAL,
  paid_date DATE,
  
  -- Verification
  revenue_verified BOOLEAN DEFAULT false,
  verification_notes TEXT,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_id, month)
);

-- Internal Payouts
CREATE TABLE internal_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_date DATE,
  gross_amount DECIMAL NOT NULL,
  
  -- Splits
  business_amount DECIMAL,
  business_percentage DECIMAL,
  sales_amount DECIMAL,
  sales_percentage DECIMAL,
  worker_amount DECIMAL,
  worker_percentage DECIMAL,
  
  -- Source
  source_clients TEXT[], -- which clients this payment covers
  source_months TEXT[], -- which months
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LEAD TRACKING TABLES
-- =====================================================

-- Lead Sources (templates)
CREATE TABLE lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- sweetDreams, organic, referral, paid, unknown
  channel TEXT, -- social, website, google, direct, phone, walkIn
  platform TEXT, -- instagram, facebook, etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Lead info
  lead_name TEXT,
  lead_contact TEXT,
  lead_date DATE,
  job_type TEXT,
  estimated_value DECIMAL,
  
  -- Attribution
  source_id UUID REFERENCES lead_sources(id),
  source_category TEXT,
  source_channel TEXT,
  source_platform TEXT,
  source_content TEXT,
  attribution_confidence TEXT, -- confirmed, likely, assumed, unknown
  attribution_notes TEXT,
  
  -- Outcome
  status TEXT DEFAULT 'new', -- new, contacted, quoted, won, lost, pending
  final_value DECIMAL,
  outcome_date DATE,
  outcome_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Daily Metrics (from integrations)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL, -- instagram, facebook, tiktok, youtube, website, gbp, etc
  
  -- Flexible metric storage
  metric_name TEXT NOT NULL,
  metric_value DECIMAL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_id, date, platform, metric_name)
);

-- Monthly Analytics Summary (aggregated)
CREATE TABLE monthly_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  
  -- Social totals
  total_followers INTEGER,
  follower_growth INTEGER,
  total_posts INTEGER,
  total_reach INTEGER,
  total_impressions INTEGER,
  total_engagements INTEGER,
  engagement_rate DECIMAL,
  
  -- Platform breakdown (JSON for flexibility)
  platform_stats JSONB,
  
  -- Website
  website_visits INTEGER,
  unique_visitors INTEGER,
  page_views INTEGER,
  avg_session_duration DECIMAL,
  bounce_rate DECIMAL,
  goal_completions INTEGER,
  
  -- Top content
  top_posts JSONB,
  top_pages JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_id, month)
);

-- =====================================================
-- ACTIVITY TRACKING TABLES
-- =====================================================

-- Our Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  activity_type TEXT NOT NULL, -- content, posting, strategy, communication, admin
  description TEXT,
  quantity INTEGER,
  hours_spent DECIMAL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monthly Activity Summary
CREATE TABLE monthly_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  
  videos_produced INTEGER DEFAULT 0,
  videos_published INTEGER DEFAULT 0,
  photos_produced INTEGER DEFAULT 0,
  photos_published INTEGER DEFAULT 0,
  graphics_created INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  content_days INTEGER DEFAULT 0,
  
  hours_strategy DECIMAL DEFAULT 0,
  hours_production DECIMAL DEFAULT 0,
  hours_posting DECIMAL DEFAULT 0,
  hours_communication DECIMAL DEFAULT 0,
  total_hours DECIMAL DEFAULT 0,
  
  strategy_calls INTEGER DEFAULT 0,
  reports_delivered INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_id, month)
);

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  -- Connection details
  account_id TEXT,
  account_name TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMP,
  
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMP,
  last_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- info, warning, critical, positive
  message TEXT NOT NULL,
  
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Google Drive Links
CREATE TABLE drive_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  link_type TEXT NOT NULL, -- contract, proposal, report, other
  file_name TEXT,
  drive_url TEXT NOT NULL,
  drive_file_id TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Scenarios (for prospect modeling)
CREATE TABLE saved_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT,
  prospect_name TEXT,
  industry TEXT,
  baseline_revenue DECIMAL,
  
  -- Scenario data (JSON for flexibility)
  scenario_data JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_monthly_revenue_client_month ON monthly_revenue(client_id, month);
CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_daily_metrics_client_date ON daily_metrics(client_id, date);
CREATE INDEX idx_activity_log_client_date ON activity_log(client_id, date);
CREATE INDEX idx_alerts_client_acknowledged ON alerts(client_id, acknowledged);
```

---

## SECTION 10: SYSTEM ARCHITECTURE DIAGRAM (REVISED)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SWEET DREAMS GRAND SLAM SYSTEM                           │
│                         (Internal Operations Tool)                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DATA SOURCES                              │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   METRICOOL     │   GOOGLE        │   GOOGLE        │   GOOGLE              │
│   (Scheduler)   │   ANALYTICS     │   SEARCH        │   BUSINESS            │
│   ───────────   │   ───────────   │   CONSOLE       │   PROFILE             │
│   • Schedule    │   • Traffic     │   ───────────   │   ───────────         │
│   • Engagement  │   • Users       │   • Rankings    │   • Local views       │
│   • Reach       │   • Pages       │   • Keywords    │   • Calls             │
│   • Followers   │   • Goals       │   • Clicks      │   • Directions        │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         └─────────────────┴─────────────────┴────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION LAYER                                    │
│                                                                              │
│    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│    │  Scheduled Jobs  │    │  API Connectors  │    │  Data Processor  │     │
│    │  (Daily 6am)     │    │  (OAuth tokens)  │    │  (Normalize)     │     │
│    └──────────────────┘    └──────────────────┘    └──────────────────┘     │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                          DATABASE (Supabase)                                 │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │ Clients   │ │ Contracts │ │ Revenue   │ │ Leads     │ │ Analytics │     │
│  │ & Terms   │ │ & Tiers   │ │ & Fees    │ │ & Sources │ │ & Metrics │     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                    │
│  │ Activity  │ │ Payouts   │ │ Alerts    │ │ Drive     │                    │
│  │ Logs      │ │ & Splits  │ │           │ │ Links     │                    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘                    │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CALCULATION ENGINES                                   │
│                                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                   │
│  │ Baseline       │ │ Fee Tier       │ │ Monthly Fee    │                   │
│  │ Calculator     │ │ Generator      │ │ Calculator     │                   │
│  └────────────────┘ └────────────────┘ └────────────────┘                   │
│                                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                   │
│  │ Attribution    │ │ Payout         │ │ Health Score   │                   │
│  │ Engine         │ │ Calculator     │ │ Calculator     │                   │
│  └────────────────┘ └────────────────┘ └────────────────┘                   │
│                                                                              │
│  ┌────────────────┐ ┌────────────────┐                                      │
│  │ Scenario       │ │ Buyout         │                                      │
│  │ Projector      │ │ Calculator     │                                      │
│  └────────────────┘ └────────────────┘                                      │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTERNAL DASHBOARDS (Us Only)                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PORTFOLIO OVERVIEW                                                  │    │
│  │  All clients • Health scores • Fees owed • Alerts                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  CLIENT DETAIL                                                       │    │
│  │  Performance • Analytics • Leads • Financials • Activity • Notes    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FINANCIAL SUMMARY                                                   │    │
│  │  Fees owed • Collected • Outstanding • Internal payouts             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SCENARIO MODELER                                                    │    │
│  │  Prospect pricing • Structure comparison • Projections              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OUTPUTS (Download/Print)                           │
│                                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                   │
│  │ Performance    │ │ Proposal       │ │ Internal       │                   │
│  │ Reports (PDF)  │ │ Documents (PDF)│ │ Reports (PDF)  │                   │
│  │                │ │                │ │                │                   │
│  │ → Download     │ │ → Download     │ │ → Download     │                   │
│  │ → Print        │ │ → Print        │ │ → Print        │                   │
│  │ → Save to      │ │ → Save to      │ │                │                   │
│  │   Google Drive │ │   Google Drive │ │                │                   │
│  │ → Email to     │ │ → Email to     │ │                │                   │
│  │   client       │ │   prospect     │ │                │                   │
│  └────────────────┘ └────────────────┘ └────────────────┘                   │
│                                                                              │
│                    (All sharing done manually by us)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

SECTION 11: BUILD PHASES (REVISED)
Phase 1: Foundation (Week 1-2)

 Supabase project setup
 All database tables created
 Authentication (just for us, simple)
 Basic Next.js app structure

Phase 2: Core Calculations (Week 2-3)

 Baseline calculator function
 Fee tier generator function
 Monthly fee calculator function
 Attribution calculator function
 Payout calculator function
 Health score calculator function

Phase 3: Client Management (Week 3-4)

 Client list view
 Client create/edit form
 Contract terms configuration
 Fee structure setup
 Trailing revenue input

Phase 4: Data Entry (Week 4-5)

 Monthly revenue input form
 Lead tracking (add/edit/list)
 Lead outcome updates
 Activity logging
 Payment tracking (manual mark as paid)

Phase 5: Analytics Integration (Week 5-7)

 Metricool API connection
 Google Analytics API connection
 Google Search Console API connection
 Google Business Profile API connection
 Daily data pull jobs
 Data normalization and storage

Phase 6: Dashboards (Week 7-9)

 Portfolio overview dashboard
 Client detail dashboard (all tabs)
 Financial summary dashboard
 Alerts display

Phase 7: Scenario & Projections (Week 9-10)

 Scenario modeling tool
 Structure comparison
 Projection tables and charts
 Buyout calculator

Phase 8: Reports (Week 10-11)

 Monthly performance report PDF
 Proposal document PDF
 Internal portfolio summary PDF
 Financial reconciliation export
 Download/print functionality

Phase 9: Polish (Week 11-12)

 Google Drive integration (link storage)
 UI refinement
 Mobile responsiveness (for checking on phone)
 Performance optimization
 Bug fixes


SECTION 12: KEY DECISIONS TO FINALIZE
1. Attribution Model

Recommendation: Last-touch for fee calculation. Record first-touch for analysis.
Decision needed: Confirm this approach.

2. Unknown Lead Handling

Recommendation: Apply ratio of known attribution. If 60% of known leads are ours, assume 60% of unknown are too.
Decision needed: Confirm or choose conservative (count all unknown as organic).

3. Revenue Verification

Recommendation: Trust client reporting. Flag as "verified" if they provide bank statement/P&L. Only push for verification on large accounts or suspicious numbers.
Decision needed: Confirm approach.

4. Data Entry

Recommendation: We enter everything. Client provides numbers via call/email, we input.
Decision needed: Confirm this is the workflow.

5. Minimum Retainer

Recommendation: Default is no minimum (pure performance). Option to add minimum per contract for high-maintenance clients.
Decision needed: Confirm.

6. Cap Behavior

Recommendation: When cap is hit, we continue working. Use as leverage for renegotiation.
Decision needed: Confirm.

7. Metricool (or Alternative)

Recommendation: Metricool for scheduling + analytics API.
Decision needed: Confirm platform choice or evaluate alternatives.

8. Reporting Frequency

Recommendation: Monthly performance reports, quarterly deep reviews.
Decision needed: Confirm cadence.


DOCUMENT 1: CLIENT MEETING OUTLINE
(What Monster Remodeling receives to follow along)

PARTNERSHIP PROPOSAL
Sweet Dreams Media × Monster Remodeling

THE OPPORTUNITY
Your brand and business presentation stands out. It's genuinely different compared to the uninspired content most businesses in your area put out. You already have an excellent foundation for effective marketing.
High-end media allows your work to speak for itself—complemented by professional video and photography that matches the caliber of what you actually deliver.

OUR APPROACH
We don't want to sell you videos. We want to partner.

Our compensation is directly tied to your growth
If you don't grow, we don't get paid
That's our incentive to actually move the needle


WHAT THE PARTNERSHIP INCLUDES
Brand Responsibility

Website design and management
Logo variations for different uses
Consistent look across all posts and media

Core Media Production

Business Trailer (brand identity, mission, origin story, what you do, how you do it, case study footage)
Onboarding Videos (recruiting content that makes working for Monster feel inspiring)
Before & After Content (photo documentation, video walkthroughs)

Social Presence

Daily posts across 7 platforms
Mix of video-first content designed for free organic exposure
Photos (project documentation, before/after, team, etc.)
Daily maintenance—replying to comments and messages
Engaging with local community and potential leads

Communication & Strategy

Available daily to discuss media, strategy, opportunities
Integrated with your team's workflow
Monitor what content drives real leads
Track which trends convert to sales
Identify where every sale originates
Report on what's actually moving the needle

Offer Development Support

Help refine your offer and pricing
Psychological positioning in your market
Goal: make your offer beat every competitor


GROWTH GOALS

Build brand exposure so Monster is expected at events like the Home & Garden Show
Establish authority in your market
Create consistency that builds trust over time


THE 30-DAY TRIAL

No risk to you
We need access to your socials, Google Business, Apple Business
We create any other profiles needed
We've already started a new website for you
End of 30 days—we meet and review what changed
Even with small changes and 1-2 content days, we expect 1-3 more jobs minimum


THE DECISION
If you don't want to continue:

Keep everything we built
No cost to you

If you do continue:

Bracketed percentages of the growth we generate
No upfront cost—we only earn when you earn
Plus a team watching your leads and growth full-time


THE BOTTOM LINE
If your business isn't growing, it's dying. There's no standing still.


DOCUMENT 2: INTERNAL MEETING GUIDE
(For Sweet Dreams Media to control the meeting)

MEETING CONTROL SHEET
Monster Remodeling Partnership Pitch

PRE-MEETING CHECKLIST

 Client outline printed for them
 Final proposal letter ready (DO NOT give until end)
 New website mockup ready to show
 Competitor examples pulled up (show low-quality media)
 Our portfolio ready to contrast


MEETING FLOW
1. OPENING — The Hook (2-3 min)
SAY:

"We quoted you $500 for the before/after video—still happy to do that."
"But we think you're a fit for something bigger. An exclusive partnership we only offer to select businesses."
"We like how you carry yourselves and your brand."

TONE: Casual, complimentary, plant the seed that this is special.

2. THE PROBLEM WITH COMPETITORS (3-5 min)
SAY:

"We researched your competition."
"They might do good work, but their media is low quality."
"Makes even great craftsmanship look average."
"They feel bland. Uninspired."

DO: Pull up 2-3 competitor examples. Point out specifically what looks cheap or generic.
TRANSITION: "That's what makes you different..."

3. WHAT MAKES THEM DIFFERENT (2-3 min)
SAY:

"Your brand presentation already stands out."
"You have a strong foundation."
"We want to amplify that with professional media that matches the quality of your actual work."
"Quantity, quality, AND consistency."

TONE: Build them up. Make them feel seen.

4. OUR APPROACH — NOT A TRANSACTION (3-4 min)
SAY:

"We don't want to sell you videos."
"We want to partner—our pay is tied to your growth."
"If you don't grow, we don't get paid."
"That's our incentive to actually move the needle."

KEY POINT: Emphasize the risk is on US, not them.

5. WALK THROUGH THE SERVICES (5-7 min)
USE THE CLIENT OUTLINE. Go section by section:

Brand Responsibility
Core Media Production
Social Presence
Communication & Strategy
Offer Development Support

SAY for Offer Development:

"We get intertwined with your communication and operations."
"Not forceful, not disrespectful—just a resource."
"We track what's actually driving leads and where sales come from."
"We help you refine your offer, pricing, how you see your market."
"Goal: build an offer so good it beats every competitor."


6. GROWTH GOALS (1-2 min)
SAY:

"We want Monster to be EXPECTED at the Home & Garden Show."
"Authority in your market."
"Consistency that builds trust."


7. THE 30-DAY TRIAL (3-4 min)
SAY:

"No risk to you."
"We need access to your socials, Google Business, Apple Business."
"We'll create any other profiles needed."

DO: SHOW THE NEW WEBSITE MOCKUP HERE
SAY:

"We've already started."
"End of 30 days, we meet and review what changed."
"Even with small changes and 1-2 content days, we expect 1-3 more jobs minimum."


8. THE DECISION (2-3 min)
SAY:

"If you don't want to continue—keep everything. No cost."
"If you do continue—bracketed percentages of growth we generate."
"Still no upfront cost. We only earn when you earn."
"Plus you get a team watching your leads and growth full-time."

PAUSE. Let it land.
SAY:

"If your business isn't growing, it's dying. There's no standing still."


9. CLOSE & HANDOFF (2-3 min)
DO: Hand them the FINAL PROPOSAL LETTER (Document 3)
SAY:

"Here's everything we just discussed in writing."
"Take your time. Look it over."
"We're excited about this. We think it's a perfect fit."

WAIT for questions. Don't rush.

IMPROVEMENTS IDENTIFIED (DO NOT SHARE WITH CLIENT)
Use these as internal talking points if they ask "what would you change?" or to inform strategy:

Website needs updates
Google Service Area optimization needed
[Add any other specifics you've found]

These are leverage points—show you've done homework without making them feel criticized.

OBJECTION HANDLING
"We need to think about it."

"Absolutely. That's why we're giving you this in writing. The 30 days is no risk—you can decide after you see results."

"What if it doesn't work?"

"Then you keep everything we built and it cost you nothing. We take the risk."

"We've worked with agencies before and it didn't go well."

"That's exactly why we don't operate like an agency. We don't get paid unless you grow. Our success depends on yours."

"How much time do we need to put in?"

"Upfront there's setup and communication. After that, we handle the heavy lifting. We just need access and occasional content days."



DOCUMENT 3: FINAL PROPOSAL LETTER
(Handed off at the end of the meeting)

PARTNERSHIP PROPOSAL
Sweet Dreams Media × Monster Remodeling

We initially quoted the "before and after" video at $500, and we're still happy to provide that. However, we have an exclusive system we offer to a select few businesses, and we believe your business model is a perfect fit for a partnership. We admire the way you manage your brand and operations—your current approach to presenting your remodeling business is distinctive, making it an excellent foundation for effective marketing.
Here's what we've noticed: most of your competitors may do solid work, but their media is low quality, making even great craftsmanship feel average. High-end media allows the work to speak for itself—complemented by professional video and photography that matches the caliber of what you actually deliver. The combination of creative energy and professionalism makes a brand feel like it's on top of things, like they go above and beyond. That impression is built through consistency across all platforms—quantity, quality, and consistency in marketing. Your competitors feel bland in comparison. You already have the foundation; we want to amplify it.
We propose moving beyond a transactional relationship for one-off services. Instead, we want a partnership where our compensation is directly tied to your growth. This system incentivizes us to help you succeed, unlike simple video production with no guaranteed results or long-term direction.
This partnership requires upfront setup and ongoing communication. It involves updating all your business's public-facing pages and content, as well as close collaboration on backend processes. We become deeply intertwined with your communication and operations—not in a forceful or disrespectful way, but as a resource. Through ongoing marketing analysis, we track what's actually driving leads, which trends convert into real sales, and where those sales originate. That data positions us to help you refine your offer, your pricing, and how you approach your market psychologically. We believe we can help you build an offer so compelling it beats every competitor—something genuinely different.
To demonstrate the value, we offer a risk-free 30-day trial. To begin, we need access to all your current social media platforms, including your Google Business Page and Apple Business Page. We'll also create any additional profiles we deem necessary. We've already started building a new website for you.
At the end of the 30 days, we'll meet to review progress. We're confident that even with these foundational changes and one or two major content days, we can generate an additional 1–3 jobs for you, if not more.
Regardless of the outcome, you decide whether to continue. If you choose not to, you keep the strong foundation we've built onto your already excellent brand—at no cost to you.
Should you choose to move forward, our compensation will be structured as bracketed percentages tied to the stages of client growth we generate. No upfront cost—we only receive small portions of revenue after we've successfully created it for your business. Your business also gains enhanced organization, with a dedicated team monitoring lead drivers and focusing on strategies that actually move the needle.
If your business isn't growing, it's dying. There's no standing still.


THE CORE PROBLEM
Your original model assumed:

Small business ($5k/month)
Low baseline, high growth potential
Most of their growth = YOUR work

Monster Remodeling is different:

Already doing ~$380k/year (and growing)
Has existing momentum, reputation, word-of-mouth
Seasonal fluctuations (remodeling is slow in winter, booms in spring/summer)
Projecting $1M this year WITH OR WITHOUT you

The question you're really asking: How much of their growth is US vs. how much would have happened anyway?
If you charge 25% on all growth from $380k to $1M, that's $155,000 to Sweet Dreams. That's absurd for what you're actually providing—and they'd never agree to it.

THE BASELINE GROWTH ARCHITECTURE
You need to separate three types of growth:
1. Organic Baseline Growth
Growth that would happen anyway due to:

Existing reputation and word-of-mouth
Seasonal patterns (remodeling explodes March-October)
General market conditions
Their own sales efforts

For remodeling specifically: Industry average organic growth is 8-15% annually for established businesses. Monster is already outpacing that, which means they're good at what they do.
2. Momentum Growth
Growth from work they've already done that's compounding:

Past clients referring new ones
Reviews they've already earned
Jobs in progress that will close

3. Attributable Growth
Growth YOU actually cause:

Leads from new social presence
Website conversions from your redesign
Brand perception shift from professional media
Offer improvements from your strategic input

You should only be charging on #3.

HOW TO MEASURE ATTRIBUTABLE GROWTH
Method 1: Lead Source Tracking
Set up tracking so you KNOW where leads come from:

Specific landing pages you create
UTM parameters on social posts
"How did you hear about us?" on every inquiry
Dedicated phone numbers for different channels

Then you only take percentage on jobs that came from YOUR leads.
Method 2: Baseline + Uplift Model

Establish their "expected" trajectory without you
Only charge on growth ABOVE that line

For Monster:

Last 12 months: ~$380k
Industry baseline growth: +12% = $425k expected
If they hit $1M, the "uplift" = $575k
You charge percentage on the $575k, not the full $620k growth

Method 3: Tiered Caps for Larger Businesses
For businesses already doing $300k+, your percentages need to drop significantly:
Growth TierSmall Biz ($5k baseline)Mid Biz ($30k baseline)Large Biz ($300k+ baseline)First 25% growth7%5%3%26-50% growth25%15%5%51-100% growth20%10%4%100%+ growth15%7%3%

PROPOSED MODEL FOR MONSTER REMODELING
Given their situation:

~$380k trailing 12 months
Projecting $1M (but January is slow)
Women-owned, strong brand already
You're offering the Grand Slam

Option A: Lead Attribution Model (Most Fair)
Structure:

You track every lead source
You take 10-15% of revenue from jobs that came from YOUR marketing efforts
No percentage on their organic/existing pipeline

Pros: Completely fair, easy to justify
Cons: Requires diligent tracking, they might game it
Option B: Baseline + Reduced Percentage Model
Structure:

Establish baseline: Their trailing 12-month average monthly revenue = ~$31.6k/month
Apply industry growth factor: +12% = $35.4k/month expected baseline
You take percentage only on revenue ABOVE $35.4k/month
Percentage: 5-7% of uplift revenue

Example Month:

Monster does $90k in June (good month)
Baseline expected: $35.4k
Uplift: $54.6k
Your fee: $54.6k × 6% = $3,276

Annual Example:

They hit $1M for the year
Baseline expected: $425k
Uplift: $575k
Your annual fee: $575k × 6% = $34,500

That's much more reasonable than $155k.
Option C: Flat Retainer + Performance Bonus
Structure:

$2,500/month retainer (covers your baseline costs)
Plus 3% of revenue above baseline threshold
Cap at $8k/month maximum

This gives you:

Guaranteed income to cover your work
Upside if you crush it
Protection for them against runaway fees


THE CONVERSATION WITH MONSTER
Here's how I'd frame it in the meeting:

"We know you're already a successful business. You're not a startup we're building from zero. So our model adjusts for that. We're not going to take credit for growth that was already happening—that wouldn't be fair to you.
What we do is establish a baseline of where you'd be without us, and then we only take a percentage of the growth above that line. If we don't move the needle beyond what you'd do anyway, we don't get paid beyond our costs.
For a business at your level, we're looking at [X%] of attributable growth, with a monthly cap of [Y] to protect you. If we're as good as we think we are, we'll earn well. If we're not, you're protected."


WHAT YOU NEED TO FIGURE OUT

Their actual trailing 12-month revenue (get exact numbers, not projections)
Seasonality pattern (which months are big vs. slow?)
Where their current leads come from (so you can isolate your impact)
Their realistic ceiling (can they actually handle $1M in work? Do they have the crew?)


MY RECOMMENDATION FOR MONSTER
Given the size of their business, I'd go with:
Baseline + Reduced Percentage with Cap

Baseline: Trailing 12-month monthly average + 12%
Fee: 5% of monthly revenue above baseline
Monthly cap: $6,000
Annual cap: $60,000

30-Day Trial:

No fee during trial
Just prove you can generate trackable leads
Then negotiate final terms based on real data

This protects them, gives you upside, and—most importantly—is defensible. You can explain exactly why you're charging what you're charging.