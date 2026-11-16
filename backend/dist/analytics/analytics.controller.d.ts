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
    getStats(campaignId: string, userId: number): Promise<{
        summary: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AnalyticsEventGroupByOutputType, "eventType"[]> & {
            _count: number;
        })[];
        events: {
            domain: string | null;
            id: number;
            campaignId: number;
            eventType: string;
            timestamp: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        leads: number;
    }>;
}
