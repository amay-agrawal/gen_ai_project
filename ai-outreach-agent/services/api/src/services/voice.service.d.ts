import { ILLMClient } from '../llm/LLMClient.js';
import type { ParsedIntent } from '@ai-outreach/shared';
export declare class VoiceService {
    private llm;
    constructor(llm: ILLMClient);
    /**
     * Parses a voice transcript into a structured intent using LLM function-calling.
     * Then resolves recipient names against the CRM to find matching contacts.
     */
    parseIntent(transcript: string, orgId: string): Promise<{
        intent: ParsedIntent;
        resolvedContacts: Array<{
            contactId: string;
            company: string;
            email: string;
            hrName: string;
        }>;
    }>;
    /**
     * Fuzzy-matches recipient names (company names) against the CRM contacts.
     */
    private resolveRecipients;
}
//# sourceMappingURL=voice.service.d.ts.map