import { OutreachRecord } from '../models/OutreachRecord.js';
import { EmailDraft } from '../models/EmailDraft.js';
export class DashboardService {
    /**
     * Gets summary metrics for the dashboard.
     */
    async getSummary(orgId) {
        const [emailsSent, repliesReceived, pendingDrafts, followUpsDue,] = await Promise.all([
            OutreachRecord.countDocuments({ orgId }),
            OutreachRecord.countDocuments({ orgId, replyReceived: true }),
            EmailDraft.countDocuments({ orgId, status: 'pending_review' }),
            this.getFollowUpsDueCount(orgId),
        ]);
        const responseRate = emailsSent > 0
            ? Math.round((repliesReceived / emailsSent) * 100 * 10) / 10
            : 0;
        return {
            emailsSent,
            repliesReceived,
            responseRate,
            pendingDrafts,
            followUpsDue,
        };
    }
    /**
     * Gets daily email volume data for charts.
     */
    async getDailyChart(orgId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const pipeline = [
            {
                $match: {
                    orgId: { $exists: true },
                    sentAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$sentAt' },
                    },
                    sent: { $sum: 1 },
                    replies: {
                        $sum: { $cond: [{ $eq: ['$replyReceived', true] }, 1, 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ];
        const results = await OutreachRecord.aggregate(pipeline);
        return results.map((r) => ({
            date: r._id,
            sent: r.sent,
            replies: r.replies,
        }));
    }
    /**
     * Gets per-company response trends.
     */
    async getCompanyTrends(orgId) {
        const pipeline = [
            {
                $match: { orgId: { $exists: true } },
            },
            {
                $group: {
                    _id: '$company',
                    sent: { $sum: 1 },
                    replied: {
                        $sum: { $cond: [{ $eq: ['$replyReceived', true] }, 1, 0] },
                    },
                },
            },
            { $sort: { sent: -1 } },
            { $limit: 20 },
        ];
        const results = await OutreachRecord.aggregate(pipeline);
        return results.map((r) => ({
            company: r._id,
            sent: r.sent,
            replied: r.replied,
            responseRate: r.sent > 0 ? Math.round((r.replied / r.sent) * 100) : 0,
        }));
    }
    async getFollowUpsDueCount(orgId) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        return OutreachRecord.countDocuments({
            orgId,
            replyReceived: false,
            status: 'sent',
            sentAt: { $lte: cutoffDate },
            followUpCount: { $lt: 3 },
        });
    }
}
//# sourceMappingURL=dashboard.service.js.map