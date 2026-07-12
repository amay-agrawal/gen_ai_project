import OpenAI from 'openai';
import { config } from '../config/index.js';
import { LLMError } from './LLMClient.js';
export class OpenAIClient {
    client;
    constructor() {
        this.client = new OpenAI({ apiKey: config.openai.apiKey });
    }
    get name() {
        return `openai:${config.openai.model}`;
    }
    async generate(params) {
        try {
            const messages = [];
            if (params.systemPrompt) {
                messages.push({ role: 'system', content: params.systemPrompt });
            }
            for (const msg of params.messages) {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
            const completionParams = {
                model: config.openai.model,
                messages,
                temperature: params.temperature ?? 0.7,
                max_tokens: params.maxTokens ?? 4096,
            };
            if (params.responseSchema) {
                completionParams.response_format = { type: 'json_object' };
            }
            const completion = await this.client.chat.completions.create(completionParams);
            const choice = completion.choices[0];
            return {
                content: choice.message.content || '',
                usage: {
                    promptTokens: completion.usage?.prompt_tokens ?? 0,
                    completionTokens: completion.usage?.completion_tokens ?? 0,
                    totalTokens: completion.usage?.total_tokens ?? 0,
                },
                model: this.name,
            };
        }
        catch (error) {
            const err = error;
            const retryable = err.status === 429 || err.status === 503;
            throw new LLMError('openai', err.message || 'OpenAI API error', retryable);
        }
    }
    async embed(text) {
        try {
            const response = await this.client.embeddings.create({
                model: 'text-embedding-3-large',
                input: text,
            });
            return response.data[0].embedding;
        }
        catch (error) {
            const err = error;
            throw new LLMError('openai', `Embedding error: ${err.message}`, false);
        }
    }
}
//# sourceMappingURL=OpenAIClient.js.map