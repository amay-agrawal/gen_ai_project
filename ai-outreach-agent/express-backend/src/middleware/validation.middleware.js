import { sendError } from '../utils/apiResponse.js';
/**
 * Creates a middleware that validates req.body against a Zod schema.
 * Invalid input is rejected with 400 before touching any service logic.
 */
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            sendError(res, 'VALIDATION_ERROR', `Invalid request body: ${errors.join('; ')}`, 400);
            return;
        }
        req.body = result.data;
        next();
    };
}
/**
 * Creates a middleware that validates req.query against a Zod schema.
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            sendError(res, 'VALIDATION_ERROR', `Invalid query parameters: ${errors.join('; ')}`, 400);
            return;
        }
        req.query = result.data;
        next();
    };
}
/**
 * Creates a middleware that validates req.params against a Zod schema.
 */
export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            sendError(res, 'VALIDATION_ERROR', `Invalid path parameters: ${errors.join('; ')}`, 400);
            return;
        }
        req.params = result.data;
        next();
    };
}
//# sourceMappingURL=validation.middleware.js.map