import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { ReplyService } from '../services/reply.service.js';
import { ThreadMessage } from '../models/ThreadMessage.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getLLMClient } from '../index.js';
const router = Router();
/**
 * GET /replies/inbox — List inbound messages with AI summaries
 */
router.get('/inbox', authenticate, async (req, res, next) => {
    try {
        const replyService = new ReplyService(getLLMClient());
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await replyService.getInbox(req.user.orgId, page, limit);
        sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /replies/sync — Sync inbox with Gmail
 */
router.post('/sync', authenticate, async (req, res, next) => {
    try {
        const replyService = new ReplyService(getLLMClient());
        const result = await replyService.syncInbox(req.user.id, req.user.orgId);
        sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /replies/:threadMessageId — Full detail with action items
 */
router.get('/:threadMessageId', authenticate, async (req, res, next) => {
    try {
        const replyService = new ReplyService(getLLMClient());
        const message = await replyService.getMessageDetail(req.params.threadMessageId);
        sendSuccess(res, { message });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /replies/:threadMessageId/suggest — Generate reply suggestions
 */
router.post('/:threadMessageId/suggest', authenticate, async (req, res, next) => {
    try {
        const replyService = new ReplyService(getLLMClient());
        const message = await ThreadMessage.findById(req.params.threadMessageId);
        if (!message) {
            sendError(res, 'NOT_FOUND', 'Message not found', 404);
            return;
        }
        // Get thread history
        const threadMessages = await ThreadMessage.find({
            outreachRecordId: message.outreachRecordId,
        })
            .sort({ receivedAt: 1 })
            .lean();
        const threadHistory = threadMessages
            .map((m) => `[${m.direction}] ${m.from}: ${m.snippet}`)
            .join('\n\n');
        const variants = await replyService.generateReplyVariants(threadHistory, JSON.stringify({
            summary: message.aiSummary,
            actionItems: message.actionItems,
        }));
        sendSuccess(res, { variants });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=reply.routes.js.map