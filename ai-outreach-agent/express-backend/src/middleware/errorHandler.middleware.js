import { sendError, AppError } from '../utils/apiResponse.js';
export function errorHandler(err, _req, res, _next) {
    console.error('[ErrorHandler]', err.stack || err.message);
    if (err instanceof AppError) {
        sendError(res, err.code, err.message, err.statusCode);
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        sendError(res, 'VALIDATION_ERROR', err.message, 400);
        return;
    }
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        sendError(res, 'INVALID_ID', 'Invalid resource identifier', 400);
        return;
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        sendError(res, 'DUPLICATE_ENTRY', 'Resource already exists', 409);
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
        return;
    }
    // Default 500
    sendError(res, 'INTERNAL_ERROR', process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message, 500);
}
//# sourceMappingURL=errorHandler.middleware.js.map