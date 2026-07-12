import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { RagQuerySchema, RAG_DEFAULTS } from '@ai-outreach/shared';
import { RagService } from '../services/rag.service.js';
import { DocModel } from '../models/Document.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getLLMClient } from '../index.js';
const router = Router();
// Multer config for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: RAG_DEFAULTS.MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (['pdf', 'docx', 'xlsx', 'csv'].includes(ext || '')) {
            cb(null, true);
        }
        else {
            cb(new Error('Unsupported file type. Allowed: pdf, docx, xlsx, csv'));
        }
    },
});
/**
 * POST /documents/upload — Upload and ingest a document
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            sendError(res, 'NO_FILE', 'No file uploaded', 400);
            return;
        }
        const docType = req.body.docType || 'other';
        const ext = req.file.originalname.split('.').pop()?.toLowerCase() || '';
        // Create document record
        const doc = await DocModel.create({
            orgId: req.user.orgId,
            uploadedBy: req.user.id,
            fileName: req.file.originalname,
            fileType: ext,
            storageUrl: '', // Local for MVP; S3 in production
            docType,
            status: 'processing',
        });
        // Start async ingestion
        const ragService = new RagService(getLLMClient());
        ragService
            .ingestDocument({
            documentId: doc._id.toString(),
            orgId: req.user.orgId,
            fileName: req.file.originalname,
            fileType: ext,
            buffer: req.file.buffer,
        })
            .catch((err) => {
            console.error('[RAG] Background ingestion error:', err);
        });
        sendSuccess(res, { document: doc }, 201);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /documents — List documents
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const documents = await DocModel.find({ orgId: req.user.orgId })
            .sort({ createdAt: -1 })
            .lean();
        sendSuccess(res, { documents });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /documents/:id — Remove document and its chunks/vectors
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const doc = await DocModel.findOne({
            _id: req.params.id,
            orgId: req.user.orgId,
        });
        if (!doc) {
            sendError(res, 'NOT_FOUND', 'Document not found', 404);
            return;
        }
        const ragService = new RagService(getLLMClient());
        await ragService.deleteDocument(doc._id.toString());
        sendSuccess(res, { message: 'Document deleted' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /rag/query — Debug/internal: query retrieval pipeline
 */
router.post('/query', authenticate, validateBody(RagQuerySchema), async (req, res, next) => {
    try {
        const ragService = new RagService(getLLMClient());
        const chunks = await ragService.retrieve({
            query: req.body.query,
            orgId: req.user.orgId,
            topK: req.body.topK,
        });
        sendSuccess(res, { chunks });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=rag.routes.js.map