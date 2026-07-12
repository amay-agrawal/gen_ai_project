"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardQuerySchema = exports.CreateGmailDraftSchema = exports.ExtensionSummarizeSchema = exports.ExtensionRewriteSchema = exports.ExtensionGenerateSchema = exports.SuggestReplySchema = exports.FollowUpSettingsSchema = exports.GenerateFollowUpsSchema = exports.RagQuerySchema = exports.UploadDocumentSchema = exports.ContactQuerySchema = exports.UpdateContactSchema = exports.CreateContactSchema = exports.SendEmailsRequestSchema = exports.EditDraftRequestSchema = exports.RegenerateRequestSchema = exports.GenerateBulkRequestSchema = exports.GenerateEmailRequestSchema = exports.ParsedIntentSchema = exports.ParseIntentRequestSchema = void 0;
const zod_1 = require("zod");
// ─── Voice/Intent ──────────────────────────────────────
exports.ParseIntentRequestSchema = zod_1.z.object({
    transcript: zod_1.z.string().min(1).max(5000),
});
exports.ParsedIntentSchema = zod_1.z.object({
    intent: zod_1.z.enum(['single_outreach', 'bulk_outreach', 'follow_up', 'reply']),
    topic: zod_1.z.string(),
    year: zod_1.z.string().nullable(),
    recipients: zod_1.z.array(zod_1.z.string()),
    requiredFacts: zod_1.z.array(zod_1.z.string()),
    tone: zod_1.z.enum(['professional', 'casual', 'formal', 'friendly']),
    constraints: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number().min(0).max(1),
    clarifyingQuestion: zod_1.z.string().optional(),
});
// ─── Email Generation ──────────────────────────────────
exports.GenerateEmailRequestSchema = zod_1.z.object({
    intent: exports.ParsedIntentSchema,
    contactId: zod_1.z.string().optional(),
});
exports.GenerateBulkRequestSchema = zod_1.z.object({
    intent: exports.ParsedIntentSchema,
    recipientIds: zod_1.z.array(zod_1.z.string()).min(1).max(500),
});
exports.RegenerateRequestSchema = zod_1.z.object({
    instruction: zod_1.z.string().max(500).optional(),
});
exports.EditDraftRequestSchema = zod_1.z.object({
    subject: zod_1.z.string().optional(),
    body: zod_1.z.string().optional(),
    signature: zod_1.z.string().optional(),
});
exports.SendEmailsRequestSchema = zod_1.z.object({
    draftIds: zod_1.z.array(zod_1.z.string()).min(1).max(500),
});
// ─── Contacts (CRM) ───────────────────────────────────
exports.CreateContactSchema = zod_1.z.object({
    company: zod_1.z.string().min(1).max(200),
    hrName: zod_1.z.string().min(1).max(200),
    designation: zod_1.z.string().max(200).default(''),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().max(20).default(''),
    status: zod_1.z.enum(['new', 'contacted', 'replied', 'closed']).default('new'),
    notes: zod_1.z.string().max(5000).default(''),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.UpdateContactSchema = exports.CreateContactSchema.partial();
exports.ContactQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    status: zod_1.z.enum(['new', 'contacted', 'replied', 'closed']).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// ─── Documents (RAG) ──────────────────────────────────
exports.UploadDocumentSchema = zod_1.z.object({
    docType: zod_1.z.enum(['brochure', 'statistics', 'company_info', 'template', 'other']).default('other'),
});
exports.RagQuerySchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(1000),
    topK: zod_1.z.coerce.number().int().min(1).max(20).default(5),
});
// ─── Follow-Up ────────────────────────────────────────
exports.GenerateFollowUpsSchema = zod_1.z.object({
    outreachRecordIds: zod_1.z.array(zod_1.z.string()).min(1).max(100),
    instruction: zod_1.z.string().max(500).optional(),
});
exports.FollowUpSettingsSchema = zod_1.z.object({
    daySequence: zod_1.z.array(zod_1.z.number().int().min(1)).min(1).max(5),
    maxFollowUps: zod_1.z.number().int().min(1).max(10),
});
// ─── Reply Assistant ──────────────────────────────────
exports.SuggestReplySchema = zod_1.z.object({
    variant: zod_1.z.enum(['professional', 'brief', 'positive', 'clarification']),
});
// ─── Extension ────────────────────────────────────────
exports.ExtensionGenerateSchema = zod_1.z.object({
    context: zod_1.z.enum(['new', 'reply']),
    threadText: zod_1.z.string().max(50000).optional(),
    instruction: zod_1.z.string().min(1).max(2000),
});
exports.ExtensionRewriteSchema = zod_1.z.object({
    selectedText: zod_1.z.string().min(1).max(10000),
    mode: zod_1.z.enum(['professional', 'concise', 'expand']),
});
exports.ExtensionSummarizeSchema = zod_1.z.object({
    threadText: zod_1.z.string().min(1).max(50000),
});
// ─── Gmail ────────────────────────────────────────────
exports.CreateGmailDraftSchema = zod_1.z.object({
    to: zod_1.z.string().email(),
    subject: zod_1.z.string().min(1),
    body: zod_1.z.string().min(1),
    threadId: zod_1.z.string().optional(),
});
// ─── Dashboard ────────────────────────────────────────
exports.DashboardQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
//# sourceMappingURL=index.js.map