// Brand-voice + outreach validators.
//
// Per CRM Outreach System Design v0.1 §4.3:
//   "No dashes in any generated copy. Templates and on the fly
//    personalization both enforced."
//
// Cowork calls these before creating a Gmail draft. Platform also exposes a
// `/api/outreach/validate/email` endpoint for the same check at the API
// boundary.

/* eslint-disable no-irregular-whitespace */

/**
 * Any character commonly displayed as a "dash" in typography.
 * Covers ASCII hyphen-minus, non-breaking hyphen, figure dash, en dash,
 * em dash, horizontal bar, soft hyphen, small/full-width variants.
 */
const DASH_CHARS = [
  '\u002D', // HYPHEN-MINUS
  '\u2010', // HYPHEN
  '\u2011', // NON-BREAKING HYPHEN
  '\u2012', // FIGURE DASH
  '\u2013', // EN DASH
  '\u2014', // EM DASH
  '\u2015', // HORIZONTAL BAR
  '\u00AD', // SOFT HYPHEN
  '\uFE58', // SMALL EM DASH
  '\uFE63', // SMALL HYPHEN-MINUS
  '\uFF0D', // FULLWIDTH HYPHEN-MINUS
]

const DASH_CHAR_CLASS = `[${DASH_CHARS.join('')}]`

const URL_REGEX = /https?:\/\/\S+/gi
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
/** Common handles / cite patterns where a hyphen is acceptable. */
const HANDLE_REGEX = /(@[A-Za-z0-9_-]+|#[A-Za-z0-9_-]+)/g

export interface DashHit {
  /** 0-based character offset within the input. */
  index: number
  /** The dash character itself. */
  char: string
  /** Up to ~20 chars of surrounding context for debugging. */
  context: string
}

export interface DashCheckResult {
  ok: boolean
  count: number
  hits: DashHit[]
  /** Input with URLs / emails / handles masked out — useful for debugging. */
  normalized: string
}

/**
 * Scan text for dashes outside URLs / email addresses / @handles / #hashtags.
 *
 * The brand-voice rule is "no dashes in generated copy" — meaning prose. We
 * allow dashes in URLs and email addresses since those are literal references,
 * not stylistic choices. Everything else fails.
 */
export function checkForDashes(text: string, opts?: { ignoreUrls?: boolean; ignoreEmails?: boolean; ignoreHandles?: boolean }): DashCheckResult {
  const ignoreUrls = opts?.ignoreUrls ?? true
  const ignoreEmails = opts?.ignoreEmails ?? true
  const ignoreHandles = opts?.ignoreHandles ?? true

  // Mask protected spans with spaces so offsets stay stable relative to the original.
  let normalized = text
  if (ignoreUrls) normalized = maskWithSpaces(normalized, URL_REGEX)
  if (ignoreEmails) normalized = maskWithSpaces(normalized, EMAIL_REGEX)
  if (ignoreHandles) normalized = maskWithSpaces(normalized, HANDLE_REGEX)

  const hits: DashHit[] = []
  const rx = new RegExp(DASH_CHAR_CLASS, 'g')
  const matches = Array.from(normalized.matchAll(rx))
  for (const m of matches) {
    if (m.index === undefined) continue
    const index = m.index
    const start = Math.max(0, index - 20)
    const end = Math.min(text.length, index + 21)
    hits.push({
      index,
      char: m[0],
      context: text.slice(start, end).replace(/\n/g, '⏎'),
    })
  }

  return {
    ok: hits.length === 0,
    count: hits.length,
    hits,
    normalized,
  }
}

function maskWithSpaces(input: string, pattern: RegExp): string {
  return input.replace(pattern, (match) => ' '.repeat(match.length))
}

/**
 * Convenience: strip all dashes from a string (greedy).
 * Useful for sanitizing Cowork drafts before create_draft, with a warning log.
 */
export function stripDashes(text: string): string {
  const rx = new RegExp(DASH_CHAR_CLASS, 'g')
  return text.replace(rx, '')
}

/**
 * Validate a full email draft (subject + body). Returns pass/fail per check.
 * Cowork should pass the check before calling Gmail MCP create_draft.
 */
export interface EmailValidationResult {
  ok: boolean
  subject_dashes: DashCheckResult
  body_dashes: DashCheckResult
  warnings: string[]
}

export function validateEmailDraft(subject: string, body: string): EmailValidationResult {
  const subjectCheck = checkForDashes(subject)
  const bodyCheck = checkForDashes(body)

  const warnings: string[] = []

  // Reasonable length guardrails. Not blocking — just surfaced.
  if (subject.length > 90) warnings.push(`Subject is ${subject.length} chars; aim for <=90.`)
  if (!subject.trim()) warnings.push('Subject is empty.')

  const bodyWordCount = body.split(/\s+/).filter(Boolean).length
  if (bodyWordCount < 30) {
    warnings.push('Body is under 30 words. First-touch cold outreach usually reads 70 to 120 words.')
  }
  if (bodyWordCount > 220) {
    warnings.push('Body is over 220 words. Consider trimming.')
  }
  if (!/\b(Cole|Sweet Dreams)\b/.test(body)) {
    warnings.push('Body lacks sign-off reference to Cole or Sweet Dreams.')
  }

  return {
    ok: subjectCheck.ok && bodyCheck.ok,
    subject_dashes: subjectCheck,
    body_dashes: bodyCheck,
    warnings,
  }
}
