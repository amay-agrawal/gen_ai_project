import { ILLMClient } from '../llm/LLMClient.js';
import type { ReplySummary, ReplyVariants } from '@ai-outreach/shared';
export declare class ReplyService {
    private llm;
    constructor(llm: ILLMClient);
    /**
     * Lists inbound messages with AI summaries for the reply inbox.
     */
    getInbox(orgId: string, page?: number, limit?: number): Promise<{
        messages: (import("mongoose").FlattenMaps<import("../models/ThreadMessage.js").ThreadMessageDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        pages: number;
    }>;
    /**
     * Gets full detail for a thread message including action items and deadlines.
     */
    getMessageDetail(messageId: string): Promise<import("mongoose").FlattenMaps<import("../models/ThreadMessage.js").ThreadMessageDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Summarizes an inbound email and extracts action items/deadlines.
     */
    summarizeReply(emailBody: string): Promise<ReplySummary>;
    /**
     * Generates 4 reply variants for a specific reply variant type.
     */
    generateReplyVariants(threadHistory: string, summaryJson: string): Promise<ReplyVariants>;
    /**
     * Processes an inbound message: summarize and store.
     */
    processInboundMessage(params: {
        outreachRecordId: string;
        gmailMessageId: string;
        from: string;
        snippet: string;
        fullBody: string;
    }): Promise<void>;
    /**
     * Syncs the inbox by polling Gmail for replies to tracked threads.
     */
    syncInbox(userId: string, orgId: string): Promise<{
        synced: number;
    }>;
}
//# sourceMappingURL=reply.service.d.ts.map