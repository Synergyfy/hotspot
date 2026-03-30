import { LeadsService } from './leads.service';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(body: any): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        campaignId: number;
        ip: string | null;
    }>;
    findAll(userId: number): Promise<({
        campaign: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            imageUrl: string;
            filters: import("@prisma/client/runtime/library").JsonValue | null;
            userId: number;
            watermarkUrl: string | null;
            soundUrl: string | null;
        };
    } & {
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        campaignId: number;
        ip: string | null;
    })[]>;
}
