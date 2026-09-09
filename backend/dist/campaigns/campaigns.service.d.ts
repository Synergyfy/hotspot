import { PrismaService } from '../prisma/prisma.service';
export declare class CampaignsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: number, data: any): Promise<any>;
    findAll(userId: number): Promise<any[]>;
    findLight(userId: number): Promise<{
        name: string;
        id: number;
    }[]>;
    findOne(id: number, userId?: number): Promise<any>;
    update(id: number, userId: number, data: any): Promise<any>;
    remove(id: number, userId: number): Promise<void>;
}
