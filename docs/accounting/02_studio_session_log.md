# Document 02: Studio Session Log

**File:** `02_studio_session_log.md`
**Frequency:** Per-Session / Bi-Weekly Aggregation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To track every studio recording session — including the engineer who ran the board, the artist who booked, the hours billed, and the revenue split between the engineer and the business. Since studio engineers receive **percentage-based compensation only with no guaranteed base pay**, this log is the sole document that triggers their bi-weekly payment.

Without a completed session log entry, no engineer payout is authorized.

---

## 2. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `session_id` | String | Unique ID using format `SESS-YYYY-###` (e.g., `SESS-2026-042`). Sequential per calendar year. |
| `session_date` | Date | Date the session occurred. |
| `engineer_name` | String | The engineer who ran the session. |
| `artist_name` | String | The client/artist who booked and was recorded. |
| `session_type` | Dropdown | Recording, Mixing, Mastering, or Combo. |
| `total_hours` | Decimal | Duration of the session in hours (e.g., 3.5). |
| `hourly_rate` | Currency | Rate charged to the artist per hour (e.g., $75.00/hr). |
| `total_billed` | Formula | `total_hours × hourly_rate` — Total amount invoiced to the artist. |
| `engineer_percentage` | Percentage | The engineer's agreed-upon cut of the session revenue (e.g., 40%). |
| `engineer_payout` | Formula | `total_billed × engineer_percentage` — Amount owed to the engineer. |
| `business_retention` | Formula | `total_billed − engineer_payout` — Amount retained by Sweet Dreams. |
| `business_retention_pct` | Formula | `business_retention ÷ total_billed × 100` — Must be ≥ 35% to stay consistent with the business model. |
| `payment_collected` | Boolean | Whether the artist has paid for the session (Yes/No). |
| `payment_method` | String | Cash, Venmo, Zelle, Card, Invoice. |
| `pay_period` | String | The bi-weekly pay period this session falls into. |
| `notes` | Text | Session notes, issues, or special arrangements. |

---

## 3. Example Entry

```
session_id:             SESS-2026-042
session_date:           2026-03-08
engineer_name:          Marcus Williams
artist_name:            DLo The Artist
session_type:           Recording
total_hours:            4.0
hourly_rate:            $75.00
total_billed:           $300.00
engineer_percentage:    40%
engineer_payout:        $120.00
business_retention:     $180.00
business_retention_pct: 60%
payment_collected:      Yes
payment_method:         Zelle
pay_period:             2026-03-01 to 2026-03-15
```

---

## 4. Rules & Laws

### 4.1 IRS 1099-NEC Classification — Independent Contractors

Studio engineers who receive percentage-based compensation with **no guaranteed base pay** are classified as **Independent Contractors** under IRS guidelines. This classification requires:

- **Form 1099-NEC** must be filed for any engineer who receives **$600 or more** in a calendar year (threshold increases to $2,000 for payments made in 2026, per the One Big Beautiful Bill Act, reportable on 2027 filings).
- **No tax withholding.** Sweet Dreams does not withhold federal income tax, Social Security, or Medicare from engineer payments.
- **No benefits obligation.** The LLC is not required to provide health insurance, workers' comp, or unemployment insurance for independent contractors.
- Engineers must receive their 1099-NEC by **January 31** of the following year (for 2025 payments) or **February 2, 2026** (adjusted for weekends).

### 4.2 FLSA Misclassification Risk — Indiana

The **Fair Labor Standards Act (FLSA)** and Indiana's own classification rules (Indiana Code § 22-1-6) require that workers classified as independent contractors truly meet the legal definition. The IRS uses multiple factors, but the key ones for studio engineers are:

| Factor | Must Be True for IC Status | Red Flag (Employee) |
|---|---|---|
| **Behavioral Control** | Engineer uses their own techniques, mixing style, workflow | You dictate exactly how to EQ, compress, etc. |
| **Financial Control** | Engineer can work at multiple studios, set own rates | You set all rates, engineer can only work for you |
| **Relationship Type** | No benefits, no permanence, project-by-project | Engineer has set schedule, guaranteed hours |
| **Tools & Equipment** | Ideally brings own plugins/headphones (even if using your board) | You provide everything with no contractor input |
| **Availability** | Engineer sets own session availability | You assign sessions without engineer input |

> **Best Practice:** Have each engineer sign an **Independent Contractor Agreement** that clearly states: (1) they are not employees, (2) they control their own methods, (3) they are responsible for their own taxes, and (4) the relationship is at-will with no guaranteed hours or pay.

### 4.3 Indiana Wage & Hour — Does NOT Apply

Indiana Code § 22-2-2 (minimum wage) and § 22-2-5 (wage payment) apply to **employees only**. Since engineers are independent contractors, there is no minimum wage floor and no mandated payment frequency. However, Sweet Dreams pays bi-weekly as a matter of business practice and contractor goodwill.

### 4.4 Studio Insurance & Liability

The `business_retention` portion must cover:

- **General Liability Insurance** — Required to cover injuries on premises during sessions.
- **Equipment Insurance** — Covers gear damage/theft. Equipment used by contractors should be documented.
- **Indiana Workers' Compensation** — Not required for independent contractors, but if a contractor is injured on your premises, your general liability policy is your protection. Per Indiana Code § 22-3-2-9, the contractor exemption only applies if the contractor agreement is properly documented.

---

## 5. Business Relation

### 5.1 The 35% Floor Rule

The `business_retention_pct` must be **at least 35%** to remain consistent with Sweet Dreams' overhead model. This means:

- If the engineer's percentage is 40%, business keeps 60% ✅
- If the engineer's percentage is 50%, business keeps 50% ✅
- If the engineer's percentage is 65%, business keeps 35% ✅ (minimum)
- If the engineer's percentage is 70%, business keeps 30% ❌ **Violation — renegotiate terms**

### 5.2 Revenue Attribution

Studio session revenue is categorized as **"Studio Revenue"** in the Monthly P&L (Document 09). It is separate from Media Revenue and Beat Sale Revenue. The business retention from sessions funds:

- Electricity and HVAC costs for the studio space
- Gear maintenance, wear-and-tear, and replacement fund
- Studio insurance premiums
- Software licenses (Pro Tools, plugins, etc.)

### 5.3 Payment Flow

```
Artist pays for session ($300)
  └─→ Engineer Payout: $120 (40%)
  └─→ Business Retention: $180 (60%)
        └─→ Overhead Fund (35% of $300 = $105)
        └─→ Profit to LLC (25% of $300 = $75)
```

---

## 6. Reconciliation Checkpoint

At the end of each bi-weekly pay period, all Studio Session Logs for that period must be aggregated into **Document 05: Bi-Weekly Payout Summary**. The following must balance:

```
Σ total_billed (all sessions in period) =
  Σ engineer_payout +
  Σ business_retention
```

Additionally, verify:
- All sessions marked `payment_collected: Yes` have matching bank deposits
- Any sessions marked `payment_collected: No` are flagged for accounts receivable follow-up

---

## 7. Document Retention

Per IRS guidelines and Indiana record-keeping requirements:

- **Retain for a minimum of 7 years** from the date the associated tax return was filed.
- Store digital copies in a secure, backed-up location.
- Cross-reference each `session_id` with the corresponding bank deposit or payment confirmation.
- If an engineer disputes a payout, this log is the primary evidence document.

---

## 8. Engineer Onboarding Checklist

Before an engineer's first session is logged, ensure:

- [ ] **W-9 Form** collected (required before any payment and before issuing 1099-NEC)
- [ ] **Independent Contractor Agreement** signed
- [ ] **Percentage agreement** documented (what % they receive)
- [ ] **Payment method** confirmed (Zelle, check, direct deposit)
- [ ] **Contact information** on file (legal name, address, SSN/EIN via W-9)

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It feeds into Document 05 (Bi-Weekly Payout Summary), Document 06 (Contractor Payment Log), and Document 09 (Monthly P&L Statement).*
