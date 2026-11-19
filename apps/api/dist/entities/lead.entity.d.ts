import { Campaign } from './campaign.entity';
export declare class Lead {
    id: number;
    campaignId: number;
    campaign: Campaign;
    email: string;
    name: string;
    ip: string;
    data: any;
    createdAt: Date;
    updatedAt: Date;
}
