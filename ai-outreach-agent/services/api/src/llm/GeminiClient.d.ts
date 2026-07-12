import { ILLMClient, GenerateParams } from './LLMClient.js';
import type { LLMResponse } from '@ai-outreach/shared';
export declare class GeminiClient implements ILLMClient {
    private client;
    private model;
    private embeddingModel;
    constructor();
    get name(): string;
    generate(params: GenerateParams): Promise<LLMResponse>;
    embed(text: string): Promise<number[]>;
}
//# sourceMappingURL=GeminiClient.d.ts.map