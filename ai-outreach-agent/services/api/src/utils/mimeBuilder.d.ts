/**
 * Builds a base64url-encoded RFC 2822 MIME message for the Gmail API.
 */
export declare function buildMimeMessage(params: {
    to: string;
    from: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
}): string;
/**
 * Generates a dedupe key for idempotent sends.
 */
export declare function generateDedupeKey(draftId: string, recipientEmail: string): string;
//# sourceMappingURL=mimeBuilder.d.ts.map