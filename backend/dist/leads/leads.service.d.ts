import { PrismaService } from '../prisma/prisma.service';
export declare class LeadsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        id: number;
        email: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        campaignId: number;
        ip: string | null;
    }>;
    findAll(userId: number, campaignId?: number): Promise<({
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
    remove(id: number, userId: number): Promise<{
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
