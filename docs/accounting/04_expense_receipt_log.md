# Document 04: Expense Receipt Log

**File:** `04_expense_receipt_log.md`
**Frequency:** Per-Transaction / Monthly Aggregation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To track how the **35% Business Fund** is being spent. This document transforms "spending" into "tax write-offs" by creating a detailed, IRS-compliant record of every business expense. Without this log, expenses are just spending. With it, they are documented deductions that reduce Jay and Cole's personal tax liability at the end of the year.

Every single dollar that leaves the business account must have a corresponding entry in this log with a receipt attached.

---

## 2. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `expense_id` | String | Unique ID using format `EXP-YYYY-###` (e.g., `EXP-2026-087`). Sequential per calendar year. |
| `transaction_date` | Date | Date of purchase. |
| `vendor` | String | Where it was purchased (e.g., Sweetwater, B&H Photo, Amazon, Best Buy, Adobe). |
| `category` | Dropdown | See Section 3 for full category list with IRS mapping. |
| `subcategory` | String | More specific description (e.g., "Microphone" under Gear, "Premiere Pro" under Software). |
| `description` | Text | Brief business purpose note (e.g., "New condenser mic for Studio B vocal booth"). |
| `amount_paid` | Currency | Total amount including any sales tax paid to the vendor. |
| `sales_tax_paid` | Currency | The sales tax portion of the purchase (tracked separately for Indiana Form 103). |
| `payment_method` | String | Which business card/account was used (e.g., "Business Chase Debit," "Business Credit Card"). |
| `receipt_image` | File/Link | Photo, PDF, or cloud link to the receipt. **Mandatory — no receipt = no deduction.** |
| `asset_or_expense` | Dropdown | "Expense" (fully deductible this year) or "Asset" (must be depreciated or Section 179'd). See Section 4.3. |
| `section_179_eligible` | Boolean | If asset, is it eligible for immediate Section 179 deduction? |
| `useful_life_years` | Number | If asset and not Section 179'd, the depreciation period (typically 5 or 7 years for equipment). |
| `form_103_reportable` | Boolean | Must this item be reported on Indiana Business Personal Property Tax Form 103? |
| `month` | String | Month this expense falls into (e.g., "2026-03") for monthly aggregation. |

---

## 3. Expense Categories & IRS Mapping

| Category | Examples | IRS Form 1065 Line | Deduction Type |
|---|---|---|---|
| **Gear / Equipment** | Cameras, microphones, lights, monitors, audio interfaces | Line 20 (Other Deductions) or Depreciation Schedule | Asset or Section 179 |
| **Software** | Adobe Creative Cloud, Pro Tools, Final Cut Pro, plugins | Line 20 (Other Deductions) | Expense (subscription) or Asset (perpetual license) |
| **Insurance** | General liability, equipment insurance, E&O | Line 15 (Insurance) | Expense |
| **Rent / Lease** | Studio rent, co-working space, storage unit | Line 16a/16b (Rent) | Expense |
| **Utilities** | Electricity, internet, water (studio) | Line 20 (Other Deductions) | Expense |
| **Marketing** | Ads, website hosting, domain names, business cards, promo materials | Line 20 (Other Deductions) | Expense |
| **Vehicle / Travel** | Gas, mileage, parking, travel to shoots, flights | Line 20 or Schedule C equivalent | Expense (see 4.5) |
| **Office Supplies** | Paper, ink, hard drives, cables, batteries, SD cards | Line 20 (Other Deductions) | Expense |
| **Professional Services** | Accountant, lawyer, tax prep, business consulting | Line 17 (Legal and Professional Services) | Expense |
| **Meals (Business)** | Client meals, team working meals (50% deductible) | Line 20 (Other Deductions) | 50% Expense |
| **Education / Training** | Courses, workshops, certifications, books | Line 20 (Other Deductions) | Expense |
| **Bank / Payment Fees** | Transaction fees, monthly account fees, PayPal/Stripe fees | Line 20 (Other Deductions) | Expense |
| **Repairs & Maintenance** | Gear repair, studio maintenance, computer repair | Line 20 (Other Deductions) | Expense |
| **Subscriptions** | SaaS tools, cloud storage, streaming services (business use) | Line 20 (Other Deductions) | Expense |

---

## 4. Rules & Laws

### 4.1 IRS Publication 535 — Business Expenses

For an expense to be deductible, it must be both:

1. **Ordinary** — Common and accepted in the media/music production industry.
2. **Necessary** — Helpful and appropriate for the business (does not need to be indispensable).

> **Example:** A $3,000 camera is ordinary and necessary for a media production LLC. A $3,000 espresso machine is neither ordinary nor necessary (unless you're a coffee shop).

### 4.2 IRS Publication 463 — Travel, Gift, and Car Expenses

If Sweet Dreams incurs travel expenses for client shoots:

- **Local travel** (within Indianapolis metro): Track mileage at the IRS standard mileage rate (**$0.70/mile for 2026** — verify annually).
- **Overnight travel**: Lodging, meals (50%), and transportation are deductible if the trip is primarily for business.
- **Documentation required**: Date, destination, business purpose, and amount for every travel expense.

### 4.3 Section 179 Deduction vs. Depreciation

When Sweet Dreams purchases equipment (cameras, audio gear, computers), there are two options:

| Method | What It Does | When to Use | 2026 Limit |
|---|---|---|---|
| **Section 179** | Deduct the full cost in the year of purchase | When you want the maximum tax break NOW | Up to $1,250,000 (verify annually) |
| **MACRS Depreciation** | Spread the deduction over 5-7 years | When you want to smooth out deductions across years | N/A (follows IRS tables) |
| **Bonus Depreciation** | Deduct a percentage in year one, depreciate the rest | Phase-down in effect — 40% for 2026 (verify) | Applies to new and used property |

> **Recommendation for Sweet Dreams (growth phase):** Use **Section 179** for all qualifying equipment purchases. Since you're reinvesting every dime, maximizing current-year deductions lowers Jay and Cole's self-employment tax burden immediately.

### 4.4 Indiana Business Personal Property Tax — Form 103

Under **Indiana Code § 6-1.1-3**, any tangible personal property used in business (gear, equipment, furniture, computers) must be reported annually on **Form 103** (Business Tangible Personal Property Return).

**Key Requirements:**

| Item | Requirement |
|---|---|
| **Filing Deadline** | **May 15** of each year |
| **Late Penalty (< $2M cost)** | $25 flat |
| **Late Penalty (≥ $2M cost)** | $25 if filed by June 15; additional 20% if filed after June 15 |
| **Form Type** | Form 103-Short (total acquisition cost < $150,000) or Form 103-Long (≥ $150,000) |
| **What to Report** | All business tangible personal property at acquisition cost, organized by year of acquisition |
| **Depreciation** | Indiana uses its own depreciation table (not IRS MACRS) to calculate assessed value |
| **Filing Location** | Township assessor or county assessor where the property is physically located |

Every expense categorized as **"Gear / Equipment"** in this log with `form_103_reportable: Yes` must be carried over to **Document 20: Business Personal Property Tax (Form 103) Worksheet** at year-end.

### 4.5 Vehicle Expense Deduction — Two Methods

If Jay or Cole use personal vehicles for business:

| Method | How It Works | Best For |
|---|---|---|
| **Standard Mileage** | Track business miles × IRS rate ($0.70/mile for 2026) | Simpler; better if vehicle is older/paid off |
| **Actual Expense** | Track gas, insurance, repairs, depreciation; multiply by business-use percentage | Better if vehicle is new/expensive and heavily used for business |

> **Important:** You must choose one method in the first year and generally stick with it. Keep a mileage log (date, destination, purpose, miles) for either method.

### 4.6 Receipt Retention Requirements

| Authority | Minimum Retention | Notes |
|---|---|---|
| **IRS** | **7 years** from filing date | Recommended for all records |
| **Indiana DOR** | **3 years** from filing date | Sales tax records specifically |
| **Best Practice** | **Permanently** for asset purchases | Needed for depreciation schedules and Form 103 |

---

## 5. Business Relation

### 5.1 The 35% Business Fund Accountability

This log answers the question: **"Where did the 35% go?"** At any point, Jay and Cole should be able to:

1. Look at total revenue for a period
2. Calculate the 35% business fund
3. Compare it against total logged expenses
4. See a surplus (good — building reserves) or deficit (warning — overspending overhead)

```
Example Month:
  Total Revenue (all streams):     $8,000.00
  35% Business Fund:               $2,800.00
  Total Logged Expenses:           $2,150.00
  Surplus:                         $650.00 (rolls into reserves)
```

### 5.2 Tax Impact Illustration

Every dollar logged as a legitimate business expense reduces taxable income:

```
Without Expense Logging:
  Gross Revenue:           $96,000/year
  Taxable (to partners):   $96,000
  Self-Employment Tax:     ~$13,550 (15.3% on 92.35%)
  Federal Income Tax:      ~$10,000+ (depends on bracket)

With Proper Expense Logging ($25,000 in deductions):
  Gross Revenue:           $96,000/year
  Business Deductions:     −$25,000
  Taxable (to partners):   $71,000
  Self-Employment Tax:     ~$10,020 (saves ~$3,530)
  Federal Income Tax:      ~$7,500+ (saves ~$2,500+)

  TOTAL ESTIMATED SAVINGS: ~$6,000+/year
```

---

## 6. Monthly Reconciliation

At the end of each month, this log feeds into **Document 09: Monthly P&L Statement** and **Document 10: Business Fund Allocation Report**:

```
Σ amount_paid (all expenses in month) = Total Monthly Expenses
  → Broken down by category for P&L line items
  → Compared against 35% Business Fund for budget adherence
```

---

## 7. Audit Preparedness Checklist

If the IRS or Indiana DOR requests documentation:

- [ ] Every expense has a matching receipt image
- [ ] Every expense has a clear business purpose description
- [ ] Equipment purchases over $2,500 are properly classified as assets
- [ ] Vehicle expenses have supporting mileage logs
- [ ] Meal expenses are noted as 50% deductible with attendee names and business purpose
- [ ] No personal expenses are mixed in (this is the #1 audit trigger for LLCs)

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It feeds into Document 09 (Monthly P&L Statement), Document 10 (Business Fund Allocation Report), and Document 20 (Indiana Form 103 Personal Property Tax Worksheet).*
