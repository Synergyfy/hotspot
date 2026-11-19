import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Campaign } from '../entities/campaign.entity';
import { Lead } from '../entities/lead.entity';
export declare class AnalyticsService {
    private analyticsEvents;
    private campaigns;
    private leads;
    constructor(analyticsEvents: Repository<AnalyticsEvent>, campaigns: Repository<Campaign>, leads: Repository<Lead>);
    logEvent(campaignId: number, data: any): Promise<AnalyticsEvent[]>;
    getStats(campaignId: number, userId: number): Promise<{
        events: AnalyticsEvent[];
        aggregated: any[];
        leads: number;
    }>;
}
