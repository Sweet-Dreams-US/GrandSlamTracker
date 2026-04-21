// Outreach template registry.
//
// Each template is identified by `<service>_<role>_<version>` (e.g.
// `aerial_owner_cold_v1`). Templates are pure strings with `{slot}` merge
// fields filled at draft time from the client record + Notes block.
//
// Brand rules applied at draft time:
//   - No dashes anywhere in the rendered output (enforced via validators).
//   - Sign-off is Cole Marcuccilli, Sweet Dreams Media, Fort Wayne IN.
//   - Reel link defaults to https://sweetdreams.us/work for aerial.
//
// New templates get added here. Role + service combinations are declared in
// TEMPLATE_REGISTRY and referenced by Cowork via /api/outreach/templates.

export type TemplateRole = 'owner' | 'architect' | 'gc' | 'marketing' | 'venue' | 'other'
export type TemplateService = 'aerial' | 'music' | 'video' | 'photo'
export type TemplateKind = 'cold' | 'followup_day6' | 'followup_day17' | 'breakup'

export interface TemplateSlots {
  first_name?: string       // defaults to "team"
  company: string
  project?: string
  city_state?: string       // "Fort Wayne, IN"
  role_hook?: string        // free hook line
  service_line?: string     // e.g. "aerial cinema"
  reel_link?: string
  signoff_name?: string     // defaults to "Cole Marcuccilli"
  signoff_company?: string  // defaults to "Sweet Dreams Media"
  signoff_location?: string // defaults to "Fort Wayne, IN"
  signoff_url?: string      // defaults to "sweetdreams.us"
  /** Anything else Cowork wants to pass for custom templates. */
  [k: string]: string | undefined
}

export interface OutreachTemplate {
  id: string                // e.g. "aerial_owner_cold_v1"
  service: TemplateService
  role: TemplateRole
  kind: TemplateKind
  version: number
  description: string
  subject: string
  body: string
}

/** Defaults applied during render when a slot is missing. */
const DEFAULT_SLOTS: Partial<Record<keyof TemplateSlots, string>> = {
  first_name: 'team',
  signoff_name: 'Cole Marcuccilli',
  signoff_company: 'Sweet Dreams Media',
  signoff_location: 'Fort Wayne, IN',
  signoff_url: 'sweetdreams.us',
}

const AERIAL_REEL_LINK = 'https://sweetdreams.us/work'

// ─────────────────────────────────────────────────────────────────
// Template library
//   IMPORTANT: No dashes in any template body or subject. Keep copy
//   clean of hyphen-minus, em dash, en dash, etc. Validators will
//   reject a draft containing dashes.
// ─────────────────────────────────────────────────────────────────

const TEMPLATES: OutreachTemplate[] = [
  {
    id: 'aerial_owner_cold_v1',
    service: 'aerial',
    role: 'owner',
    kind: 'cold',
    version: 1,
    description: 'First touch to project owner. Frames the opportunity around a once-only completion flyover.',
    subject: 'Cinema flyover of {project}',
    body:
`Hi {first_name},

Congratulations on {project}. I run Sweet Dreams Media out of {signoff_location} and fly a DJI Inspire 2 with the Zenmuse X7 cine camera. The look is closer to a helicopter gimbal than a typical prosumer drone. Flat, three dimensional, real depth on glass facades and curtain walls.

I would like to put together a short cinema package for the finished building. Two or three exterior moves that live on your website homepage and investor pages, plus raw 6K files for your comms team.

Can I send a one minute reel of recent flagship work so you can judge the look for yourself? Link: {reel_link}

Best,
{signoff_name}
{signoff_company}
{signoff_location}
{signoff_url}`,
  },
  {
    id: 'aerial_architect_cold_v1',
    service: 'aerial',
    role: 'architect',
    kind: 'cold',
    version: 1,
    description: 'First touch to architecture firm. Speaks to portfolio value and case study imagery.',
    subject: 'Finished building cinema for {project}',
    body:
`Hi {first_name},

The completed {project} is a portfolio piece. I run Sweet Dreams Media in {signoff_location} and fly an Inspire 2 with the Zenmuse X7 cine camera. The output is 6K, graded, and reads as cinema rather than drone footage.

Most firms want the finished building shot once it is occupied and landscaped, but that window closes fast. A single day shoot gives you hero stills for the project page plus motion clips for case studies, award submissions, and RFPs.

One minute reel of recent flagship work: {reel_link}

Worth a call to see if it fits your next portfolio refresh?

Best,
{signoff_name}
{signoff_company}
{signoff_location}`,
  },
  {
    id: 'aerial_gc_cold_v1',
    service: 'aerial',
    role: 'gc',
    kind: 'cold',
    version: 1,
    description: 'First touch to general contractor. Speaks to progress documentation + marketing asset value.',
    subject: 'Flyover documentation for {project}',
    body:
`Hi {first_name},

Came across {project} and wanted to reach out. Sweet Dreams Media, based in {signoff_location}, flies a DJI Inspire 2 with the Zenmuse X7 cine camera for major build documentation.

Two ways GC teams typically use us:

First, monthly progress passes so the owner has clean aerials to share with their board.
Second, a completion film once the site is finished, with hero stills your marketing team can push to LinkedIn and proposals.

One minute reel of recent flagship work: {reel_link}

If you are mid build, would a quick look at rates for monthly progress make sense?

Best,
{signoff_name}
{signoff_company}
{signoff_location}`,
  },
  {
    id: 'aerial_owner_followup_day6_v1',
    service: 'aerial',
    role: 'owner',
    kind: 'followup_day6',
    version: 1,
    description: 'Six day follow up to owner after no reply.',
    subject: 'Re: Cinema flyover of {project}',
    body:
`Hi {first_name},

Following up on my note last week. With {project} progressing fast, the best shoot window can close before the site is occupied.

Two easy next steps:

Reply here with a couple of time slots this week for a short call, or let me know if you want the one minute reel first. Link: {reel_link}

Best,
{signoff_name}
{signoff_company}`,
  },
  {
    id: 'aerial_owner_breakup_v1',
    service: 'aerial',
    role: 'owner',
    kind: 'breakup',
    version: 1,
    description: 'Final touch before moving prospect to paused.',
    subject: 'Closing the loop on {project}',
    body:
`Hi {first_name},

Closing the loop on {project}. If cinema flyover is not on your radar right now, totally understand.

If it comes up later, renovation, next phase, another project, shoot me a note. My calendar books 4 to 6 weeks out during mega project completion windows, so earlier notice helps.

Best of luck with the rest of the build.

Best,
{signoff_name}
{signoff_company}`,
  },
]

export const TEMPLATE_REGISTRY: Record<string, OutreachTemplate> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
)

export function listTemplates(filter?: { service?: TemplateService; role?: TemplateRole; kind?: TemplateKind }): OutreachTemplate[] {
  return TEMPLATES.filter((t) => {
    if (filter?.service && t.service !== filter.service) return false
    if (filter?.role && t.role !== filter.role) return false
    if (filter?.kind && t.kind !== filter.kind) return false
    return true
  })
}

export function getTemplate(id: string): OutreachTemplate | null {
  return TEMPLATE_REGISTRY[id] || null
}

export interface RenderedTemplate {
  template_id: string
  subject: string
  body: string
  missing_slots: string[]
  applied_defaults: string[]
}

/**
 * Render a template with the given slots. Returns the subject+body plus a
 * list of any slots that were required but not provided (rendered as the
 * empty string). Callers can decide whether to proceed or reject.
 *
 * Slots are referenced via `{slot_name}`. Unknown slots render as empty.
 * URLs and emails pass through unchanged.
 */
export function renderTemplate(id: string, slots: TemplateSlots): RenderedTemplate | null {
  const t = getTemplate(id)
  if (!t) return null

  const merged: TemplateSlots = { ...slots }
  const appliedDefaults: string[] = []
  for (const [key, value] of Object.entries(DEFAULT_SLOTS)) {
    if (value !== undefined && !merged[key as keyof TemplateSlots]) {
      merged[key as keyof TemplateSlots] = value
      appliedDefaults.push(key)
    }
  }

  // Default reel link per service
  if (!merged.reel_link) {
    if (t.service === 'aerial') merged.reel_link = AERIAL_REEL_LINK
  }

  const missing: string[] = []
  const replace = (template: string): string =>
    template.replace(/\{([a-z_]+)\}/g, (match, slotName: string) => {
      const v = merged[slotName]
      if (v === undefined || v === '') {
        missing.push(slotName)
        return ''
      }
      return v
    })

  return {
    template_id: id,
    subject: replace(t.subject),
    body: replace(t.body),
    missing_slots: Array.from(new Set(missing)),
    applied_defaults: appliedDefaults,
  }
}
