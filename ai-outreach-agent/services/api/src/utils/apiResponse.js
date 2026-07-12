import { v4 as uuidv4 } from 'uuid';
export function sendSuccess(res, data, statusCode = 200) {
    const response = {
        success: true,
        data,
        error: null,
        meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
        },
    };
    res.status(statusCode).json(response);
}
export function sendError(res, code, message, statusCode = 400) {
    const response = {
        success: false,
        data: null,
        error: { code, message },
        meta: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
        },
    };
    res.status(statusCode).json(response);
}
export class AppError extends Error {
    statusCode;
    code;
    constructor(code, message, statusCode = 400) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
//# sourceMappingURL=apiResponse.js.map