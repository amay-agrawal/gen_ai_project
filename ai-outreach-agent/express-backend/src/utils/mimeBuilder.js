import crypto from 'crypto';
/**
 * Builds a base64url-encoded RFC 2822 MIME message for the Gmail API.
 */
export function buildMimeMessage(params) {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const headers = [
        `From: ${params.from}`,
        `To: ${params.to}`,
        `Subject: ${params.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    if (params.inReplyTo) {
        headers.push(`In-Reply-To: ${params.inReplyTo}`);
    }
    if (params.references) {
        headers.push(`References: ${params.references}`);
    }
    const plainText = params.body.replace(/<[^>]*>/g, '');
    const message = [
        headers.join('\r\n'),
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        plainText,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        wrapInHtml(params.body),
        '',
        `--${boundary}--`,
    ].join('\r\n');
    return Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
function wrapInHtml(body) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
${body}
</body>
</html>`;
}
/**
 * Generates a dedupe key for idempotent sends.
 */
export function generateDedupeKey(draftId, recipientEmail) {
    return crypto
        .createHash('sha256')
        .update(`${draftId}:${recipientEmail}`)
        .digest('hex')
        .slice(0, 32);
}
//# sourceMappingURL=mimeBuilder.js.map