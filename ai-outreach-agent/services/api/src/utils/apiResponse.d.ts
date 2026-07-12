import { Response } from 'express';
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number): void;
export declare function sendError(res: Response, code: string, message: string, statusCode?: number): void;
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(code: string, message: string, statusCode?: number);
}
//# sourceMappingURL=apiResponse.d.ts.map