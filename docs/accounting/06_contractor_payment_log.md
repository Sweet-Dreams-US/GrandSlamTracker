# Document 06: Contractor Payment Log

**File:** `06_contractor_payment_log.md`
**Frequency:** Per-Payment / Bi-Weekly & Annual Aggregation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To maintain a running ledger of every payment made to every independent contractor — studio engineers, beat producers, freelance videographers, photographers, graphic designers, and any other non-partner worker. This log is the **primary source document** for preparing Form 1099-NEC at year-end and for defending contractor classification in the event of an IRS or Indiana Department of Revenue audit.

---

## 2. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `payment_id` | String | Format: `CP-YYYY-###` (e.g., `CP-2026-033`). |
| `payment_date` | Date | Date the payment was disbursed. |
| `payee_name` | String | Legal name of the contractor (must match W-9). |
| `payee_type` | Dropdown | Studio Engineer, Beat Producer, Media Freelancer, Other. |
| `payee_ein_or_ssn` | Encrypted/Ref | Reference to W-9 on file (do NOT store SSN in plaintext). |
| `revenue_source` | Dropdown | Studio Session, Beat Sale, Media Project. |
| `source_document_id` | String | Reference to the originating document (e.g., `SESS-2026-042` or `BEAT-2026-019`). |
| `gross_payment` | Currency | Total amount paid to the contractor for this period. |
| `payment_method` | String | Zelle, Direct Deposit, Check (#____), PayPal, Cash. |
| `pay_period` | String | Bi-weekly pay period reference (e.g., `PP-2026-06`). |
| `ytd_total` | Formula | Running year-to-date total for this contractor. Auto-calculated. |
| `w9_on_file` | Boolean | Yes/No — W-9 must be on file before any payment. |
| `contractor_agreement_on_file` | Boolean | Yes/No — Signed IC agreement on file. |
| `notes` | Text | Any payment adjustments, disputes, or special terms. |

---

## 3. Example Entries

```
payment_id:       CP-2026-033
payment_date:     2026-03-17
payee_name:       Marcus Williams
payee_type:       Studio Engineer
revenue_source:   Studio Session
source_doc_id:    SESS-2026-042, SESS-2026-043
gross_payment:    $210.00
payment_method:   Zelle
pay_period:       PP-2026-06
ytd_total:        $1,470.00
w9_on_file:       Yes
ic_agreement:     Yes

payment_id:       CP-2026-034
payment_date:     2026-03-17
payee_name:       Trenton James (BeatsByTrenton)
payee_type:       Beat Producer
revenue_source:   Beat Sale
source_doc_id:    BEAT-2026-019, BEAT-2026-020
gross_payment:    $65.00
payment_method:   PayPal
pay_period:       PP-2026-06
ytd_total:        $520.00
w9_on_file:       Yes
ic_agreement:     Yes
```

---

## 4. Rules & Laws

### 4.1 Form 1099-NEC Filing Requirements

**IRS Form 1099-NEC** must be filed for each contractor who receives **$600 or more** in a calendar year.

> **Important Change for 2026:** The **One Big Beautiful Bill Act** (signed 2025) increased the 1099-NEC reporting threshold to **$2,000** for payments made in calendar year 2026 (filed in early 2027). However, Sweet Dreams should continue tracking all payments regardless of amount, since:
> - The threshold may revert in future years.
> - State filing requirements may differ.
> - Complete records protect against misclassification audits.

| Deadline | Action | Authority |
|---|---|---|
| **January 31** (of following year) | Furnish 1099-NEC copy to contractor | IRS §6041 |
| **January 31** (of following year) | File 1099-NEC with IRS | IRS §6071(c) |
| **No extension** | 1099-NEC has NO automatic extension (unlike 1099-MISC) | IRS rules |

### 4.2 Penalties for Late/Missing 1099-NEC Filing

| Filing Status | Penalty Per Return |
|---|---|
| 1–30 days late | $60 |
| 31+ days late but by August 1 | $130 |
| After August 1 or not filed | $340 |
| Intentional disregard | $680 (no cap) |

> Small business exception: For businesses with gross receipts ≤ $5 million, maximum aggregate penalties are capped (e.g., $220,500 for 1–30 days late). Still, it's far cheaper to file on time.

### 4.3 W-9 Collection Requirement

Under **IRS Regulation §31.3406(d)-1**, the payer (Sweet Dreams) must collect a **Form W-9** from each contractor **before** making the first payment. The W-9 provides:

- Contractor's legal name
- Business name (if different)
- Federal Tax Classification (Individual, LLC, Corporation)
- SSN or EIN
- Address
- Certification and signature

> **Backup Withholding Risk:** If a contractor refuses to provide a W-9, Sweet Dreams must withhold **24% of each payment** as "backup withholding" and remit it to the IRS. This is burdensome — always collect W-9s upfront.

### 4.4 Independent Contractor Classification — IRS & Indiana

Sweet Dreams must be able to defend that each contractor is **not an employee**. The IRS uses three categories of evidence:

**Behavioral Control:**
- Does Sweet Dreams control WHAT work is done? (Yes — this is normal)
- Does Sweet Dreams control HOW the work is done? (Should be No for IC status)

**Financial Control:**
- Can the worker serve multiple clients? (Should be Yes)
- Does the worker have unreimbursed business expenses? (Common for ICs)
- Is there opportunity for profit or loss? (ICs can earn more or less per job)

**Type of Relationship:**
- Is there a written contract? (Should be Yes — IC Agreement)
- Are benefits provided? (Should be No for ICs)
- Is the relationship permanent? (Should be project-based, not indefinite)

**Indiana-Specific (IC § 22-1-6):** Indiana's "ABC Test" for unemployment tax purposes requires that the worker:

- **(A)** Is free from control or direction in performing the work
- **(B)** Performs work outside the usual course of the hiring entity's business OR is performed outside all of the hiring entity's places of business
- **(C)** Is customarily engaged in an independently established trade, occupation, or business

> **Practical Guidance for Sweet Dreams:** Studio engineers pass this test easily if they (A) use their own mixing techniques, (B) are available to work at other studios, and (C) market themselves as independent engineers. Beat producers pass even more clearly since they create beats independently on their own equipment.

### 4.5 Indiana Withholding — Not Required for ICs

Indiana does not require withholding state income tax from payments to independent contractors. Only employees require Indiana WH-4 withholding.

---

## 5. Business Relation

### 5.1 The 1099 Pipeline

This log is the operational backbone for year-end 1099 filing:

```
Year-Round:
  Every bi-weekly payment → logged in this document
  YTD totals auto-update per contractor

Year-End (December):
  Filter contractors with YTD ≥ $2,000 (2026 threshold)
  → Generate 1099-NEC for each
  → Deliver Copy B to contractor by January 31
  → File Copy A with IRS by January 31
  → See Document 21 for the full 1099-NEC Filing Checklist
```

### 5.2 Contractor Dispute Resolution

If a contractor disputes a payment amount, this log — combined with the originating Documents 01, 02, or 03 — provides a complete audit trail:

1. Reference the `source_document_id` to find the original project/session/sale
2. Verify the agreed-upon percentage or rate
3. Confirm the calculation matches the payment
4. Resolve or document the discrepancy

---

## 6. Year-End Summary Table (Maintained Rolling)

| Contractor | Type | YTD Payments | 1099 Required? | W-9 on File? |
|---|---|---|---|---|
| Marcus Williams | Studio Engineer | $4,860.00 | Yes | Yes |
| Trenton James | Beat Producer | $2,340.00 | Yes | Yes |
| Sarah Chen | Freelance Photographer | $1,800.00 | No (under $2,000) | Yes |
| ... | ... | ... | ... | ... |

---

## 7. Document Retention

- **Retain all contractor payment records for 7 years** from the date the associated 1099-NEC was filed.
- **Retain W-9 forms for 4 years** after the last tax year in which the W-9 was used.
- **Retain IC Agreements permanently** or until 4 years after the last payment to that contractor.

---

## 8. Contractor Onboarding Master Checklist

Before ANY first payment is made:

- [ ] W-9 collected and verified (name, SSN/EIN, signature)
- [ ] Independent Contractor Agreement signed
- [ ] Percentage/rate agreement documented
- [ ] Payment method confirmed
- [ ] Contact information on file
- [ ] Added to this Contractor Payment Log with `ytd_total` initialized at $0

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It feeds into Document 05 (Bi-Weekly Payout Summary), Document 16 (1099 Contractor YTD Tracker), and Document 21 (Annual 1099-NEC Filing Checklist).*
