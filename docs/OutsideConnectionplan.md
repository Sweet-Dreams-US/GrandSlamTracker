SWEET DREAMS MEDIA
External Platform & Integration Plan

SECTION 1: PLATFORM ECOSYSTEM OVERVIEW
1.1 The Full Picture
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                        SWEET DREAMS OPERATIONS                               │
│                                                                              │
├──────────────────────────────────┬───────────────────────────────────────────┤
│                                  │                                           │
│   MANUAL USE (You Work In)       │   AUTOMATED (Feeds Your Web App)         │
│                                  │                                           │
│   • Metricool App (posting)      │   • Metricool API (social stats)         │
│   • Google Drive (files)         │   • Google Analytics API (web stats)     │
│   • Gmail (client comms)         │   • Search Console API (SEO stats)       │
│   • Calendar (scheduling)        │   • Business Profile API (local stats)   │
│   • Bank Account (payments)      │                                           │
│                                  │                                           │
└──────────────────────────────────┴───────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │                              │
                    │   YOUR CUSTOM WEB APP        │
                    │   ────────────────────       │
                    │   • Client Management        │
                    │   • Analytics Dashboard      │
                    │   • Fee Calculations         │
                    │   • Lead Tracking            │
                    │   • Report Generation        │
                    │   • Payout Tracking          │
                    │                              │
                    └──────────────────────────────┘

1.2 Platform Summary
PlatformPurposeHow You Use ItConnects to Web App?MetricoolSocial scheduling + analyticsApp for posting, API for statsYes (API)Google Analytics (GA4)Website trackingSet up once, pulls automaticYes (API)Google Search ConsoleSEO trackingSet up once, pulls automaticYes (API)Google Business ProfileLocal presence trackingClient manages, you pull dataYes (API)Google DriveFile storageStore contracts, reports, proposalsLink only (manual)GmailClient communicationEmail invoices, reports, updatesNoGoogle CalendarSchedulingContent days, client meetingsNoBank AccountPaymentsCheck deposits, mark paid in systemNo (manual entry)

SECTION 2: DETAILED PLATFORM BREAKDOWN
2.1 METRICOOL
What It Is
Social media management platform. You use the app to schedule and post content. Your web app pulls analytics via API.
How You Use It (Manual)

Log into Metricool dashboard
Add each client as a "brand"
Connect their social accounts (Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Google Business)
Schedule posts using their content calendar
Monitor real-time engagement in their app

How Your Web App Uses It (API)

Pull follower counts (total and growth)
Pull engagement metrics (reach, impressions, likes, comments, shares)
Pull post performance data
Pull historical trends

Setup Per Client

Create brand in Metricool
Connect client's social accounts (they grant access)
Store Metricool brand ID in your web app
API pulls data automatically

Cost
TierBrandsPriceTeam 55 brands~$49/monthTeam 1010 brands~$99/monthTeam 1515 brands~$149/monthCustom15+Contact them
API Access

Included in paid plans
API key from dashboard settings
Rate limits: generous for daily pulls


2.2 GOOGLE ANALYTICS (GA4)
What It Is
Website analytics. Tracks visitors, behavior, conversions on client websites.
How You Use It (Setup)

Create GA4 property for each client (or they already have one)
Get "view" access to their property
Install tracking code on their website (one time)

How Your Web App Uses It (API)

Pull daily visitor counts
Pull traffic sources
Pull top pages
Pull session duration, bounce rate
Pull goal completions (if configured)

Setup Per Client

Client grants you "Viewer" access to their GA4 property
Note their GA4 Property ID
Store Property ID in your web app
API pulls data automatically

Cost

Free (GA4 is free, API is free)
API quota: 10,000 requests per day (more than enough)

API Access

Google Cloud Console → Enable Analytics Data API
OAuth2 or Service Account authentication
Well-documented, reliable


2.3 GOOGLE SEARCH CONSOLE
What It Is
SEO analytics. Shows how client sites perform in Google Search.
How You Use It (Setup)

Verify ownership of client's site (or they add you)
Get access to their Search Console property

How Your Web App Uses It (API)

Pull search impressions (how often they appear)
Pull search clicks (how often people click)
Pull average position (where they rank)
Pull top queries (what people search)
Pull top pages (what ranks)

Setup Per Client

Client grants you "Full" access to their Search Console property
Note their site URL (exact format matters)
Store site URL in your web app
API pulls data automatically

Cost

Free (Search Console is free, API is free)
API quota: generous

API Access

Google Cloud Console → Enable Search Console API
Same OAuth2/Service Account as GA4
Data is 2-3 days delayed (Google limitation)


2.4 GOOGLE BUSINESS PROFILE
What It Is
Local business listing (Google Maps, local search). Tracks local visibility and actions.
How You Use It (Setup)

Client should already have a Google Business Profile
They grant you "Manager" access
You can also manage it for them (respond to reviews, post updates)

How Your Web App Uses It (API)

Pull profile views
Pull search appearances
Pull phone calls (from listing)
Pull direction requests
Pull website clicks
Pull review count and rating

Setup Per Client

Client grants you Manager access to their GBP
Note their Location ID
Store Location ID in your web app
API pulls data automatically

Cost

Free (GBP is free, API is free)
API quota: limited but sufficient for daily pulls

API Access

Google Cloud Console → Enable My Business API
More complex setup than GA4/Search Console
Some endpoints being deprecated, check current docs

Note
GBP API has been changing. Google has been consolidating APIs. Verify current endpoints before building.

2.5 GOOGLE DRIVE
What It Is
Cloud file storage. Where you store contracts, proposals, reports.
How You Use It (Manual)

Create folder structure for clients
Store signed contracts
Store generated reports (after download from your app)
Store proposals
Share files with clients via link

How Your Web App Uses It

No API integration needed
Just store Google Drive links in your web app
Click link → opens Drive file

Folder Structure (Suggested)
Sweet Dreams Media/
├── Clients/
│   ├── Monster Remodeling/
│   │   ├── Contract/
│   │   │   └── Monster_Contract_2026.pdf
│   │   ├── Proposals/
│   │   │   └── Monster_Proposal_Jan2026.pdf
│   │   ├── Reports/
│   │   │   ├── Monster_Report_Jan2026.pdf
│   │   │   ├── Monster_Report_Feb2026.pdf
│   │   │   └── ...
│   │   └── Assets/
│   │       └── (logos, photos, etc.)
│   ├── Client 2/
│   │   └── ...
│   └── ...
├── Templates/
│   ├── Proposal_Template.docx
│   ├── Report_Template.docx
│   └── Contract_Template.docx
└── Internal/
    └── (internal docs)
Cost

Free (15GB with Google account)
$1.99/month for 100GB
$2.99/month for 200GB


2.6 GMAIL
What It Is
Email. How you communicate with clients.
How You Use It (Manual)

Email clients to request monthly revenue numbers
Email invoices (as PDF attachment or Google Drive link)
Email monthly reports (as PDF attachment or Google Drive link)
Email proposals
General client communication

How Your Web App Uses It

No API integration
You do this manually
Your web app might remind you who needs an email (via alerts)

Cost

Free (with Google account)
Google Workspace: $6/user/month (professional email @yourdomain.com)

Recommendation
Get Google Workspace for professional appearance:

cole@sweetdreamsmedia.com
Not cole.sweetdreams@gmail.com


2.7 GOOGLE CALENDAR
What It Is
Scheduling. Track content days, client meetings, deadlines.
How You Use It (Manual)

Schedule content production days
Schedule client meetings
Schedule monthly reconciliation reminders
Schedule trial end dates

How Your Web App Uses It

No API integration needed
Your web app has its own alerts for deadlines
Calendar is for your personal scheduling

Cost

Free (with Google account)
Included in Google Workspace


2.8 BANK ACCOUNT
What It Is
Where client payments land.
How You Use It (Manual)

Check for deposits
When payment received, mark as paid in your web app
Enter payment date and amount

How Your Web App Uses It

No API integration
Manual entry only
You check bank → you update system

Recommendation
Consider a business bank account separate from personal:

Mercury (online, free, good for small business)
Relay (online, free, good for categorization)
Local credit union


SECTION 3: CONNECTION ARCHITECTURE
3.1 Full Integration Map
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL PLATFORMS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  METRICOOL  │ │   GOOGLE    │ │   GOOGLE    │ │   GOOGLE    │ │   GOOGLE    │
│             │ │  ANALYTICS  │ │   SEARCH    │ │  BUSINESS   │ │   DRIVE     │
│  (Social)   │ │   (GA4)     │ │  CONSOLE    │ │  PROFILE    │ │  (Files)    │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │               │               │
       │ API           │ API           │ API           │ API           │ Links
       │               │               │               │               │ Only
       ▼               ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                              YOUR WEB APP                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      INTEGRATION LAYER                               │    │
│  │                                                                      │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │    │
│  │  │  Metricool   │ │    GA4       │ │   Search     │ │    GBP     │  │    │
│  │  │  Connector   │ │  Connector   │ │  Console     │ │ Connector  │  │    │
│  │  │              │ │              │ │  Connector   │ │            │  │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └─────┬──────┘  │    │
│  │         │                │                │               │         │    │
│  │         └────────────────┴────────────────┴───────────────┘         │    │
│  │                                   │                                  │    │
│  │                                   ▼                                  │    │
│  │                          ┌───────────────┐                          │    │
│  │                          │  Daily Job    │                          │    │
│  │                          │  (6am pull)   │                          │    │
│  │                          └───────┬───────┘                          │    │
│  │                                  │                                   │    │
│  └──────────────────────────────────┼───────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                           DATABASE                                    │   │
│  │                                                                       │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │   │
│  │  │  Clients   │ │  Revenue   │ │   Leads    │ │  Metrics   │        │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │   │
│  │  │  Contracts │ │  Payouts   │ │  Activity  │ │   Alerts   │        │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        CALCULATION ENGINES                            │   │
│  │                                                                       │   │
│  │  Baseline → Fee Tiers → Monthly Fees → Attribution → Payouts         │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                           USER INTERFACE                              │   │
│  │                                                                       │   │
│  │  Portfolio │ Client Detail │ Financials │ Scenarios │ Reports        │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                     │
                                     ▼
                              ┌─────────────┐
                              │   OUTPUTS   │
                              │             │
                              │  • PDFs     │
                              │  • Reports  │
                              │  • Exports  │
                              │             │
                              │  (Download) │
                              └─────────────┘

3.2 Data Flow Per Platform
Metricool → Web App
METRICOOL
    │
    │  API Call (daily)
    │  GET /brands/{id}/analytics
    │
    ▼
┌─────────────────────────────────────────┐
│  Data Received:                         │
│  • followers (by platform)              │
│  • follower_change                      │
│  • posts_published                      │
│  • reach                                │
│  • impressions                          │
│  • engagements                          │
│  • engagement_rate                      │
│  • top_posts                            │
└─────────────────────────────────────────┘
    │
    │  Normalize & Store
    │
    ▼
┌─────────────────────────────────────────┐
│  daily_metrics table                    │
│                                         │
│  client_id | date | platform | metric   │
│  ───────────────────────────────────    │
│  abc123    | 1/15 | instagram | followers: 5420  │
│  abc123    | 1/15 | instagram | reach: 12000     │
│  abc123    | 1/15 | facebook  | followers: 2100  │
│  ...                                    │
└─────────────────────────────────────────┘
    │
    │  Monthly Aggregation
    │
    ▼
┌─────────────────────────────────────────┐
│  monthly_analytics table                │
│                                         │
│  client_id | month | total_followers    │
│  abc123    | Jan   | 7520               │
│  abc123    | Jan   | follower_growth: 315        │
│  abc123    | Jan   | total_engagement: 4200      │
│  ...                                    │
└─────────────────────────────────────────┘
    │
    │  Display
    │
    ▼
┌─────────────────────────────────────────┐
│  Client Dashboard                       │
│  ─────────────────                      │
│  Social Performance This Month:         │
│  • Followers: 7,520 (+315)              │
│  • Reach: 89,000                        │
│  • Engagements: 4,200                   │
│  • Engagement Rate: 4.7%                │
└─────────────────────────────────────────┘
Google Analytics → Web App
GOOGLE ANALYTICS (GA4)
    │
    │  API Call (daily)
    │  POST /v1beta/{property}:runReport
    │
    ▼
┌─────────────────────────────────────────┐
│  Data Received:                         │
│  • sessions                             │
│  • users                                │
│  • newUsers                             │
│  • pageviews                            │
│  • avgSessionDuration                   │
│  • bounceRate                           │
│  • conversions (if goals set)           │
│  • topPages                             │
│  • trafficSources                       │
└─────────────────────────────────────────┘
    │
    │  Normalize & Store
    │
    ▼
┌─────────────────────────────────────────┐
│  daily_metrics table                    │
│                                         │
│  client_id | date | platform | metric   │
│  ───────────────────────────────────    │
│  abc123    | 1/15 | website  | visits: 245       │
│  abc123    | 1/15 | website  | users: 198        │
│  abc123    | 1/15 | website  | bounce: 45%       │
│  ...                                    │
└─────────────────────────────────────────┘
    │
    │  Monthly Aggregation
    │
    ▼
┌─────────────────────────────────────────┐
│  monthly_analytics table                │
│                                         │
│  website_visits: 6,200                  │
│  unique_visitors: 4,800                 │
│  avg_session_duration: 2:45             │
│  bounce_rate: 42%                       │
│  goal_completions: 34                   │
└─────────────────────────────────────────┘
    │
    │  Display
    │
    ▼
┌─────────────────────────────────────────┐
│  Client Dashboard                       │
│  ─────────────────                      │
│  Website Performance This Month:        │
│  • Visits: 6,200                        │
│  • Unique Users: 4,800                  │
│  • Avg Session: 2:45                    │
│  • Conversions: 34                      │
└─────────────────────────────────────────┘
Google Search Console → Web App
GOOGLE SEARCH CONSOLE
    │
    │  API Call (daily)
    │  POST /webmasters/v3/sites/{site}/searchAnalytics/query
    │
    ▼
┌─────────────────────────────────────────┐
│  Data Received:                         │
│  • impressions                          │
│  • clicks                               │
│  • ctr (click-through rate)             │
│  • position (average ranking)           │
│  • topQueries                           │
│  • topPages                             │
└─────────────────────────────────────────┘
    │
    │  Normalize & Store
    │
    ▼
┌─────────────────────────────────────────┐
│  daily_metrics table                    │
│                                         │
│  client_id | date | platform | metric   │
│  ───────────────────────────────────    │
│  abc123    | 1/15 | search   | impressions: 1200 │
│  abc123    | 1/15 | search   | clicks: 85        │
│  abc123    | 1/15 | search   | position: 12.4    │
│  ...                                    │
└─────────────────────────────────────────┘
    │
    │  Monthly Aggregation
    │
    ▼
┌─────────────────────────────────────────┐
│  monthly_analytics table                │
│                                         │
│  search_impressions: 28,000             │
│  search_clicks: 2,100                   │
│  search_ctr: 7.5%                       │
│  avg_position: 11.2                     │
│  top_queries: [...]                     │
└─────────────────────────────────────────┘
    │
    │  Display
    │
    ▼
┌─────────────────────────────────────────┐
│  Client Dashboard                       │
│  ─────────────────                      │
│  Search Performance This Month:         │
│  • Search Impressions: 28,000           │
│  • Search Clicks: 2,100                 │
│  • Click-Through Rate: 7.5%             │
│  • Avg Position: 11.2                   │
└─────────────────────────────────────────┘
Google Business Profile → Web App
GOOGLE BUSINESS PROFILE
    │
    │  API Call (daily)
    │  GET /v1/{name}/locations/{locationId}:getDailyMetricsTimeSeries
    │
    ▼
┌─────────────────────────────────────────┐
│  Data Received:                         │
│  • businessProfileViews                 │
│  • searchViews                          │
│  • mapViews                             │
│  • websiteClicks                        │
│  • phoneCalls                           │
│  • directionRequests                    │
└─────────────────────────────────────────┘
    │
    │  Normalize & Store
    │
    ▼
┌─────────────────────────────────────────┐
│  daily_metrics table                    │
│                                         │
│  client_id | date | platform | metric   │
│  ───────────────────────────────────    │
│  abc123    | 1/15 | gbp      | views: 89        │
│  abc123    | 1/15 | gbp      | calls: 4         │
│  abc123    | 1/15 | gbp      | directions: 7    │
│  ...                                    │
└─────────────────────────────────────────┘
    │
    │  Monthly Aggregation
    │
    ▼
┌─────────────────────────────────────────┐
│  monthly_analytics table                │
│                                         │
│  gbp_views: 2,400                       │
│  gbp_searches: 1,800                    │
│  gbp_calls: 95                          │
│  gbp_directions: 180                    │
│  gbp_website_clicks: 320                │
└─────────────────────────────────────────┘
    │
    │  Display
    │
    ▼
┌─────────────────────────────────────────┐
│  Client Dashboard                       │
│  ─────────────────                      │
│  Local Performance This Month:          │
│  • Profile Views: 2,400                 │
│  • Phone Calls: 95                      │
│  • Direction Requests: 180              │
│  • Website Clicks: 320                  │
└─────────────────────────────────────────┘

3.3 Client Setup Checklist
When onboarding a new client, you need to connect them to all platforms:
Metricool Setup

 Create new "brand" in Metricool
 Connect client's Instagram account
 Connect client's Facebook page
 Connect client's TikTok account (if applicable)
 Connect client's YouTube channel (if applicable)
 Connect client's LinkedIn page (if applicable)
 Connect client's X/Twitter (if applicable)
 Connect client's Google Business Profile
 Note the Metricool Brand ID
 Store Brand ID in your web app

Google Analytics Setup

 Confirm client has GA4 installed on website
 Request "Viewer" access to their GA4 property
 Note the GA4 Property ID
 Store Property ID in your web app

Google Search Console Setup

 Confirm client's site is verified in Search Console
 Request "Full" access to their property
 Note the exact site URL format
 Store site URL in your web app

Google Business Profile Setup

 Confirm client has a Google Business Profile
 Request "Manager" access
 Note the Location ID
 Store Location ID in your web app

Your Web App Setup

 Create client record
 Enter business info and trailing revenue
 Configure fee structure
 Store all platform IDs
 Test data pull for each integration
 Verify data is flowing


SECTION 4: MANUAL OPERATIONS
4.1 What You Do Outside the Web App
TaskPlatformFrequencySchedule and post contentMetricool appDailyStore contracts and reportsGoogle DriveAs neededEmail clientsGmailAs neededRequest monthly revenueGmailMonthly (1st-5th)Send invoicesGmail + DriveMonthlySend reportsGmail + DriveMonthlyCheck paymentsBank accountWeeklySchedule meetingsGoogle CalendarAs needed

4.2 Monthly Workflow (Manual + System)
Week 1 (1st - 7th)
Manual Tasks:

 Email all clients requesting last month's revenue
 Check bank for any outstanding payments

In Your Web App:

 System runs daily data pull (automatic)
 Review any data pull alerts/errors
 Enter revenue as clients respond
 Update lead outcomes

Week 2 (8th - 14th)
Manual Tasks:

 Follow up with clients who haven't sent revenue
 Check bank for payments

In Your Web App:

 Continue entering revenue
 Run fee calculations for completed clients
 Generate monthly reports (download PDFs)

Week 3 (15th - 21st)
Manual Tasks:

 Send monthly reports to clients (email + Drive)
 Send invoices for fees owed (email + Drive)
 Check bank for payments

In Your Web App:

 Mark invoices as sent
 Enter payments received
 Calculate internal payouts

Week 4 (22nd - End)
Manual Tasks:

 Follow up on unpaid invoices
 Plan next month's content
 Check bank for payments

In Your Web App:

 Update payment status
 Record internal payouts
 Review alerts and client health


4.3 File Naming Conventions
Google Drive Files
Contracts:
[ClientName]_Contract_[Year].pdf
Monster_Remodeling_Contract_2026.pdf
Proposals:
[ClientName]_Proposal_[MonthYear].pdf
Monster_Remodeling_Proposal_Jan2026.pdf
Monthly Reports:
[ClientName]_Report_[MonthYear].pdf
Monster_Remodeling_Report_Jan2026.pdf
Monster_Remodeling_Report_Feb2026.pdf
Invoices:
[ClientName]_Invoice_[Number]_[MonthYear].pdf
Monster_Remodeling_Invoice_001_Jan2026.pdf
Monster_Remodeling_Invoice_002_Feb2026.pdf

SECTION 5: COST SUMMARY
5.1 Platform Costs
PlatformCostNotesMetricool$49-149/monthDepends on # of brandsGoogle AnalyticsFreeAPI includedGoogle Search ConsoleFreeAPI includedGoogle Business ProfileFreeAPI includedGoogle DriveFree - $2.99/month15GB free, upgrade if neededGmailFree - $6/monthFree works, Workspace for pro emailGoogle CalendarFreeIncluded with Google accountTOTAL$49-158/month
5.2 Recommended Stack (10 Clients)
PlatformTierCostMetricoolTeam 10$99/monthGoogle WorkspaceBusiness Starter$6/monthGoogle DriveIncluded in Workspace$0All Google APIsFree$0TOTAL$105/month
5.3 Scaling Costs
ClientsMetricool TierMonthly Cost1-5Team 5~$55/month6-10Team 10~$105/month11-15Team 15~$155/month16-25Custom~$200-250/month25+CustomContact Metricool

SECTION 6: IMPLEMENTATION CHECKLIST
6.1 One-Time Setup (Do Once)
Google Cloud Console

 Create Google Cloud project
 Enable Google Analytics Data API
 Enable Search Console API
 Enable My Business API (GBP)
 Create service account OR set up OAuth2
 Download credentials

Metricool

 Create Metricool account
 Choose appropriate tier
 Get API key from settings

Google Workspace (Optional but Recommended)

 Set up Google Workspace for your domain
 Create professional email (you@sweetdreamsmedia.com)
 Set up Drive folder structure

Your Web App

 Build integration connectors
 Set up daily job scheduler
 Build data storage tables
 Test all connections

6.2 Per-Client Setup

 Add to Metricool, connect their accounts
 Get GA4 access, note Property ID
 Get Search Console access, note site URL
 Get GBP access, note Location ID
 Create client in your web app
 Store all IDs/credentials
 Test data pull
 Create Google Drive folder
 Store contract


SECTION 7: SUMMARY
What You Use Manually
PlatformWhat ForMetricool AppSchedule and post contentGoogle DriveStore and share filesGmailClient communicationGoogle CalendarYour scheduleBank AccountCheck payments
What Feeds Your Web App Automatically
PlatformWhat DataMetricool APISocial followers, reach, engagement, postsGA4 APIWebsite visits, users, pages, conversionsSearch Console APISEO impressions, clicks, rankingsGBP APILocal views, calls, directions
What You Enter Manually in Your Web App
DataSourceClient monthly revenueClient tells youJob countClient tells youLeads and outcomesClient + your observationYour activity hoursYour trackingPayment receivedYou check bank