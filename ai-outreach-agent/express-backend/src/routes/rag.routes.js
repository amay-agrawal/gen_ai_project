import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { RagQuerySchema, RAG_DEFAULTS } from '@ai-outreach/shared';
import { DocModel } from '../models/Document.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
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
        
        const doc = await DocModel.create({
            orgId: req.user.orgId,
            uploadedBy: req.user.id,
            fileName: req.file.originalname,
            fileType: ext,
            storageUrl: '',
            docType,
            status: 'processing',
        });
        
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const tempFilePath = path.join(uploadDir, `${doc._id.toString()}.${ext}`);
        await fs.promises.writeFile(tempFilePath, req.file.buffer);
        
        const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'document_processor.py');
        
        execFile(pythonPath, [scriptPath, tempFilePath, doc._id.toString(), 'add'], async (error, stdout, stderr) => {
            try {
                await fs.promises.unlink(tempFilePath);
            } catch (e) {
                console.error('[RAG] Failed to delete temp file:', e);
            }
            
            if (error) {
                console.error('[RAG] Python processing error:', error, stderr);
                doc.status = 'failed';
                await doc.save();
                return;
            }
            
            try {
                const result = JSON.parse(stdout);
                if (result.success) {
                    doc.status = 'indexed';
                    doc.chunkCount = result.chunkCount;
                    await doc.save();
                } else {
                    doc.status = 'failed';
                    await doc.save();
                }
            } catch (err) {
                console.error('[RAG] Failed to parse python output:', err);
                doc.status = 'failed';
                await doc.save();
            }
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
        
        const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'document_processor.py');
        
        execFile(pythonPath, [scriptPath, 'none', doc._id.toString(), 'delete'], async (error, stdout, stderr) => {
            if (error) {
                console.error('[RAG] Python deletion error:', error, stderr);
            }
            await DocModel.deleteOne({ _id: doc._id });
        });
        
        sendSuccess(res, { message: 'Document deletion in progress' });
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
        const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(process.cwd(), '..', 'python-core', 'document_processor.py');
        
        execFile(pythonPath, [scriptPath, req.body.query, 'none', 'query'], (error, stdout, stderr) => {
            if (error) {
                console.error('[RAG] Python query error:', error, stderr);
                sendError(res, 'QUERY_FAILED', stderr || error.message, 500);
                return;
            }
            try {
                const result = JSON.parse(stdout);
                if (result.success) {
                    sendSuccess(res, { chunks: result.chunks });
                } else {
                    sendError(res, 'QUERY_FAILED', result.error, 500);
                }
            } catch (err) {
                sendError(res, 'QUERY_FAILED', 'Failed to parse python output', 500);
            }
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=rag.routes.js.map