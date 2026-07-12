import { FOLLOW_UP_PROMPT, buildFollowUpMessage } from '../llm/prompts/followUp.js';
import { OutreachRecord } from '../models/OutreachRecord.js';
import { EmailDraft } from '../models/EmailDraft.js';
import { FollowUp } from '../models/FollowUp.js';
import { Campaign } from '../models/Campaign.js';
import { PROMPT_VERSIONS, FOLLOWUP_DEFAULTS } from '@ai-outreach/shared';
export class FollowUpService {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Gets candidates for follow-up based on org settings.
     */
    async getPendingCandidates(orgId, daysThreshold = FOLLOWUP_DEFAULTS.DAY_SEQUENCE[0]) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
        const candidates = await OutreachRecord.find({
            orgId,
            replyReceived: false,
            status: 'sent',
            sentAt: { $lte: cutoffDate },
            followUpCount: { $lt: FOLLOWUP_DEFAULTS.MAX_FOLLOWUPS },
        })
            .populate('contactId')
            .populate('draftId')
            .sort({ sentAt: 1 })
            .limit(100)
            .lean();
        return candidates.map((c) => ({
            ...c,
            daysSinceSent: Math.floor((Date.now() - new Date(c.sentAt).getTime()) / (1000 * 60 * 60 * 24)),
        }));
    }
    /**
     * Generates follow-up drafts for specified outreach records.
     */
    async generateFollowUps(params) {
        const { outreachRecordIds, orgId, userId, instruction } = params;
        const draftIds = [];
        // Create a campaign for follow-ups
        const campaign = await Campaign.create({
            orgId,
            createdBy: userId,
            name: `Follow-Up Batch - ${new Date().toLocaleDateString()}`,
            sourceIntent: { intent: 'follow_up', topic: 'follow-up batch' },
            status: 'in_review',
            recipientCount: outreachRecordIds.length,
        });
        for (const recordId of outreachRecordIds) {
            const record = await OutreachRecord.findById(recordId).populate('draftId');
            if (!record)
                continue;
            const originalDraft = await EmailDraft.findById(record.draftId);
            if (!originalDraft)
                continue;
            const daysSinceSent = Math.floor((Date.now() - new Date(record.sentAt).getTime()) / (1000 * 60 * 60 * 24));
            const sequenceNumber = record.followUpCount + 1;
            // Generate follow-up using LLM
            const userMessage = buildFollowUpMessage(daysSinceSent, sequenceNumber, originalDraft.subject, originalDraft.body.slice(0, 500));
            const response = await this.llm.generate({
                systemPrompt: FOLLOW_UP_PROMPT,
                messages: [
                    { role: 'user', content: instruction ? `${userMessage}\n\nAdditional instruction: ${instruction}` : userMessage },
                ],
                responseSchema: { type: 'object' },
                temperature: 0.7,
            });
            let followUpContent;
            try {
                const cleaned = response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                followUpContent = JSON.parse(cleaned);
            }
            catch {
                followUpContent = {
                    subject: `Re: ${originalDraft.subject}`,
                    body: response.content,
                };
            }
            // Create follow-up draft
            const draft = await EmailDraft.create({
                campaignId: campaign._id,
                contactId: record.contactId,
                orgId,
                type: 'follow_up',
                subject: followUpContent.subject,
                body: followUpContent.body,
                signature: originalDraft.signature,
                status: 'pending_review',
                generationMeta: {
                    model: this.llm.name,
                    promptVersion: PROMPT_VERSIONS.FOLLOW_UP,
                    retrievedChunkIds: [],
                    regenerateCount: 0,
                },
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
        }
        return draftIds;
    }
}
//# sourceMappingURL=followup.service.js.map