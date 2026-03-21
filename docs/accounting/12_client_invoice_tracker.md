# Document 12: Client Invoice & Accounts Receivable Tracker

**File:** `12_client_invoice_tracker.md`
**Frequency:** Per-Invoice / Monthly Reconciliation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To track every invoice sent to a client — from creation through payment — and manage accounts receivable (unpaid invoices). This document ensures that:

- No invoice falls through the cracks.
- Revenue is not recognized (for payout purposes) until payment is actually received.
- Aging receivables are escalated before they become bad debt.
- Cash flow is accurately projected for each bi-weekly payout cycle.

---

## 2. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `invoice_id` | String | Format: `INV-YYYY-###` (e.g., `INV-2026-045`). |
| `invoice_date` | Date | Date the invoice was created and sent. |
| `client_name` | String | Client legal name (must match contract/agreement). |
| `project_id` | String | Reference to the corresponding Document 01 entry (e.g., `MEDIA-2026-014`). |
| `description` | Text | Brief description of services/products invoiced. |
| `invoice_amount` | Currency | Total amount invoiced (before any deposits already received). |
| `deposit_received` | Currency | Any upfront deposit already collected ($0 if none). |
| `balance_due` | Formula | `invoice_amount − deposit_received`. |
| `payment_terms` | Dropdown | Due on Receipt, Net 15, Net 30, Net 45, Custom. |
| `due_date` | Formula | `invoice_date + payment_terms days`. |
| `status` | Dropdown | Sent, Viewed, Partial, Paid, Overdue, Disputed, Written Off. |
| `payment_date` | Date | Date full payment was received (null until paid). |
| `payment_method` | String | Zelle, ACH, Check, Wire, Card, Cash. |
| `days_outstanding` | Formula | `today − invoice_date` (if unpaid). |
| `aging_bucket` | Formula | Current (0–15), 16–30, 31–60, 61–90, 90+ days. |
| `follow_up_date` | Date | Next scheduled follow-up for unpaid invoices. |
| `notes` | Text | Payment plan terms, dispute details, contact attempts. |

---

## 3. Example Entries

```
invoice_id:      INV-2026-045
invoice_date:    2026-03-01
client_name:     Monster Remodeling LLC
project_id:      MEDIA-2026-014
description:     March 2026 Monthly Content Package
invoice_amount:  $3,000.00
deposit:         $1,500.00
balance_due:     $1,500.00
terms:           Net 15
due_date:        2026-03-16
status:          Paid
payment_date:    2026-03-14
payment_method:  ACH
days_outstanding: 0

invoice_id:      INV-2026-046
invoice_date:    2026-03-10
client_name:     Local Fitness Studio
project_id:      MEDIA-2026-015
description:     Brand video + social content
invoice_amount:  $1,500.00
deposit:         $0.00
balance_due:     $1,500.00
terms:           Net 30
due_date:        2026-04-09
status:          Sent
payment_date:    (null)
days_outstanding: 10
aging_bucket:    Current
follow_up_date:  2026-03-25
```

---

## 4. Accounts Receivable Aging Report

Run this summary at the end of each month:

| Aging Bucket | # Invoices | Total Outstanding | % of Total AR |
|---|---|---|---|
| **Current (0–15 days)** | __ | $_____ | __% |
| **16–30 days** | __ | $_____ | __% |
| **31–60 days** | __ | $_____ | __% |
| **61–90 days** | __ | $_____ | __% |
| **90+ days** | __ | $_____ | __% |
| **TOTAL AR** | __ | **$_____** | **100%** |

### Escalation Protocol

| Aging | Action | Responsible |
|---|---|---|
| **0–15 days** | No action needed — within terms | — |
| **16–30 days** | Friendly reminder email/text | Whoever sent the invoice |
| **31–45 days** | Direct phone call to client | Jay or Cole |
| **46–60 days** | Formal written notice (email + letter) | Jay or Cole |
| **61–90 days** | Final demand with specific deadline | Both partners discuss |
| **90+ days** | Consider: collections, small claims, or write-off | Both partners decide |

---

## 5. Rules & Laws

### 5.1 Cash Basis Accounting — Revenue Recognition

Under **cash basis accounting** (which Sweet Dreams uses):

- Revenue is recognized **when payment is received**, NOT when the invoice is sent.
- An outstanding invoice is NOT revenue until cash hits the bank account.
- This means: **No payouts are triggered by unpaid invoices.** Only paid invoices flow into Document 01 and the bi-weekly payout cycle.

### 5.2 Bad Debt — Tax Treatment

If a client never pays:

- Under **cash basis accounting**, there is generally NO bad debt deduction because the income was never recognized in the first place.
- If Sweet Dreams ever switches to **accrual basis**, unpaid invoices that were previously recognized as income can be deducted as bad debt under IRC § 166.
- **Practical impact:** Under cash basis, an unpaid invoice simply means Sweet Dreams never earned the money — no tax consequence, but real cash flow impact.

### 5.3 Indiana Small Claims Court

For unpaid invoices, Indiana small claims court is available:

| Detail | Indiana Small Claims |
|---|---|
| **Maximum claim amount** | $10,000 (as of 2026 — verify) |
| **Filing fee** | ~$35–$97 depending on amount |
| **Jurisdiction** | County where the defendant resides or where the contract was performed |
| **Attorney required?** | No (but allowed) |
| **Typical timeline** | 30–60 days from filing to hearing |

> **Documentation needed:** The signed contract/agreement, the invoice, proof of delivery (completed work), and records of follow-up attempts. Documents 01 and 12 provide this.

### 5.4 Indiana Prompt Payment Act

**IC § 5-17-5** applies to government contracts (not private). For private contracts, payment terms are governed by the agreement between Sweet Dreams and the client. Always include clear payment terms in contracts:

- Due date
- Late payment fee (if any — typically 1.5%/month or $25 flat)
- Acceptable payment methods

---

## 6. Business Relation

### 6.1 Cash Flow Impact

Unpaid invoices create a **cash flow gap**:

```
March Revenue Invoiced:  $8,000
March Revenue Collected:  $6,500
Outstanding AR:           $1,500

Impact:
  - Business Fund (35%) is based on COLLECTED revenue: $2,275 (not $2,800)
  - Labor pool is based on COLLECTED revenue: $4,225 (not $5,200)
  - Payouts may need to be reduced until AR is collected
```

### 6.2 Deposit Policy Recommendation

To minimize AR risk, Sweet Dreams should collect **50% deposits** on all media projects over $1,000:

| Project Size | Deposit Policy | Balance Due |
|---|---|---|
| Under $500 | Due on receipt (no deposit) | Full amount on delivery |
| $500–$1,000 | 50% deposit OR due on receipt | Balance on delivery |
| $1,000–$5,000 | 50% deposit required | Balance on delivery or Net 15 |
| $5,000+ | 50% deposit + 25% at midpoint | 25% on delivery |
| Monthly retainers | Full amount due by 1st of month | N/A |

### 6.3 Integration with Payout Cycle

Only invoices with `status: Paid` or `status: Partial` (for the paid portion) are included in the **Bi-Weekly Payout Summary (Document 05)**. This prevents paying out labor from money that hasn't been collected yet.

---

## 7. Monthly Reconciliation Checklist

- [ ] All invoices sent this month are logged
- [ ] Payment status updated for all invoices (check bank deposits)
- [ ] Aging report generated and reviewed
- [ ] Follow-up actions scheduled for overdue invoices
- [ ] Verify collected revenue matches Document 08 (Monthly Revenue Summary)
- [ ] Write-off any invoices confirmed as uncollectible (with both partners' agreement)

---

## 8. Document Retention

- Retain all invoice records for **7 years**.
- Retain contracts and signed agreements **permanently** or until 7 years after the final payment under that contract.
- If a dispute goes to small claims or collections, retain all records until **3 years after resolution**.

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It validates revenue recognition for Documents 01, 05, and 08, and provides cash flow data for Documents 09 (Monthly P&L) and 10 (Business Fund Allocation).*
