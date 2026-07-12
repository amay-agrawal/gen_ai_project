export const REWRITE_PROMPT = `Rewrite the given text in the requested mode, preserving the original meaning and any names/numbers exactly. Return ONLY the rewritten text, no commentary.

Mode = "professional": elevate tone, remove slang/casualness.
Mode = "concise": cut to essential meaning, target ~50% of original length.
Mode = "expand": add helpful detail/context, roughly double the length.`;
export function buildRewriteMessage(mode, selectedText) {
    return `<mode>${mode}</mode>
<text>${selectedText}</text>`;
}
//# sourceMappingURL=rewrite.js.map