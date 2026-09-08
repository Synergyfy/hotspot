import { PrismaService } from '../prisma/prisma.service';
export declare class CampaignsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: number, data: any): Promise<any>;
    findAll(userId: number): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, userId: number, data: any): Promise<any>;
    remove(id: number, userId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string;
        filters: import("@prisma/client/runtime/library").JsonValue | null;
        userId: number;
        watermarkUrl: string | null;
        soundUrl: string | null;
    }>;
}
