import type { DashboardSummary, DailyChartPoint, CompanyResponseTrend } from '@ai-outreach/shared';
export declare class DashboardService {
    /**
     * Gets summary metrics for the dashboard.
     */
    getSummary(orgId: string): Promise<DashboardSummary>;
    /**
     * Gets daily email volume data for charts.
     */
    getDailyChart(orgId: string, startDate?: string, endDate?: string): Promise<DailyChartPoint[]>;
    /**
     * Gets per-company response trends.
     */
    getCompanyTrends(orgId: string): Promise<CompanyResponseTrend[]>;
    private getFollowUpsDueCount;
}
//# sourceMappingURL=dashboard.service.d.ts.map