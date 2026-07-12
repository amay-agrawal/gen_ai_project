import { LLMError } from './LLMClient.js';
/**
 * Resilient LLM client that tries providers in order, failing over
 * to the next on retryable errors. Implements exponential backoff
 * on 429s within a single provider before moving to the next.
 */
export class ResilientLLMClient {
    providers;
    primaryIndex = 0;
    constructor(providers) {
        if (providers.length === 0) {
            throw new Error('ResilientLLMClient requires at least one provider');
        }
        this.providers = providers;
    }
    get name() {
        return `resilient:[${this.providers.map((p) => p.name).join(',')}]`;
    }
    async generate(params) {
        let lastError = null;
        for (let i = 0; i < this.providers.length; i++) {
            const providerIndex = (this.primaryIndex + i) % this.providers.length;
            const provider = this.providers[providerIndex];
            try {
                const result = await this.executeWithRetry(() => provider.generate(params), 2);
                return result;
            }
            catch (error) {
                lastError = error;
                console.warn(`[ResilientLLM] Provider ${provider.name} failed: ${error.message}. ` +
                    `Trying next provider...`);
            }
        }
        throw new LLMError('resilient', `All LLM providers failed. Last error: ${lastError?.message}`, false);
    }
    async embed(text) {
        let lastError = null;
        for (let i = 0; i < this.providers.length; i++) {
            const providerIndex = (this.primaryIndex + i) % this.providers.length;
            const provider = this.providers[providerIndex];
            try {
                return await provider.embed(text);
            }
            catch (error) {
                lastError = error;
                console.warn(`[ResilientLLM] Embedding via ${provider.name} failed: ${error.message}`);
            }
        }
        throw new LLMError('resilient', `All embedding providers failed. Last error: ${lastError?.message}`, false);
    }
    async executeWithRetry(fn, maxRetries) {
        let retries = 0;
        while (true) {
            try {
                return await fn();
            }
            catch (error) {
                const llmErr = error;
                if (!llmErr.retryable || retries >= maxRetries) {
                    throw error;
                }
                retries++;
                const delay = Math.min(1000 * Math.pow(2, retries) + Math.random() * 500, 10000);
                console.warn(`[ResilientLLM] Retryable error, attempt ${retries}/${maxRetries}. ` +
                    `Waiting ${Math.round(delay)}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
}
//# sourceMappingURL=ResilientLLMClient.js.map