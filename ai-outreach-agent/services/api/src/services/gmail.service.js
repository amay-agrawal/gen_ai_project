import { google } from 'googleapis';
import { config } from '../config/index.js';
import { OAuthToken } from '../models/OAuthToken.js';
import { OutreachRecord } from '../models/OutreachRecord.js';
import { EmailDraft } from '../models/EmailDraft.js';
import { Contact } from '../models/Contact.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { buildMimeMessage, generateDedupeKey } from '../utils/mimeBuilder.js';
import { AppError } from '../utils/apiResponse.js';
const dedupeCache = new Set();
export class GmailService {
    /**
     * Creates an OAuth2 client configured with Google credentials.
     */
    getOAuth2Client() {
        return new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, config.google.callbackUrl);
    }
    /**
     * Generates the Google OAuth consent URL.
     */
    getAuthUrl() {
        const oauth2Client = this.getOAuth2Client();
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: config.google.scopes,
        });
    }
    /**
     * Exchanges authorization code for tokens and stores them encrypted.
     */
    async handleCallback(tokens, userId) {
        if (!tokens.access_token || !tokens.refresh_token) {
            throw new AppError('OAUTH_ERROR', 'Failed to obtain tokens from Google', 400);
        }
        const tokenDoc = {
            userId,
            provider: 'google',
            accessTokenEnc: encrypt(tokens.access_token),
            refreshTokenEnc: encrypt(tokens.refresh_token),
            scope: config.google.scopes,
            expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        };
        await OAuthToken.findOneAndUpdate({ userId }, tokenDoc, {
            upsert: true,
            new: true,
        });
    }
    /**
     * Gets an authorized Gmail client for a user, refreshing tokens if needed.
     */
    async getAuthorizedClient(userId) {
        const tokenDoc = await OAuthToken.findOne({ userId });
        if (!tokenDoc) {
            throw new AppError('GMAIL_NOT_CONNECTED', 'Gmail not connected. Please connect your Gmail account.', 401);
        }
        const oauth2Client = this.getOAuth2Client();
        const accessToken = decrypt(tokenDoc.accessTokenEnc);
        const refreshToken = decrypt(tokenDoc.refreshTokenEnc);
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: tokenDoc.expiresAt.getTime(),
        });
        // Check if token is expired and refresh
        if (tokenDoc.expiresAt.getTime() < Date.now()) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                if (credentials.access_token) {
                    tokenDoc.accessTokenEnc = encrypt(credentials.access_token);
                    tokenDoc.expiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);
                    await tokenDoc.save();
                    oauth2Client.setCredentials(credentials);
                }
            }
            catch (error) {
                throw new AppError('GMAIL_TOKEN_EXPIRED', 'Gmail access expired. Please reconnect your Gmail account.', 401);
            }
        }
        return oauth2Client;
    }
    /**
     * Sends an email through Gmail API. Idempotent via dedupe key.
     */
    async sendEmail(userId, draftId) {
        const draft = await EmailDraft.findById(draftId);
        if (!draft)
            throw new AppError('NOT_FOUND', 'Draft not found', 404);
        const contact = await Contact.findById(draft.contactId);
        if (!contact)
            throw new AppError('NOT_FOUND', 'Contact not found', 404);
        // Idempotency check
        const dedupeKey = generateDedupeKey(draftId, contact.email);
        if (dedupeCache.has(dedupeKey)) {
            throw new AppError('DUPLICATE_SEND', 'This email has already been sent', 409);
        }
        const auth = await this.getAuthorizedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth });
        // Get user's email
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const fromEmail = profile.data.emailAddress || '';
        const raw = buildMimeMessage({
            to: contact.email,
            from: fromEmail,
            subject: draft.subject,
            body: draft.body + (draft.signature ? `\n\n${draft.signature}` : ''),
        });
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw },
        });
        const messageId = result.data.id || '';
        const threadId = result.data.threadId || '';
        // Mark as sent
        dedupeCache.add(dedupeKey);
        draft.status = 'sent';
        await draft.save();
        // Create outreach record
        await OutreachRecord.create({
            orgId: draft.orgId,
            draftId: draft._id,
            contactId: contact._id,
            company: contact.company,
            gmailThreadId: threadId,
            gmailMessageId: messageId,
            sentAt: new Date(),
        });
        // Update contact status
        await Contact.findByIdAndUpdate(contact._id, {
            status: 'contacted',
            lastContactDate: new Date(),
        });
        return { messageId, threadId };
    }
    /**
     * Creates a Gmail draft (not sent).
     */
    async createDraft(userId, to, subject, body, threadId) {
        const auth = await this.getAuthorizedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const fromEmail = profile.data.emailAddress || '';
        const raw = buildMimeMessage({
            to,
            from: fromEmail,
            subject,
            body,
            threadId,
        });
        const result = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: { raw, threadId },
            },
        });
        return result.data.id || '';
    }
    /**
     * Fetches a Gmail thread's messages.
     */
    async getThread(userId, threadId) {
        const auth = await this.getAuthorizedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth });
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
            format: 'full',
        });
        return thread.data;
    }
    /**
     * Gets the user's daily send quota usage.
     */
    async getQuota(userId, dailySendCap) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const sent = await OutreachRecord.countDocuments({
            orgId: (await OAuthToken.findOne({ userId }))?.userId,
            sentAt: { $gte: startOfDay },
        });
        return {
            sent,
            limit: dailySendCap,
            remaining: Math.max(0, dailySendCap - sent),
        };
    }
    /**
     * Checks if a user has connected Gmail.
     */
    async isConnected(userId) {
        const token = await OAuthToken.findOne({ userId });
        return !!token;
    }
}
//# sourceMappingURL=gmail.service.js.map