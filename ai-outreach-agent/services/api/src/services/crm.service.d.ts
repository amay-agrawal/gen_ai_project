import type { IContact, ContactStatus } from '@ai-outreach/shared';
export declare class CrmService {
    /**
     * Lists contacts with search, filter, and pagination.
     */
    listContacts(params: {
        orgId: string;
        search?: string;
        company?: string;
        status?: ContactStatus;
        page: number;
        limit: number;
    }): Promise<{
        contacts: IContact[];
        total: number;
        pages: number;
    }>;
    /**
     * Creates a new contact.
     */
    createContact(orgId: string, data: Partial<IContact>): Promise<IContact>;
    /**
     * Updates an existing contact.
     */
    updateContact(contactId: string, orgId: string, data: Partial<IContact>): Promise<IContact>;
    /**
     * Deletes a contact.
     */
    deleteContact(contactId: string, orgId: string): Promise<void>;
    /**
     * Gets communication history for a contact.
     */
    getContactHistory(contactId: string, orgId: string): Promise<any[]>;
    /**
     * Bulk imports contacts from parsed CSV/XLSX data.
     */
    bulkImport(orgId: string, contacts: Array<{
        company: string;
        hrName: string;
        email: string;
        designation?: string;
        phone?: string;
    }>): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
}
//# sourceMappingURL=crm.service.d.ts.map