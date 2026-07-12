# AI Outreach Agent — Security & Scalability

## 1. Authentication & Authorization

| Mechanism | Detail |
|---|---|
| **Primary auth** | Google OAuth 2.0 (Authorization Code + PKCE for the extension, standard code flow for the dashboard) |
| **Session** | Short-lived JWT (15 min access, 7-day rotating refresh) issued by the API after OAuth success; stored as `httpOnly` `Secure` cookie for the dashboard, in `chrome.storage.local` (encrypted via Web Crypto API) for the extension |
| **Gmail tokens** | Stored separately from session JWTs, AES-256-GCM encrypted at rest, key managed via cloud KMS (never co-located with the encrypted data) |
| **RBAC** | Two roles at MVP: `admin` (manage org settings, send caps, all contacts) and `member` (own campaigns + assigned contacts only). Enforced via middleware checking `req.user.role` + `orgId` scoping on every query |

### RBAC Permission Matrix

| Action | Member | Admin |
|---|---|---|
| Generate/send own emails | ✅ | ✅ |
| View own outreach history | ✅ | ✅ |
| View org-wide dashboard | ❌ | ✅ |
| Upload/delete RAG documents | ✅ (upload), ❌ (delete others') | ✅ |
| Modify daily send cap | ❌ | ✅ |
| Manage other users | ❌ | ✅ |

## 2. Rate Limiting & Send Caps

| Limit | Value (default) | Enforced At |
|---|---|---|
| API requests per user | 120/min | `rateLimit.middleware.ts` (token bucket, Redis-backed) |
| LLM generation calls | 60/hour/user | LLM Service wrapper, returns `429` with retry-after |
| Gmail sends | `dailySendCap` (default 500/day/user) | Gmail Service, checked **before** every send, atomic Redis counter |
| Bulk job size | 500 recipients/job (larger jobs auto-chunked) | Bulk Generation Queue |

Gmail itself imposes hard daily sending limits per account type (consumer vs Workspace) — the app's own cap is always set conservatively below Google's published limits so the system fails gracefully with its own clear error rather than triggering a Gmail-side suspension.

## 3. Prompt Injection Protection

Defense in depth, applied to any pipeline touching uploaded documents, voice transcripts, or inbound emails (all are attacker-influenceable surfaces):

1. **Tag isolation** — all untrusted text wrapped in explicit `<user_context>`/`<retrieved_documents>`/`<inbound_email>` tags; system prompt instructs the model these are data, not instructions (see Prompts Library §10).
2. **Schema-constrained output** — structured JSON output wherever the call's purpose allows it, validated server-side with a strict schema (Zod) before use; anything that fails validation is discarded and re-requested or surfaced for manual review, never passed through.
3. **No tool/action access from untrusted content** — the LLM that processes document/email content has no function-calling tools enabled in that call (it cannot trigger a "send email" or "delete contact" action); only the dedicated, narrowly-scoped Voice/Intent call (operating on the user's own spoken command, the most trusted input in the system) has function-calling enabled.
4. **Output content filtering** — generated drafts are scanned for high-risk patterns (payment/wire-transfer language, credential requests, external links not present in the source documents) and flagged with a warning banner in the Preview Workflow rather than blocked outright — the human approver makes the final call, but is warned.
5. **Document provenance tracking** — every generated fact traces back to a specific `chunkId`; the UI can show "this came from brochure.pdf, page 4" on hover, making hallucination or injected misinformation easy for a human to audit.

## 4. Input Validation

- All API request bodies validated with Zod schemas at the route boundary; invalid input rejected with `400` before touching any service logic.
- File uploads: MIME-type allowlist (`pdf`, `docx`, `xlsx`, `csv`), size cap (25MB), virus scan via a sandboxed scanning step before parsing.
- Email address validation: RFC 5322 regex + optional MX-record check on bulk import, with bad rows surfaced to the user for correction rather than silently dropped.

## 5. Data Protection

- All data encrypted in transit (TLS 1.3) and at rest (MongoDB encrypted storage engine / cloud-provider disk encryption).
- PII minimization: raw audio from voice commands is never stored — only the transcript, and only as long as needed to debug the intent-parsing pipeline (configurable retention, default 30 days).
- Per-org data isolation enforced at the query layer (`orgId` required on every read/write) as the first line of multi-tenant defense, in addition to logical DB separation at larger scale (see §7).
- Audit log collection (`audit_logs`) records every send, every document upload/delete, and every settings change with `userId`, `action`, `timestamp`, `before/after` diff for sensitive fields.

---

## 6. Scalability — Designing for 10,000+ Users

### 6.1 Back-of-Envelope Load

Assume 10,000 active users, each averaging 20 emails/day (mix of single + bulk) during business hours:

- ~200,000 emails/day ≈ **8,300/hour** at peak, realistically front-loaded into a few business-hour windows → design for **~50-80 sends/sec at peak**, not a flat average.
- LLM calls: roughly 1.5–2 LLM calls per email (generation + occasional regenerate) → **~12,000–16,000 LLM calls/hour at peak**.
- Document corpus: assume 10,000 orgs × ~20 documents × ~150 chunks ≈ **30M vectors** at full scale — well beyond what an embedded ChromaDB instance comfortably serves, which is the trigger for the Pinecone migration noted in §B.4 of the Extension/RAG doc.

### 6.2 Horizontal Scaling Strategy

| Layer | Strategy |
|---|---|
| **API Gateway** | Stateless Express instances behind a load balancer, auto-scaled on CPU/connection count; JWT auth means no server-side session affinity needed |
| **Bulk generation/send** | Entirely queue-based (BullMQ on Redis Cluster); workers scale horizontally and independently from the API tier — a traffic spike in bulk sends never blocks interactive dashboard requests |
| **MongoDB** | Replica set for read scaling early on; sharded by `orgId` once a single replica set's working set exceeds comfortable memory limits (orgId is a natural, evenly-distributed shard key for this domain) |
| **Vector DB** | Pinecone namespaced per `orgId`, which gives per-tenant isolation and lets retrieval queries stay fast regardless of total corpus size |
| **Redis** | Used for rate-limit counters, queues, and a generation-result cache (e.g., caching identical "average package" retrieval+generation pairs for a short TTL when the same campaign re-runs) |
| **LLM provider** | `ResilientLLMClient` round-robins/fails-over between Gemini and OpenAI, and queues+retries on `429`s rather than surfacing errors to users; this also lets the system shift load to a secondary provider during a primary outage |

### 6.3 Gmail API Quota Management

Gmail/Google Workspace APIs impose **per-user** quotas, not just per-project — which actually works in this system's favor at scale, since each user sends through their *own* Gmail account/quota rather than a shared service account. The platform-level concern becomes the shared **Google Cloud project's** API request quota (queries/100 seconds/user and project-wide), managed via:
- Exponential backoff + jitter on `429`/`403 rateLimitExceeded` responses (standard Google API client behavior).
- Per-user send queues so one user's bulk job can't starve another user's quota allowance.

### 6.4 Caching

- Document chunk retrieval results cached (Redis, short TTL ~10 min) per `(orgId, queryHash)` — repeated generations referencing "average package" within the same campaign session don't re-run vector search every time.
- Dashboard aggregation queries (response rate, daily volume) computed via a scheduled materialized rollup (cron, every 15 min) rather than live aggregation on every page load once org sizes grow large.

### 6.5 Multi-Tenancy Model

Single shared application tier (cheaper to operate, simpler to ship as MVP) with **logical isolation** via `orgId` on every collection and every vector namespace, **not** separate databases per tenant — this is the standard SaaS pattern at this scale and keeps ops complexity manageable until a specific enterprise customer contractually requires physical data isolation, at which point that one org can be migrated to a dedicated MongoDB database/vector namespace without changing application code (the `orgId`-scoped query layer already behaves identically either way).

### 6.6 Cost Lever Summary

| Lever | Effect |
|---|---|
| Batched personalization (Prompt §3) instead of N independent calls | Cuts LLM cost/latency roughly linearly with batch size |
| Hybrid template + fill approach (Feature 2) | Avoids regenerating boilerplate per recipient |
| Caching retrieval results within a campaign | Cuts redundant vector DB queries |
| Provider failover on outage/cost spikes | Avoids hard downtime; enables cost-based routing later (e.g., cheaper model for low-stakes rewrites, premium model for first-touch outreach) |

---

*Continue to `07-ROADMAP-CAREER.md` for the implementation roadmap, MVP vs V2 split, resume description, and interview prep.*
