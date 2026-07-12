export const SUBJECT_LINE_PROMPT = `Write 1 concise, professional subject line (under 65 characters) for the email below. No quotation marks, no emoji unless the requested tone is "casual" or "friendly".

Return ONLY the subject line text, nothing else.`;
export function buildSubjectLineMessage(tone, bodySummary) {
    return `<tone>${tone}</tone>
<body_summary>${bodySummary}</body_summary>`;
}
//# sourceMappingURL=subjectLine.js.map