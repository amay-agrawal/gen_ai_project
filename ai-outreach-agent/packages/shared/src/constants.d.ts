export declare const ROLES: {
    ADMIN: "admin";
    MEMBER: "member";
};
export declare const DRAFT_STATUSES: readonly ["pending_review", "approved", "sending", "sent", "failed", "rejected"];
export declare const CONTACT_STATUSES: readonly ["new", "contacted", "replied", "closed"];
export declare const RATE_LIMITS: {
    API_REQUESTS_PER_MINUTE: number;
    LLM_CALLS_PER_HOUR: number;
    DEFAULT_DAILY_SEND_CAP: number;
    MAX_BULK_JOB_SIZE: number;
    MAX_PERSONALIZATION_BATCH: number;
};
export declare const RAG_DEFAULTS: {
    CHUNK_SIZE_TOKENS: number;
    CHUNK_OVERLAP_TOKENS: number;
    DEFAULT_TOP_K: number;
    MAX_TOP_K: number;
    MAX_FILE_SIZE_BYTES: number;
    ALLOWED_MIME_TYPES: string[];
};
export declare const FOLLOWUP_DEFAULTS: {
    DAY_SEQUENCE: number[];
    MAX_FOLLOWUPS: number;
};
export declare const PROMPT_VERSIONS: {
    INTENT_EXTRACTION: string;
    EMAIL_GENERATION: string;
    PERSONALIZATION: string;
    SUBJECT_LINE: string;
    REPLY_SUMMARIZATION: string;
    REPLY_VARIANTS: string;
    FOLLOW_UP: string;
    REWRITE: string;
    THREAD_SUMMARIZE: string;
};
export declare const JWT_DEFAULTS: {
    ACCESS_TOKEN_EXPIRY: string;
    REFRESH_TOKEN_EXPIRY: string;
};
export declare const API_BASE = "/api/v1";
//# sourceMappingURL=constants.d.ts.map