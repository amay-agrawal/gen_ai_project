import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
const router = Router();
const dashboardService = new DashboardService();
/**
 * GET /dashboard/summary — Summary metrics
 */
router.get('/summary', authenticate, async (req, res, next) => {
    try {
        const summary = await dashboardService.getSummary(req.user.orgId);
        sendSuccess(res, { summary });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /dashboard/charts/daily — Daily email volume
 */
router.get('/charts/daily', authenticate, async (req, res, next) => {
    try {
        const data = await dashboardService.getDailyChart(req.user.orgId, req.query.startDate, req.query.endDate);
        sendSuccess(res, { data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /dashboard/charts/response-trends — Per-company response trends
 */
router.get('/charts/response-trends', authenticate, async (req, res, next) => {
    try {
        const data = await dashboardService.getCompanyTrends(req.user.orgId);
        sendSuccess(res, { data });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=dashboard.routes.js.map