'use client'

// PayoutRecordStatusBadges
//
// 4 reconciliation indicators for a single payout_record, always visible on
// the card header (without needing to expand):
//
//   ● Client  — deposits received vs total_revenue
//   ● Business — payment_to_business vs business_amount
//   ● Workers  — payment_to_worker vs worker_amount
//   ● Sales    — payment_to_sales vs sales_amount  (hidden if sales_amount = 0)
//
// Colors:
//   green = fully reconciled (≥ 99.5% to handle rounding)
//   amber = partial (anything > 0 but < target)
//   red   = zero paid yet (target > 0, paid = 0)
//   gray  = N/A (target = 0)

import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export interface RecordReconciliation {
  /** Sum of deposit_received transactions for this record. */
  deposits_received: number
  /** Sum of payment_to_business. */
  business_paid: number
  /** Sum of payment_to_worker. */
  workers_paid: number
  /** Sum of payment_to_sales. */
  sales_paid: number
}

type Tone = 'full' | 'partial' | 'none' | 'na'

function tone(paid: number, target: number): Tone {
  if (target <= 0) return 'na'
  const ratio = paid / target
  if (ratio >= 0.995) return 'full'
  if (paid <= 0) return 'none'
  return 'partial'
}

const toneStyles: Record<Tone, { bg: string; fg: string; border: string; label: string }> = {
  full:    { bg: 'bg-emerald-500/10', fg: 'text-emerald-400', border: 'border-emerald-500/30', label: '✓' },
  partial: { bg: 'bg-amber-500/10',   fg: 'text-amber-400',   border: 'border-amber-500/30',   label: '⋯' },
  none:    { bg: 'bg-rose-500/10',    fg: 'text-rose-400',    border: 'border-rose-500/30',    label: '✗' },
  na:      { bg: 'bg-[var(--surface-hover)]', fg: 'text-[var(--muted)]', border: 'border-[var(--border)]', label: '—' },
}

function pct(paid: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((paid / target) * 100))
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

interface Props {
  totalRevenue: number
  businessAmount: number
  salesAmount: number
  workerAmount: number
  reconciliation: RecordReconciliation
  /** compact hides the percentage text and shows only dot indicators */
  compact?: boolean
}

export default function PayoutRecordStatusBadges({
  totalRevenue,
  businessAmount,
  salesAmount,
  workerAmount,
  reconciliation,
  compact = false,
}: Props) {
  const items: { key: string; label: string; paid: number; target: number }[] = [
    { key: 'client',   label: 'Client',   paid: reconciliation.deposits_received, target: totalRevenue },
    { key: 'business', label: 'Business', paid: reconciliation.business_paid,      target: businessAmount },
    { key: 'workers',  label: 'Workers',  paid: reconciliation.workers_paid,       target: workerAmount },
  ]
  // Only show Sales if the deal actually has a sales portion
  if (salesAmount > 0) {
    items.push({ key: 'sales', label: 'Sales', paid: reconciliation.sales_paid, target: salesAmount })
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'} flex-wrap`}>
      {items.map((it) => {
        const t = tone(it.paid, it.target)
        const s = toneStyles[t]
        const percent = pct(it.paid, it.target)
        const remaining = Math.max(0, Math.round((it.target - it.paid) * 100) / 100)
        const tooltip = it.target === 0
          ? `${it.label}: not applicable`
          : `${it.label}: ${fmt(it.paid)} of ${fmt(it.target)}` +
            (remaining > 0 ? ` — ${fmt(remaining)} still ${it.key === 'client' ? 'owed to us' : 'unpaid'}` : ' — fully reconciled')

        if (compact) {
          return (
            <span key={it.key} title={tooltip} className={`inline-block w-2 h-2 rounded-full ${s.bg.replace('/10', '')}`} />
          )
        }

        return (
          <span
            key={it.key}
            title={tooltip}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${s.bg} ${s.fg} ${s.border}`}
          >
            {t === 'full' ? (
              <CheckCircle2 className="h-2.5 w-2.5" />
            ) : t === 'none' ? (
              <AlertCircle className="h-2.5 w-2.5" />
            ) : t === 'partial' ? (
              <Circle className="h-2.5 w-2.5" />
            ) : (
              <span className="w-2.5 h-2.5 inline-block" />
            )}
            <span>{it.label}</span>
            {t !== 'na' && <span className="font-mono">{percent}%</span>}
          </span>
        )
      })}
    </div>
  )
}
