# Document 11: Indiana Sales Tax (ST-103) Worksheet

**File:** `11_indiana_sales_tax_worksheet.md`
**Frequency:** Monthly (aligned with ST-103 filing schedule)
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To prepare the data needed to file Indiana Form **ST-103** (Sales and Use Tax Return) each month. Beat sales are the **only revenue stream** at Sweet Dreams that generates a sales tax obligation. This worksheet aggregates all taxable transactions for the filing period and calculates the exact amount to remit to the Indiana Department of Revenue (DOR).

**This is a fiduciary obligation.** The 7% collected from buyers is NOT Sweet Dreams' money. It is held in trust for the State of Indiana. Failure to remit is treated as theft of state funds.

---

## 2. Filing Schedule & Deadlines

| Average Monthly Tax Liability | Filing Frequency | Due Date | Portal |
|---|---|---|---|
| **≥ $1,000/month** (prior fiscal year avg) | Monthly | **20th** of the following month | INtax (intax.in.gov) |
| **< $1,000/month** (prior fiscal year avg) | Monthly | **30th** of the following month | INtax (intax.in.gov) |
| **< $10/month** average (very low volume) | Annual | **January 31** of the following year | INtax (intax.in.gov) |

> **Sweet Dreams should file monthly** regardless of volume. Even if zero beat sales occurred, a **zero-return must be filed** while the Registered Retail Merchant Certificate (RRMC) is active. Failure to file a zero return results in estimated assessments from the DOR.

---

## 3. Required Data Fields

### 3.1 Filing Period Header

| Field | Value |
|---|---|
| **Filing Period** | Month/Year (e.g., "March 2026") |
| **Filing Deadline** | (20th or 30th of following month) |
| **RRMC Number** | Sweet Dreams' Registered Retail Merchant Certificate # |
| **Location** | County and township where business operates |

### 3.2 Taxable Transaction Detail (from Document 03)

| Sale ID | Date | Beat/Product | License Type | Sale Price (Taxable) | Tax Rate | Tax Collected | Total Charged | Buyer State |
|---|---|---|---|---|---|---|---|---|
| BEAT-2026-019 | 03/05 | Midnight Run | Premium Lease | $99.99 | 7% | $7.00 | $106.99 | IN |
| BEAT-2026-020 | 03/08 | Trap Soul | Basic Lease | $29.99 | 7% | $2.10 | $32.09 | IN |
| BEAT-2026-021 | 03/12 | Night Drive | Exclusive | $499.99 | 7% | $35.00 | $534.99 | IN |
| BEAT-2026-022 | 03/19 | Vibe Check | Basic Lease | $24.99 | 0% | $0.00 | $24.99 | CA |

> **Note:** Sale BEAT-2026-022 to a California buyer — no Indiana sales tax collected (out-of-state, no nexus in CA). However, monitor cumulative out-of-state sales for economic nexus thresholds.

### 3.3 Monthly Summary for ST-103

| ST-103 Line | Description | Amount |
|---|---|---|
| **Line 1** | Gross Retail Sales (all beat sales, including exempt) | $_____ |
| **Line 2** | Exempt Sales (out-of-state, exempt buyers) | $_____ |
| **Line 3** | Taxable Sales (Line 1 − Line 2) | $_____ |
| **Line 4** | Indiana Sales Tax Due (Line 3 × 0.07) | $_____ |
| **Line 5** | Use Tax Due (if applicable — purchases from out-of-state vendors where no tax was charged) | $_____ |
| **Line 6** | Total Tax Due (Line 4 + Line 5) | $_____ |
| **Line 7** | Penalty (if late — 10% of tax due) | $_____ |
| **Line 8** | Interest (if late — variable rate set by DOR) | $_____ |
| **Line 9** | Total Amount Due (Line 6 + Line 7 + Line 8) | **$_____** |

---

## 4. Rules & Laws

### 4.1 Indiana Code § 6-2.5-1-26.5 — Specified Digital Products

**Definition:** "Specified digital products" means digital audio works, digital audiovisual works, and digital books that are transferred electronically.

**Application to Sweet Dreams:**

| Product | Taxable? | Reasoning |
|---|---|---|
| Beat lease (non-exclusive) | **Yes** | Digital audio work transferred electronically with permanent use rights |
| Beat exclusive license | **Yes** | Transfer/sale of a digital audio work |
| Sound kit / sample pack | **Yes** | Digital audio work |
| Beat subscription (if ever offered) | **Potentially exempt** | No permanent use right — consult IN DOR |
| Custom composition service | **Potentially exempt** | Custom software/work exemption may apply |

### 4.2 Indiana Code § 6-2.5-2-1 — Imposition of Sales Tax

The 7% sales tax is imposed on **retail transactions** made in Indiana. A transaction is "made in Indiana" when:

- The product is received by the purchaser in Indiana, **OR**
- The purchaser has an Indiana billing address (for digital products)

### 4.3 Registered Retail Merchant Certificate (RRMC)

Under **IC § 6-2.5-8-1**, any person making retail transactions must hold a valid RRMC. Sweet Dreams obtained this through the INBiz portal.

- RRMC must be renewed as required by the DOR.
- The certificate must be displayed at the place of business.
- Operating without one while collecting sales tax is a **Class A misdemeanor**.

### 4.4 Penalties for Non-Compliance

| Violation | Penalty | Authority |
|---|---|---|
| Late filing | 10% of tax due (minimum $5) | IC § 6-8.1-10-2.1 |
| Late payment | Interest at DOR-set rate (adjusted annually) | IC § 6-8.1-10-1 |
| Failure to file | DOR issues estimated assessment + penalties | IC § 6-8.1-5-1 |
| Collecting tax without RRMC | Class A misdemeanor | IC § 6-2.5-8-1 |
| Fraud / intentional underpayment | Up to 100% penalty + criminal prosecution | IC § 6-8.1-10-4 |

### 4.5 Use Tax Obligation

If Sweet Dreams purchases taxable items from **out-of-state vendors** who did NOT charge Indiana sales tax (e.g., equipment from an out-of-state online retailer), Sweet Dreams owes **Indiana Use Tax** at 7% on those purchases. Report on ST-103, Line 5.

> **Common triggers:** Buying gear from out-of-state sellers on eBay, Reverb, or direct-from-manufacturer where no IN tax was collected.

### 4.6 Economic Nexus — Out-of-State Sales

Sweet Dreams is currently collecting Indiana tax only. However, if beat sales to a specific state exceed that state's economic nexus threshold, Sweet Dreams may be required to collect and remit that state's sales tax. Common thresholds:

| State | Revenue Threshold | Transaction Threshold |
|---|---|---|
| Most states | $100,000 | 200 transactions |
| Some states (CA, NY, TX) | $500,000 | N/A |

> **Action Item:** Track out-of-state beat sales by buyer state (field in Document 03). If approaching any state's threshold, consult a sales tax advisor.

---

## 5. Business Relation

### 5.1 Sales Tax Trust Account

**Strongly Recommended:** Maintain a separate bank account or sub-account exclusively for holding collected sales tax. On the filing date, transfer the exact amount from this account to the DOR.

```
Beat sale: $99.99 + $7.00 tax = $106.99

Day of sale:
  $7.00 → Sales Tax Trust Account
  $99.99 → Operating Account

Filing day:
  Sales Tax Trust Account → DOR payment ($7.00)
```

### 5.2 Why This Is the Highest-Risk Document

Among all 21 documents, this one carries the most **personal liability risk** for Jay and Cole. Under Indiana's responsible person doctrine (IC § 6-8.1-10-6.1), LLC members who are responsible for collecting and remitting sales tax can be held **personally liable** for unpaid sales tax — piercing the LLC's liability protection.

### 5.3 Monthly Filing Routine

| Step | Action | Deadline |
|---|---|---|
| 1 | Export all beat sales for the month from Document 03 | Month-end + 3 days |
| 2 | Calculate totals (gross, exempt, taxable, tax due) | Month-end + 5 days |
| 3 | Verify trust account balance matches tax due | Month-end + 7 days |
| 4 | Log into INtax and file ST-103 | By 20th or 30th of following month |
| 5 | Make payment via INtax (ACH, credit card, or check) | Same as filing |
| 6 | Save confirmation number and attach to this worksheet | Same day |

---

## 6. Filing Confirmation Log

| Month | Gross Sales | Exempt Sales | Taxable Sales | Tax Remitted | Filed On | Confirmation # |
|---|---|---|---|---|---|---|
| Jan 2026 | $_____ | $_____ | $_____ | $_____ | ______ | ______ |
| Feb 2026 | $_____ | $_____ | $_____ | $_____ | ______ | ______ |
| Mar 2026 | $_____ | $_____ | $_____ | $_____ | ______ | ______ |
| ... | | | | | | |

---

## 7. Document Retention

- **Indiana DOR:** Retain sales tax records for a minimum of **3 years** from the date the return was filed.
- **Best Practice:** Retain for **7 years** to align with IRS record-keeping standards.
- Store all ST-103 filing confirmations, this worksheet, and the underlying Document 03 entries together.

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It sources data from Document 03 (Producer Beat Sale Record) and is verified against Document 08 (Monthly Revenue Summary). Filing confirmations are retained for Document 15 (Quarterly P&L Review) and Document 19 (Indiana IT-65 Partnership Return Prep).*
