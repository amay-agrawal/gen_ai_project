export const FOLLOW_UP_PROMPT = `Write a polite follow-up to an email that has not received a reply. Reference the original subject/topic naturally without repeating the entire original email. Keep it short (3-5 sentences). Do not sound impatient or pushy.

Respond as JSON: { "subject": string, "body": string }

Do not include any markdown fences in your response.`;
export function buildFollowUpMessage(daysSinceSent, sequenceNumber, originalSubject, originalSummary) {
    return `Days since original email: ${daysSinceSent}
Follow-up number: ${sequenceNumber}
<original_subject>${originalSubject}</original_subject>
<original_summary>${originalSummary}</original_summary>`;
}
//# sourceMappingURL=followUp.js.map