# Cowork Scheduled Tasks — Sweet Dreams Outreach

**What this is:** three scheduled tasks you create inside Claude (Cowork). Each task runs on a cron and executes against the platform's API. Your Cowork plan covers the Claude inference — no Anthropic API spend. Cowork never touches Gmail directly anymore; the platform handles all Gmail operations via its service account.

## Prereqs (already done)

- ✅ Platform deployed to `https://www.nightmaresturntodreams.com`
- ✅ `OUTREACH_API_KEY` configured
- ✅ Service account with domain-wide delegation on `cole@sweetdreams.us`
- ✅ 10 `Outreach/*` Gmail labels created
- ✅ Vol 4 imported (61 prospects in DB)

## Credentials Cowork needs

```
PLATFORM_BASE_URL   https://www.nightmaresturntodreams.com
OUTREACH_API_KEY    kWLe1xXNs5WO1Qd8jtwhQvc-bXvchi6D7Frywln9y0x5z41NQTjAwV0h0QpFwq2P
```

Every API call uses `Authorization: Bearer <key>`.

## Task 1 — Daily Research Pass (6am ET)

**Purpose:** Find new named projects (news, Dodge, ENR, press releases, event sites) that fit a Sweet Dreams service line. Create them as prospects. If the service line has a "pre-written email draft" pattern established (like Vol 4 owners), draft a personalized email and create a Gmail draft under `Outreach/Pending`.

**Scheduled task prompt (paste into Cowork):**

````
You are running Sweet Dreams' daily outreach research pass at 6am ET.

Your one job: identify up to 20 new named construction/mega-project targets that could buy Sweet Dreams aerial cinema footage, and seed them into the platform as prospect drafts.

Hard rules you always follow:
1. No dashes in any generated email copy. All 11 dash characters are forbidden in subject + body. URLs and email addresses are exempt. Call POST /api/outreach/validate/email with every draft before submitting to Gmail — reject and rewrite if validation.ok is false.
2. Every contact you add needs a `source` field citing where you found it (e.g. "dodge_2026_04_21", "enr_top_projects_2026", "press_release_parkview.com_2026-04-19", "linkedin_profile:jsmith").
3. Cap: 20 new prospects per run. If research yields more, put the extras in a scratch note for tomorrow.
4. Dedup: before creating a prospect, call GET /api/outreach/clients?limit=500 and check if display_name or business_name already exists. Skip duplicates.
5. Never invent an email. If you can't source a real contact email, leave primary_contact_email null — the prospect still gets created for manual enrichment later.

Workflow:

A. Check platform state
   GET https://www.nightmaresturntodreams.com/api/outreach/dashboard
   Read the current counts. Log them to the task output.

B. Identify new projects (open-web research, no MCP calls needed)
   Sources to scan:
   - Dodge Construction Network project news feed
   - ENR top projects of the month
   - Owner/developer press release pages (Related Midwest, Kite Realty, Sterling Bay, Continental Properties, Ryan Companies, Mortenson)
   - Major architecture firm announcements (HKS, Gensler, SOM, Perkins&Will, Fanning Howey)
   - State AIA chapter project awards
   - University capital project RFPs
   Filter: projects near or at completion (next 12 months), $20M+ scope, within 500 miles of Fort Wayne IN for drive feasibility, or anywhere if the owner/architect runs long-term retainer potential.

C. For each project (up to 20):
   1. Extract: project_name, project_city, project_state, project_eta, owner_name, architect_name, contractor_name, hook (one line why Sweet Dreams fits), and at least one role-inbox email you can source.
   2. Compose an email draft in the same voice as Vol 4 packs (no dashes, lead with project name, mention Inspire 2 + Zenmuse X7, include https://sweetdreams.us/work).
   3. Validate: POST /api/outreach/validate/email { subject, body }. If not ok, rewrite.
   4. Create the prospect: POST /api/outreach/clients with business_name, display_name, industry, status=prospect, primary_contact_email, and outreach_block { service, project, project_role, project_eta, project_city, project_state, hook, contacts, cross_refs, next_step: "ready_to_draft" }.
   5. Create the Gmail draft: POST /api/outreach/gmail/drafts with { to, subject, body, service_label: "Outreach/Aerial", prospect_id: <returned from step 4>, role_template: "aerial_owner_cold_v1_cowork" }.
   6. On success, the draft lands in Gmail under Outreach/Pending and the prospect's Notes block records the draft pointer.

D. Write a brief summary as your final output:
   - Prospects created: N
   - Drafts created: M
   - Skipped (duplicates): K
   - Errors: list any

Stop after 20. If you hit any API errors, log and move on — do not retry more than once per call.
````

**Recommended Cowork schedule:** Daily at 06:00 America/New_York.

---

## Task 2 — Daily Send-Sync Pass (9am + 2pm ET)

**Purpose:** Two things — (1) handle drafts Cole relabeled to `Outreach/Approved` in Gmail (if that happens outside the platform UI) by telling the platform to send them. (2) Detect inbound replies on tracked threads and log them to the platform.

**Scheduled task prompt:**

````
You are running Sweet Dreams' send-sync pass. This is lightweight — your job is to reconcile Gmail state with the platform.

Workflow:

A. Send any Gmail drafts that Cole relabeled to Outreach/Approved but that aren't yet sent
   1. GET /api/outreach/gmail/drafts?label=Outreach%2FApproved&limit=50
   2. For each draft returned:
      a. Look up the matching prospect by scanning outreach blocks for the gmail_draft_id (GET /api/outreach/clients?draft_state=pending_approval, then check each notes block for the draft id).
      b. POST /api/outreach/gmail/drafts/:id/send with { prospect_id, type: "cold_open" }.
      c. If the send returns 2xx, the platform automatically flips the Gmail message label to Outreach/Sent and writes Send_History to the prospect's Notes block.
   If there are no Approved drafts, skip to B.

B. Scan for replies on sent threads
   1. GET /api/outreach/clients?has_block=true&limit=500 → for each with send_history containing thread_id, collect thread_ids from the most recent Send_History entry.
   2. For each tracked thread_id, check Gmail for new messages since our last recorded send. You can fetch threads via the platform: GET /api/outreach/gmail/threads?thread_id=<id> (if available) OR just trust the platform's /api/outreach/gmail/drafts?label=Outreach%2FReplied flow.
   3. For any new inbound message:
      a. POST /api/outreach/clients/:id/reply with { thread_id, gmail_message_id, from_email, subject, snippet, sent }.
      b. This flips prospect status to "trial" and next_step to "reply_received_review".

C. Summary:
   - Sent: N
   - Replies logged: M
   - Errors: list any

Cap sends at 40 per pass per PDF §6.2 safety rail. No auto-reply to inbound — those need Cole's review in the platform.
````

**Recommended Cowork schedule:** Daily at 09:00 and 14:00 America/New_York.

---

## Task 3 — Weekly Hygiene Pass (Mon 7am ET)

**Purpose:** Clean up stale prospects, generate a brief, email it to Cole.

**Scheduled task prompt:**

````
You are running Sweet Dreams' weekly outreach hygiene pass.

Workflow:

A. Pull KPIs
   GET /api/outreach/dashboard
   Log: total_outreach, new_prospects_this_week, drafts_pending_over_48h, prospects_stale_over_30d, trials_stale_over_60d.

B. Stale prospect cleanup
   GET /api/outreach/hygiene?older_than_days=30&status=prospect
   For each returned prospect: PATCH /api/outreach/clients/:id with { status: "paused" }.

C. Stale trial flag
   GET /api/outreach/hygiene?older_than_days=60&status=trial
   Do NOT auto-pause these. Surface them in the brief for Cole's decision.

D. Generate the weekly brief email as a Gmail draft addressed to cole@sweetdreams.us
   Content:
   - New prospects added this week: N
   - Drafts awaiting Cole: M  (include company names, link to /outreach)
   - Emails sent this week: X
   - Replies received: Y
   - Prospects auto-paused: Z
   - Trials flagged for review: list
   Subject: "Sweet Dreams Outreach — Weekly Brief <YYYY-MM-DD>"
   POST /api/outreach/gmail/drafts with { to: "cole@sweetdreams.us", subject, body, service_label: "Outreach/Aerial" }
   Cole will see the brief in his Gmail inbox under Outreach/Pending on Monday morning.

E. Summary of what the pass did:
   - Stale prospects paused: Z
   - Trials flagged: T
   - Brief drafted: yes/no
````

**Recommended Cowork schedule:** Weekly Mondays at 07:00 America/New_York.

---

## How Cole uses the platform daily

1. Morning: open https://www.nightmaresturntodreams.com → sign in as `admin` → click **Outreach** in the sidebar.
2. The approval queue shows all drafts Cowork wrote overnight. Each card has subject, body, recipient, and three buttons: **Approve & Send**, **Edit**, **Reject**.
3. Click **Approve & Send** — the platform calls Gmail API via the service account, sends the email, flips labels, updates the prospect's Notes block. One click, one email.
4. Total time: ~10-15 min/day.

## Monitoring the system

- **Dashboard KPIs:** https://www.nightmaresturntodreams.com/outreach (top-of-page stat cards)
- **Gmail UI:** https://mail.google.com/mail/u/0/#label/Outreach (filter to see all outreach activity)
- **Vercel runtime logs:** if something breaks, check Vercel deployment logs for the API route

## If Cowork breaks or stops running

Platform keeps working — Cole can add prospects via the `/outreach` UI manually, and can draft emails in Gmail himself. Cowork is the research + drafting brain; without it, the platform becomes a manual-mode CRM until Cowork resumes. Nothing breaks, just slows down.

## Gotchas

1. **Cowork can't access `C:\Users\cole\...`** — your local filesystem. Vol 4 was already imported via the platform UI; future volumes get the same treatment (Cole drops the .docx at `/outreach/import`).
2. **Rate limit yourself.** Don't hit the platform API with 50 concurrent calls — stagger 500ms between calls in the research pass.
3. **No send scope verification per call.** The platform's SA has gmail.send. That's fine because it only sends when Cole clicks Approve in the UI or when this Cowork task explicitly POSTs to /send. There's no path where sends happen without one of those two triggers.

---

**File path for Cowork config:** save this doc, give it to Cowork at agent config time, then tell it: "You have three scheduled tasks to configure. Paste each task's prompt into Cowork's scheduled tasks UI at the specified cadence. Report back when all three are scheduled and tell me when the first run happens."
