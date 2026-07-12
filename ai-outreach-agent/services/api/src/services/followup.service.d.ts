import { ILLMClient } from '../llm/LLMClient.js';
export declare class FollowUpService {
    private llm;
    constructor(llm: ILLMClient);
    /**
     * Gets candidates for follow-up based on org settings.
     */
    getPendingCandidates(orgId: string, daysThreshold?: number): Promise<any[]>;
    /**
     * Generates follow-up drafts for specified outreach records.
     */
    generateFollowUps(params: {
        outreachRecordIds: string[];
        orgId: string;
        userId: string;
        instruction?: string;
    }): Promise<string[]>;
}
//# sourceMappingURL=followup.service.d.ts.map