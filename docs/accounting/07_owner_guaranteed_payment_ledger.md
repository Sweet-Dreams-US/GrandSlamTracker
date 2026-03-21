# Document 07: Owner Guaranteed Payment Ledger

**File:** `07_owner_guaranteed_payment_ledger.md`
**Frequency:** Bi-Weekly Entries / Monthly & Annual Aggregation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To maintain a dedicated, IRS-compliant record of all **Guaranteed Payments** made to Jay and Cole as partners of Sweet Dreams Media LLC. These payments are for **services rendered** (labor on media projects, sales commissions, studio management) and are legally distinct from profit distributions based on the 50/50 ownership split.

This ledger is the **single source of truth** for:

- Preparing Schedule K-1 (Form 1065), Box 4a
- Calculating self-employment tax on Schedule SE
- Proving that unequal partner compensation is based on work performed, not profit-sharing

---

## 2. Why Guaranteed Payments Matter

Under **IRC § 707(c)**, Guaranteed Payments are payments to a partner for services (or use of capital) that are determined **without regard to the income of the partnership.**

| Aspect | Guaranteed Payment | Profit Distribution |
|---|---|---|
| **Basis** | Work performed (hours, role, deliverables) | Ownership percentage (50/50) |
| **Tax Treatment** | Deductible by partnership (Form 1065, Line 10) | NOT deductible — reduces partner capital |
| **Self-Employment Tax** | Subject to SE tax on each partner's return | Also subject to SE tax for general partners |
| **Equality Requirement** | Can be unequal (based on work) | Must follow operating agreement (50/50) |
| **K-1 Reporting** | Box 4a (Guaranteed Payments for Services) | Box 1 (Ordinary Business Income) |

> **Key Insight for Jay and Cole:** If Jay works 100 hours in a pay period and Cole works 20, Jay's guaranteed payment is 5× Cole's. The 50/50 split only applies to whatever profit remains AFTER all guaranteed payments and expenses. This is fair, legal, and expected by the IRS.

---

## 3. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `entry_id` | String | Format: `GP-YYYY-###` (e.g., `GP-2026-012`). |
| `pay_period` | String | Bi-weekly period reference (e.g., `PP-2026-06`). |
| `payment_date` | Date | Date the guaranteed payment was disbursed. |
| `partner_name` | String | "Jay" or "Cole." |
| `payment_category` | Dropdown | Labor, Sales Commission, Management, or Other. |
| `revenue_source` | Dropdown | Media Project, Studio Session, Beat Sales, General Operations. |
| `source_document_ids` | Array | References to the originating split sheets/session logs. |
| `hours_worked` | Decimal | Total hours for this category in this period (if applicable). |
| `effective_rate` | Formula | `amount ÷ hours_worked` — For internal tracking, not contractual. |
| `amount` | Currency | Dollar amount of the guaranteed payment. |
| `ytd_total` | Formula | Running year-to-date total for this partner. |
| `notes` | Text | Description of work performed, projects involved. |

---

## 4. Example Entries (Single Pay Period)

```
entry_id:     GP-2026-011
pay_period:   PP-2026-06
partner:      Jay
category:     Labor
source:       Media Projects
source_docs:  [MEDIA-2026-014]
hours:        12
amount:       $877.50
ytd_total:    $8,250.00
notes:        Videography and editing for Monster Remodeling monthly package

entry_id:     GP-2026-012
pay_period:   PP-2026-06
partner:      Jay
category:     Sales Commission
source:       Media Projects
source_docs:  [MEDIA-2026-014]
hours:        N/A
amount:       $195.00
ytd_total:    $1,560.00
notes:        10% sales commission — originated Monster Remodeling deal

entry_id:     GP-2026-013
pay_period:   PP-2026-06
partner:      Cole
category:     Labor
source:       Media Projects
source_docs:  [MEDIA-2026-014, MEDIA-2026-015]
hours:        18
amount:       $1,755.00
ytd_total:    $7,950.00
notes:        Direction/color grade for Monster Remodeling + Fitness Pro
```

---

## 5. Rules & Laws

### 5.1 IRC § 707(c) — Guaranteed Payments for Services

**Full Text Summary:** To the extent determined without regard to the income of the partnership, payments to a partner for services or for the use of capital shall be considered as made to one who is not a member of the partnership, but only for the purposes of section 61(a) (gross income) and section 162(a) (trade or business expenses).

**Practical Meaning:**

1. **Deductibility:** The partnership deducts guaranteed payments just like it would deduct wages paid to a non-partner employee. This reduces the partnership's ordinary income on Form 1065.

2. **Partner's Income:** The partner includes guaranteed payments in gross income regardless of whether the partnership had a profit or loss that year. Even if Sweet Dreams loses money, Jay and Cole still owe income tax on their guaranteed payments.

3. **Self-Employment Tax:** Guaranteed payments are subject to self-employment tax (15.3% on the first $168,600 of combined net SE income for 2026 — verify annually; 2.9% Medicare on amounts above).

### 5.2 IRC § 736(a) — Payments to Retiring/Deceased Partners

Not currently applicable, but important for future planning: if Jay or Cole ever leaves the partnership, guaranteed payments for services that continue post-departure are treated under § 736(a) and are still ordinary income to the recipient and deductible by the partnership.

### 5.3 Schedule K-1 (Form 1065) Reporting

Each partner's total guaranteed payments for the year are reported on their **Schedule K-1**:

| K-1 Box | Description | What Goes Here |
|---|---|---|
| **Box 4a** | Guaranteed payments for services | Total annual guaranteed payments from this ledger |
| **Box 4b** | Guaranteed payments for capital | N/A for Sweet Dreams (no capital-based payments) |
| **Box 4c** | Total guaranteed payments | Same as Box 4a (since 4b = $0) |
| **Box 1** | Ordinary business income (loss) | Partner's 50% share of remaining profit AFTER guaranteed payments |

### 5.4 Indiana Tax Treatment

Indiana follows federal treatment of guaranteed payments. They are included in the partner's **Indiana Adjusted Gross Income** reported on Form IT-40, Schedule IN K-1.

---

## 6. Business Relation

### 6.1 The Guaranteed Payment vs. Distribution Distinction

This is the most important concept for Jay and Cole's tax planning:

```
Sweet Dreams Revenue in a Year:             $120,000
  − Business Expenses:                       −$30,000
  − Jay's Guaranteed Payments:               −$35,000
  − Cole's Guaranteed Payments:              −$30,000
  = Partnership Ordinary Income:              $25,000
    → Jay's 50% share:                        $12,500
    → Cole's 50% share:                       $12,500

Jay's Total Taxable Income from SD:
  Guaranteed Payments:    $35,000
  + 50% of Profit:        $12,500
  = Total:                $47,500

Cole's Total Taxable Income from SD:
  Guaranteed Payments:    $30,000
  + 50% of Profit:        $12,500
  = Total:                $42,500
```

> Notice: Jay earned more total because Jay worked more, but both partners still get equal shares of the residual profit. This is exactly how the IRS expects a service-based partnership to operate.

### 6.2 Why This Ledger Protects Both Partners

Without a detailed guaranteed payment ledger:

- The IRS may reclassify all payments as profit distributions, losing the deduction on Form 1065.
- Jay and Cole cannot prove their unequal pay was work-based, potentially triggering a reallocation audit.
- Quarterly estimated tax payments become guesswork.

### 6.3 Quarterly Tax Planning Connection

Every month, the YTD totals from this ledger feed directly into **Document 13 (Quarterly Estimated Tax — Federal)** and **Document 14 (Quarterly Estimated Tax — Indiana)** to calculate each partner's required estimated tax payments.

---

## 7. Monthly & Annual Summaries

### Monthly Summary Format

| Month | Jay — Labor | Jay — Sales | Jay — Total | Cole — Labor | Cole — Sales | Cole — Total |
|---|---|---|---|---|---|---|
| January | $3,200.00 | $480.00 | $3,680.00 | $2,800.00 | $320.00 | $3,120.00 |
| February | $2,900.00 | $350.00 | $3,250.00 | $3,100.00 | $400.00 | $3,500.00 |
| March | ... | ... | ... | ... | ... | ... |

### Annual Summary (for K-1 Preparation)

| Partner | Total Guaranteed Payments (Services) | K-1 Box 4a | Verified? |
|---|---|---|---|
| Jay | $42,150.00 | $42,150.00 | ☐ |
| Cole | $39,780.00 | $39,780.00 | ☐ |

---

## 8. Document Retention

- Retain for **7 years** minimum from the date the partnership return (Form 1065) was filed.
- This document is referenced by your CPA when preparing Form 1065 and individual K-1s.
- Cross-reference every entry against the originating split sheets (Document 01) and session logs (Document 02).

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It feeds into Document 05 (Bi-Weekly Payout Summary), Document 13 (Quarterly Estimated Tax — Federal), Document 14 (Quarterly Estimated Tax — Indiana), Document 17 (Annual Form 1065 Prep), and Document 18 (Schedule K-1 Prep Worksheet).*
