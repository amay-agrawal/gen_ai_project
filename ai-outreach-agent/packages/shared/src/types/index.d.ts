export type UserRole = 'admin' | 'member';
export interface IUser {
    _id: string;
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string;
    role: UserRole;
    orgId: string;
    signature: string;
    dailySendCap: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IOAuthToken {
    _id: string;
    userId: string;
    provider: 'google';
    accessTokenEnc: string;
    refreshTokenEnc: string;
    scope: string[];
    expiresAt: Date;
    createdAt: Date;
}
export type ContactStatus = 'new' | 'contacted' | 'replied' | 'closed';
export interface IContact {
    _id: string;
    orgId: string;
    company: string;
    hrName: string;
    designation: string;
    email: string;
    phone: string;
    status: ContactStatus;
    lastContactDate: Date | null;
    notes: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export type DocFileType = 'pdf' | 'docx' | 'xlsx' | 'csv';
export type DocType = 'brochure' | 'statistics' | 'company_info' | 'template' | 'other';
export type DocStatus = 'processing' | 'indexed' | 'failed';
export interface IDocument {
    _id: string;
    orgId: string;
    uploadedBy: string;
    fileName: string;
    fileType: DocFileType;
    storageUrl: string;
    docType: DocType;
    status: DocStatus;
    chunkCount: number;
    createdAt: Date;
}
export interface IDocumentChunk {
    _id: string;
    documentId: string;
    orgId: string;
    chunkIndex: number;
    text: string;
    vectorId: string;
    metadata: {
        page: number;
        section: string;
    };
    createdAt: Date;
}
export type CampaignStatus = 'draft' | 'in_review' | 'sent' | 'partially_sent';
export interface ICampaign {
    _id: string;
    orgId: string;
    createdBy: string;
    name: string;
    sourceIntent: ParsedIntent;
    status: CampaignStatus;
    recipientCount: number;
    createdAt: Date;
}
export type DraftType = 'outreach' | 'follow_up' | 'reply';
export type DraftStatus = 'pending_review' | 'approved' | 'sending' | 'sent' | 'failed' | 'rejected';
export interface IGenerationMeta {
    model: string;
    promptVersion: string;
    retrievedChunkIds: string[];
    regenerateCount: number;
}
export interface IEditHistoryEntry {
    editedAt: Date;
    prevBody: string;
}
export interface IEmailDraft {
    _id: string;
    campaignId: string;
    contactId: string;
    orgId: string;
    type: DraftType;
    subject: string;
    body: string;
    signature: string;
    status: DraftStatus;
    generationMeta: IGenerationMeta;
    editHistory: IEditHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;
}
export type OutreachStatus = 'sent' | 'delivered' | 'bounced' | 'replied';
export interface IOutreachRecord {
    _id: string;
    orgId: string;
    draftId: string;
    contactId: string;
    company: string;
    gmailThreadId: string;
    gmailMessageId: string;
    sentAt: Date;
    replyReceived: boolean;
    replyReceivedAt: Date | null;
    status: OutreachStatus;
    followUpCount: number;
    lastFollowUpAt: Date | null;
}
export type FollowUpStatus = 'pending_review' | 'sent';
export interface IFollowUp {
    _id: string;
    outreachRecordId: string;
    draftId: string;
    sequenceNumber: number;
    triggeredAt: Date;
    status: FollowUpStatus;
}
export type MessageDirection = 'outbound' | 'inbound';
export interface IDeadline {
    label: string;
    date: Date | null;
}
export interface IThreadMessage {
    _id: string;
    outreachRecordId: string;
    gmailMessageId: string;
    direction: MessageDirection;
    from: string;
    snippet: string;
    fullBodyRef: string;
    aiSummary: string;
    actionItems: string[];
    deadlines: IDeadline[];
    receivedAt: Date;
}
export type IntentType = 'single_outreach' | 'bulk_outreach' | 'follow_up' | 'reply';
export type ToneType = 'professional' | 'casual' | 'formal' | 'friendly';
export interface ParsedIntent {
    intent: IntentType;
    topic: string;
    year: string | null;
    recipients: string[];
    requiredFacts: string[];
    tone: ToneType;
    constraints: string[];
    confidence: number;
    clarifyingQuestion?: string;
}
export interface GeneratedEmail {
    subject: string;
    body: string;
    signature: string;
}
export interface PersonalizedSlot {
    recipientId: string;
    recipient_greeting: string;
    company_hook: string;
}
export type Sentiment = 'positive' | 'neutral' | 'negative';
export interface ReplySummary {
    summary: string;
    actionItems: string[];
    deadlines: {
        label: string;
        date: string | null;
    }[];
    sentiment: Sentiment;
}
export type ReplyVariantType = 'professional' | 'brief' | 'positive' | 'clarification';
export interface ReplyVariants {
    professional: string;
    brief: string;
    positive: string;
    clarification: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error: {
        code: string;
        message: string;
    } | null;
    meta: {
        requestId: string;
        timestamp: string;
    };
}
export interface DashboardSummary {
    emailsSent: number;
    repliesReceived: number;
    responseRate: number;
    pendingDrafts: number;
    followUpsDue: number;
}
export interface DailyChartPoint {
    date: string;
    sent: number;
    replies: number;
}
export interface CompanyResponseTrend {
    company: string;
    sent: number;
    replied: number;
    responseRate: number;
}
export type RewriteMode = 'professional' | 'concise' | 'expand';
export interface ExtensionGeneratePayload {
    context: 'new' | 'reply';
    threadText?: string;
    instruction: string;
}
export interface ExtensionRewritePayload {
    selectedText: string;
    mode: RewriteMode;
}
export interface ExtensionSummarizePayload {
    threadText: string;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface LLMResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
}
//# sourceMappingURL=index.d.ts.map