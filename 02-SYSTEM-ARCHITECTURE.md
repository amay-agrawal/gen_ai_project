# AI Outreach Agent — System Architecture

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        EXT["Chrome Extension<br/>(Manifest V3)"]
        WEB["Web Dashboard<br/>(React + TS)"]
    end

    subgraph Edge["API Gateway"]
        GW["Express API<br/>(Auth, Rate Limit, Routing)"]
    end

    subgraph Core["Core Services"]
        VOICE["Voice/Intent Service"]
        GEN["Email Generation Service"]
        RAG["RAG Service"]
        GMAIL["Gmail Integration Service"]
        CRM["Contact/CRM Service"]
        FOLLOWUP["Follow-Up Engine"]
        REPLY["Reply Assistant Service"]
        DASH["Dashboard/Analytics Service"]
    end

    subgraph Async["Async Workers (BullMQ + Redis)"]
        Q1["Bulk Generation Queue"]
        Q2["Bulk Send Queue"]
        Q3["Follow-Up Cron Worker"]
        Q4["Reply Polling Worker"]
    end

    subgraph Data["Data Layer"]
        MONGO[("MongoDB<br/>Users/Contacts/Emails/Threads")]
        VECTOR[("Vector DB<br/>Chroma/Pinecone")]
        REDIS[("Redis<br/>Queues + Cache")]
        BLOB[("Object Storage<br/>Uploaded Docs (S3/R2)")]
    end

    subgraph External["External APIs"]
        LLM["Gemini 2.5 Pro / OpenAI<br/>(via LLMClient abstraction)"]
        GMAILAPI["Gmail API"]
        OAUTH["Google OAuth 2.0"]
    end

    EXT -->|REST + JWT| GW
    WEB -->|REST + JWT| GW
    GW --> VOICE
    GW --> GEN
    GW --> RAG
    GW --> GMAIL
    GW --> CRM
    GW --> FOLLOWUP
    GW --> REPLY
    GW --> DASH

    VOICE --> LLM
    GEN --> LLM
    GEN --> RAG
    RAG --> VECTOR
    RAG --> BLOB
    GMAIL --> GMAILAPI
    GMAIL --> OAUTH
    REPLY --> LLM
    REPLY --> GMAILAPI

    GEN --> Q1
    GMAIL --> Q2
    FOLLOWUP --> Q3
    REPLY --> Q4

    Q1 --> MONGO
    Q2 --> MONGO
    Q3 --> MONGO
    Q4 --> MONGO

    VOICE --> MONGO
    CRM --> MONGO
    DASH --> MONGO
    GW --> REDIS
```

**Key principle:** the API Gateway never calls the LLM or Gmail directly — it routes to dedicated services, each with a single responsibility. This keeps the "GenAI surface area" isolated and swappable (see `LLMClient` abstraction below) and keeps Gmail send-logic auditable in one place.

---

## 2. Low-Level Architecture — Service Responsibilities

| Service | Responsibility | Talks To |
|---|---|---|
| **Voice/Intent Service** | Receives transcript, calls LLM with function-calling schema, returns structured intent | LLM, CRM (to resolve names → contacts) |
| **Email Generation Service** | Given intent + retrieved facts, produces subject/body/signature; handles single and bulk (templated) generation | LLM, RAG Service, Bulk Generation Queue |
| **RAG Service** | Document ingestion (parse → chunk → embed → store), and retrieval (query → top-k chunks) | Vector DB, Object Storage, Embedding model |
| **Gmail Integration Service** | OAuth token lifecycle, drafts.create, messages.send, threads.get/list, history polling | Gmail API, Google OAuth, Bulk Send Queue |
| **Contact/CRM Service** | CRUD on HR contacts, search/filter, communication history rollups | MongoDB |
| **Follow-Up Engine** | Daily cron scans OutreachRecords for stale, unreplied sends; triggers Email Generation Service with `intent=follow_up` | MongoDB, Email Generation Service, Cron Worker |
| **Reply Assistant Service** | Polls/watches for inbound mail on tracked threads, summarizes, extracts action items/deadlines, generates 4 reply variants | Gmail API, LLM |
| **Dashboard/Analytics Service** | Aggregation queries for metrics & chart data | MongoDB (aggregation pipeline) |

### The `LLMClient` Abstraction

```ts
interface LLMClient {
  generate(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    responseSchema?: JSONSchema; // forces structured output
    temperature?: number;
  }): Promise<LLMResponse>;

  embed(text: string): Promise<number[]>;
}

// Concrete implementations
class GeminiClient implements LLMClient { /* primary */ }
class OpenAIClient implements LLMClient { /* fallback / A-B */ }

// Selected via env/config, with automatic failover:
const llm = new ResilientLLMClient([new GeminiClient(), new OpenAIClient()]);
```

Every GenAI-touching service depends on the `LLMClient` interface, never a concrete SDK. This is what makes "Gemini primary, OpenAI optional" a config change, not a rewrite — and it's a strong talking point for the "how would you avoid vendor lock-in" interview question.

---

## 3. Folder Structure (Monorepo)

```
ai-outreach-agent/
├── apps/
│   ├── dashboard/                 # React + TS + Tailwind web app
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ComposeVoice.tsx
│   │   │   │   ├── BulkUpload.tsx
│   │   │   │   ├── PreviewQueue.tsx
│   │   │   │   ├── Contacts.tsx
│   │   │   │   ├── Inbox.tsx           # Reply Assistant UI
│   │   │   │   └── Settings.tsx
│   │   │   ├── components/
│   │   │   │   ├── voice/MicButton.tsx
│   │   │   │   ├── voice/TranscriptPanel.tsx
│   │   │   │   ├── email/EmailPreviewCard.tsx
│   │   │   │   ├── email/RegenerateModal.tsx
│   │   │   │   ├── crm/ContactTable.tsx
│   │   │   │   ├── charts/ResponseRateChart.tsx
│   │   │   │   └── charts/OutreachTrendChart.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSpeechToText.ts
│   │   │   │   ├── useEmailDraft.ts
│   │   │   │   └── useGmailAuth.ts
│   │   │   ├── api/                    # typed API client (shared types)
│   │   │   └── store/                  # Zustand/Redux state
│   │   └── package.json
│   │
│   └── extension/                  # Manifest V3 Chrome Extension
│       ├── manifest.json
│       ├── src/
│       │   ├── background/service-worker.ts
│       │   ├── content-scripts/gmail-compose-injector.ts
│       │   ├── content-scripts/gmail-toolbar.tsx
│       │   ├── popup/Popup.tsx
│       │   └── shared/messaging.ts    # chrome.runtime message contracts
│       └── package.json
│
├── services/
│   ├── api/                        # Express API Gateway + Core Services
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── voice.routes.ts
│   │   │   │   ├── email.routes.ts
│   │   │   │   ├── rag.routes.ts
│   │   │   │   ├── gmail.routes.ts
│   │   │   │   ├── contacts.routes.ts
│   │   │   │   ├── followup.routes.ts
│   │   │   │   ├── reply.routes.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   ├── services/
│   │   │   │   ├── voice.service.ts
│   │   │   │   ├── emailGeneration.service.ts
│   │   │   │   ├── rag.service.ts
│   │   │   │   ├── gmail.service.ts
│   │   │   │   ├── crm.service.ts
│   │   │   │   ├── followup.service.ts
│   │   │   │   └── reply.service.ts
│   │   │   ├── llm/
│   │   │   │   ├── LLMClient.ts
│   │   │   │   ├── GeminiClient.ts
│   │   │   │   ├── OpenAIClient.ts
│   │   │   │   └── prompts/             # prompt template files (see Prompts Library)
│   │   │   ├── models/                  # Mongoose schemas
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rateLimit.middleware.ts
│   │   │   │   └── promptInjectionGuard.middleware.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── worker/                     # BullMQ workers (separate process/deploy)
│       ├── src/
│       │   ├── queues/
│       │   │   ├── bulkGeneration.queue.ts
│       │   │   ├── bulkSend.queue.ts
│       │   │   ├── followUpCron.queue.ts
│       │   │   └── replyPolling.queue.ts
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   └── shared/                     # shared TS types, Zod schemas, constants
│       ├── src/types/
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── vercel.json
│
└── docs/                           # this spec
```

---

## 4. Sequence Diagram — Voice-to-Bulk-Email (Primary Use Case)

```mermaid
sequenceDiagram
    participant U as User
    participant D as Dashboard
    participant API as API Gateway
    participant V as Voice/Intent Service
    participant R as RAG Service
    participant G as Email Generation Service
    participant DB as MongoDB
    participant GM as Gmail Service

    U->>D: Speaks command
    D->>D: Web Speech API → transcript
    D->>API: POST /api/voice/parse {transcript}
    API->>V: parseIntent(transcript)
    V->>V: LLM function-call → structured intent
    V->>DB: resolve recipients via CRM
    V-->>API: intent JSON
    API->>R: retrieve(topic="average package, placement stats")
    R-->>API: top-k document chunks
    API->>G: generateBulk(intent, chunks, recipients[])
    G->>G: LLM generates base template + per-recipient personalization
    G->>DB: save drafts (status=pending_review)
    G-->>D: 4 editable draft previews
    U->>D: Edits / Approves each draft
    D->>API: POST /api/email/send {draftIds[]}
    API->>GM: send(draftIds[])
    GM->>GM: Gmail API messages.send (per draft)
    GM->>DB: update status=sent, create OutreachRecord
    GM-->>D: confirmation + updated dashboard metrics
```

## 5. Sequence Diagram — Follow-Up Agent

```mermaid
sequenceDiagram
    participant Cron as Follow-Up Cron Worker
    participant DB as MongoDB
    participant FE as Follow-Up Engine
    participant G as Email Generation Service
    participant U as User (Dashboard)

    Cron->>DB: query OutreachRecords where status=sent AND replyReceived=false AND daysSinceSent>=7
    DB-->>Cron: candidate list
    Cron->>FE: triggerFollowUps(candidates)
    FE->>G: generate(intent=follow_up, originalThread)
    G-->>FE: follow-up drafts
    FE->>DB: save drafts (status=pending_review, type=follow_up)
    FE->>U: notification: "5 follow-ups ready for review"
    U->>U: reviews in Preview Queue
```

## 6. Sequence Diagram — AI Reply Assistant

```mermaid
sequenceDiagram
    participant GM as Gmail
    participant W as Reply Polling Worker
    participant RS as Reply Assistant Service
    participant LLM as LLM
    participant U as User

    W->>GM: poll historyId for tracked threads
    GM-->>W: new inbound message
    W->>RS: process(message)
    RS->>LLM: summarize + extract action items/deadlines
    LLM-->>RS: structured summary JSON
    RS->>LLM: generate 4 reply variants
    LLM-->>RS: [professional, brief, positive, clarification]
    RS->>U: surfaces summary + 4 variants in Inbox UI
    U->>U: picks one → opens in Preview Workflow → edits → sends
```

## 7. Data Flow Diagram — Document-Aware Generation (RAG)

```mermaid
flowchart LR
    A[User uploads brochure.pdf] --> B[Parse: PDF/DOCX text extraction]
    B --> C[Chunk: ~500 token windows, overlap 50]
    C --> D[Embed each chunk]
    D --> E[(Vector DB)]
    F[Generation request: 'average package'] --> G[Embed query]
    G --> H[Similarity search top-k]
    E --> H
    H --> I[Inject chunks into prompt context]
    I --> J[LLM generates grounded email]
    J --> K[Fact-check pass: flag numbers absent from retrieved chunks]
    K --> L[Editable draft shown to user]
```

---

*Continue to `03-DATABASE-AND-API.md` for the full schema and endpoint specification.*
