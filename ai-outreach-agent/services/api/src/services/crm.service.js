import { Contact } from '../models/Contact.js';
import { OutreachRecord } from '../models/OutreachRecord.js';
import { EmailDraft } from '../models/EmailDraft.js';
import { AppError } from '../utils/apiResponse.js';
export class CrmService {
    /**
     * Lists contacts with search, filter, and pagination.
     */
    async listContacts(params) {
        const { orgId, search, company, status, page, limit } = params;
        const filter = { orgId };
        if (company) {
            filter.company = { $regex: new RegExp(company, 'i') };
        }
        if (status) {
            filter.status = status;
        }
        if (search) {
            filter.$text = { $search: search };
        }
        const [contacts, total] = await Promise.all([
            Contact.find(filter)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Contact.countDocuments(filter),
        ]);
        return {
            contacts: contacts,
            total,
            pages: Math.ceil(total / limit),
        };
    }
    /**
     * Creates a new contact.
     */
    async createContact(orgId, data) {
        const existing = await Contact.findOne({ orgId, email: data.email });
        if (existing) {
            throw new AppError('DUPLICATE_ENTRY', 'A contact with this email already exists', 409);
        }
        const contact = await Contact.create({ ...data, orgId });
        return contact.toObject();
    }
    /**
     * Updates an existing contact.
     */
    async updateContact(contactId, orgId, data) {
        const contact = await Contact.findOneAndUpdate({ _id: contactId, orgId }, { $set: data }, { new: true });
        if (!contact) {
            throw new AppError('NOT_FOUND', 'Contact not found', 404);
        }
        return contact.toObject();
    }
    /**
     * Deletes a contact.
     */
    async deleteContact(contactId, orgId) {
        const result = await Contact.findOneAndDelete({ _id: contactId, orgId });
        if (!result) {
            throw new AppError('NOT_FOUND', 'Contact not found', 404);
        }
    }
    /**
     * Gets communication history for a contact.
     */
    async getContactHistory(contactId, orgId) {
        const contact = await Contact.findOne({ _id: contactId, orgId });
        if (!contact) {
            throw new AppError('NOT_FOUND', 'Contact not found', 404);
        }
        const outreachRecords = await OutreachRecord.find({ contactId, orgId })
            .sort({ sentAt: -1 })
            .limit(50)
            .lean();
        const draftIds = outreachRecords.map((r) => r.draftId);
        const drafts = await EmailDraft.find({ _id: { $in: draftIds } })
            .select('subject body type status createdAt')
            .lean();
        const draftMap = new Map(drafts.map((d) => [d._id.toString(), d]));
        return outreachRecords.map((record) => ({
            ...record,
            draft: draftMap.get(record.draftId.toString()) || null,
        }));
    }
    /**
     * Bulk imports contacts from parsed CSV/XLSX data.
     */
    async bulkImport(orgId, contacts) {
        let imported = 0;
        let skipped = 0;
        const errors = [];
        for (const contact of contacts) {
            try {
                if (!contact.email || !contact.company || !contact.hrName) {
                    errors.push(`Missing required fields for: ${contact.email || 'unknown'}`);
                    skipped++;
                    continue;
                }
                await Contact.findOneAndUpdate({ orgId, email: contact.email.toLowerCase() }, {
                    $setOnInsert: {
                        orgId,
                        company: contact.company,
                        hrName: contact.hrName,
                        email: contact.email.toLowerCase(),
                        designation: contact.designation || '',
                        phone: contact.phone || '',
                        status: 'new',
                        tags: [],
                        notes: '',
                    },
                }, { upsert: true });
                imported++;
            }
            catch (err) {
                if (err.code === 11000) {
                    skipped++;
                }
                else {
                    errors.push(`Error importing ${contact.email}: ${err.message}`);
                }
            }
        }
        return { imported, skipped, errors };
    }
}
//# sourceMappingURL=crm.service.js.map