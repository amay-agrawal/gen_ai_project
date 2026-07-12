import { Router } from 'express';
import { google } from 'googleapis';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { GmailService } from '../services/gmail.service.js';
import { authenticate, generateAccessToken, generateRefreshToken, } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
const router = Router();
const gmailService = new GmailService();
/**
 * GET /auth/google — Redirect to Google OAuth consent screen
 */
router.get('/google', (_req, res) => {
    const authUrl = gmailService.getAuthUrl();
    res.redirect(authUrl);
});
/**
 * GET /auth/google/callback — Handle OAuth callback
 */
router.get('/google/callback', async (req, res, next) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            sendError(res, 'INVALID_CODE', 'Missing authorization code', 400);
            return;
        }
        // Exchange code for tokens
        const oauth2Client = gmailService.getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token) {
            sendError(res, 'OAUTH_ERROR', 'Failed to obtain access token', 400);
            return;
        }
        // Get user info from Google
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const { id: googleId, email, name, picture } = userInfo.data;
        if (!googleId || !email) {
            sendError(res, 'OAUTH_ERROR', 'Failed to get user information', 400);
            return;
        }
        // Find or create user
        let user = await User.findOne({ googleId });
        if (!user) {
            user = await User.create({
                googleId,
                email,
                name: name || email.split('@')[0],
                avatarUrl: picture || '',
                role: 'admin', // First user gets admin
                orgId: undefined, // Will be set on org creation
            });
            // Set orgId to user's own ID for single-user setup
            user.orgId = user._id;
            await user.save();
        }
        // Store encrypted Gmail tokens
        await gmailService.handleCallback(tokens, user._id.toString());
        // Generate JWT
        const accessToken = generateAccessToken({
            _id: user._id.toString(),
            email: user.email,
            role: user.role,
            orgId: (user.orgId || user._id).toString(),
        });
        const refreshToken = generateRefreshToken(user._id.toString());
        // Set cookie and redirect to frontend
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: !config.isDev,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: !config.isDev,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // Redirect to frontend with token in URL for SPA pickup
        res.redirect(`${config.frontendUrl}/auth/callback?token=${accessToken}`);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /auth/logout — Invalidate session
 */
router.post('/logout', authenticate, (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    sendSuccess(res, { message: 'Logged out successfully' });
});
/**
 * GET /auth/me — Get current user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');
        if (!user) {
            sendError(res, 'NOT_FOUND', 'User not found', 404);
            return;
        }
        const gmailConnected = await gmailService.isConnected(user._id.toString());
        sendSuccess(res, {
            user: user.toObject(),
            gmailConnected,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map