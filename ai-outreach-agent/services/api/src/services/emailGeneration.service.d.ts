import { ILLMClient } from '../llm/LLMClient.js';
import type { ParsedIntent } from '@ai-outreach/shared';
export declare class EmailGenerationService {
    private llm;
    constructor(llm: ILLMClient);
    /**
     * Generates a single email draft for one recipient.
     */
    generateSingle(params: {
        intent: ParsedIntent;
        contactId: string;
        orgId: string;
        userId: string;
        retrievedChunks: string;
        userSignature: string;
    }): Promise<string>;
    /**
     * Generates bulk email drafts for multiple recipients.
     * Uses the hybrid template + batched personalization approach.
     */
    generateBulk(params: {
        intent: ParsedIntent;
        recipientIds: string[];
        orgId: string;
        userId: string;
        retrievedChunks: string;
        userSignature: string;
    }): Promise<string>;
    /**
     * Regenerates a draft with optional user instruction.
     */
    regenerate(draftId: string, instruction?: string): Promise<void>;
    private generateBaseEmail;
    private personalizeForBatch;
    private generateSubjectLine;
}
//# sourceMappingURL=emailGeneration.service.d.ts.map