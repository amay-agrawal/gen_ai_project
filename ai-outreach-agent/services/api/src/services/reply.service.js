import { REPLY_SUMMARIZATION_PROMPT, buildReplySummarizationMessage, } from '../llm/prompts/replySummarization.js';
import { REPLY_VARIANTS_PROMPT, buildReplyVariantsMessage, } from '../llm/prompts/replyVariants.js';
import { ThreadMessage } from '../models/ThreadMessage.js';
import { OutreachRecord } from '../models/OutreachRecord.js';
import { AppError } from '../utils/apiResponse.js';
import { GmailService } from './gmail.service.js';
export class ReplyService {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Lists inbound messages with AI summaries for the reply inbox.
     */
    async getInbox(orgId, page = 1, limit = 20) {
        const [messages, total] = await Promise.all([
            ThreadMessage.find({ direction: 'inbound' })
                .populate({
                path: 'outreachRecordId',
                match: { orgId },
            })
                .sort({ receivedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ThreadMessage.countDocuments({ direction: 'inbound' }),
        ]);
        // Filter out messages without matching orgId records
        const filtered = messages.filter((m) => m.outreachRecordId);
        return { messages: filtered, total, pages: Math.ceil(total / limit) };
    }
    /**
     * Gets full detail for a thread message including action items and deadlines.
     */
    async getMessageDetail(messageId) {
        const message = await ThreadMessage.findById(messageId)
            .populate('outreachRecordId')
            .lean();
        if (!message) {
            throw new AppError('NOT_FOUND', 'Message not found', 404);
        }
        return message;
    }
    /**
     * Summarizes an inbound email and extracts action items/deadlines.
     */
    async summarizeReply(emailBody) {
        const userMessage = buildReplySummarizationMessage(emailBody);
        const response = await this.llm.generate({
            systemPrompt: REPLY_SUMMARIZATION_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
            responseSchema: { type: 'object' },
            temperature: 0.3,
        });
        try {
            const cleaned = response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        }
        catch {
            return {
                summary: response.content.slice(0, 200),
                actionItems: [],
                deadlines: [],
                sentiment: 'neutral',
            };
        }
    }
    /**
     * Generates 4 reply variants for a specific reply variant type.
     */
    async generateReplyVariants(threadHistory, summaryJson) {
        const userMessage = buildReplyVariantsMessage(threadHistory, summaryJson);
        const response = await this.llm.generate({
            systemPrompt: REPLY_VARIANTS_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
            responseSchema: { type: 'object' },
            temperature: 0.7,
        });
        try {
            const cleaned = response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        }
        catch {
            return {
                professional: response.content,
                brief: 'Thank you for your message. I will get back to you shortly.',
                positive: 'Thank you! This is wonderful news. I look forward to discussing further.',
                clarification: 'Thank you for reaching out. Could you please provide more details?',
            };
        }
    }
    /**
     * Processes an inbound message: summarize and store.
     */
    async processInboundMessage(params) {
        const { outreachRecordId, gmailMessageId, from, snippet, fullBody } = params;
        // Summarize
        const summary = await this.summarizeReply(fullBody);
        // Store thread message
        await ThreadMessage.create({
            outreachRecordId,
            gmailMessageId,
            direction: 'inbound',
            from,
            snippet,
            fullBodyRef: fullBody,
            aiSummary: summary.summary,
            actionItems: summary.actionItems,
            deadlines: summary.deadlines.map((d) => ({
                label: d.label,
                date: d.date ? new Date(d.date) : null,
            })),
            receivedAt: new Date(),
        });
        // Update outreach record
        await OutreachRecord.findByIdAndUpdate(outreachRecordId, {
            replyReceived: true,
            replyReceivedAt: new Date(),
            status: 'replied',
        });
    }
    /**
     * Syncs the inbox by polling Gmail for replies to tracked threads.
     */
    async syncInbox(userId, orgId) {
        const gmailService = new GmailService();
        // Find records that are sent but haven't received a reply
        const pendingRecords = await OutreachRecord.find({
            orgId,
            status: 'sent',
            replyReceived: false,
        });
        let syncedCount = 0;
        for (const record of pendingRecords) {
            if (!record.gmailThreadId)
                continue;
            try {
                const thread = await gmailService.getThread(userId, record.gmailThreadId);
                const messages = thread.messages || [];
                // If thread has more than 1 message, someone replied
                if (messages.length > 1) {
                    // Get the latest message
                    const latestMessage = messages[messages.length - 1];
                    const payload = latestMessage.payload;
                    // Check if it's from someone else
                    const headers = payload?.headers || [];
                    const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
                    const toHeader = headers.find((h) => h.name.toLowerCase() === 'to')?.value || '';
                    // Decode body
                    let bodyData = '';
                    if (payload?.parts) {
                        const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
                        if (textPart?.body?.data) {
                            bodyData = textPart.body.data;
                        }
                    }
                    else if (payload?.body?.data) {
                        bodyData = payload.body.data;
                    }
                    const fullBody = Buffer.from(bodyData, 'base64url').toString('utf8');
                    await this.processInboundMessage({
                        outreachRecordId: record._id.toString(),
                        gmailMessageId: latestMessage.id || '',
                        from: fromHeader,
                        snippet: latestMessage.snippet || '',
                        fullBody,
                    });
                    syncedCount++;
                }
            }
            catch (err) {
                console.error(`Failed to sync thread ${record.gmailThreadId}:`, err);
            }
        }
        return { synced: syncedCount };
    }
}
//# sourceMappingURL=reply.service.js.map