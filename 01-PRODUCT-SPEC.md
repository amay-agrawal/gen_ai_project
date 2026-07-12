# AI Outreach Agent — Product Specification

> A voice-driven, AI-native outreach operating system: a Chrome Extension + Web Dashboard that turns a spoken sentence into a fully personalized, fact-grounded, multi-recipient email campaign — drafted, previewed, and sent through the user's own Gmail account.

---

## 1. One-Line Pitch

**"Tell it who to email and why — it writes, personalizes, fact-checks against your documents, and sends, with you approving every word."**

## 2. Problem Statement

Placement cells, sales teams, recruiters, and founders spend hours per week on repetitive, high-stakes outreach: drafting near-identical emails to dozens of recipients, manually personalizing names/companies, hunting for the right brochure stat to quote, tracking who replied, and writing follow-ups. The work is high-volume but low-leverage — exactly the kind of task GenAI should absorb, while keeping a human in the loop for anything that actually gets sent.

## 3. Primary Use Case — End-to-End Walkthrough

**Spoken command:**
> "Send a placement invitation mail to Microsoft, Amazon, Adobe and Atlassian. Mention that we are inviting them for the 2027 placement season. Include information from the placement brochure and mention our average package."

| Step | What Happens | Engine |
|---|---|---|
| 1 | Mic captures audio in the dashboard or extension popup | Web Speech API |
| 2 | Audio → text transcript | Browser STT (client-side) |
| 3 | Transcript → structured intent: `{intent: "bulk_outreach", recipients: ["Microsoft","Amazon","Adobe","Atlassian"], topic: "placement invitation", year: "2027", required_facts: ["average package","placement brochure"]}` | LLM function-calling (Gemini 2.5 Pro) |
| 4 | Recipient names matched against the HR Contact CRM to resolve actual email addresses | Traditional fuzzy-match service |
| 5 | "average package" and brochure facts retrieved from the vector store of uploaded documents | RAG pipeline |
| 6 | One **base draft** generated, then **4 personalized variants** (per company tone/name) | LLM generation, 1 base + N personalization calls (or single batched call, see §RAG/Prompts doc) |
| 7 | Subject line generated per variant | LLM generation |
| 8 | All 4 drafts rendered in the **Preview Workflow** — editable, regenerate-able | React UI |
| 9 | User clicks **Approve & Send** (per email or bulk) | Traditional backend logic |
| 10 | Gmail API sends each mail from the user's own account; thread + outreach record created | Gmail API + MongoDB |
| 11 | Dashboard updates: Emails Sent +4, Pending Responses +4, Follow-Up timer starts (7 days) | Traditional backend + cron |

This single voice command therefore touches **every subsystem** in the product — which is why it's the spec's running example throughout this document set.

---

## 4. Feature Breakdown

For every feature: what the user experiences, the user flow, and an explicit split of **GenAI-driven** vs **traditional software engineering** work. This split matters — it's the single most common interview question for a project like this, and the answer should be precise, not hand-wavy.

### Feature 1 — Voice to Email

**Flow:** mic click → speak → live transcript shown → transcript sent to backend `/api/voice/parse` → intent JSON returned → `/api/email/generate` called with that intent → editable draft rendered (Subject / Body / Signature, each independently editable).

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Speech capture | — | Web Speech API wrapper, mic permission handling, waveform UI |
| Transcription | Browser-native STT (not LLM) | Debounce, silence detection, retry on low-confidence |
| Intent understanding | LLM function-calling to extract `{intent, recipients, topic, tone, constraints}` | JSON-schema validation of LLM output, fallback intent ("unclear" → ask clarifying question) |
| Email drafting | LLM generates subject/body/signature | Template assembly, signature injection from user profile, draft persistence |

### Feature 2 — Bulk Email Generation

**Flow:** upload CSV/XLSX/Google Sheet → backend parses & validates rows → for each row, the system generates a *personalized* draft using the same base intent + that row's `{name, company, designation}` → drafts queued in Preview Workflow.

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| File parsing | — | `csv-parse` / `xlsx` (SheetJS) parsing, header detection, type coercion |
| Email validation | — | Regex + MX-record lookup (optional), dedup against CRM |
| Personalization | LLM rewrites the greeting, company-specific reference, and 1–2 personalized sentences per recipient, reusing one shared "core message" | Batch orchestration: queue rows, rate-limit LLM calls, merge personalized fragments back into the base template (templating engine, not raw LLM, for boilerplate sections) |
| Salutation logic | LLM decides "Dear Rahul" vs "Dear Microsoft University Recruitment Team" based on whether a named contact exists | Deterministic rule as fallback if LLM call fails |

> **Architecture note:** generating 200 fully-independent LLM completions for 200 near-identical emails is slow and expensive. The system uses a **hybrid template + LLM** approach: one LLM call produces a *parameterized* email template with placeholder slots reasoned about contextually (`{{recipient_greeting}}`, `{{company_hook}}`), and a second, cheap pass (LLM or even simple substitution) fills slots per row. See §3 of the Prompts Library for the exact technique.

### Feature 3 — Gmail Integration

OAuth login → backend stores encrypted refresh token → Gmail API used for `drafts.create`, `messages.send`, `threads.get`, `messages.list` (for reply detection). No password is ever seen by the system — entirely OAuth 2.0 / Google-managed.

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Auth | — | OAuth 2.0 Authorization Code flow, PKCE, encrypted token storage, refresh-token rotation |
| Sending | — | Gmail API, exponential backoff, per-user daily send-cap enforcement |
| Thread tracking | — | Webhook/poll on `historyId`, store `threadId` per outreach record |

This feature is **100% traditional engineering** — correctly so. GenAI should never be in the critical path of "does the email actually leave the building."

### Feature 4 — Email Preview Workflow

A hard product rule: **nothing is ever sent without explicit human approval.** Preview shows Recipient / Subject / Body with three actions: **Edit**, **Regenerate** (re-prompts the LLM, optionally with a one-line instruction like "make it shorter"), **Approve & Send**.

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Regenerate | LLM re-generation with prior draft + user instruction as context | Diff/version history of drafts, undo |
| Approve & Send | — | State machine: `draft → approved → sending → sent → failed`, idempotent send (dedupe key) |

### Feature 5 — Follow-Up Agent

Command: *"Follow up with companies that haven't replied in 7 days."* The system queries OutreachRecords where `status = 'sent'`, `replyReceived = false`, `daysSinceSent >= 7`, generates a follow-up email referencing the original thread, and queues it for approval — never auto-sent.

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Candidate detection | — | MongoDB query + cron job (daily) computing `daysSinceSent` |
| Follow-up copy | LLM writes a follow-up that references the original email's subject/topic without sounding repetitive | Gmail thread reply (`threadId`, `In-Reply-To` headers) so it lands in the same conversation |

### Feature 6 — AI Reply Assistant

Incoming recruiter reply is summarized, action items + deadlines extracted, and 4 response variants generated (Professional / Brief / Positive / Clarification).

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Summarization, action-item & deadline extraction | LLM structured extraction → JSON | Gmail watch/poll for new inbound mail matching tracked threads |
| 4 reply variants | 4 LLM generations (or 1 call returning 4 variants) sharing context | UI for one-click "use this variant" → opens in Preview Workflow |

### Feature 7 — Document-Aware Generation (RAG)

Uploaded brochures/stats/templates are chunked, embedded, and stored in a vector DB. At generation time, the system retrieves the top-k relevant chunks (e.g., "average package", "placement statistics") and injects them into the prompt so the LLM **never invents numbers**.

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Embedding generation | Embedding model (e.g., `text-embedding-3-large` or Gemini embeddings) | Chunking strategy, metadata tagging, file parsing (PDF/DOCX) |
| Retrieval | — (vector similarity search is math, not generation) | Vector DB indexing, hybrid search (keyword + semantic), top-k reranking |
| Grounded generation | LLM generates using retrieved context, instructed to cite/quote only from context | Prompt-injection guardrails (see Security doc), fact-check diffing (flag numbers not present in retrieved chunks) |

Full pipeline detail in `04-EXTENSION-RAG-GMAIL.md`.

### Feature 8 — HR Contact Management (Mini CRM)

Standard CRUD CRM: search, filter, communication history per contact. **No GenAI** — this is the system of record other features read/write against.

### Feature 9 — Outreach Dashboard

Metrics (Emails Sent, Replies Received, Response Rate, Pending, Follow-Ups Due) and charts (Daily/Weekly Outreach, Company Response Trends). **No GenAI** — aggregation queries + charting (Recharts).

### Feature 10 — Chrome Extension (Gmail Compose Page)

Injects a floating toolbar into Gmail's compose window: *Generate*, *Rewrite selected*, *Make professional*, *Make concise*, *Expand*, *Summarize thread*. Operates on the DOM of Gmail's compose `contenteditable` element.

| Layer | GenAI | Traditional Engineering |
|---|---|---|
| Rewrite/summarize | LLM call with selected text (or full thread text) as input | Content script DOM injection, MutationObserver to survive Gmail's SPA re-renders, message passing to background service worker → backend API |

---

## 5. GenAI vs Traditional Engineering — Master Table

| Capability | Type | Why |
|---|---|---|
| Speech → text | Traditional (browser API) | Deterministic, no need for an LLM |
| Voice command → structured intent | **GenAI** | Open-ended natural language, needs reasoning |
| Recipient name → email address resolution | Traditional | Exact/fuzzy match against CRM, deterministic |
| Email generation / personalization | **GenAI** | Core value proposition |
| Document chunking & storage | Traditional | Engineering pipeline |
| Embedding generation | **GenAI** (embedding model) | Semantic representation |
| Vector similarity search | Traditional (math/infra) | Not generative |
| Grounded answer/fact injection | **GenAI** | Synthesis over retrieved context |
| OAuth, sending, thread tracking | Traditional | Must be deterministic and auditable |
| Reply summarization & extraction | **GenAI** | Open-ended NLU |
| Follow-up candidate detection | Traditional | Date/status query |
| Follow-up email copy | **GenAI** | Generation |
| CRM CRUD | Traditional | Standard backend |
| Dashboard metrics/charts | Traditional | Aggregation |
| Rate limiting, send caps, RBAC | Traditional | Security/ops |
| Prompt-injection defense | Traditional (with GenAI as the thing being defended) | Input sanitization, system-prompt isolation |

This table is the single most reusable artifact from this spec for interviews — see `07-ROADMAP-CAREER.md`.

---

## 6. Tech Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Dashboard frontend | React + TypeScript + Tailwind CSS | Type safety at this complexity level is not optional; Tailwind for fast, consistent UI |
| Chrome Extension | Manifest V3 (service worker + content scripts) | MV2 is deprecated; MV3 is required for Chrome Web Store as of 2026 |
| Backend | Node.js + Express (TypeScript) | Shares types with frontend via a `packages/shared` types package; async-heavy I/O (LLM calls, Gmail API) suits Node's event loop |
| Primary DB | MongoDB | Schema flexibility for evolving email/thread structures; document model maps naturally to "an email" |
| Vector DB | ChromaDB (self-hosted, MVP) → Pinecone (managed, scale) | Chroma for $0-cost MVP; Pinecone when multi-tenant scale/latency SLAs matter |
| Auth | Google OAuth 2.0 (+ JWT for session) | Required for Gmail API access anyway; reuse as the app's own auth |
| GenAI primary | Gemini 2.5 Pro | Strong function-calling, large context (good for RAG + thread history), competitive cost |
| GenAI abstraction | Provider-agnostic `LLMClient` interface with OpenAI as fallback/secondary | Avoids vendor lock-in; lets ops swap providers per cost/latency/outage |
| Speech | Web Speech API | Zero-cost, client-side, no audio ever leaves the browser as raw audio (only the transcript does) |
| Background jobs | BullMQ + Redis | Bulk send queueing, follow-up cron, retry/backoff |
| Deployment | Vercel (dashboard), Render (API + worker), Docker (local/dev parity) | Fast frontend deploys, simple managed backend hosting for an MVP team |

---

*Continue to `02-SYSTEM-ARCHITECTURE.md` for diagrams, folder structure, and sequence flows.*
