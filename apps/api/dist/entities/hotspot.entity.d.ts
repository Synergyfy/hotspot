import { Campaign } from './campaign.entity';
export declare class Hotspot {
    id: number;
    campaignId: number;
    campaign: Campaign;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    description: string;
    price: string;
    ctaText: string;
    imageUrl: string;
    videoUrl: string;
    redirectUrl: string;
    actionType: string;
    actionValue: string;
    config: any;
    filters: any;
    createdAt: Date;
    updatedAt: Date;
}
