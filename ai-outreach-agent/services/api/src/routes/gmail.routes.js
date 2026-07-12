import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { CreateGmailDraftSchema } from '@ai-outreach/shared';
import { GmailService } from '../services/gmail.service.js';
import { User } from '../models/User.js';
import { sendSuccess } from '../utils/apiResponse.js';
const router = Router();
const gmailService = new GmailService();
/**
 * GET /gmail/threads/:threadId — Fetch thread messages
 */
router.get('/threads/:threadId', authenticate, async (req, res, next) => {
    try {
        const thread = await gmailService.getThread(req.user.id, req.params.threadId);
        sendSuccess(res, { thread });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /gmail/draft — Create a Gmail draft (not sent)
 */
router.post('/draft', authenticate, validateBody(CreateGmailDraftSchema), async (req, res, next) => {
    try {
        const draftId = await gmailService.createDraft(req.user.id, req.body.to, req.body.subject, req.body.body, req.body.threadId);
        sendSuccess(res, { draftId }, 201);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /gmail/quota — Get daily send quota
 */
router.get('/quota', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const quota = await gmailService.getQuota(req.user.id, user?.dailySendCap || 500);
        sendSuccess(res, { quota });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=gmail.routes.js.map