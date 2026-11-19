import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { Campaign } from '../entities/campaign.entity';
export declare class LeadsService {
    private leads;
    private campaigns;
    constructor(leads: Repository<Lead>, campaigns: Repository<Campaign>);
    create(data: any): Promise<Lead[]>;
    findAll(userId: number, campaignId?: number): Promise<{
        campaign: {
            id: number;
            name: string;
        };
        id: number;
        campaignId: number;
        email: string;
        name: string;
        ip: string;
        data: any;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    remove(id: number, userId: number): Promise<Lead>;
}
