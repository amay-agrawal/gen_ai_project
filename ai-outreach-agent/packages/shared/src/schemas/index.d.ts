import { z } from 'zod';
export declare const ParseIntentRequestSchema: z.ZodObject<{
    transcript: z.ZodString;
}, "strip", z.ZodTypeAny, {
    transcript: string;
}, {
    transcript: string;
}>;
export declare const ParsedIntentSchema: z.ZodObject<{
    intent: z.ZodEnum<["single_outreach", "bulk_outreach", "follow_up", "reply"]>;
    topic: z.ZodString;
    year: z.ZodNullable<z.ZodString>;
    recipients: z.ZodArray<z.ZodString, "many">;
    requiredFacts: z.ZodArray<z.ZodString, "many">;
    tone: z.ZodEnum<["professional", "casual", "formal", "friendly"]>;
    constraints: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodNumber;
    clarifyingQuestion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
    topic: string;
    year: string | null;
    recipients: string[];
    requiredFacts: string[];
    tone: "professional" | "casual" | "formal" | "friendly";
    constraints: string[];
    confidence: number;
    clarifyingQuestion?: string | undefined;
}, {
    intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
    topic: string;
    year: string | null;
    recipients: string[];
    requiredFacts: string[];
    tone: "professional" | "casual" | "formal" | "friendly";
    constraints: string[];
    confidence: number;
    clarifyingQuestion?: string | undefined;
}>;
export declare const GenerateEmailRequestSchema: z.ZodObject<{
    intent: z.ZodObject<{
        intent: z.ZodEnum<["single_outreach", "bulk_outreach", "follow_up", "reply"]>;
        topic: z.ZodString;
        year: z.ZodNullable<z.ZodString>;
        recipients: z.ZodArray<z.ZodString, "many">;
        requiredFacts: z.ZodArray<z.ZodString, "many">;
        tone: z.ZodEnum<["professional", "casual", "formal", "friendly"]>;
        constraints: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodNumber;
        clarifyingQuestion: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    }, {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    }>;
    contactId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    intent: {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    };
    contactId?: string | undefined;
}, {
    intent: {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    };
    contactId?: string | undefined;
}>;
export declare const GenerateBulkRequestSchema: z.ZodObject<{
    intent: z.ZodObject<{
        intent: z.ZodEnum<["single_outreach", "bulk_outreach", "follow_up", "reply"]>;
        topic: z.ZodString;
        year: z.ZodNullable<z.ZodString>;
        recipients: z.ZodArray<z.ZodString, "many">;
        requiredFacts: z.ZodArray<z.ZodString, "many">;
        tone: z.ZodEnum<["professional", "casual", "formal", "friendly"]>;
        constraints: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodNumber;
        clarifyingQuestion: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    }, {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    }>;
    recipientIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    intent: {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    };
    recipientIds: string[];
}, {
    intent: {
        intent: "follow_up" | "reply" | "single_outreach" | "bulk_outreach";
        topic: string;
        year: string | null;
        recipients: string[];
        requiredFacts: string[];
        tone: "professional" | "casual" | "formal" | "friendly";
        constraints: string[];
        confidence: number;
        clarifyingQuestion?: string | undefined;
    };
    recipientIds: string[];
}>;
export declare const RegenerateRequestSchema: z.ZodObject<{
    instruction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    instruction?: string | undefined;
}, {
    instruction?: string | undefined;
}>;
export declare const EditDraftRequestSchema: z.ZodObject<{
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subject?: string | undefined;
    body?: string | undefined;
    signature?: string | undefined;
}, {
    subject?: string | undefined;
    body?: string | undefined;
    signature?: string | undefined;
}>;
export declare const SendEmailsRequestSchema: z.ZodObject<{
    draftIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    draftIds: string[];
}, {
    draftIds: string[];
}>;
export declare const CreateContactSchema: z.ZodObject<{
    company: z.ZodString;
    hrName: z.ZodString;
    designation: z.ZodDefault<z.ZodString>;
    email: z.ZodString;
    phone: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["new", "contacted", "replied", "closed"]>>;
    notes: z.ZodDefault<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "new" | "contacted" | "replied" | "closed";
    company: string;
    hrName: string;
    designation: string;
    email: string;
    phone: string;
    notes: string;
    tags: string[];
}, {
    company: string;
    hrName: string;
    email: string;
    status?: "new" | "contacted" | "replied" | "closed" | undefined;
    designation?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const UpdateContactSchema: z.ZodObject<{
    company: z.ZodOptional<z.ZodString>;
    hrName: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["new", "contacted", "replied", "closed"]>>>;
    notes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    status?: "new" | "contacted" | "replied" | "closed" | undefined;
    company?: string | undefined;
    hrName?: string | undefined;
    designation?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    tags?: string[] | undefined;
}, {
    status?: "new" | "contacted" | "replied" | "closed" | undefined;
    company?: string | undefined;
    hrName?: string | undefined;
    designation?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const ContactQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["new", "contacted", "replied", "closed"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "new" | "contacted" | "replied" | "closed" | undefined;
    company?: string | undefined;
    search?: string | undefined;
}, {
    status?: "new" | "contacted" | "replied" | "closed" | undefined;
    company?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const UploadDocumentSchema: z.ZodObject<{
    docType: z.ZodDefault<z.ZodEnum<["brochure", "statistics", "company_info", "template", "other"]>>;
}, "strip", z.ZodTypeAny, {
    docType: "brochure" | "statistics" | "company_info" | "template" | "other";
}, {
    docType?: "brochure" | "statistics" | "company_info" | "template" | "other" | undefined;
}>;
export declare const RagQuerySchema: z.ZodObject<{
    query: z.ZodString;
    topK: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    topK: number;
}, {
    query: string;
    topK?: number | undefined;
}>;
export declare const GenerateFollowUpsSchema: z.ZodObject<{
    outreachRecordIds: z.ZodArray<z.ZodString, "many">;
    instruction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    outreachRecordIds: string[];
    instruction?: string | undefined;
}, {
    outreachRecordIds: string[];
    instruction?: string | undefined;
}>;
export declare const FollowUpSettingsSchema: z.ZodObject<{
    daySequence: z.ZodArray<z.ZodNumber, "many">;
    maxFollowUps: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    daySequence: number[];
    maxFollowUps: number;
}, {
    daySequence: number[];
    maxFollowUps: number;
}>;
export declare const SuggestReplySchema: z.ZodObject<{
    variant: z.ZodEnum<["professional", "brief", "positive", "clarification"]>;
}, "strip", z.ZodTypeAny, {
    variant: "professional" | "positive" | "brief" | "clarification";
}, {
    variant: "professional" | "positive" | "brief" | "clarification";
}>;
export declare const ExtensionGenerateSchema: z.ZodObject<{
    context: z.ZodEnum<["new", "reply"]>;
    threadText: z.ZodOptional<z.ZodString>;
    instruction: z.ZodString;
}, "strip", z.ZodTypeAny, {
    instruction: string;
    context: "new" | "reply";
    threadText?: string | undefined;
}, {
    instruction: string;
    context: "new" | "reply";
    threadText?: string | undefined;
}>;
export declare const ExtensionRewriteSchema: z.ZodObject<{
    selectedText: z.ZodString;
    mode: z.ZodEnum<["professional", "concise", "expand"]>;
}, "strip", z.ZodTypeAny, {
    selectedText: string;
    mode: "professional" | "concise" | "expand";
}, {
    selectedText: string;
    mode: "professional" | "concise" | "expand";
}>;
export declare const ExtensionSummarizeSchema: z.ZodObject<{
    threadText: z.ZodString;
}, "strip", z.ZodTypeAny, {
    threadText: string;
}, {
    threadText: string;
}>;
export declare const CreateGmailDraftSchema: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
    threadId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subject: string;
    body: string;
    to: string;
    threadId?: string | undefined;
}, {
    subject: string;
    body: string;
    to: string;
    threadId?: string | undefined;
}>;
export declare const DashboardQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map