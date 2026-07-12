export declare class GmailService {
    /**
     * Creates an OAuth2 client configured with Google credentials.
     */
    getOAuth2Client(): import("google-auth-library").OAuth2Client;
    /**
     * Generates the Google OAuth consent URL.
     */
    getAuthUrl(): string;
    /**
     * Exchanges authorization code for tokens and stores them encrypted.
     */
    handleCallback(tokens: any, userId: string): Promise<void>;
    /**
     * Gets an authorized Gmail client for a user, refreshing tokens if needed.
     */
    getAuthorizedClient(userId: string): Promise<import("google-auth-library").OAuth2Client>;
    /**
     * Sends an email through Gmail API. Idempotent via dedupe key.
     */
    sendEmail(userId: string, draftId: string): Promise<{
        messageId: string;
        threadId: string;
    }>;
    /**
     * Creates a Gmail draft (not sent).
     */
    createDraft(userId: string, to: string, subject: string, body: string, threadId?: string): Promise<string>;
    /**
     * Fetches a Gmail thread's messages.
     */
    getThread(userId: string, threadId: string): Promise<import("googleapis").gmail_v1.Schema$Thread>;
    /**
     * Gets the user's daily send quota usage.
     */
    getQuota(userId: string, dailySendCap: number): Promise<{
        sent: number;
        limit: number;
        remaining: number;
    }>;
    /**
     * Checks if a user has connected Gmail.
     */
    isConnected(userId: string): Promise<boolean>;
}
//# sourceMappingURL=gmail.service.d.ts.map