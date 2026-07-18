import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { CreateContactSchema, UpdateContactSchema, ContactQuerySchema } from '@ai-outreach/shared';
import { CrmService } from '../services/crm.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
const router = Router();
const crmService = new CrmService();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});
/**
 * GET /contacts — List contacts with search/filter/pagination
 */
router.get('/', authenticate, validateQuery(ContactQuerySchema), async (req, res, next) => {
    try {
        const result = await crmService.listContacts({
            orgId: req.user.orgId,
            ...req.query,
        });
        sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /contacts — Create a new contact
 */
router.post('/', authenticate, validateBody(CreateContactSchema), async (req, res, next) => {
    try {
        const contact = await crmService.createContact(req.user.orgId, req.body);
        sendSuccess(res, { contact }, 201);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /contacts/bulk-import — Import contacts from CSV/XLSX
 */
router.post('/bulk-import', authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            sendError(res, 'NO_FILE', 'No file uploaded', 400);
            return;
        }
        const ext = req.file.originalname.split('.').pop()?.toLowerCase();
        let contacts = [];
        if (ext === 'csv') {
            const { parse } = await import('csv-parse/sync');
            contacts = parse(req.file.buffer.toString('utf-8'), {
                columns: true,
                skip_empty_lines: true,
            });
        }
        else if (ext === 'xlsx') {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            contacts = XLSX.utils.sheet_to_json(sheet);
        }
        else {
            sendError(res, 'INVALID_FILE_TYPE', 'Only CSV and XLSX files are supported', 400);
            return;
        }
        const result = await crmService.bulkImport(req.user.orgId, contacts);
        sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /contacts/:id — Update a contact
 */
router.patch('/:id', authenticate, validateBody(UpdateContactSchema), async (req, res, next) => {
    try {
        const contact = await crmService.updateContact(req.params.id, req.user.orgId, req.body);
        sendSuccess(res, { contact });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /contacts/:id — Delete a contact
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        await crmService.deleteContact(req.params.id, req.user.orgId);
        sendSuccess(res, { message: 'Contact deleted' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /contacts/:id/history — Communication history
 */
router.get('/:id/history', authenticate, async (req, res, next) => {
    try {
        const history = await crmService.getContactHistory(req.params.id, req.user.orgId);
        sendSuccess(res, { history });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=contacts.routes.js.map