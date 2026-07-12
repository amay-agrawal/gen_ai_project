import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { GenerateEmailRequestSchema, GenerateBulkRequestSchema, RegenerateRequestSchema, EditDraftRequestSchema, SendEmailsRequestSchema, } from '@ai-outreach/shared';
import { EmailGenerationService } from '../services/emailGeneration.service.js';
import { RagService } from '../services/rag.service.js';
import { GmailService } from '../services/gmail.service.js';
import { EmailDraft } from '../models/EmailDraft.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getLLMClient } from '../index.js';
const router = Router();
const gmailService = new GmailService();
/**
 * POST /email/generate — Generate a single email draft
 */
router.post('/generate', authenticate, validateBody(GenerateEmailRequestSchema), async (req, res, next) => {
    try {
        const llm = getLLMClient();
        const emailService = new EmailGenerationService(llm);
        const ragService = new RagService(llm);
        const user = await User.findById(req.user.id);
        // Retrieve relevant documents
        let retrievedChunks = '';
        if (req.body.intent.requiredFacts?.length > 0) {
            const chunks = await ragService.retrieve({
                query: req.body.intent.requiredFacts.join(' '),
                orgId: req.user.orgId,
            });
            retrievedChunks = chunks.map((c) => c.text).join('\n\n---\n\n');
        }
        const draftId = await emailService.generateSingle({
            intent: req.body.intent,
            contactId: req.body.contactId || '',
            orgId: req.user.orgId,
            userId: req.user.id,
            retrievedChunks,
            userSignature: user?.signature || '',
        });
        const draft = await EmailDraft.findById(draftId);
        sendSuccess(res, { draft }, 201);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /email/generate-bulk — Generate bulk email drafts
 */
router.post('/generate-bulk', authenticate, validateBody(GenerateBulkRequestSchema), async (req, res, next) => {
    try {
        const llm = getLLMClient();
        const emailService = new EmailGenerationService(llm);
        const ragService = new RagService(llm);
        const user = await User.findById(req.user.id);
        let retrievedChunks = '';
        if (req.body.intent.requiredFacts?.length > 0) {
            const chunks = await ragService.retrieve({
                query: req.body.intent.requiredFacts.join(' '),
                orgId: req.user.orgId,
            });
            retrievedChunks = chunks.map((c) => c.text).join('\n\n---\n\n');
        }
        const campaignId = await emailService.generateBulk({
            intent: req.body.intent,
            recipientIds: req.body.recipientIds,
            orgId: req.user.orgId,
            userId: req.user.id,
            retrievedChunks,
            userSignature: user?.signature || '',
        });
        sendSuccess(res, { campaignId }, 201);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /email/:draftId/regenerate — Regenerate a draft
 */
router.post('/:draftId/regenerate', authenticate, validateBody(RegenerateRequestSchema), async (req, res, next) => {
    try {
        const emailService = new EmailGenerationService(getLLMClient());
        await emailService.regenerate(req.params.draftId, req.body.instruction);
        const draft = await EmailDraft.findById(req.params.draftId);
        sendSuccess(res, { draft });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /email/:draftId — Manual edit save
 */
router.patch('/:draftId', authenticate, validateBody(EditDraftRequestSchema), async (req, res, next) => {
    try {
        const draft = await EmailDraft.findOne({
            _id: req.params.draftId,
            orgId: req.user.orgId,
        });
        if (!draft) {
            sendError(res, 'NOT_FOUND', 'Draft not found', 404);
            return;
        }
        // Save to edit history
        if (req.body.body && req.body.body !== draft.body) {
            draft.editHistory.push({
                editedAt: new Date(),
                prevBody: draft.body,
            });
        }
        if (req.body.subject)
            draft.subject = req.body.subject;
        if (req.body.body)
            draft.body = req.body.body;
        if (req.body.signature !== undefined)
            draft.signature = req.body.signature;
        await draft.save();
        sendSuccess(res, { draft });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /email/:draftId/approve — Mark draft as approved
 */
router.post('/:draftId/approve', authenticate, async (req, res, next) => {
    try {
        const draft = await EmailDraft.findOneAndUpdate({ _id: req.params.draftId, orgId: req.user.orgId, status: 'pending_review' }, { status: 'approved' }, { new: true });
        if (!draft) {
            sendError(res, 'NOT_FOUND', 'Draft not found or not in reviewable state', 404);
            return;
        }
        sendSuccess(res, { draft });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /email/send — Send approved drafts via Gmail
 */
router.post('/send', authenticate, validateBody(SendEmailsRequestSchema), async (req, res, next) => {
    try {
        const results = [];
        for (const draftId of req.body.draftIds) {
            try {
                // Approve if still pending
                await EmailDraft.findOneAndUpdate({ _id: draftId, status: 'pending_review' }, { status: 'approved' });
                const { messageId, threadId } = await gmailService.sendEmail(req.user.id, draftId);
                results.push({ draftId, success: true });
            }
            catch (err) {
                results.push({ draftId, success: false, error: err.message });
            }
        }
        sendSuccess(res, { results });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /email/campaign/:campaignId — List all drafts in a campaign
 */
router.get('/campaign/:campaignId', authenticate, async (req, res, next) => {
    try {
        const drafts = await EmailDraft.find({
            campaignId: req.params.campaignId,
            orgId: req.user.orgId,
        })
            .populate('contactId')
            .sort({ createdAt: -1 })
            .lean();
        sendSuccess(res, { drafts });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /email/drafts — List all recent drafts
 */
router.get('/drafts', authenticate, async (req, res, next) => {
    try {
        const drafts = await EmailDraft.find({ orgId: req.user.orgId })
            .populate('contactId')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        sendSuccess(res, { drafts });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=email.routes.js.map