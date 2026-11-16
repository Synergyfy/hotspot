import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    logEvent(campaignId: number, data: any): Promise<{
        domain: string | null;
        id: number;
        campaignId: number;
        eventType: string;
        timestamp: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getStats(campaignId: number, userId: number): Promise<{
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
