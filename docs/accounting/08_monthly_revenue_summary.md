# Document 08: Monthly Revenue Summary

**File:** `08_monthly_revenue_summary.md`
**Frequency:** Monthly (prepared within 5 business days of month-end)
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To consolidate all revenue from all three business streams — Media Projects, Studio Sessions, and Beat Sales — into a single monthly view. This document is the **top-line financial snapshot** that answers: "How much did Sweet Dreams earn this month, from where, and how was it allocated?"

It feeds directly into the Monthly P&L (Document 09), Business Fund Allocation (Document 10), and Quarterly Tax Planning (Documents 13–14).

---

## 2. Required Data Fields — Header

| Field Name | Type | Description |
|---|---|---|
| `report_month` | String | Month and year (e.g., "March 2026"). |
| `report_date` | Date | Date this summary was prepared. |
| `prepared_by` | String | Jay or Cole. |
| `prior_month_revenue` | Currency | Last month's total gross revenue (for trend comparison). |
| `ytd_total_revenue` | Currency | Year-to-date cumulative gross revenue. |

---

## 3. Revenue by Stream

### 3.1 Media Projects Revenue

| Metric | Amount |
|---|---|
| **Number of Projects Completed** | (count) |
| **Gross Revenue** | (sum of all gross_revenue from Doc 01 entries this month) |
| **Business Cut (35%)** | (sum of business_cut_35) |
| **Sales Commissions Paid** | (sum of sales_commission) |
| **Labor Distributed (Jay)** | (sum of Jay's worker_breakdown amounts) |
| **Labor Distributed (Cole)** | (sum of Cole's worker_breakdown amounts) |
| **External Labor Distributed** | (sum of external contractor amounts) |

### 3.2 Studio Session Revenue

| Metric | Amount |
|---|---|
| **Number of Sessions** | (count) |
| **Total Hours Billed** | (sum of total_hours from Doc 02) |
| **Gross Revenue** | (sum of total_billed) |
| **Business Retention** | (sum of business_retention) |
| **Engineer Payouts** | (sum of engineer_payout) |
| **Average Revenue per Session** | (gross_revenue ÷ number_of_sessions) |

### 3.3 Beat Sales Revenue

| Metric | Amount |
|---|---|
| **Number of Beats Sold** | (count) |
| **Gross Sales (pre-tax)** | (sum of sale_price from Doc 03) |
| **Indiana Sales Tax Collected** | (sum of in_sales_tax_collected) — NOT revenue, held in trust |
| **Total Collected from Buyers** | (sum of total_collected) |
| **Producer Payouts** | (sum of producer_payout) |
| **Business Profit** | (sum of business_profit) |
| **Average Sale Price** | (gross_sales ÷ number_of_beats_sold) |

---

## 4. Consolidated Monthly Summary

| Category | Media Projects | Studio Sessions | Beat Sales | **TOTAL** |
|---|---|---|---|---|
| **Gross Revenue** | $X | $X | $X | **$X** |
| **Business Retention** | $X (35%) | $X | $X | **$X** |
| **Labor / Contractor Payouts** | $X | $X | $X | **$X** |
| **Sales Commissions** | $X | — | — | **$X** |
| **Sales Tax Collected** | — | — | $X | **$X** |

### Key Ratios

| Ratio | Formula | Target | Actual |
|---|---|---|---|
| **Business Retention Rate** | Total Business Retention ÷ Total Gross Revenue | ≥ 35% | __% |
| **Labor Cost Ratio** | Total Payouts ÷ Total Gross Revenue | ≤ 65% | __% |
| **Revenue Mix — Media** | Media Revenue ÷ Total Revenue | Track trend | __% |
| **Revenue Mix — Studio** | Studio Revenue ÷ Total Revenue | Track trend | __% |
| **Revenue Mix — Beats** | Beat Revenue ÷ Total Revenue | Track trend | __% |
| **Month-over-Month Growth** | (This Month − Last Month) ÷ Last Month | Positive | __% |

---

## 5. Year-to-Date Tracking

| Month | Media Revenue | Studio Revenue | Beat Sales | Total Revenue | MoM Growth |
|---|---|---|---|---|---|
| January | $X | $X | $X | $X | — |
| February | $X | $X | $X | $X | __% |
| March | $X | $X | $X | $X | __% |
| ... | ... | ... | ... | ... | ... |
| **YTD Total** | **$X** | **$X** | **$X** | **$X** | |

---

## 6. Rules & Laws

### 6.1 Revenue Recognition — Cash Basis Accounting

Sweet Dreams LLC should use the **cash method of accounting** (permitted under IRC § 446(c)(1) for businesses with gross receipts under $29 million). Under cash basis:

- **Revenue is recognized when payment is received**, not when the invoice is sent or work is completed.
- If a client pays a $3,000 retainer on March 28 for April's work, that revenue is recognized in March (when received).
- If a session occurs on March 30 but the artist doesn't pay until April 5, that revenue is recognized in April.

> **Consistency is key.** Once Sweet Dreams adopts cash basis, it must be used consistently unless the IRS approves a change (Form 3115).

### 6.2 Gross Receipts Tracking for Federal Thresholds

Several IRS rules and thresholds are based on **gross receipts**:

| Threshold | What It Triggers | Status |
|---|---|---|
| **$600/year to any contractor** | 1099-NEC filing required | Track via Document 06 |
| **$2,000/year to contractor (2026+)** | New 1099-NEC threshold | Track via Document 06 |
| **$100,000 in sales to another state** | Economic nexus — may trigger out-of-state sales tax | Monitor beat sales by state |
| **$250,000+ gross receipts** | May affect accounting method options | Long-term planning |
| **$29 million gross receipts** | Cash basis accounting no longer available | Very long-term |

### 6.3 Indiana Gross Income Tax Note

Indiana imposes an **Adjusted Gross Income Tax** on individuals, not on the partnership itself. However, the partnership's gross receipts are reported on Form IT-65 and flow through to each partner's individual Indiana return. The 2026 Indiana individual income tax rate is **3.05%** (verify annually — it has been decreasing).

---

## 7. Business Relation

### 7.1 Monthly Revenue Target Framework

As Sweet Dreams grows, set monthly revenue targets by stream:

| Stream | Current Monthly Avg | 6-Month Target | 12-Month Target |
|---|---|---|---|
| Media Projects | $_____ | $_____ | $_____ |
| Studio Sessions | $_____ | $_____ | $_____ |
| Beat Sales | $_____ | $_____ | $_____ |
| **TOTAL** | **$_____** | **$_____** | **$_____** |

### 7.2 Revenue Diversification

Track the percentage mix across streams. Over-reliance on any single stream creates risk:

- **Ideal mix:** No single stream exceeds 60% of total revenue.
- **Warning:** If one stream drops significantly, the others should provide a floor.

### 7.3 Cash Flow Timing

This summary also reveals cash flow patterns:

- **Media Projects:** Often invoiced monthly → predictable
- **Studio Sessions:** Cash at time of service → variable but immediate
- **Beat Sales:** Online transactions → immediate but unpredictable volume

---

## 8. Monthly Preparation Checklist

At the close of each month:

- [ ] All Document 01 entries (media projects) for the month are finalized
- [ ] All Document 02 entries (studio sessions) for the month are finalized
- [ ] All Document 03 entries (beat sales) for the month are finalized
- [ ] Verify all bank deposits match logged revenue amounts
- [ ] Calculate and verify all ratios (business retention ≥ 35%)
- [ ] Update YTD tracking table
- [ ] Flag any accounts receivable (invoiced but unpaid)
- [ ] Forward to Document 09 (Monthly P&L) for expense integration

---

## 9. Document Retention

- Retain for **7 years** minimum.
- This document, combined with the P&L (Document 09), forms the financial narrative of the business that a CPA or IRS auditor would review.
- Store alongside the underlying Documents 01, 02, and 03 for the same month.

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It aggregates data from Documents 01, 02, and 03 and feeds into Document 09 (Monthly P&L Statement), Document 10 (Business Fund Allocation Report), Document 13 (Quarterly Estimated Tax — Federal), and Document 14 (Quarterly Estimated Tax — Indiana).*
