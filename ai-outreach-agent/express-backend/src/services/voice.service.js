import { Contact } from '../models/Contact.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class VoiceService {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Parses a voice transcript into a structured intent using LLM function-calling.
     * Then resolves recipient names against the CRM to find matching contacts.
     */
    async parseIntent(transcript, orgId) {
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'parse_intent.py');
        const pythonExecutable = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        
        try {
            const { stdout, stderr } = await execFileAsync(pythonExecutable, [scriptPath, transcript]);
            
            if (stderr && stderr.includes('error')) {
                console.error("Python script error:", stderr);
                throw new Error("Failed to parse intent using Python LangChain agent");
            }
            
            const intent = JSON.parse(stdout.trim());
            const resolvedContacts = await this.resolveRecipients(intent.recipients, orgId);
            return { intent, resolvedContacts };
        } catch (error) {
            console.error("Failed to execute python agent:", error);
            throw new Error('Failed to parse intent from LLM response');
        }
    }
    /**
     * Fuzzy-matches recipient names (company names) against the CRM contacts.
     */
    async resolveRecipients(recipientNames, orgId) {
        const resolved = [];
        // Special case for "all contacts"
        if (recipientNames.length === 0 ||
            recipientNames.some(n => /^(all|everyone|all contacts|all of them)$/i.test(n))) {
            const allContacts = await Contact.find({ orgId });
            return allContacts.map(c => ({
                contactId: c._id.toString(),
                company: c.company,
                email: c.email,
                hrName: c.hrName,
            }));
        }
        for (const name of recipientNames) {
            // Try exact match first, then case-insensitive regex on both company and hrName
            let contact = await Contact.findOne({
                orgId,
                $or: [
                    { company: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } },
                    { hrName: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } }
                ]
            });
            // If not found, try partial match on both
            if (!contact) {
                contact = await Contact.findOne({
                    orgId,
                    $or: [
                        { company: { $regex: new RegExp(escapeRegex(name), 'i') } },
                        { hrName: { $regex: new RegExp(escapeRegex(name), 'i') } }
                    ]
                });
            }
            if (contact) {
                resolved.push({
                    contactId: contact._id.toString(),
                    company: contact.company,
                    email: contact.email,
                    hrName: contact.hrName,
                });
            }
            else {
                // Add as unresolved — the frontend will prompt the user to add
                resolved.push({
                    contactId: '',
                    company: name,
                    email: '',
                    hrName: '',
                });
            }
        }
        return resolved;
    }
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=voice.service.js.map