// Parser for Sweet Dreams Outreach Packs (.docx format).
//
// Each pack has a consistent structure (Volumes 1-4):
//   Intro section (positioning, rules) — skipped
//   Project briefings — one per flagship, in this shape:
//
//     #<N>. <project name>
//     Type: <type>
//     Location: <city/state>
//     Target completion: <timeframe>
//     Drive from Fort Wayne: <note>
//     Owner and end user: <owner>
//     Architect: <architect>
//     Contractor: <contractor>
//     Why this one: <hook>
//     Verify before sending: <note>
//     Who to contact on #<N>
//     Owner side communications at <owner>
//       Role inbox: <emails>
//       Website: <url>
//       LinkedIn search: <search>
//       <push strategy>
//     Architect communications at <architect>
//       ... (same structure)
//     Contractor marketing at <contractor>
//       ... (same structure)
//     Email draft for #<N> (no dashes)
//       Subject: <subject>
//       Hi [first name], ...
//       Best, Cole Marcuccilli ...
//   Rollups section (by contractor/architect/owner) — skipped
//
// This parser extracts every project briefing into a normalized
// structure ready for `POST /api/outreach/clients`.

import mammoth from 'mammoth'

export type OutreachRole = 'Owner' | 'Architect' | 'GC' | 'Other'

export interface ParsedContact {
  kind: OutreachRole
  org_name: string           // e.g. "Parkview Health"
  role_inbox_emails: string[]
  website?: string
  linkedin_search?: string
  push_strategy?: string     // short blurb from the pack
}

export interface ParsedEmailDraft {
  subject: string
  body: string
}

export interface ParsedProject {
  number: number              // #1, #2, ...
  name: string
  type?: string               // "Healthcare", etc.
  location?: string
  city?: string
  state?: string
  target_completion?: string
  drive_note?: string
  owner_name?: string
  architect_name?: string
  contractor_name?: string
  hook?: string               // "Why this one"
  verify_note?: string
  contacts: ParsedContact[]
  email_draft?: ParsedEmailDraft
}

export interface ParseResult {
  title: string              // pack title (first line of doc)
  projects: ParsedProject[]
  unmatched_lines: string[]  // anything we couldn't classify, for debug
}

export async function parseOutreachPack(buffer: Buffer): Promise<ParseResult> {
  const { value: text } = await mammoth.extractRawText({ buffer })
  return parseOutreachPackText(text)
}

export function parseOutreachPackText(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const title = lines[0] || 'Outreach Pack'
  const projects: ParsedProject[] = []
  const unmatched: string[] = []

  // Split into project blocks: each starts with "#<N>. <name>"
  // Note: rollup section at the end also has "#<N>" references — we stop when
  // we see the phrase "By contractor" / "By architect" / "By owner" headings.

  const projectStartRe = /^#(\d+)\.\s+(.+)$/

  let currentBlock: string[] | null = null
  let currentNumber = 0
  let currentName = ''
  let inRollup = false

  const flushBlock = () => {
    if (!currentBlock || currentBlock.length === 0) return
    const project = parseProjectBlock(currentNumber, currentName, currentBlock, unmatched)
    if (project) projects.push(project)
    currentBlock = null
  }

  for (const line of lines) {
    if (isRollupMarker(line)) {
      inRollup = true
      flushBlock()
      continue
    }
    if (inRollup) continue

    const m = line.match(projectStartRe)
    if (m) {
      flushBlock()
      currentNumber = parseInt(m[1], 10)
      currentName = m[2]
      currentBlock = []
      continue
    }
    if (currentBlock) {
      currentBlock.push(line)
    }
  }
  flushBlock()

  return { title, projects, unmatched_lines: unmatched }
}

function isRollupMarker(line: string): boolean {
  const l = line.toLowerCase()
  return (
    l.startsWith('by contractor') ||
    l.startsWith('by architect') ||
    l.startsWith('by owner') ||
    l.startsWith('rollups') ||
    l === 'end of pack' ||
    l === 'end of volume'
  )
}

function parseProjectBlock(
  number: number,
  name: string,
  lines: string[],
  unmatched: string[]
): ParsedProject | null {
  if (!name) return null

  const project: ParsedProject = {
    number,
    name,
    contacts: [],
  }

  // State machine: either in "metadata" section, "Who to contact" section
  // (per-role subsections), or "Email draft" section.
  type Section =
    | 'metadata'
    | { role: OutreachRole; org_name: string; contact: ParsedContact }
    | 'email_draft'

  let section: Section = 'metadata'
  let emailDraftSubject: string | undefined
  const emailBodyLines: string[] = []

  const commitContact = () => {
    if (typeof section !== 'string' && section !== null && (section as any).contact) {
      const c = (section as any).contact as ParsedContact
      // Only keep if we captured at least an org name
      if (c.org_name) project.contacts.push(c)
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Section switches
    if (/^Who to contact on #\d+/i.test(line)) {
      commitContact()
      section = 'metadata' // reset, next lines will trigger role section
      continue
    }
    const ownerHeader = line.match(/^Owner\s+side\s+communications\s+at\s+(.+)$/i)
    if (ownerHeader) {
      commitContact()
      const contact: ParsedContact = {
        kind: 'Owner',
        org_name: ownerHeader[1].trim(),
        role_inbox_emails: [],
      }
      section = { role: 'Owner', org_name: ownerHeader[1].trim(), contact }
      continue
    }
    const archHeader = line.match(/^Architect\s+communications\s+at\s+(.+)$/i)
    if (archHeader) {
      commitContact()
      const contact: ParsedContact = {
        kind: 'Architect',
        org_name: archHeader[1].trim(),
        role_inbox_emails: [],
      }
      section = { role: 'Architect', org_name: archHeader[1].trim(), contact }
      continue
    }
    const gcHeader = line.match(/^Contractor\s+marketing\s+at\s+(.+)$/i)
    if (gcHeader) {
      commitContact()
      const contact: ParsedContact = {
        kind: 'GC',
        org_name: gcHeader[1].trim(),
        role_inbox_emails: [],
      }
      section = { role: 'GC', org_name: gcHeader[1].trim(), contact }
      continue
    }
    if (/^Email draft for #\d+/i.test(line)) {
      commitContact()
      section = 'email_draft'
      continue
    }

    // Within 'metadata' section, parse key-value lines
    if (section === 'metadata') {
      const kv = line.match(/^([A-Za-z][^:]+):\s*(.+)$/)
      if (!kv) { unmatched.push(line); continue }
      const key = kv[1].trim().toLowerCase()
      const value = kv[2].trim()
      switch (key) {
        case 'type': project.type = value; break
        case 'location': {
          project.location = value
          const cs = value.split(',').map((s) => s.trim())
          if (cs.length >= 2) { project.city = cs[0]; project.state = cs[1] }
          else { project.city = value }
          break
        }
        case 'target completion': project.target_completion = value; break
        case 'drive from fort wayne': project.drive_note = value; break
        case 'owner and end user': project.owner_name = value; break
        case 'architect': project.architect_name = value; break
        case 'contractor': project.contractor_name = value; break
        case 'why this one': project.hook = value; break
        case 'verify before sending': project.verify_note = value; break
        default: unmatched.push(line)
      }
      continue
    }

    // Within a role section, parse contact fields
    if (typeof section === 'object' && 'contact' in section) {
      const kv = line.match(/^([A-Za-z][^:]+):\s*(.+)$/)
      if (kv) {
        const key = kv[1].trim().toLowerCase()
        const value = kv[2].trim()
        switch (key) {
          case 'role inbox': {
            section.contact.role_inbox_emails = value
              .split(',')
              .map((e) => e.trim().replace(/[<>]/g, ''))
              .filter(Boolean)
            break
          }
          case 'website': section.contact.website = value; break
          case 'linkedin search': section.contact.linkedin_search = value; break
          default:
            // Push-strategy blurbs don't start with a recognized key
            section.contact.push_strategy = section.contact.push_strategy
              ? `${section.contact.push_strategy} ${line}`
              : line
        }
        continue
      }
      // Line with no colon inside a role section -> push-strategy continuation
      section.contact.push_strategy = section.contact.push_strategy
        ? `${section.contact.push_strategy} ${line}`
        : line
      continue
    }

    // Email draft section
    if (section === 'email_draft') {
      const subjectMatch = line.match(/^Subject:\s*(.+)$/i)
      if (subjectMatch && !emailDraftSubject) {
        emailDraftSubject = subjectMatch[1].trim()
        continue
      }
      emailBodyLines.push(line)
      continue
    }

    unmatched.push(line)
  }

  commitContact()

  if (emailDraftSubject || emailBodyLines.length > 0) {
    project.email_draft = {
      subject: emailDraftSubject || `Regarding ${name}`,
      body: emailBodyLines.join('\n').trim(),
    }
  }

  return project
}

/**
 * Convenience: convert a ParsedProject into a prospect payload shaped for
 * POST /api/outreach/clients. Picks the Owner-role contact as the primary.
 */
export function projectToProspectPayload(project: ParsedProject, serviceLine: string = 'aerial_cinema') {
  const owner = project.contacts.find((c) => c.kind === 'Owner')
  const primaryEmail = owner?.role_inbox_emails?.[0]

  return {
    business_name: project.owner_name || project.name,
    display_name: project.name,
    industry: project.type || 'construction',
    status: 'prospect',
    website_url: owner?.website,
    primary_contact_name: null,
    primary_contact_email: primaryEmail,
    outreach_block: {
      service: serviceLine,
      project: project.name,
      project_role: owner ? 'Owner' : project.contacts[0]?.kind || 'Owner',
      project_eta: project.target_completion,
      project_city: project.city,
      project_state: project.state,
      hook: project.hook,
      contacts: project.contacts.flatMap((c) =>
        c.role_inbox_emails.map((email) => ({
          name: `${c.kind} Inbox`,
          role: c.kind,
          email,
          source: 'vol4_backlog',
          extra: c.website ? { org: c.org_name, website: c.website } : { org: c.org_name },
        }))
      ),
      cross_refs: [
        ...(project.architect_name ? [{ kind: 'Architect', name: project.architect_name }] : []),
        ...(project.contractor_name ? [{ kind: 'GC', name: project.contractor_name }] : []),
      ],
      next_step: 'ready_to_draft',
    },
    email_draft: project.email_draft,  // passed separately; API may ignore
  }
}
