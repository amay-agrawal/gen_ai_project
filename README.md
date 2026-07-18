# AI Outreach Agent — Full Specification Set

A production-quality spec for a voice-driven, RAG-grounded email outreach platform (Chrome Extension + Web Dashboard), built around one running example: *"Send a placement invitation mail to Microsoft, Amazon, Adobe and Atlassian..."*

## Reading Order

| # | Document | Covers |
|---|---|---|
| 1 | [`01-PRODUCT-SPEC.md`](./01-PRODUCT-SPEC.md) | Product goal, primary use-case walkthrough, all 10 features, GenAI-vs-traditional-engineering breakdown, tech stack |
| 2 | [`02-SYSTEM-ARCHITECTURE.md`](./02-SYSTEM-ARCHITECTURE.md) | High/low-level architecture diagrams, `LLMClient` abstraction, monorepo folder structure, 3 sequence diagrams, RAG data-flow diagram |
| 3 | [`03-DATABASE-AND-API.md`](./03-DATABASE-AND-API.md) | ER diagram, full MongoDB collection schemas, complete REST API specification |
| 4 | [`04-EXTENSION-RAG-GMAIL.md`](./04-EXTENSION-RAG-GMAIL.md) | Chrome Extension (Manifest V3) internals, RAG ingestion/retrieval pipeline, Gmail OAuth & send architecture |
| 5 | [`05-PROMPTS-LIBRARY.md`](./05-PROMPTS-LIBRARY.md) | Every actual system prompt used in the product (intent extraction, generation, personalization, summarization, replies, follow-ups, rewrite), plus the prompt-injection defense pattern |
| 6 | [`06-SECURITY-SCALABILITY.md`](./06-SECURITY-SCALABILITY.md) | Auth/RBAC, rate limiting, prompt-injection defense, data protection, and a full plan for scaling to 10,000+ users |
| 7 | [`07-ROADMAP-CAREER.md`](./07-ROADMAP-CAREER.md) | 20-week implementation roadmap, MVP vs V2 feature matrix, resume bullets, and likely interview questions with talking points |

## TL;DR Architecture

```
Chrome Extension ─┐
                   ├─→ API Gateway (Express) ─→ Core Services ─→ LLM (Gemini/OpenAI) + Gmail API + Vector DB
Web Dashboard ─────┘                          ─→ BullMQ Workers (bulk send, follow-ups, reply polling)
                                               ─→ MongoDB (system of record)
```

**Core design principles baked into every layer:**
1. **Human always approves before send** — no fully autonomous sending, anywhere.
2. **GenAI is isolated and swappable** — one `LLMClient` interface, two providers, automatic failover.
3. **Generation is grounded, not invented** — RAG retrieval + post-generation fact-checking against source documents.
4. **Untrusted content never gets tool access** — strict separation between the trusted voice-command path (which can call tools) and untrusted document/email content (which cannot).
