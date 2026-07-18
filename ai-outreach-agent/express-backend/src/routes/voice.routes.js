import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { ParseIntentRequestSchema } from '@ai-outreach/shared';
import { VoiceService } from '../services/voice.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
const router = Router();
/**
 * POST /voice/parse — Parse voice transcript into structured intent
 */
router.post('/parse', authenticate, validateBody(ParseIntentRequestSchema), async (req, res, next) => {
    try {
        const voiceService = new VoiceService();
        const { transcript } = req.body;
        const result = await voiceService.parseIntent(transcript, req.user.orgId);
        sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=voice.routes.js.map