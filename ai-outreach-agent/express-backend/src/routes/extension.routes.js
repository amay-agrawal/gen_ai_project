import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { ExtensionGenerateSchema, ExtensionRewriteSchema, ExtensionSummarizeSchema } from '@ai-outreach/shared';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import path from 'path';
import { execFile } from 'child_process';

const router = Router();

async function runExtensionAgent(action, args) {
    const pythonPath = path.join(process.cwd(), '..', 'python-core', 'venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(process.cwd(), '..', 'python-core', 'extension_agent.py');
    
    return new Promise((resolve, reject) => {
        execFile(pythonPath, [scriptPath, action, JSON.stringify(args)], (error, stdout, stderr) => {
            if (error) {
                console.error('[Extension Agent] Error running python:', error, stderr);
                reject(new Error(stderr || error.message));
                return;
            }
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (err) {
                console.error('[Extension Agent] Failed to parse stdout:', err, stdout);
                reject(err);
            }
        });
    });
}

/**
 * POST /extension/compose/generate — Generate email from compose context
 */
router.post('/compose/generate', authenticate, validateBody(ExtensionGenerateSchema), async (req, res, next) => {
    try {
        const result = await runExtensionAgent('generate', {
            context: req.body.context,
            threadText: req.body.threadText,
            instruction: req.body.instruction,
        });
        if (result.success) {
            sendSuccess(res, { result: result.result });
        } else {
            sendError(res, 'GENERATION_FAILED', result.error, 500);
        }
    }
    catch (error) {
        next(error);
    }
});

/**
 * POST /extension/compose/rewrite — Rewrite selected text
 */
router.post('/compose/rewrite', authenticate, validateBody(ExtensionRewriteSchema), async (req, res, next) => {
    try {
        const result = await runExtensionAgent('rewrite', {
            selectedText: req.body.selectedText,
            mode: req.body.mode,
        });
        if (result.success) {
            sendSuccess(res, { result: result.result });
        } else {
            sendError(res, 'REWRITE_FAILED', result.error, 500);
        }
    }
    catch (error) {
        next(error);
    }
});

/**
 * POST /extension/thread/summarize — Summarize Gmail thread
 */
router.post('/thread/summarize', authenticate, validateBody(ExtensionSummarizeSchema), async (req, res, next) => {
    try {
        const result = await runExtensionAgent('summarize', {
            threadText: req.body.threadText,
        });
        if (result.success) {
            sendSuccess(res, { result: result.result });
        } else {
            sendError(res, 'SUMMARIZE_FAILED', result.error, 500);
        }
    }
    catch (error) {
        next(error);
    }
});

export default router;