import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { GenerateFollowUpsSchema } from '@ai-outreach/shared';
import { OutreachRecord } from '../models/OutreachRecord.js';
import { EmailDraft } from '../models/EmailDraft.js';
import { FollowUp } from '../models/FollowUp.js';
import { Campaign } from '../models/Campaign.js';
import { OAuthToken } from '../models/OAuthToken.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { decrypt } from '../utils/encryption.js';
import { config } from '../config/index.js';
import path from 'path';
import { execFile } from 'child_process';

const router = Router();

/**
 * GET /followups/pending — Get candidates for follow-up
 */
router.get('/pending', authenticate, async (req, res, next) => {
    try {
        const daysThreshold = 3; // default threshold
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
        const candidates = await OutreachRecord.find({
            orgId: req.user.orgId,
            replyReceived: false,
            status: 'sent',
            sentAt: { $lte: cutoffDate },
            followUpCount: { $lt: 3 }, // max followups
        })
            .populate('contactId')
            .populate('draftId')
            .sort({ sentAt: 1 })
            .limit(100)
            .lean();
            
        const formattedCandidates = candidates.map((c) => ({
            ...c,
            daysSinceSent: Math.floor((Date.now() - new Date(c.sentAt).getTime()) / (1000 * 60 * 60 * 24)),
        }));
        sendSuccess(res, { candidates: formattedCandidates });
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
        const { outreachRecordIds, instruction } = req.body;
        
        // Find OAuth Token
        const oauthTokenDoc = await OAuthToken.findOne({ userId: req.user.id });
        const auth_info = oauthTokenDoc ? {
            access_token: decrypt(oauthTokenDoc.accessTokenEnc),
            refresh_token: decrypt(oauthTokenDoc.refreshTokenEnc),
            client_id: config.google.clientId,
            client_secret: config.google.clientSecret,
            scopes: oauthTokenDoc.scope
        } : null;
        
        if (!auth_info) {
            sendError(res, 'AUTH_REQUIRED', 'Google Authentication required for followups', 401);
            return;
        }
        
        // Create a campaign for follow-ups
        const campaign = await Campaign.create({
            orgId: req.user.orgId,
            createdBy: req.user.id,
            name: `Follow-Up Batch - ${new Date().toLocaleDateString()}`,
            sourceIntent: { intent: 'follow_up', topic: 'follow-up batch' },
            status: 'in_review',
            recipientCount: outreachRecordIds.length,
        });
        
        const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'followup_agent.py');
        
        const draftIds = [];
        
        for (const recordId of outreachRecordIds) {
            try {
                const record = await OutreachRecord.findById(recordId).populate('contactId').populate('draftId');
                if (!record || !record.gmailThreadId) continue;
                
                // Add contact's email so the python script can write correct 'to' header
                const extended_auth_info = {
                    ...auth_info,
                    recipient_email: record.contactId.email
                };
                
                // Exec python followup evaluator
                const result = await new Promise((resolve, reject) => {
                    execFile(pythonPath, [
                        scriptPath,
                        record.gmailThreadId,
                        record.contactId.hrName,
                        JSON.stringify(extended_auth_info),
                        instruction || ""
                    ], (error, stdout, stderr) => {
                        if (error) {
                            reject(new Error(stderr || error.message));
                            return;
                        }
                        try {
                            resolve(JSON.parse(stdout));
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
                
                if (result.success && result.shouldFollowUp) {
                    const sequenceNumber = record.followUpCount + 1;
                    
                    // Create follow-up draft in MongoDB
                    const draft = await EmailDraft.create({
                        campaignId: campaign._id,
                        contactId: record.contactId._id,
                        orgId: req.user.orgId,
                        type: 'follow_up',
                        subject: result.subject,
                        body: result.body,
                        signature: record.draftId?.signature || "",
                        status: 'pending_review',
                        gmailDraftId: result.gmailDraftId
                    });
                    
                    // Create follow-up record
                    await FollowUp.create({
                        outreachRecordId: record._id,
                        draftId: draft._id,
                        sequenceNumber,
                        triggeredAt: new Date(),
                        status: 'pending_review',
                    });
                    
                    // Update outreach record
                    record.followUpCount = sequenceNumber;
                    record.lastFollowUpAt = new Date();
                    await record.save();
                    
                    draftIds.push(draft._id.toString());
                } else if (result.success && !result.shouldFollowUp) {
                    // Recipient has replied! Mark outreach record accordingly
                    record.replyReceived = true;
                    record.replyReceivedAt = new Date();
                    record.status = 'replied';
                    await record.save();
                }
            } catch (err) {
                console.error(`Failed to process followup for record ${recordId}:`, err);
            }
        }
        
        sendSuccess(res, { draftIds }, 201);
    }
    catch (error) {
        next(error);
    }
});

export default router;