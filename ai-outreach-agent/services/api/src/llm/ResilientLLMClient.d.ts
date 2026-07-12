import { ILLMClient, GenerateParams } from './LLMClient.js';
import type { LLMResponse } from '@ai-outreach/shared';
/**
 * Resilient LLM client that tries providers in order, failing over
 * to the next on retryable errors. Implements exponential backoff
 * on 429s within a single provider before moving to the next.
 */
export declare class ResilientLLMClient implements ILLMClient {
    private providers;
    private primaryIndex;
    constructor(providers: ILLMClient[]);
    get name(): string;
    generate(params: GenerateParams): Promise<LLMResponse>;
    embed(text: string): Promise<number[]>;
    private executeWithRetry;
}
//# sourceMappingURL=ResilientLLMClient.d.ts.map