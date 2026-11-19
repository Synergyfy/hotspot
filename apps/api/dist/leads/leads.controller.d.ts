import { LeadsService } from './leads.service';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(body: any): Promise<import("../entities/lead.entity").Lead[]>;
    findAll(userId: number, campaignId?: string): Promise<{
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
    remove(id: string, userId: number): Promise<import("../entities/lead.entity").Lead>;
}
