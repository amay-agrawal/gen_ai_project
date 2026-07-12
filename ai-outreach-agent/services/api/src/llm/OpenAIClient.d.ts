import { ILLMClient, GenerateParams } from './LLMClient.js';
import type { LLMResponse } from '@ai-outreach/shared';
export declare class OpenAIClient implements ILLMClient {
    private client;
    constructor();
    get name(): string;
    generate(params: GenerateParams): Promise<LLMResponse>;
    embed(text: string): Promise<number[]>;
}
//# sourceMappingURL=OpenAIClient.d.ts.map