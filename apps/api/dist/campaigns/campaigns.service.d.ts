import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { Hotspot } from '../entities/hotspot.entity';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { Lead } from '../entities/lead.entity';
export declare class CampaignsService {
    private campaigns;
    private hotspots;
    private analyticsEvents;
    private leads;
    constructor(campaigns: Repository<Campaign>, hotspots: Repository<Hotspot>, analyticsEvents: Repository<AnalyticsEvent>, leads: Repository<Lead>);
    create(userId: number, data: any): Promise<any>;
    findAll(userId: number): Promise<any[]>;
    findOne(id: number, userId?: number): Promise<any>;
    update(id: number, userId: number, data: any): Promise<any>;
    remove(id: number, userId: number): Promise<void>;
}
