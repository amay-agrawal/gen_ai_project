import type { ChatMessage, LLMResponse } from '@ai-outreach/shared';
export interface GenerateParams {
    systemPrompt: string;
    messages: ChatMessage[];
    responseSchema?: Record<string, unknown>;
    temperature?: number;
    maxTokens?: number;
}
export interface ILLMClient {
    generate(params: GenerateParams): Promise<LLMResponse>;
    embed(text: string): Promise<number[]>;
    get name(): string;
}
export declare class LLMError extends Error {
    provider: string;
    retryable: boolean;
    constructor(provider: string, message: string, retryable?: boolean);
}
//# sourceMappingURL=LLMClient.d.ts.map