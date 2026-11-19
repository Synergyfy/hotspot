import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    logEvent(campaignId: string, body: any): Promise<import("../entities/analytics-event.entity").AnalyticsEvent[]>;
    getStats(campaignId: string, userId: number): Promise<{
        events: import("../entities/analytics-event.entity").AnalyticsEvent[];
        aggregated: any[];
        leads: number;
    }>;
}
