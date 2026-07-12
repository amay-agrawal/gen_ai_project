import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { ExtensionGenerateSchema, ExtensionRewriteSchema, ExtensionSummarizeSchema } from '@ai-outreach/shared';
import { REWRITE_PROMPT, buildRewriteMessage } from '../llm/prompts/rewrite.js';
import { THREAD_SUMMARIZE_PROMPT, buildThreadSummarizeMessage } from '../llm/prompts/threadSummarize.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getLLMClient } from '../index.js';
const router = Router();
/**
 * POST /extension/compose/generate — Generate email from compose context
 */
router.post('/compose/generate', authenticate, validateBody(ExtensionGenerateSchema), async (req, res, next) => {
    try {
        const llm = getLLMClient();
        const { context, threadText, instruction } = req.body;
        let systemPrompt = 'You are a professional email writing assistant. Write a clear, professional email based on the user\'s instruction. Return ONLY the email body.';
        if (context === 'reply' && threadText) {
            systemPrompt += `\n\nThis is a reply to an existing thread. Here is the thread context:\n${threadText}`;
        }
        const response = await llm.generate({
            systemPrompt,
            messages: [{ role: 'user', content: instruction }],
            temperature: 0.7,
        });
        sendSuccess(res, { result: response.content.trim() });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /extension/compose/rewrite — Rewrite selected text
 */
router.post('/compose/rewrite', authenticate, validateBody(ExtensionRewriteSchema), async (req, res, next) => {
    try {
        const llm = getLLMClient();
        const { selectedText, mode } = req.body;
        const response = await llm.generate({
            systemPrompt: REWRITE_PROMPT,
            messages: [{ role: 'user', content: buildRewriteMessage(mode, selectedText) }],
            temperature: 0.7,
        });
        sendSuccess(res, { result: response.content.trim() });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /extension/thread/summarize — Summarize Gmail thread
 */
router.post('/thread/summarize', authenticate, validateBody(ExtensionSummarizeSchema), async (req, res, next) => {
    try {
        const llm = getLLMClient();
        const { threadText } = req.body;
        const response = await llm.generate({
            systemPrompt: THREAD_SUMMARIZE_PROMPT,
            messages: [{ role: 'user', content: buildThreadSummarizeMessage(threadText) }],
            temperature: 0.3,
        });
        sendSuccess(res, { result: response.content.trim() });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=extension.routes.js.map