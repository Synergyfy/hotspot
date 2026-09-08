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
