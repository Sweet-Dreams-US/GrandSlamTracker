# Reference Charts

## All Rates, Tiers, and Lookup Tables

Central reference for all Grand Slam pricing calculations.

---

## Business Size Categories

| Category | Monthly Revenue | Annual Revenue | Typical Industries |
|----------|-----------------|----------------|-------------------|
| Micro | <$10k | <$120k | Startups, solo operators |
| Small | $10-30k | $120-360k | Local service businesses |
| Medium | $30-75k | $360-900k | Established local businesses |
| Large | $75-150k | $900k-1.8M | Multi-crew operations |
| Major | $150-300k | $1.8-3.6M | Large contractors |
| Enterprise | $300-500k | $3.6-6M | Regional companies |
| Elite | >$500k | >$6M | National players |

---

## Foundation Fee Rates

| Category | Annual Range | Rate | Example Calculation |
|----------|--------------|------|---------------------|
| Micro | <$120k | 3.00% | $100k × 3% = $3,000 |
| Small | $120-360k | 2.50% | $250k × 2.5% = $6,250 |
| Medium | $360-900k | 2.00% | $600k × 2% = $12,000 |
| Large | $900k-1.8M | 1.50% | $1.2M × 1.5% = $18,000 |
| Major | $1.8-3.6M | 1.25% | $2.5M × 1.25% = $31,250 |
| Enterprise | $3.6-6M | 1.00% | $5M × 1% = $50,000 |
| Elite | >$6M | 0.75% | $8M × 0.75% = $60,000 |

### Quick Reference: Common Baselines

| Annual Baseline | Category | Foundation Fee | Monthly Equivalent |
|-----------------|----------|----------------|-------------------|
| $50,000 | Micro | $1,500 | $125 |
| $100,000 | Micro | $3,000 | $250 |
| $150,000 | Small | $3,750 | $313 |
| $250,000 | Small | $6,250 | $521 |
| $400,000 | Medium | $8,000 | $667 |
| $600,000 | Medium | $12,000 | $1,000 |
| $800,000 | Medium | $16,000 | $1,333 |
| $1,000,000 | Large | $15,000 | $1,250 |
| $1,500,000 | Large | $22,500 | $1,875 |
| $2,000,000 | Major | $25,000 | $2,083 |
| $3,000,000 | Major | $37,500 | $3,125 |

---

## Growth Fee Tiers

### Tier Definitions

| Tier | Growth Range | Multiplier Range |
|------|--------------|------------------|
| Tier 1 | 0-50% | 1.0-1.5x baseline |
| Tier 2 | 51-100% | 1.5-2x baseline |
| Tier 3 | 101-200% | 2-3x baseline |
| Tier 4 | 201-300% | 3-4x baseline |
| Tier 5 | 301-500% | 4-6x baseline |
| Tier 6 | 501-750% | 6-8.5x baseline |
| Tier 7 | 751-1000% | 8.5-11x baseline |
| Tier 8 | 1001%+ | Beyond 11x baseline |

### Full Rate Matrix

| Tier | Micro | Small | Medium | Large | Major | Enterprise | Elite |
|------|-------|-------|--------|-------|-------|------------|-------|
| 1 (0-50%) | 10% | 8% | 6% | 5% | 4% | 3% | 2.5% |
| 2 (51-100%) | 15% | 12% | 9% | 7% | 5.5% | 4% | 3% |
| 3 (101-200%) | 20% | 16% | 12% | 9% | 7% | 5% | 4% |
| 4 (201-300%) | 18% | 14% | 10% | 8% | 6% | 4.5% | 3.5% |
| 5 (301-500%) | 15% | 12% | 8% | 7% | 5% | 4% | 3% |
| 6 (501-750%) | 12% | 10% | 7% | 6% | 4.5% | 3.5% | 2.5% |
| 7 (751-1000%) | 10% | 8% | 6% | 5% | 4% | 3% | 2% |
| 8 (1001%+) | 8% | 6% | 5% | 4% | 3.5% | 2.5% | 1.5% |

### Calculation Example

**Client:** Small category, 75% growth, $250k baseline

1. **Identify applicable tiers:**
   - Tier 1: 0-50% (50% of baseline)
   - Tier 2: 51-75% (25% of baseline)

2. **Calculate uplift per tier:**
   - Tier 1 uplift: $250k × 50% = $125,000
   - Tier 2 uplift: $250k × 25% = $62,500

3. **Apply rates:**
   - Tier 1 fee: $125,000 × 8% = $10,000
   - Tier 2 fee: $62,500 × 12% = $7,500

4. **Total growth fees:** $10,000 + $7,500 = **$17,500 for the year**

---

## Industry Growth Factors

Used in baseline reset calculations.

| Industry | Factor | Notes |
|----------|--------|-------|
| Remodeling | 1.12 | Strong demand, aging housing stock |
| Home Services | 1.10 | Essential, recurring |
| Healthcare | 1.08 | Aging population |
| Legal | 1.06 | Stable, consistent |
| Real Estate | 1.08 | Market dependent |
| Retail | 1.04 | High competition, e-commerce pressure |
| Restaurants | 1.05 | Thin margins, high turnover |
| Entertainment | 1.10 | Discretionary, event-driven |
| Professional Services | 1.06 | Stable, relationship-based |
| Automotive | 1.05 | Steady demand |
| Beauty/Salon | 1.04 | Competitive, low barriers |
| Fitness | 1.08 | Growing health awareness |

**Default Factor:** 1.06 (use when industry is uncertain)

---

## Seasonal Adjustment Indices

### Remodeling / Construction

| Month | Index | Interpretation |
|-------|-------|----------------|
| January | 0.65 | Low season |
| February | 0.70 | Ramping |
| March | 0.85 | Building |
| April | 1.00 | Normal |
| May | 1.20 | Peak starting |
| June | 1.35 | Peak |
| July | 1.30 | Peak |
| August | 1.20 | Peak |
| September | 1.10 | Winding down |
| October | 0.95 | Slowing |
| November | 0.70 | Low |
| December | 0.60 | Lowest |

### Home Services (HVAC, Plumbing, Electrical)

| Month | Index | Interpretation |
|-------|-------|----------------|
| January | 1.20 | Heating repairs |
| February | 1.15 | Heating repairs |
| March | 0.90 | Transition |
| April | 0.95 | Spring maintenance |
| May | 1.10 | AC prep |
| June | 1.30 | Peak AC |
| July | 1.40 | Peak AC |
| August | 1.35 | Peak AC |
| September | 1.00 | Transition |
| October | 0.85 | Slow |
| November | 0.90 | Heating prep |
| December | 1.10 | Heating |

### Entertainment / Events

| Month | Index | Interpretation |
|-------|-------|----------------|
| January | 0.70 | Post-holiday low |
| February | 0.80 | Valentine's bump |
| March | 0.90 | Spring break |
| April | 1.00 | Normal |
| May | 1.10 | Graduations |
| June | 1.30 | Summer peak |
| July | 1.40 | Peak |
| August | 1.20 | Back-to-school |
| September | 0.85 | Slow |
| October | 1.00 | Halloween |
| November | 0.90 | Pre-holiday |
| December | 1.15 | Holiday events |

### Non-Seasonal Industries

| Month | Index |
|-------|-------|
| All months | 1.00 |

---

## Baseline Retention Options

Used when calculating new baseline at contract renewal.

| Option | Retention % | Best For |
|--------|-------------|----------|
| Conservative | 25% | Keep more growth opportunity in Year 2 |
| Moderate | 35% | Default for most situations |
| Aggressive | 50% | Client negotiated, high confidence in retention |

### Worked Example

**Original baseline:** $300,000
**Year 1 growth:** 80%
**Industry factor:** 1.08

| Retention | Calculation | New Baseline |
|-----------|-------------|--------------|
| Conservative (25%) | $300k × 1.08 × (1 + 0.80 × 0.25) | $388,800 |
| Moderate (35%) | $300k × 1.08 × (1 + 0.80 × 0.35) | $414,720 |
| Aggressive (50%) | $300k × 1.08 × (1 + 0.80 × 0.50) | $453,600 |

---

## Quick Fee Estimator Tables

### Micro Clients (<$120k baseline)

| Baseline | 25% Growth | 50% Growth | 75% Growth | 100% Growth | 150% Growth | 200% Growth |
|----------|------------|------------|------------|-------------|-------------|-------------|
| $50k | $1,250 | $2,500 | $4,125 | $5,750 | $9,250 | $13,000 |
| $75k | $1,875 | $3,750 | $6,188 | $8,625 | $13,875 | $19,500 |
| $100k | $2,500 | $5,000 | $8,250 | $11,500 | $18,500 | $26,000 |

*Foundation fees not included. Add 3% of baseline.*

### Small Clients ($120k-360k baseline)

| Baseline | 25% Growth | 50% Growth | 75% Growth | 100% Growth | 150% Growth |
|----------|------------|------------|------------|-------------|-------------|
| $150k | $3,000 | $6,000 | $9,750 | $13,500 | $21,750 |
| $200k | $4,000 | $8,000 | $13,000 | $18,000 | $29,000 |
| $250k | $5,000 | $10,000 | $16,250 | $22,500 | $36,250 |
| $300k | $6,000 | $12,000 | $19,500 | $27,000 | $43,500 |

*Foundation fees not included. Add 2.5% of baseline.*

### Medium Clients ($360k-900k baseline)

| Baseline | 25% Growth | 50% Growth | 75% Growth | 100% Growth |
|----------|------------|------------|------------|-------------|
| $400k | $6,000 | $12,000 | $19,500 | $27,000 |
| $500k | $7,500 | $15,000 | $24,375 | $33,750 |
| $600k | $9,000 | $18,000 | $29,250 | $40,500 |
| $750k | $11,250 | $22,500 | $36,563 | $50,625 |

*Foundation fees not included. Add 2% of baseline.*

---

## Effective Rate Reference

*What % of total revenue do our fees represent?*

| Category | At 50% Growth | At 100% Growth | At 200% Growth |
|----------|---------------|----------------|----------------|
| Micro | 5.3% | 7.0% | 8.3% |
| Small | 4.2% | 5.5% | 6.5% |
| Medium | 3.3% | 4.3% | 5.0% |
| Large | 2.8% | 3.5% | 4.0% |
| Major | 2.3% | 2.8% | 3.2% |
| Enterprise | 1.8% | 2.2% | 2.5% |
| Elite | 1.5% | 1.8% | 2.0% |

---

## Minimum Fee Structures

### Option A: Minimum Monthly Fee

| Client Baseline | Recommended Minimum |
|-----------------|---------------------|
| Under $100k | $500/month |
| $100k-$200k | $750/month |
| $200k-$300k | $1,000/month |

**How it works:** Client pays the higher of calculated fees OR the minimum.

### Option B: Hybrid Retainer Structure

| Component | Standard | Premium |
|-----------|----------|---------|
| Monthly Retainer | $750 | $1,500 |
| Foundation Fee | Waived | Waived |
| Growth Fee Rate | 50% of standard | 50% of standard |

**When to use:** Client wants budget predictability, or baseline is too low for performance-only.

---

## Contract Terms & Payment Schedule

### Term Options

| Term | Use Case |
|------|----------|
| 12 months | Standard for all clients |
| 6 months | Trial periods, uncertain clients |

### Payment Timing

| Fee Type | When Charged |
|----------|--------------|
| Foundation Fee | Quarterly (3 equal payments) or Annual |
| Growth Fees | Monthly, billed by 10th of following month |
| Sustaining Fee | Monthly, billed with growth fees |
| Minimum Fees | Monthly, if applicable |

### Annual Calendar Example

| Month | Foundation | Growth | Sustaining | Notes |
|-------|------------|--------|------------|-------|
| Jan | Q1 payment | Dec performance | (Yr 2+) | Year starts |
| Feb | - | Jan performance | (Yr 2+) | |
| Mar | - | Feb performance | (Yr 2+) | |
| Apr | Q2 payment | Mar performance | (Yr 2+) | |
| May | - | Apr performance | (Yr 2+) | |
| Jun | - | May performance | (Yr 2+) | |
| Jul | Q3 payment | Jun performance | (Yr 2+) | |
| Aug | - | Jul performance | (Yr 2+) | |
| Sep | - | Aug performance | (Yr 2+) | |
| Oct | Q4 payment | Sep performance | (Yr 2+) | |
| Nov | - | Oct performance | (Yr 2+) | |
| Dec | - | Nov performance | (Yr 2+) | Year ends |

---

## Formula Reference

### Foundation Fee
```
Foundation Fee = Annual Baseline × Category Rate
Monthly Equivalent = Foundation Fee ÷ 12
```

### Growth Fee (per month)
```
Monthly Uplift = Current Month Revenue - (Baseline ÷ 12)
Cumulative Uplift = Sum of all monthly uplift YTD
Growth % = Cumulative Uplift ÷ Baseline
Apply tier rates to each tier of growth
```

### Sustaining Fee (Year 2+)
```
Sustaining = Last Year Avg Monthly Fee - (New Foundation ÷ 12)
If result < 0, Sustaining = 0
```

### Baseline Reset
```
New Baseline = Old Baseline × Industry Factor × (1 + Growth% × Retention%)
```

### Total Monthly Fee (Year 1)
```
Monthly Fee = (Foundation ÷ 12) + Growth Fees
```

### Total Monthly Fee (Year 2+)
```
Monthly Fee = (Foundation ÷ 12) + Sustaining + Growth Fees
```

---

*See also: [Scenario Calculator](scenario-calculator.md) | [Eligibility Criteria](eligibility-criteria.md)*
