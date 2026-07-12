import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { LLMError } from './LLMClient.js';
export class GeminiClient {
    client;
    model;
    embeddingModel;
    constructor() {
        this.client = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.client.getGenerativeModel({ model: config.gemini.model });
        this.embeddingModel = this.client.getGenerativeModel({ model: 'text-embedding-004' });
    }
    get name() {
        return `gemini:${config.gemini.model}`;
    }
    async generate(params) {
        try {
            const contents = params.messages
                .filter((m) => m.role !== 'system')
                .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));
            const generationConfig = {
                temperature: params.temperature ?? 0.7,
                maxOutputTokens: params.maxTokens ?? 4096,
            };
            if (params.responseSchema) {
                generationConfig.responseMimeType = 'application/json';
            }
            const result = await this.model.generateContent({
                contents,
                systemInstruction: params.systemPrompt
                    ? { role: 'user', parts: [{ text: params.systemPrompt }] }
                    : undefined,
                generationConfig,
            });
            const response = result.response;
            const text = response.text();
            const usage = response.usageMetadata;
            return {
                content: text,
                usage: {
                    promptTokens: usage?.promptTokenCount ?? 0,
                    completionTokens: usage?.candidatesTokenCount ?? 0,
                    totalTokens: usage?.totalTokenCount ?? 0,
                },
                model: this.name,
            };
        }
        catch (error) {
            const err = error;
            const retryable = err.status === 429 || err.status === 503;
            throw new LLMError('gemini', err.message || 'Gemini API error', retryable);
        }
    }
    async embed(text) {
        try {
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            const err = error;
            throw new LLMError('gemini', `Embedding error: ${err.message}`, false);
        }
    }
}
//# sourceMappingURL=GeminiClient.js.map