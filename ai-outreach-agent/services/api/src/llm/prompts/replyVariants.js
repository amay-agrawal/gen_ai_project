export const REPLY_VARIANTS_PROMPT = `Generate FOUR reply variants to the inbound email, given the conversation history and the extracted summary. Each variant must be a complete, ready-to-edit draft.

- "professional": balanced, formal tone, addresses all action items
- "brief": 2-3 sentences max, only the essential answer
- "positive": enthusiastic, emphasizes opportunity/excitement
- "clarification": politely asks a clarifying question instead of fully answering

Respond as JSON: { "professional": string, "brief": string, "positive": string, "clarification": string }

Do not include any markdown fences in your response.`;
export function buildReplyVariantsMessage(threadHistory, summaryJson) {
    return `<thread_history>${threadHistory}</thread_history>
<inbound_summary>${summaryJson}</inbound_summary>`;
}
//# sourceMappingURL=replyVariants.js.map