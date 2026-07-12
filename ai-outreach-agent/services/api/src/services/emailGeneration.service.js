import { EMAIL_GENERATION_PROMPT, buildEmailGenerationMessage, } from '../llm/prompts/emailGeneration.js';
import { PERSONALIZATION_PROMPT, buildPersonalizationMessage, } from '../llm/prompts/personalization.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { SUBJECT_LINE_PROMPT, buildSubjectLineMessage } from '../llm/prompts/subjectLine.js';
import { Campaign } from '../models/Campaign.js';
import { EmailDraft } from '../models/EmailDraft.js';
import { Contact } from '../models/Contact.js';
import { PROMPT_VERSIONS, RATE_LIMITS } from '@ai-outreach/shared';
export class EmailGenerationService {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Generates a single email draft for one recipient.
     */
    async generateSingle(params) {
        const { intent, contactId, orgId, userId, retrievedChunks, userSignature } = params;
        // Create campaign
        const campaign = await Campaign.create({
            orgId,
            createdBy: userId,
            name: `${intent.topic} - Single Email`,
            sourceIntent: intent,
            status: 'in_review',
            recipientCount: 1,
        });
        // Generate email
        const generated = await this.generateBaseEmail(intent, retrievedChunks, userSignature);
        // Get contact info for personalization
        if (!contactId || contactId.trim() === '') {
            throw new Error('Invalid or missing contactId. Please ensure the recipient exists in your CRM contacts before generating an email.');
        }
        const contact = await Contact.findById(contactId);
        let body = generated.body;
        let subject = generated.subject;
        if (contact) {
            body = body
                .replace('{{recipient_greeting}}', `Dear ${contact.hrName || contact.company}`)
                .replace('{{company_hook}}', `We are reaching out to ${contact.company}.`);
        }
        // Generate subject line if not good enough
        if (!subject || subject.length < 5) {
            subject = await this.generateSubjectLine(intent.tone, body.slice(0, 200));
        }
        // Create draft
        const draft = await EmailDraft.create({
            campaignId: campaign._id,
            contactId,
            orgId,
            type: 'outreach',
            subject,
            body,
            signature: generated.signature || userSignature,
            status: 'pending_review',
            generationMeta: {
                model: this.llm.name,
                promptVersion: PROMPT_VERSIONS.EMAIL_GENERATION,
                retrievedChunkIds: [],
                regenerateCount: 0,
            },
        });
        return draft._id.toString();
    }
    /**
     * Generates bulk email drafts for multiple recipients.
     * Uses the hybrid template + batched personalization approach.
     */
    async generateBulk(params) {
        const { intent, recipientIds, orgId, userId, retrievedChunks, userSignature } = params;
        // Create campaign
        const campaign = await Campaign.create({
            orgId,
            createdBy: userId,
            name: `${intent.topic} - Bulk (${recipientIds.length} recipients)`,
            sourceIntent: intent,
            status: 'in_review',
            recipientCount: recipientIds.length,
        });
        // Step 1: Generate base template (one LLM call)
        const baseEmail = await this.generateBaseEmail(intent, retrievedChunks, userSignature);
        // Step 2: Get all contacts
        const contacts = await Contact.find({ _id: { $in: recipientIds }, orgId });
        // Step 3: Batch personalization (chunk into groups of 25)
        const batches = [];
        for (let i = 0; i < contacts.length; i += RATE_LIMITS.MAX_PERSONALIZATION_BATCH) {
            batches.push(contacts.slice(i, i + RATE_LIMITS.MAX_PERSONALIZATION_BATCH));
        }
        for (const batch of batches) {
            const recipientsJson = JSON.stringify(batch.map((c) => ({
                recipientId: c._id.toString(),
                company: c.company,
                hrName: c.hrName,
                designation: c.designation,
            })));
            let personalizations;
            try {
                personalizations = await this.personalizeForBatch(baseEmail.body, recipientsJson);
            }
            catch {
                // Fallback: simple substitution
                personalizations = batch.map((c) => ({
                    recipientId: c._id.toString(),
                    recipient_greeting: `Dear ${c.hrName || c.company}`,
                    company_hook: `We are delighted to connect with ${c.company}.`,
                }));
            }
            // Create drafts for each recipient in this batch
            for (const contact of batch) {
                const slot = personalizations.find((p) => p.recipientId === contact._id.toString()) || {
                    recipientId: contact._id.toString(),
                    recipient_greeting: `Dear ${contact.hrName || contact.company}`,
                    company_hook: `We are pleased to reach out to ${contact.company}.`,
                };
                const personalizedBody = baseEmail.body
                    .replace('{{recipient_greeting}}', slot.recipient_greeting)
                    .replace('{{company_hook}}', slot.company_hook);
                let subject = baseEmail.subject;
                if (subject.includes('{{')) {
                    subject = subject.replace(/\{\{.*?\}\}/g, contact.company);
                }
                await EmailDraft.create({
                    campaignId: campaign._id,
                    contactId: contact._id,
                    orgId,
                    type: 'outreach',
                    subject,
                    body: personalizedBody,
                    signature: baseEmail.signature || userSignature,
                    status: 'pending_review',
                    generationMeta: {
                        model: this.llm.name,
                        promptVersion: PROMPT_VERSIONS.PERSONALIZATION,
                        retrievedChunkIds: [],
                        regenerateCount: 0,
                    },
                });
            }
        }
        return campaign._id.toString();
    }
    /**
     * Regenerates a draft with optional user instruction.
     */
    async regenerate(draftId, instruction) {
        const draft = await EmailDraft.findById(draftId);
        if (!draft)
            throw new Error('Draft not found');
        // Save previous version to edit history
        draft.editHistory.push({
            editedAt: new Date(),
            prevBody: draft.body,
        });
        const regeneratePrompt = instruction
            ? `Rewrite the following email. User instruction: "${instruction}"\n\nCurrent email:\n${draft.body}`
            : `Rewrite the following email to improve clarity and engagement:\n\n${draft.body}`;
        const response = await this.llm.generate({
            systemPrompt: 'You are a professional email writing assistant. Return ONLY the rewritten email body, no commentary.',
            messages: [{ role: 'user', content: regeneratePrompt }],
            temperature: 0.7,
        });
        draft.body = response.content.trim();
        draft.generationMeta.regenerateCount += 1;
        draft.generationMeta.model = response.model;
        await draft.save();
    }
    async generateBaseEmail(intent, retrievedChunks, userSignature) {
        const scriptPath = path.join(__dirname, '..', 'python-agents', 'generate_email.py');
        const pythonExecutable = path.join(__dirname, '..', 'python-agents', 'venv', 'Scripts', 'python.exe');
        
        try {
            const { stdout, stderr } = await execFileAsync(pythonExecutable, [scriptPath, JSON.stringify(intent), userSignature]);
            
            if (stderr && stderr.includes('error')) {
                console.error("Python script error:", stderr);
                throw new Error("Failed to generate email using Python LangChain agent");
            }
            
            return JSON.parse(stdout.trim());
        } catch (error) {
            console.error("Failed to execute python agent:", error);
            return {
                subject: `${intent.topic}`,
                body: `Error generating email via Python LangChain Agent. Topic: ${intent.topic}`,
                signature: userSignature,
            };
        }
    }
    async personalizeForBatch(baseTemplate, recipientsJson) {
        const userMessage = buildPersonalizationMessage(baseTemplate, recipientsJson);
        const response = await this.llm.generate({
            systemPrompt: PERSONALIZATION_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
            responseSchema: { type: 'array' },
            temperature: 0.7,
        });
        const cleaned = response.content
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
        return JSON.parse(cleaned);
    }
    async generateSubjectLine(tone, bodySummary) {
        const userMessage = buildSubjectLineMessage(tone, bodySummary);
        const response = await this.llm.generate({
            systemPrompt: SUBJECT_LINE_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
            temperature: 0.8,
        });
        return response.content.trim().replace(/^["']|["']$/g, '');
    }
}
//# sourceMappingURL=emailGeneration.service.js.map