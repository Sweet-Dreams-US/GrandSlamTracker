// POST /api/outreach/import
//   Upload a Sweet Dreams Outreach Pack (.docx) and seed prospects +
//   Gmail drafts from each project in the pack.
//
// Body: multipart/form-data with `file` (the .docx) and optional:
//   - `create_drafts=true|false` (default true) — also create Gmail drafts
//   - `service` (default "aerial_cinema")
//
// Returns: { parsed: number, created_prospects: number, created_drafts: number, errors: [] }

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import {
  parseOutreachPack,
  projectToProspectPayload,
  type ParsedProject,
} from '@/lib/outreach/docx-parser'
import { createDraft } from '@/lib/outreach/gmail'
import { GMAIL_LABELS, serviceLabel } from '@/lib/outreach/gmailLabels'
import {
  parseNotesBlock,
  applyBlockToNotes,
  setDraft,
  type OutreachBlock,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ImportError { project_number?: number; project_name?: string; stage: string; error: string }

export async function POST(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const createDraftsFlag = (formData.get('create_drafts') as string | null) !== 'false'
  const service = (formData.get('service') as string | null) || 'aerial_cinema'

  const buffer = Buffer.from(await file.arrayBuffer())

  let parsed
  try {
    parsed = await parseOutreachPack(buffer)
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Parse failure: ${m}` }, { status: 400 })
  }

  const errors: ImportError[] = []
  let createdProspects = 0
  let createdDrafts = 0

  const supabase = createOutreachSupabase() as any

  for (const project of parsed.projects as ParsedProject[]) {
    const payload = projectToProspectPayload(project, service)

    let insertPayload = {
      business_name: payload.business_name,
      display_name: payload.display_name,
      industry: payload.industry,
      status: payload.status,
      website_url: payload.website_url,
      primary_contact_name: payload.primary_contact_name,
      primary_contact_email: payload.primary_contact_email,
      notes: '',
    } as any

    const block: OutreachBlock = {
      contacts: payload.outreach_block.contacts as any,
      cross_refs: payload.outreach_block.cross_refs as any,
      send_history: [],
      unknown_keys: {},
      service: payload.outreach_block.service,
      project: payload.outreach_block.project,
      project_role: payload.outreach_block.project_role,
      project_eta: payload.outreach_block.project_eta,
      project_city: payload.outreach_block.project_city,
      project_state: payload.outreach_block.project_state,
      hook: payload.outreach_block.hook,
      next_step: payload.outreach_block.next_step,
    }
    insertPayload.notes = applyBlockToNotes('', block)

    // Upsert by display_name (project-level unique in Vol 4)
    // If a client with this display_name already has an outreach block, skip creating.
    const { data: existing } = await supabase
      .from('clients')
      .select('id, notes')
      .eq('display_name', payload.display_name)
      .maybeSingle()

    let prospectId: string
    if (existing) {
      const already = parseNotesBlock(existing.notes)
      if (already) {
        continue // skip — previously imported
      }
      // Update to add block
      const merged = applyBlockToNotes(existing.notes, block)
      const { error: updateError } = await supabase
        .from('clients')
        .update({ notes: merged })
        .eq('id', existing.id)
      if (updateError) {
        errors.push({ project_number: project.number, project_name: project.name, stage: 'update', error: updateError.message })
        continue
      }
      prospectId = existing.id
    } else {
      const { data: created, error: insertError } = await supabase
        .from('clients')
        .insert(insertPayload)
        .select()
        .single()
      if (insertError) {
        errors.push({ project_number: project.number, project_name: project.name, stage: 'insert', error: insertError.message })
        continue
      }
      prospectId = created.id
      createdProspects++
    }

    // Optionally create a Gmail draft using the pre-written email in the pack
    if (createDraftsFlag && project.email_draft) {
      const toList = payload.outreach_block.contacts
        .map((c: any) => c.email)
        .filter((e: any): e is string => typeof e === 'string' && e.length > 0)
      const to = toList[0]
      if (to) {
        try {
          const draft = await createDraft({
            to,
            subject: project.email_draft.subject,
            body: project.email_draft.body,
            serviceLabel: serviceLabel(service) || GMAIL_LABELS.AERIAL,
          })
          // Write draft pointer into the Notes block
          const { data: current2 } = await supabase
            .from('clients')
            .select('notes')
            .eq('id', prospectId)
            .single()
          if (current2) {
            const existingBlock = parseNotesBlock(current2.notes) || {
              contacts: [], cross_refs: [], send_history: [], unknown_keys: {},
            } as OutreachBlock
            const nextBlock = setDraft(existingBlock, {
              gmail_draft_id: draft.id,
              created: new Date().toISOString().slice(0, 10),
              role_template: `${service}_${(payload.outreach_block.project_role || 'owner').toLowerCase()}_cold_v1`,
              state: 'pending_approval',
            })
            nextBlock.next_step = 'await_approval'
            await supabase
              .from('clients')
              .update({ notes: applyBlockToNotes(current2.notes, nextBlock) })
              .eq('id', prospectId)
          }
          createdDrafts++
        } catch (err: unknown) {
          const m = err instanceof Error ? err.message : String(err)
          errors.push({ project_number: project.number, project_name: project.name, stage: 'draft', error: m })
        }
      } else {
        errors.push({ project_number: project.number, project_name: project.name, stage: 'draft', error: 'no recipient email extracted' })
      }
    }
  }

  return NextResponse.json({
    ok: true,
    parsed_projects: parsed.projects.length,
    created_prospects: createdProspects,
    created_drafts: createdDrafts,
    errors,
  })
}
