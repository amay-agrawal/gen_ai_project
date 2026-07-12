import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@ai-outreach/shared';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        orgId: string;
    };
}
export declare function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function authorize(...roles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function generateAccessToken(user: {
    _id: string;
    email: string;
    role: string;
    orgId: string;
}): string;
export declare function generateRefreshToken(userId: string): string;
//# sourceMappingURL=auth.middleware.d.ts.map