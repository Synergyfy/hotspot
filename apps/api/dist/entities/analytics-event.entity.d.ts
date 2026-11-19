import { Campaign } from './campaign.entity';
export declare class AnalyticsEvent {
    id: number;
    campaignId: number;
    campaign: Campaign;
    eventType: string;
    timestamp: Date;
    domain: string;
    metadata: any;
}
