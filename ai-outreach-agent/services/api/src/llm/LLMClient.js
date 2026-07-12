export class LLMError extends Error {
    provider;
    retryable;
    constructor(provider, message, retryable = false) {
        super(message);
        this.name = 'LLMError';
        this.provider = provider;
        this.retryable = retryable;
    }
}
//# sourceMappingURL=LLMClient.js.map