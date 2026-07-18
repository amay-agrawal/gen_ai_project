import { ThreadMessage } from '../models/ThreadMessage.js';
import { OutreachRecord } from '../models/OutreachRecord.js';
import { AppError } from '../utils/apiResponse.js';
import { GmailService } from './gmail.service.js';
import path from 'path';
import { execFile } from 'child_process';

export class ReplyService {
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
        const filtered = messages.filter((m) => m.outreachRecordId);
        return { messages: filtered, total, pages: Math.ceil(total / limit) };
    }

    async getMessageDetail(messageId) {
        const message = await ThreadMessage.findById(messageId)
            .populate('outreachRecordId')
            .lean();
        if (!message) {
            throw new AppError('NOT_FOUND', 'Message not found', 404);
        }
        return message;
    }

    async summarizeReply(emailBody) {
        const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'reply_agent.py');
        
        return new Promise((resolve, reject) => {
            execFile(pythonPath, [scriptPath, 'summarize', emailBody], (error, stdout, stderr) => {
                if (error) {
                    console.error('[Reply Agent] Summarization error:', error, stderr);
                    resolve({
                        summary: emailBody.slice(0, 200),
                        actionItems: [],
                        deadlines: [],
                        sentiment: 'neutral'
                    });
                    return;
                }
                try {
                    const result = JSON.parse(stdout);
                    resolve({
                        summary: result.summary,
                        actionItems: result.actionItems,
                        deadlines: result.deadlines,
                        sentiment: result.sentiment
                    });
                } catch (err) {
                    console.error('[Reply Agent] Failed to parse stdout:', err, stdout);
                    resolve({
                        summary: emailBody.slice(0, 200),
                        actionItems: [],
                        deadlines: [],
                        sentiment: 'neutral'
                    });
                }
            });
        });
    }

    async generateReplyVariants(threadHistory, summaryJson) {
        const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'reply_agent.py');
        
        const args = {
            thread_history: threadHistory,
            summary_json: summaryJson
        };
        
        return new Promise((resolve, reject) => {
            execFile(pythonPath, [scriptPath, 'variants', JSON.stringify(args)], (error, stdout, stderr) => {
                if (error) {
                    console.error('[Reply Agent] Variants error:', error, stderr);
                    resolve({
                        professional: 'Thank you for your message.',
                        brief: 'Thank you.',
                        positive: 'Thank you, looking forward to it!',
                        clarification: 'Could you please clarify?'
                    });
                    return;
                }
                try {
                    const result = JSON.parse(stdout);
                    resolve({
                        professional: result.professional,
                        brief: result.brief,
                        positive: result.positive,
                        clarification: result.clarification
                    });
                } catch (err) {
                    console.error('[Reply Agent] Failed to parse stdout:', err, stdout);
                    resolve({
                        professional: 'Thank you for your message.',
                        brief: 'Thank you.',
                        positive: 'Thank you, looking forward to it!',
                        clarification: 'Could you please clarify?'
                    });
                }
            });
        });
    }

    async processInboundMessage(params) {
        const { outreachRecordId, gmailMessageId, from, snippet, fullBody } = params;
        const summary = await this.summarizeReply(fullBody);
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
        await OutreachRecord.findByIdAndUpdate(outreachRecordId, {
            replyReceived: true,
            replyReceivedAt: new Date(),
            status: 'replied',
        });
    }

    async syncInbox(userId, orgId) {
        const gmailService = new GmailService();
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
                if (messages.length > 1) {
                    const latestMessage = messages[messages.length - 1];
                    const payload = latestMessage.payload;
                    const headers = payload?.headers || [];
                    const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
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