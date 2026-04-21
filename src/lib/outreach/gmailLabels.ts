// Gmail label constants + routing helpers.
//
// Labels under cole@sweetdreams.us drive the state machine per PDF §5.
// This module is the canonical source for label names and the mapping from
// an outreach event to the label transition Cowork should perform.

export const GMAIL_LABELS = {
  ROOT: 'Outreach',
  PENDING: 'Outreach/Pending',
  APPROVED: 'Outreach/Approved',
  SENT: 'Outreach/Sent',
  REPLIED: 'Outreach/Replied',
  DO_NOT_SEND: 'Outreach/DoNotSend',

  // Service-line tags
  AERIAL: 'Outreach/Aerial',
  MUSIC: 'Outreach/Music',
  VIDEO: 'Outreach/Video',
  PHOTO: 'Outreach/Photo',
} as const

export type GmailLabel = typeof GMAIL_LABELS[keyof typeof GMAIL_LABELS]

/** All labels Cowork should ensure exist on first run. */
export const REQUIRED_LABELS: GmailLabel[] = [
  GMAIL_LABELS.ROOT,
  GMAIL_LABELS.PENDING,
  GMAIL_LABELS.APPROVED,
  GMAIL_LABELS.SENT,
  GMAIL_LABELS.REPLIED,
  GMAIL_LABELS.DO_NOT_SEND,
  GMAIL_LABELS.AERIAL,
  GMAIL_LABELS.MUSIC,
  GMAIL_LABELS.VIDEO,
  GMAIL_LABELS.PHOTO,
]

/** Map a service-line string to its Gmail service tag. */
export function serviceLabel(service: string | null | undefined): GmailLabel | null {
  if (!service) return null
  const s = service.toLowerCase()
  if (s.includes('aerial') || s.includes('drone')) return GMAIL_LABELS.AERIAL
  if (s.includes('music')) return GMAIL_LABELS.MUSIC
  if (s.includes('video')) return GMAIL_LABELS.VIDEO
  if (s.includes('photo')) return GMAIL_LABELS.PHOTO
  return null
}

/** Labels to apply when creating a pending outreach draft for a given service. */
export function labelsForNewDraft(service: string | null | undefined): GmailLabel[] {
  const labels: GmailLabel[] = [GMAIL_LABELS.PENDING]
  const svc = serviceLabel(service)
  if (svc) labels.push(svc)
  return labels
}

/** State transition: pending → approved → sent. */
export const LABEL_TRANSITIONS = {
  approve: { remove: GMAIL_LABELS.PENDING, add: GMAIL_LABELS.APPROVED },
  markSent: { remove: GMAIL_LABELS.APPROVED, add: GMAIL_LABELS.SENT },
  markReplied: { remove: GMAIL_LABELS.SENT, add: GMAIL_LABELS.REPLIED },
  killLead:    { remove: null, add: GMAIL_LABELS.DO_NOT_SEND },
} as const
