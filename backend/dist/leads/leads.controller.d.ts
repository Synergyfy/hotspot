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
    findAll(userId: number, campaignId?: string): Promise<({
        campaign: {
            id: number;
            name: string;
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
    remove(id: string, userId: number): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        campaignId: number;
        ip: string | null;
    }>;
}
