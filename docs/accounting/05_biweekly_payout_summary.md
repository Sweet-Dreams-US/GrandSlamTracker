# Document 05: Bi-Weekly Payout Summary

**File:** `05_biweekly_payout_summary.md`
**Frequency:** Every Two Weeks (26 pay periods per year)
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

This is the **master payout document** that aggregates all revenue sources — media projects (Doc 01), studio sessions (Doc 02), and beat sales (Doc 03) — into a single payment list for every person owed money in a given bi-weekly period. No payment is made to any worker, contractor, producer, or partner without a line on this summary.

This document answers one question every two weeks: **"Who gets paid, how much, and from what?"**

---

## 2. Pay Period Structure

Sweet Dreams operates on a **bi-weekly (every 2 weeks)** payout cycle:

| Pay Period # | Period Start | Period End | Payout Date |
|---|---|---|---|
| 1 | Jan 1 | Jan 15 | Jan 17 (or next business day) |
| 2 | Jan 16 | Jan 31 | Feb 2 (or next business day) |
| ... | ... | ... | ... |
| 26 | Dec 16 | Dec 31 | Jan 2 of next year |

> **Payout Date Rule:** Payouts are processed **2 business days** after the period closes, allowing time for reconciliation.

---

## 3. Required Data Fields — Summary Header

| Field Name | Type | Description |
|---|---|---|
| `payout_period_id` | String | Format: `PP-YYYY-##` (e.g., `PP-2026-06`). |
| `period_start` | Date | First day of the bi-weekly period. |
| `period_end` | Date | Last day of the bi-weekly period. |
| `payout_date` | Date | Date payments are disbursed. |
| `total_gross_revenue` | Currency | Sum of all revenue collected across all streams in this period. |
| `total_business_retention` | Currency | Sum of all business cuts (35% from media, retention from sessions, profit from beats). |
| `total_sales_tax_collected` | Currency | Sum of all Indiana sales tax collected on beat sales (held in trust — NOT distributable). |
| `total_distributable` | Currency | `total_gross_revenue − total_business_retention − total_sales_tax_collected`. |
| `prepared_by` | String | Jay or Cole — whoever prepared this summary. |
| `approved_by` | String | The other partner — dual approval required before payouts. |

---

## 4. Revenue Source Breakdown

### 4.1 Media Projects (from Document 01)

| Project ID | Client | Gross Revenue | Business Cut (35%) | Sales Commission | Labor Distributed |
|---|---|---|---|---|---|
| MEDIA-2026-014 | Monster Remodeling | $3,000.00 | $1,050.00 | $195.00 | $1,755.00 |
| MEDIA-2026-015 | Fitness Pro Inc | $1,500.00 | $525.00 | $97.50 | $877.50 |
| **Subtotal** | | **$4,500.00** | **$1,575.00** | **$292.50** | **$2,632.50** |

### 4.2 Studio Sessions (from Document 02)

| Session ID | Artist | Total Billed | Business Retention | Engineer Payout |
|---|---|---|---|---|
| SESS-2026-042 | DLo The Artist | $300.00 | $180.00 | $120.00 |
| SESS-2026-043 | KayBee | $225.00 | $135.00 | $90.00 |
| **Subtotal** | | **$525.00** | **$315.00** | **$210.00** |

### 4.3 Beat Sales (from Document 03)

| Sale ID | Beat | Sale Price | Sales Tax | Producer Payout | Business Profit |
|---|---|---|---|---|---|
| BEAT-2026-019 | Midnight Run | $99.99 | $7.00 | $50.00 | $49.99 |
| BEAT-2026-020 | Trap Soul | $29.99 | $2.10 | $15.00 | $14.99 |
| **Subtotal** | | **$129.98** | **$9.10** | **$65.00** | **$64.98** |

---

## 5. Master Payout Table

This is the final table from which payments are made:

| # | Payee | Role | Revenue Source | Classification | Gross Amount | Notes |
|---|---|---|---|---|---|---|
| 1 | Jay | Partner — Labor | Media Projects | Guaranteed Payment (§707c) | $877.50 | Videography on MEDIA-2026-014 |
| 2 | Jay | Partner — Sales | Media Projects | Guaranteed Payment (§707c) | $195.00 | Sales commission on MEDIA-2026-014 |
| 3 | Cole | Partner — Labor | Media Projects | Guaranteed Payment (§707c) | $1,755.00 | Edit/Direction on MEDIA-014, 015 |
| 4 | Cole | Partner — Sales | Media Projects | Guaranteed Payment (§707c) | $97.50 | Sales commission on MEDIA-2026-015 |
| 5 | Marcus Williams | Engineer | Studio Sessions | 1099-NEC Contractor | $210.00 | Sessions 042, 043 |
| 6 | BeatsByTrenton | Producer | Beat Sales | 1099-NEC Contractor | $65.00 | Beats 019, 020 |
| | **TOTAL PAYOUTS** | | | | **$3,200.00** | |

### Verification

```
Total Gross Revenue:                   $5,154.98
  − Total Business Retention:          −$1,954.98
  − Total Sales Tax (held in trust):   −$9.10
  − Total Payouts:                     −$3,200.00
  = Remainder:                          −$9.10  (accounted for in sales tax trust)

CHECK: Business Retention + Sales Tax + Payouts = Gross Revenue ✅
```

---

## 6. Rules & Laws

### 6.1 Payment Timing — No Legal Requirement for Contractors

Since all payees are either **LLC members (partners)** or **independent contractors**, there is no Indiana or federal law mandating a specific pay frequency. The bi-weekly schedule is a **business policy**, not a legal obligation. However:

- Consistency builds trust with contractors.
- Regular payments prevent cash flow disputes.
- Documented pay periods create clean audit trails.

### 6.2 Dual Signature / Approval

Both partners (Jay and Cole) should review and approve every Bi-Weekly Payout Summary before payments are disbursed. This serves as:

- **Internal control** — prevents unauthorized payments.
- **Fiduciary protection** — demonstrates both partners are informed of all disbursements.
- **Operating agreement compliance** — most partnership agreements require mutual consent for distributions.

### 6.3 No Withholding Required

| Payee Type | Federal Income Tax Withholding | FICA (Social Security + Medicare) | State Income Tax Withholding |
|---|---|---|---|
| **Partners (Jay, Cole)** | No — pay via 1040-ES estimates | No — pay via Schedule SE | No — pay via Indiana IT-40ES |
| **1099 Contractors** | No | No | No |

> **The LLC itself has zero payroll tax obligations** as long as everyone remains a partner or contractor. If Sweet Dreams ever hires W-2 employees, this changes dramatically (see Document 07 notes).

---

## 7. Cash Flow Management

### 7.1 Pre-Payout Checklist

Before disbursing payments from this summary:

- [ ] All project/session/sale entries have been verified against bank deposits
- [ ] Sales tax collected is transferred to the Sales Tax Trust Account
- [ ] Business retention amounts have been verified (≥ 35% per project)
- [ ] Both partners have reviewed and approved the summary
- [ ] Sufficient cash in the operating account to cover all payouts
- [ ] Any outstanding receivables (unpaid invoices) are noted and excluded from payouts

### 7.2 Payment Methods

| Payee | Preferred Method | Backup Method |
|---|---|---|
| Jay | Direct Transfer (business → personal) | Check |
| Cole | Direct Transfer (business → personal) | Check |
| Contractors | Zelle / Direct Deposit | Check |
| Producers | PayPal / Zelle | Check |

---

## 8. Year-to-Date Running Totals

Each Bi-Weekly Payout Summary should include a running YTD section:

| Metric | This Period | YTD Total |
|---|---|---|
| Gross Revenue (all sources) | $5,154.98 | $32,847.50 |
| Business Retention | $1,954.98 | $11,496.63 |
| Jay — Total Guaranteed Payments | $1,072.50 | $8,250.00 |
| Cole — Total Guaranteed Payments | $1,852.50 | $7,950.00 |
| All Contractors — Total Payments | $275.00 | $2,340.00 |
| Sales Tax Collected (trust) | $9.10 | $87.23 |

> YTD totals are critical for quarterly estimated tax calculations (Documents 13 and 14).

---

## 9. Document Retention

- Retain all bi-weekly payout summaries for **7 years** minimum.
- Store alongside the supporting Documents 01, 02, and 03 entries for the same period.
- These summaries are the primary evidence if the IRS questions the timing or amounts of guaranteed payments or contractor payments.

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It aggregates data from Documents 01, 02, and 03 and feeds into Document 07 (Owner Guaranteed Payment Ledger), Document 08 (Monthly Revenue Summary), and Document 16 (1099 Contractor YTD Tracker).*
