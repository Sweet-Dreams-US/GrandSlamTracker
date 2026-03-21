# Document 01: Media Project Split Sheet

**File:** `01_media_project_split.md`
**Frequency:** Per-Project / Bi-Weekly Aggregation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To track high-ticket media contracts (monthly retainers, one-off video shoots, content packages) and ensure the **35% business overhead** is reserved before any labor is distributed. This document is the single source of truth for how gross revenue from a media job flows into the business fund, sales commissions, and worker payouts.

Every media project — whether a $500 social media shoot or a $10,000 monthly retainer — must have a completed split sheet before any labor is paid out on a bi-weekly cycle.

---

## 2. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `project_id` | String | Unique ID using format `MEDIA-YYYY-###` (e.g., `MEDIA-2026-001`). Sequential per calendar year. |
| `project_date` | Date | Date the project was completed or the invoice period began. |
| `client_name` | String | Name of the entity paying for the service. Must match the name on the invoice. |
| `project_description` | Text | Brief description of deliverables (e.g., "4 social media reels + 1 brand video"). |
| `gross_revenue` | Currency | Total contract price billed to the client (e.g., $1,500.00). This is the pre-split amount. |
| `business_cut_35` | Formula | `gross_revenue × 0.35` — The portion retained by Sweet Dreams Media LLC for overhead, insurance, equipment, and reinvestment. |
| `labor_pool_65` | Formula | `gross_revenue × 0.65` — The portion available for distribution to sales reps and workers. |
| `sales_rep` | String | Name of the person who originated the lead or closed the deal. |
| `sales_commission_pct` | Percentage | The agreed-upon sales commission percentage (typically 10–20% of the labor pool). |
| `sales_commission` | Formula | `labor_pool_65 × sales_commission_pct` — Dollar amount paid to the sales rep. |
| `remaining_labor_pool` | Formula | `labor_pool_65 − sales_commission` — Amount available for workers after sales is paid. |
| `worker_breakdown` | Array/List | Each worker's name, role on the project, hours worked, and dollar amount assigned from the remaining labor pool. |
| `total_labor_distributed` | Formula | Sum of all amounts in `worker_breakdown`. Must equal `remaining_labor_pool`. |
| `pay_period` | String | The bi-weekly pay period this project falls into (e.g., "2026-03-01 to 2026-03-15"). |
| `notes` | Text | Any special terms, discounts, or adjustments. |

---

## 3. Example Entry

```
project_id:           MEDIA-2026-014
project_date:         2026-03-10
client_name:          Monster Remodeling LLC
project_description:  Monthly content package — 8 reels, 2 long-form videos
gross_revenue:        $3,000.00
business_cut_35:      $1,050.00
labor_pool_65:        $1,950.00
sales_rep:            Cole
sales_commission_pct: 10%
sales_commission:     $195.00
remaining_labor_pool: $1,755.00

worker_breakdown:
  - Jay:    $877.50  (Videography, editing — 12 hrs)
  - Cole:   $877.50  (Direction, color grade — 12 hrs)

total_labor_distributed: $1,755.00
pay_period:              2026-03-01 to 2026-03-15
```

---

## 4. Rules & Laws

### 4.1 IRS Section 707(c) — Guaranteed Payments

The amounts paid to Jay and Cole from the labor pool are classified as **Guaranteed Payments** under IRC § 707(c). These payments are:

- Made to partners for **services rendered** to the partnership, regardless of partnership income.
- **Not dependent** on the 50/50 ownership split — they are compensation for actual work performed.
- **Deductible** by the partnership as a business expense on Form 1065, Line 10.
- **Reportable** on each partner's Schedule K-1 (Form 1065), Box 4a ("Guaranteed payments for services").
- Subject to **self-employment tax** (Social Security + Medicare) on each partner's individual Form 1040, Schedule SE.

> **Key Distinction:** If Jay works 20 hours on a project and Cole works 5 hours, Jay receives more from the labor pool. This is NOT a profit distribution — it is a guaranteed payment for services. The 50/50 ownership split only applies to residual profits after all guaranteed payments and expenses are accounted for.

### 4.2 Labor Pool as a Business Expense

The 65% labor pool is a **direct business expense** of the LLC. Under IRS Publication 535 ("Business Expenses"), payments to workers for services rendered are "ordinary and necessary" expenses that reduce the partnership's taxable income reported on Form 1065.

### 4.3 Independent Contractor Payments

If external workers (non-partners) are listed in `worker_breakdown`, those payments are:

- Subject to **1099-NEC reporting** if the worker receives $600+ in a calendar year (note: the threshold increases to $2,000 for payments made in 2026, reportable on 1099-NECs filed in early 2027, per the One Big Beautiful Bill Act).
- **Not subject to withholding** — the LLC does not withhold income tax, Social Security, or Medicare from contractor payments.
- The LLC must verify contractor status using the **IRS 20-factor test** and/or **Economic Reality Test** to avoid misclassification penalties under the Fair Labor Standards Act (FLSA).

### 4.4 Indiana Wage Payment Statutes

Indiana Code § 22-2-5 (Wage Payment) does not apply to independent contractors or LLC members receiving guaranteed payments. However, if Sweet Dreams ever hires W-2 employees for media work, Indiana requires payment at least **twice per month** (semi-monthly), and final wages must be paid by the **next regular payday** after separation.

---

## 5. Business Relation

This document ensures that:

1. **The Business Fund (35%) is untouchable.** No matter how the labor is split, overhead is reserved first. This funds insurance ($2M general liability), equipment replacement, software subscriptions, and growth reinvestment.
2. **Unequal work gets fair pay.** Jay and Cole may do unequal amounts of work on any given project. The split sheet documents exactly who did what, protecting both partners.
3. **Audit trail for the IRS.** Each split sheet creates a paper trail connecting gross revenue → business retention → labor distribution, which directly maps to Form 1065 line items.
4. **Sales incentives are documented.** If a sales rep (including Jay or Cole acting in that capacity) brings in a job, their commission is recorded separately from their labor payment.

---

## 6. Reconciliation Checkpoint

At the end of each bi-weekly pay period, all Media Project Split Sheets for that period must be aggregated into **Document 05: Bi-Weekly Payout Summary**. The following must balance:

```
Σ gross_revenue (all projects in period) =
  Σ business_cut_35 +
  Σ sales_commission +
  Σ total_labor_distributed
```

Any discrepancy triggers a review before payouts are processed.

---

## 7. Document Retention

Per IRS guidelines and Indiana record-keeping requirements:

- **Retain for a minimum of 7 years** from the date the associated tax return was filed.
- Store digital copies in a secure, backed-up location (Google Drive, Supabase, or equivalent).
- Physical receipts or contracts tied to a project should be cross-referenced by `project_id`.

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It feeds into Document 05 (Bi-Weekly Payout Summary) and Document 09 (Monthly P&L Statement).*
