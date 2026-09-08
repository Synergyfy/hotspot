import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    logEvent(campaignId: string, body: any): Promise<{
        domain: string | null;
        id: number;
        campaignId: number;
        eventType: string;
        timestamp: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getStats(campaignId: string): Promise<{
        events: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.AnalyticsEventGroupByOutputType, "eventType"[]> & {
            _count: number;
        })[];
        leads: number;
    }>;
}
