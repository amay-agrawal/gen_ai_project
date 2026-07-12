import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { GenerateFollowUpsSchema } from '@ai-outreach/shared';
import { FollowUpService } from '../services/followup.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getLLMClient } from '../index.js';
const router = Router();
/**
 * GET /followups/pending — Get candidates for follow-up
 */
router.get('/pending', authenticate, async (req, res, next) => {
    try {
        const followUpService = new FollowUpService(getLLMClient());
        const candidates = await followUpService.getPendingCandidates(req.user.orgId);
        sendSuccess(res, { candidates });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /followups/generate — Generate follow-up drafts
 */
router.post('/generate', authenticate, validateBody(GenerateFollowUpsSchema), async (req, res, next) => {
    try {
        const followUpService = new FollowUpService(getLLMClient());
        const draftIds = await followUpService.generateFollowUps({
            outreachRecordIds: req.body.outreachRecordIds,
            orgId: req.user.orgId,
            userId: req.user.id,
            instruction: req.body.instruction,
        });
        sendSuccess(res, { draftIds }, 201);
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=followup.routes.js.map