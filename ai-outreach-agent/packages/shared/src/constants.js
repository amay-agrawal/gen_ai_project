"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_BASE = exports.JWT_DEFAULTS = exports.PROMPT_VERSIONS = exports.FOLLOWUP_DEFAULTS = exports.RAG_DEFAULTS = exports.RATE_LIMITS = exports.CONTACT_STATUSES = exports.DRAFT_STATUSES = exports.ROLES = void 0;
// ─── Roles ──────────────────────────────────────────────
exports.ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member',
};
// ─── Draft Status Flow ─────────────────────────────────
exports.DRAFT_STATUSES = [
    'pending_review',
    'approved',
    'sending',
    'sent',
    'failed',
    'rejected',
];
// ─── Contact Statuses ──────────────────────────────────
exports.CONTACT_STATUSES = ['new', 'contacted', 'replied', 'closed'];
// ─── Rate Limits ───────────────────────────────────────
exports.RATE_LIMITS = {
    API_REQUESTS_PER_MINUTE: 120,
    LLM_CALLS_PER_HOUR: 60,
    DEFAULT_DAILY_SEND_CAP: 500,
    MAX_BULK_JOB_SIZE: 500,
    MAX_PERSONALIZATION_BATCH: 25,
};
// ─── RAG Defaults ──────────────────────────────────────
exports.RAG_DEFAULTS = {
    CHUNK_SIZE_TOKENS: 500,
    CHUNK_OVERLAP_TOKENS: 50,
    DEFAULT_TOP_K: 5,
    MAX_TOP_K: 20,
    MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
    ALLOWED_MIME_TYPES: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
    ],
};
// ─── Follow-Up Defaults ───────────────────────────────
exports.FOLLOWUP_DEFAULTS = {
    DAY_SEQUENCE: [7, 14, 21],
    MAX_FOLLOWUPS: 3,
};
// ─── Prompt Versions ──────────────────────────────────
exports.PROMPT_VERSIONS = {
    INTENT_EXTRACTION: 'v1.0',
    EMAIL_GENERATION: 'v1.0',
    PERSONALIZATION: 'v1.0',
    SUBJECT_LINE: 'v1.0',
    REPLY_SUMMARIZATION: 'v1.0',
    REPLY_VARIANTS: 'v1.0',
    FOLLOW_UP: 'v1.0',
    REWRITE: 'v1.0',
    THREAD_SUMMARIZE: 'v1.0',
};
// ─── JWT ───────────────────────────────────────────────
exports.JWT_DEFAULTS = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
};
// ─── API Paths ─────────────────────────────────────────
exports.API_BASE = '/api/v1';
//# sourceMappingURL=constants.js.map