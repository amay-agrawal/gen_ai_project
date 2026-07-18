import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { GenerateEmailRequestSchema, GenerateBulkRequestSchema, RegenerateRequestSchema, EditDraftRequestSchema, SendEmailsRequestSchema, } from '@ai-outreach/shared';
import { EmailDraft } from '../models/EmailDraft.js';
import { User } from '../models/User.js';
import { Contact } from '../models/Contact.js';
import { OAuthToken } from '../models/OAuthToken.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { decrypt } from '../utils/encryption.js';
import { config } from '../config/index.js';
import path from 'path';
import { execFile } from 'child_process';

const router = Router();

async function runEmailAgent(action, args, userId) {
    const oauthTokenDoc = await OAuthToken.findOne({ userId });
    const auth_info = oauthTokenDoc ? {
        access_token: decrypt(oauthTokenDoc.accessTokenEnc),
        refresh_token: decrypt(oauthTokenDoc.refreshTokenEnc),
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        scopes: oauthTokenDoc.scope
    } : null;
    
    const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), '..', 'python-core', 'email_agent.py');
    
    return new Promise((resolve, reject) => {
        execFile(pythonPath, [
            scriptPath, 
            action, 
            JSON.stringify(args), 
            auth_info ? JSON.stringify(auth_info) : '{}'
        ], (error, stdout, stderr) => {
            if (error) {
                console.error('[Email Agent] Error running python agent:', error, stderr);
                reject(new Error(stderr || error.message));
                return;
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (err) {
                console.error('[Email Agent] Failed to parse stdout:', err, stdout);
                reject(err);
            }
        });
    });
}

/**
 * POST /email/generate — Generate a single email draft
 */
router.post('/generate', authenticate, validateBody(GenerateEmailRequestSchema), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const contact = await Contact.findById(req.body.contactId);
        if (!contact) {
            sendError(res, 'NOT_FOUND', 'Contact not found', 404);
            return;
        }
        
        const result = await runEmailAgent('generate', {
            recipient_email: contact.email,
            recipient_name: contact.hrName,
            topic: req.body.intent.topic,
            tone: req.body.intent.tone || 'professional',
            signature: user?.signature || '',
        }, req.user.id);
        
        if (!result.success) {
            sendError(res, 'GENERATION_FAILED', 'Failed to generate email', 500);
            return;
        }
        
        const draft = await EmailDraft.create({
            orgId: req.user.orgId,
            userId: req.user.id,
            contactId: contact._id,
            subject: result.subject,
            body: result.body,
            status: 'pending_review',
            signature: user?.signature || '',
            gmailDraftId: result.gmailDraftId
        });
        
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
        const user = await User.findById(req.user.id);
        const recipientIds = req.body.recipientIds;
        
        for (const recipientId of recipientIds) {
            try {
                const contact = await Contact.findById(recipientId);
                if (!contact) continue;
                
                const result = await runEmailAgent('generate', {
                    recipient_email: contact.email,
                    recipient_name: contact.hrName,
                    topic: req.body.intent.topic,
                    tone: req.body.intent.tone || 'professional',
                    signature: user?.signature || '',
                }, req.user.id);
                
                if (result.success) {
                    await EmailDraft.create({
                        orgId: req.user.orgId,
                        userId: req.user.id,
                        contactId: contact._id,
                        subject: result.subject,
                        body: result.body,
                        status: 'pending_review',
                        signature: user?.signature || '',
                        gmailDraftId: result.gmailDraftId
                    });
                }
            } catch (err) {
                console.error(`Failed to generate bulk email for recipient ${recipientId}:`, err);
            }
        }
        sendSuccess(res, { message: 'Bulk drafts generation completed' }, 201);
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
        const draft = await EmailDraft.findById(req.params.draftId);
        if (!draft) {
            sendError(res, 'NOT_FOUND', 'Draft not found', 404);
            return;
        }
        
        const result = await runEmailAgent('regenerate', {
            subject: draft.subject,
            body: draft.body,
            instruction: req.body.instruction
        }, req.user.id);
        
        if (result.success) {
            draft.editHistory.push({
                editedAt: new Date(),
                prevBody: draft.body,
            });
            draft.subject = result.subject;
            draft.body = result.body;
            await draft.save();
        }
        
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
                const draft = await EmailDraft.findById(draftId).populate('contactId');
                if (!draft) {
                    results.push({ draftId, success: false, error: 'Draft not found' });
                    continue;
                }
                
                const result = await runEmailAgent('send', {
                    recipient_email: draft.contactId.email,
                    subject: draft.subject,
                    body: draft.body + (draft.signature ? `\n\n${draft.signature}` : ''),
                }, req.user.id);
                
                if (result.success) {
                    draft.status = 'sent';
                    await draft.save();
                    results.push({ draftId, success: true });
                } else {
                    results.push({ draftId, success: false, error: result.error });
                }
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