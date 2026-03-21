# Document 03: Producer Beat Sale Record

**File:** `03_producer_beat_sale.md`
**Frequency:** Per-Transaction / Bi-Weekly Aggregation
**Owner:** Sweet Dreams Media LLC (Indiana)
**Last Updated:** March 2026

---

## 1. Purpose

To track every sale of digital assets (beats, instrumentals, sound kits) sold through Sweet Dreams' platforms. This is the **critical tax document** for the business because it is the **only revenue stream where Indiana Sales Tax must be collected and remitted.** Every beat sale generates a sales tax liability that Sweet Dreams holds in trust for the State of Indiana until filing.

Producers are independent online collaborators — Sweet Dreams sells their beats and pays them an agreed-upon percentage. This document is the sole record that triggers producer payouts and sales tax remittance.

---

## 2. Required Data Fields

| Field Name | Type | Description |
|---|---|---|
| `sale_id` | String | Unique ID using format `BEAT-YYYY-###` (e.g., `BEAT-2026-019`). Sequential per calendar year. |
| `sale_date` | Date | Date the transaction occurred. |
| `beat_id` | String | Name or catalog ID of the beat sold (e.g., "Midnight Run" or `SD-BEAT-047`). |
| `license_type` | Dropdown | Basic Lease, Premium Lease, Exclusive, Unlimited, or Buyout. |
| `sale_price` | Currency | The list price before tax (e.g., $49.99). This is the taxable amount. |
| `buyer_name` | String | Name of the purchasing artist/entity. |
| `buyer_state` | String | State of the buyer (determines tax obligation — see Section 4.2). |
| `in_sales_tax_rate` | Percentage | Indiana sales tax rate: **7.00%** (flat, no local variation). |
| `in_sales_tax_collected` | Formula | `sale_price × 0.07` — Only collected if buyer is in Indiana or if economic nexus applies. |
| `total_collected` | Formula | `sale_price + in_sales_tax_collected` — Total amount charged to the buyer. |
| `producer_name` | String | The creator of the beat (online producer). |
| `producer_agreement_pct` | Percentage | The agreed-upon revenue share for the producer (e.g., 50%). |
| `producer_payout` | Formula | `sale_price × producer_agreement_pct` — Paid from the pre-tax sale price. |
| `business_profit` | Formula | `sale_price − producer_payout` — Sweet Dreams' gross profit on the sale. |
| `platform` | String | Where the sale occurred (BeatStars, Airbit, Website, Direct). |
| `pay_period` | String | The bi-weekly pay period this sale falls into. |
| `notes` | Text | Special licensing terms, custom pricing, or buyer requests. |

---

## 3. Example Entry

```
sale_id:                  BEAT-2026-019
sale_date:                2026-03-05
beat_id:                  SD-BEAT-047 "Midnight Run"
license_type:             Premium Lease
sale_price:               $99.99
buyer_name:               Artist X
buyer_state:              Indiana
in_sales_tax_rate:        7.00%
in_sales_tax_collected:   $7.00
total_collected:          $106.99
producer_name:            BeatsByTrenton (Trenton James)
producer_agreement_pct:   50%
producer_payout:          $50.00
business_profit:          $49.99
platform:                 BeatStars
pay_period:               2026-03-01 to 2026-03-15
```

---

## 4. Rules & Laws

### 4.1 Indiana Sales Tax on Digital Products — Indiana Code § 6-2.5-1-26.5

Indiana classifies digital audio files as **"Specified Digital Products"** under IC § 6-2.5-1-26.5. This means:

- **Digital audio works** (beats, instrumentals, sound kits) are subject to the **7% Indiana Sales Tax** when sold to end users.
- The tax applies to products **transferred electronically** — no physical media required.
- The tax applies when the buyer receives a **right of permanent use** (i.e., the license does not require continual subscription payments).
- Both **lease licenses** (non-exclusive) and **exclusive licenses** are taxable because the buyer receives a permanent-use digital product.

> **Critical Compliance Note:** The 7% sales tax collected from buyers is **NOT Sweet Dreams' money.** The LLC holds this money **in trust** for the State of Indiana. Spending sales tax collections on business expenses or payouts is a fiduciary violation and can result in personal liability for Jay and Cole as LLC members.

### 4.2 Sales Tax Nexus — When to Collect

| Buyer Location | Collect Indiana Sales Tax? | Authority |
|---|---|---|
| **Indiana resident** | **YES — Always 7%** | IC § 6-2.5-2-1 |
| **Out-of-state, Sweet Dreams has nexus** | Depends on state law | Varies by state |
| **Out-of-state, no nexus** | No | South Dakota v. Wayfair (2018) thresholds apply |
| **International** | No (generally) | No U.S. sales tax jurisdiction |

**Indiana Economic Nexus Threshold (for other states collecting from you):** If Sweet Dreams makes **$100,000+ in sales** or **200+ transactions** into another state, that state may require you to collect and remit their sales tax. Monitor this as beat sales scale.

### 4.3 ST-103 Filing — Indiana Sales & Use Tax Return

All beat sales with Indiana sales tax are reported on **Form ST-103**, filed through the **INtax online portal** (intax.in.gov).

| Average Monthly Tax Liability | Filing Frequency | Due Date |
|---|---|---|
| **≥ $1,000/month** | Monthly | 20th of the following month |
| **< $1,000/month** | Monthly | 30th of the following month |
| **Under $10/month** (very low volume) | Annual | January 31 of the following year |

> **Sweet Dreams should file monthly** until volume justifies a different schedule. Even if no sales occurred in a month, a **zero-return must be filed** if you have an active sales tax permit.

### 4.4 Sales Tax Permit Requirement

Before collecting any sales tax, Sweet Dreams must hold a valid **Registered Retail Merchant Certificate (RRMC)** issued by the Indiana Department of Revenue. This is obtained through the INBiz portal (inbiz.in.gov). Operating without one while collecting sales tax is a criminal offense under IC § 6-2.5-8-1.

### 4.5 Producer Classification — Independent Contractors

Online producers whose beats are sold through Sweet Dreams are **independent contractors**:

- **Form 1099-NEC** required if the producer receives $600+ in a calendar year ($2,000 threshold for payments made in 2026 per the One Big Beautiful Bill Act).
- **W-9 Form** must be collected from each producer before any payout.
- The producer payout is calculated on the **pre-tax sale price** — sales tax is never part of the producer's revenue share.
- Producers set their own prices, create beats on their own equipment, and are not controlled by Sweet Dreams in their creative process.

### 4.6 License Type Tax Implications

| License Type | Taxable in Indiana? | Reasoning |
|---|---|---|
| Basic Lease | Yes | Permanent-use digital audio work |
| Premium Lease | Yes | Permanent-use digital audio work |
| Exclusive | Yes | Transfer of digital audio work |
| Unlimited | Yes | Permanent-use digital audio work |
| Buyout (full copyright transfer) | Yes | Sale of specified digital product |
| Subscription/Rental (if ever offered) | Potentially exempt | No permanent use — consult tax advisor |

---

## 5. Business Relation

### 5.1 The Sales Tax Trust Account

**Best Practice:** Open a separate bank account or sub-account specifically for holding collected sales tax. This prevents accidental spending of tax money and makes ST-103 filing straightforward.

```
Beat sold for $99.99 + $7.00 tax = $106.99 collected

  $7.00  → Sales Tax Trust Account (DO NOT TOUCH — remit to Indiana DOR)
  $50.00 → Producer Payout (50%)
  $49.99 → Sweet Dreams Business Revenue
    └─→ $17.50 to Business Fund (35% of $49.99)
    └─→ $32.49 to Profit Pool
```

### 5.2 Revenue Attribution

Beat sale revenue is categorized as **"Beat Sales Revenue"** in the Monthly P&L (Document 09). It is separate from Media Revenue and Studio Session Revenue. The business profit from beat sales represents the **highest-margin revenue stream** because there is no labor cost to Sweet Dreams beyond platform hosting.

### 5.3 ST-103 Source Data

This ledger is the **primary source data** for preparing the ST-103 filing each month. At filing time:

1. Filter all `sale_id` entries for the filing month
2. Sum all `in_sales_tax_collected` values
3. This total is the amount remitted to the Indiana DOR
4. Retain this document as backup in case of audit

---

## 6. Reconciliation Checkpoint

At the end of each bi-weekly pay period:

```
Σ total_collected (all beat sales in period) =
  Σ in_sales_tax_collected +
  Σ producer_payout +
  Σ business_profit
```

At the end of each month (for ST-103 prep):

```
Σ in_sales_tax_collected (all sales in month) =
  Amount remitted on ST-103
```

---

## 7. Document Retention

Per IRS guidelines and Indiana DOR requirements:

- **Retain for a minimum of 7 years** (IRS) or **3 years** (Indiana DOR minimum), whichever is longer.
- The Indiana DOR can audit sales tax returns for up to **3 years** from the filing date, or **6 years** if underreporting exceeds 25%.
- Store all beat sale records, platform transaction confirmations, and license agreements.
- Cross-reference each `sale_id` with the platform's transaction record (BeatStars dashboard, Airbit analytics, etc.).

---

## 8. Producer Onboarding Checklist

Before a producer's first beat sale is logged:

- [ ] **W-9 Form** collected (legal name, address, SSN/EIN)
- [ ] **Revenue share agreement** signed (specifies percentage, license types, payment terms)
- [ ] **Beat catalog** uploaded with proper metadata (titles, BPM, key, tags)
- [ ] **Payment method** confirmed (PayPal, Zelle, direct deposit)
- [ ] **Tax responsibility acknowledgment** signed (producer understands they are responsible for their own income taxes)

---

*This document is part of the Sweet Dreams Media LLC Grand Slam Operations System. It feeds into Document 05 (Bi-Weekly Payout Summary), Document 06 (Contractor Payment Log), Document 09 (Monthly P&L Statement), and Document 11 (Indiana Sales Tax ST-103 Worksheet).*
