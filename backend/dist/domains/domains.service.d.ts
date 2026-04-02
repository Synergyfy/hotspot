import { PrismaService } from '../prisma/prisma.service';
export declare class DomainsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: number, name: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        verified: boolean;
    }>;
    findAll(userId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        verified: boolean;
    }[]>;
    remove(id: number, userId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        verified: boolean;
    }>;
    verify(id: number, userId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        verified: boolean;
    }>;
}
