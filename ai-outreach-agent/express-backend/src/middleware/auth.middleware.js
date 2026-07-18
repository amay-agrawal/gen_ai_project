import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { sendError } from '../utils/apiResponse.js';
export function authenticate(req, res, next) {
    try {
        // Check Authorization header first, then cookie
        let token = '';
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
        else if (req.cookies?.token) {
            token = req.cookies.token;
        }
        if (!token) {
            sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
            return;
        }
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            orgId: decoded.orgId,
        };
        next();
    }
    catch (error) {
        sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
    }
}
export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
            return;
        }
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
            return;
        }
        next();
    };
}
export function generateAccessToken(user) {
    return jwt.sign({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        orgId: user.orgId?.toString() || '',
    }, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
}
export function generateRefreshToken(userId) {
    return jwt.sign({ userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiry,
    });
}
//# sourceMappingURL=auth.middleware.js.map